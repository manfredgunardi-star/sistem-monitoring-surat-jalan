-- ============================================================================
-- SCRIPT UPDATE: Transaksi Kas & Role Permissions
-- ============================================================================
-- Deskripsi: Menambahkan table transaksi_kas dan update role permissions
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE: transaksi_kas
-- ============================================================================
CREATE TABLE IF NOT EXISTS transaksi_kas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  tipe TEXT NOT NULL CHECK (tipe IN ('terima', 'keluar')),
  kategori TEXT NOT NULL CHECK (kategori IN ('uang_jalan', 'manual')),
  jumlah NUMERIC(15, 2) NOT NULL CHECK (jumlah > 0),
  keterangan TEXT,
  surat_jalan_id UUID REFERENCES surat_jalan(id) ON DELETE SET NULL,
  nomor_surat_jalan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_transaksi_kas_tanggal ON transaksi_kas(tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_kas_tipe ON transaksi_kas(tipe);
CREATE INDEX IF NOT EXISTS idx_transaksi_kas_kategori ON transaksi_kas(kategori);
CREATE INDEX IF NOT EXISTS idx_transaksi_kas_surat_jalan_id ON transaksi_kas(surat_jalan_id);

-- ============================================================================
-- 2. CREATE TABLE: saldo_kas
-- ============================================================================
CREATE TABLE IF NOT EXISTS saldo_kas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saldo NUMERIC(15, 2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial saldo kas (jika belum ada)
INSERT INTO saldo_kas (saldo, last_updated)
SELECT 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM saldo_kas LIMIT 1);

-- ============================================================================
-- 3. FUNCTION: Update Saldo Kas
-- ============================================================================
CREATE OR REPLACE FUNCTION update_saldo_kas()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update saldo berdasarkan tipe transaksi
    IF NEW.tipe = 'terima' THEN
      UPDATE saldo_kas SET saldo = saldo + NEW.jumlah, last_updated = NOW();
    ELSIF NEW.tipe = 'keluar' THEN
      UPDATE saldo_kas SET saldo = saldo - NEW.jumlah, last_updated = NOW();
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse saldo saat delete transaksi
    IF OLD.tipe = 'terima' THEN
      UPDATE saldo_kas SET saldo = saldo - OLD.jumlah, last_updated = NOW();
    ELSIF OLD.tipe = 'keluar' THEN
      UPDATE saldo_kas SET saldo = saldo + OLD.jumlah, last_updated = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. TRIGGER: Auto Update Saldo Kas
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_saldo_kas ON transaksi_kas;
CREATE TRIGGER trigger_update_saldo_kas
  AFTER INSERT OR DELETE ON transaksi_kas
  FOR EACH ROW
  EXECUTE FUNCTION update_saldo_kas();

-- ============================================================================
-- 5. FUNCTION: Create Transaksi Kas dari Realisasi
-- ============================================================================
CREATE OR REPLACE FUNCTION create_transaksi_kas_from_realisasi()
RETURNS TRIGGER AS $$
BEGIN
  -- Hanya buat transaksi kas jika status berubah menjadi 'terkirim'
  IF NEW.status = 'terkirim' AND (OLD.status IS NULL OR OLD.status != 'terkirim') THEN
    INSERT INTO transaksi_kas (
      tanggal,
      tipe,
      kategori,
      jumlah,
      keterangan,
      surat_jalan_id,
      nomor_surat_jalan,
      created_by
    ) VALUES (
      COALESCE(NEW.tanggal_pengiriman::date, CURRENT_DATE),
      'keluar',
      'uang_jalan',
      NEW.uang_jalan,
      'Uang jalan untuk rute ' || NEW.nama_rute || ' - ' || NEW.nomor_surat_jalan,
      NEW.id,
      NEW.nomor_surat_jalan,
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGER: Auto Create Transaksi Kas saat Realisasi
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_create_transaksi_kas_realisasi ON surat_jalan;
CREATE TRIGGER trigger_create_transaksi_kas_realisasi
  AFTER UPDATE ON surat_jalan
  FOR EACH ROW
  WHEN (NEW.status = 'terkirim')
  EXECUTE FUNCTION create_transaksi_kas_from_realisasi();

-- ============================================================================
-- 7. UPDATE: Role Permissions (Update existing users table comment)
-- ============================================================================
COMMENT ON COLUMN users.role IS 'User role: admin, input_surat_jalan, input_kas, input_invoice, reader';

-- ============================================================================
-- 8. RLS POLICIES: transaksi_kas
-- ============================================================================
ALTER TABLE transaksi_kas ENABLE ROW LEVEL SECURITY;

-- Policy untuk admin: full access
CREATE POLICY transaksi_kas_admin_policy ON transaksi_kas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Policy untuk input_kas: dapat create dan read
CREATE POLICY transaksi_kas_input_kas_policy ON transaksi_kas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role IN ('admin', 'input_kas')
      AND users.is_active = true
    )
  );

-- Policy untuk reader: read only
CREATE POLICY transaksi_kas_reader_policy ON transaksi_kas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.is_active = true
    )
  );

-- ============================================================================
-- 9. RLS POLICIES: saldo_kas
-- ============================================================================
ALTER TABLE saldo_kas ENABLE ROW LEVEL SECURITY;

-- Semua user yang aktif bisa read saldo kas
CREATE POLICY saldo_kas_read_policy ON saldo_kas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.is_active = true
    )
  );

-- Hanya admin yang bisa update saldo kas secara manual
CREATE POLICY saldo_kas_admin_policy ON saldo_kas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = (current_setting('app.current_user_id', true))::uuid 
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- ============================================================================
-- 10. VIEW: Laporan Transaksi Kas
-- ============================================================================
CREATE OR REPLACE VIEW v_laporan_transaksi_kas AS
SELECT 
  tk.id,
  tk.tanggal,
  tk.tipe,
  tk.kategori,
  tk.jumlah,
  tk.keterangan,
  tk.nomor_surat_jalan,
  u.name as created_by_name,
  tk.created_at,
  CASE 
    WHEN tk.tipe = 'terima' THEN tk.jumlah
    ELSE 0
  END as terima,
  CASE 
    WHEN tk.tipe = 'keluar' THEN tk.jumlah
    ELSE 0
  END as keluar
FROM transaksi_kas tk
LEFT JOIN users u ON tk.created_by = u.id
ORDER BY tk.tanggal DESC, tk.created_at DESC;

-- ============================================================================
-- 11. VIEW: Saldo Kas Real-time
-- ============================================================================
CREATE OR REPLACE VIEW v_saldo_kas_current AS
SELECT 
  s.saldo,
  s.last_updated,
  (SELECT COUNT(*) FROM transaksi_kas WHERE tipe = 'terima') as total_transaksi_terima,
  (SELECT COUNT(*) FROM transaksi_kas WHERE tipe = 'keluar') as total_transaksi_keluar,
  (SELECT COALESCE(SUM(jumlah), 0) FROM transaksi_kas WHERE tipe = 'terima') as total_terima,
  (SELECT COALESCE(SUM(jumlah), 0) FROM transaksi_kas WHERE tipe = 'keluar') as total_keluar
FROM saldo_kas s
LIMIT 1;

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Script ini menambahkan:
-- 1. Table transaksi_kas untuk mencatat semua transaksi kas
-- 2. Table saldo_kas untuk tracking saldo real-time
-- 3. Trigger otomatis untuk update saldo saat ada transaksi baru
-- 4. Trigger otomatis untuk create transaksi kas dari realisasi pengiriman
-- 5. RLS policies untuk keamanan data
-- 6. Views untuk reporting
-- ============================================================================
