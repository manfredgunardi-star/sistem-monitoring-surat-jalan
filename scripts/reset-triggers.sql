-- Script untuk drop semua existing triggers
-- Jalankan ini DULU sebelum menjalankan setup-database.sql

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_supir_updated_at ON public.supir;
DROP TRIGGER IF EXISTS update_truck_updated_at ON public.truck;
DROP TRIGGER IF EXISTS update_material_updated_at ON public.material;
DROP TRIGGER IF EXISTS update_rute_updated_at ON public.rute;
DROP TRIGGER IF EXISTS update_surat_jalan_updated_at ON public.surat_jalan;

DROP TRIGGER IF EXISTS audit_supir ON public.supir;
DROP TRIGGER IF EXISTS audit_truck ON public.truck;
DROP TRIGGER IF EXISTS audit_material ON public.material;
DROP TRIGGER IF EXISTS audit_rute ON public.rute;
DROP TRIGGER IF EXISTS audit_surat_jalan ON public.surat_jalan;

-- Sekarang jalankan setup-database.sql
