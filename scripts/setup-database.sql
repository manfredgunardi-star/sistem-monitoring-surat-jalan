-- Supabase Database Schema untuk Sistem Monitoring Surat Jalan
-- Jalankan script ini di Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

-- =====================================================
-- TABLES
-- =====================================================

-- Table: users (untuk authentication dan role management)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama_lengkap VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'input', 'reader')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: supir (Master Data)
CREATE TABLE IF NOT EXISTS public.supir (
  id VARCHAR(50) PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  nama_pt VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Table: truck (Master Data)
CREATE TABLE IF NOT EXISTS public.truck (
  id VARCHAR(50) PRIMARY KEY,
  nomor_polisi VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Table: material (Master Data)
CREATE TABLE IF NOT EXISTS public.material (
  id VARCHAR(50) PRIMARY KEY,
  nama_material VARCHAR(255) NOT NULL,
  satuan VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Table: rute (Master Data)
CREATE TABLE IF NOT EXISTS public.rute (
  id VARCHAR(50) PRIMARY KEY,
  nama_rute VARCHAR(255) NOT NULL,
  uang_jalan NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Table: surat_jalan (Main Transaction)
CREATE TABLE IF NOT EXISTS public.surat_jalan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_surat_jalan VARCHAR(100) NOT NULL UNIQUE,
  tanggal_surat_jalan DATE NOT NULL,
  truck_id VARCHAR(50) REFERENCES public.truck(id),
  supir_id VARCHAR(50) REFERENCES public.supir(id),
  rute_id VARCHAR(50) REFERENCES public.rute(id),
  material_id VARCHAR(50) REFERENCES public.material(id),
  kuantitas_pengisian NUMERIC(15, 3) NOT NULL,
  kuantitas_terkirim NUMERIC(15, 3),
  tanggal_pengiriman DATE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'terkirim', 'gagal')),
  nomor_invoice VARCHAR(100),
  is_invoiced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Table: audit_log (untuk tracking semua perubahan)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES public.users(id),
  username VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: backup_schedule (untuk auto-backup)
CREATE TABLE IF NOT EXISTS public.backup_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type VARCHAR(50) NOT NULL,
  last_backup_at TIMESTAMPTZ,
  next_backup_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES untuk performa
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_supir_active ON public.supir(is_active);
CREATE INDEX IF NOT EXISTS idx_truck_active ON public.truck(is_active);
CREATE INDEX IF NOT EXISTS idx_surat_jalan_status ON public.surat_jalan(status);
CREATE INDEX IF NOT EXISTS idx_surat_jalan_tanggal ON public.surat_jalan(tanggal_surat_jalan);
CREATE INDEX IF NOT EXISTS idx_surat_jalan_nomor ON public.surat_jalan(nomor_surat_jalan);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- =====================================================
-- FUNCTIONS untuk auto-update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS untuk auto-update timestamps
-- =====================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supir_updated_at BEFORE UPDATE ON public.supir
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_truck_updated_at BEFORE UPDATE ON public.truck
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_updated_at BEFORE UPDATE ON public.material
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rute_updated_at BEFORE UPDATE ON public.rute
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surat_jalan_updated_at BEFORE UPDATE ON public.surat_jalan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUDIT LOG TRIGGERS (tracking semua perubahan)
-- =====================================================

CREATE OR REPLACE FUNCTION audit_log_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, user_id, username)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'delete', to_jsonb(OLD), OLD.updated_by, (SELECT username FROM public.users WHERE id = OLD.updated_by));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, user_id, username)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'update', to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by, (SELECT username FROM public.users WHERE id = NEW.updated_by));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_data, user_id, username)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'create', to_jsonb(NEW), NEW.created_by, (SELECT username FROM public.users WHERE id = NEW.created_by));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach audit triggers to all tables
CREATE TRIGGER audit_supir AFTER INSERT OR UPDATE OR DELETE ON public.supir
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

CREATE TRIGGER audit_truck AFTER INSERT OR UPDATE OR DELETE ON public.truck
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

CREATE TRIGGER audit_material AFTER INSERT OR UPDATE OR DELETE ON public.material
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

CREATE TRIGGER audit_rute AFTER INSERT OR UPDATE OR DELETE ON public.rute
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

CREATE TRIGGER audit_surat_jalan AFTER INSERT OR UPDATE OR DELETE ON public.surat_jalan
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supir ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rute ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_jalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Master data policies (admin can do everything, others can only read)
CREATE POLICY "Anyone can view supir" ON public.supir
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert supir" ON public.supir
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update supir" ON public.supir
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete supir" ON public.supir
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Repeat similar policies for truck, material, rute
CREATE POLICY "Anyone can view truck" ON public.truck FOR SELECT USING (true);
CREATE POLICY "Admin can insert truck" ON public.truck FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update truck" ON public.truck FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete truck" ON public.truck FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view material" ON public.material FOR SELECT USING (true);
CREATE POLICY "Admin can insert material" ON public.material FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update material" ON public.material FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete material" ON public.material FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view rute" ON public.rute FOR SELECT USING (true);
CREATE POLICY "Admin can insert rute" ON public.rute FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can update rute" ON public.rute FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete rute" ON public.rute FOR DELETE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Surat Jalan policies (input and admin can create/update)
CREATE POLICY "Anyone can view surat_jalan" ON public.surat_jalan
  FOR SELECT USING (true);

CREATE POLICY "Input and Admin can insert surat_jalan" ON public.surat_jalan
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'input'))
  );

CREATE POLICY "Input and Admin can update surat_jalan" ON public.surat_jalan
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'input'))
  );

-- Audit log policies (read-only for everyone)
CREATE POLICY "Anyone can view audit_log" ON public.audit_log
  FOR SELECT USING (true);

-- =====================================================
-- SEED DATA: Default Admin User
-- =====================================================

-- Password hash untuk 'admin123' (gunakan bcrypt di production)
-- Untuk development, ini adalah hash bcrypt untuk 'admin123'
INSERT INTO public.users (id, username, password_hash, nama_lengkap, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'admin',
  '$2a$10$rVqXYFKqQnvvEXdYnBJSQ.dQw7MqF8YN9qYTlhxvxQK0M5wF0Fb/C', -- hash untuk 'admin123'
  'Administrator',
  'admin',
  true
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- VIEWS untuk reporting
-- =====================================================

-- View: Surat Jalan dengan semua detail
CREATE OR REPLACE VIEW v_surat_jalan_detail AS
SELECT 
  sj.id,
  sj.nomor_surat_jalan,
  sj.tanggal_surat_jalan,
  sj.status,
  sj.tanggal_pengiriman,
  sj.kuantitas_pengisian,
  sj.kuantitas_terkirim,
  sj.nomor_invoice,
  sj.is_invoiced,
  t.nomor_polisi,
  s.nama as nama_supir,
  s.nama_pt,
  r.nama_rute,
  r.uang_jalan,
  m.nama_material,
  m.satuan,
  sj.created_at,
  u.username as created_by_username
FROM public.surat_jalan sj
LEFT JOIN public.truck t ON sj.truck_id = t.id
LEFT JOIN public.supir s ON sj.supir_id = s.id
LEFT JOIN public.rute r ON sj.rute_id = r.id
LEFT JOIN public.material m ON sj.material_id = m.id
LEFT JOIN public.users u ON sj.created_by = u.id;

-- View: Laporan Uang Jalan per tanggal
CREATE OR REPLACE VIEW v_laporan_uang_jalan AS
SELECT 
  sj.tanggal_pengiriman as tanggal,
  COUNT(sj.id) as total_pengiriman,
  SUM(r.uang_jalan) as total_uang_jalan,
  STRING_AGG(DISTINCT r.nama_rute, ', ') as rute_list
FROM public.surat_jalan sj
LEFT JOIN public.rute r ON sj.rute_id = r.id
WHERE sj.status = 'terkirim'
GROUP BY sj.tanggal_pengiriman
ORDER BY sj.tanggal_pengiriman DESC;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETE!
-- =====================================================

-- Script selesai dijalankan
-- Lanjutkan dengan konfigurasi Supabase Auth dan API
