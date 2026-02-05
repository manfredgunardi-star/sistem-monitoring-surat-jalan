# 👥 User Management Guide - Sistem Monitoring Surat Jalan

Panduan membuat dan mengelola user-user yang dapat mengakses aplikasi.

---

## 📋 User Roles & Permissions

Aplikasi memiliki 3 role dengan permissions berbeda:

| Role | Dashboard | Input Data | View Reports | Edit Data | Delete Data | User Mgmt |
|------|-----------|-----------|------------|-----------|-----------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Input** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Reader** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 🔑 Membuat User Baru

### Via Database Supabase (Direct SQL)

**Langkah 1: Buka Supabase SQL Editor**
1. Login ke https://app.supabase.com
2. Select project Anda
3. Klik **"SQL Editor"** di sidebar kiri
4. Klik **"New query"**

**Langkah 2: Jalankan Script Create User**

```sql
-- Script untuk membuat user baru
INSERT INTO public.users (
  username,
  password_hash,
  nama_lengkap,
  role,
  is_active
) VALUES (
  'budi.supir',           -- username (unique, lowercase)
  'hashed_password_here', -- akan di-hash di aplikasi
  'Budi Santoso',         -- nama lengkap
  'input',                -- role: admin, input, atau reader
  true                    -- is_active: true/false
);
```

**PENTING:** Password harus di-hash. Untuk test, gunakan password sederhana terlebih dahulu.

**Langkah 3: Verifikasi User Berhasil Dibuat**

```sql
-- Check user berhasil dibuat
SELECT id, username, nama_lengkap, role, is_active, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🔐 Password Management

### Cara 1: Hash Password Manual (Recommended untuk production)

Gunakan bcrypt online generator:
1. Buka https://bcrypt-generator.com/
2. Input password (contoh: `Budi@123456`)
3. Generate hash
4. Copy hash ke SQL query

```sql
INSERT INTO public.users (username, password_hash, nama_lengkap, role) VALUES 
('budi.supir', '$2a$10$...hash...', 'Budi Santoso', 'input');
```

### Cara 2: Reset Password User

Jika user lupa password:

```sql
-- Ganti dengan password baru (harus di-hash dulu)
UPDATE public.users 
SET password_hash = '$2a$10$...new_hash...'
WHERE username = 'budi.supir';
```

---

## 📊 Contoh Setup User untuk Team

Mari setup 5 user untuk struktur tim:

```sql
-- 1. Admin
INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) VALUES 
('admin', '$2a$10$...hash_admin...', 'Kepala Divisi', 'admin', true);

-- 2. Input Operator 1
INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) VALUES 
('operator1', '$2a$10$...hash_operator1...', 'Rini Operator', 'input', true);

-- 3. Input Operator 2
INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) VALUES 
('operator2', '$2a$10$...hash_operator2...', 'Sardi Operator', 'input', true);

-- 4. Laporan/Finance
INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) VALUES 
('finance', '$2a$10$...hash_finance...', 'Rina Finance', 'reader', true);

-- 5. Manager
INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) VALUES 
('manager', '$2a$10$...hash_manager...', 'Agus Manager', 'admin', true);
```

---

## ✏️ Update User Data

### Ubah Role User

```sql
UPDATE public.users 
SET role = 'admin'
WHERE username = 'operator1';
```

### Ubah Status User (Non-Active)

Untuk menonaktifkan user (misal sudah resign):

```sql
UPDATE public.users 
SET is_active = false
WHERE username = 'operator2';
```

User dengan `is_active = false` tidak bisa login lagi.

### Update Nama Lengkap

```sql
UPDATE public.users 
SET nama_lengkap = 'Budi Santoso S.E.'
WHERE username = 'budi.supir';
```

---

## 🗑️ Hapus User

```sql
-- Hard delete (benar-benar dihapus)
DELETE FROM public.users 
WHERE username = 'operator1';

-- Soft delete (recommended - set inactive)
UPDATE public.users 
SET is_active = false
WHERE username = 'operator1';
```

**Gunakan soft delete (inactive) lebih aman untuk audit trail.**

---

## 🔍 Query Useful untuk Monitoring

### Lihat Semua User

```sql
SELECT id, username, nama_lengkap, role, is_active, created_at, updated_at 
FROM public.users 
ORDER BY created_at DESC;
```

### Lihat User Aktif

```sql
SELECT username, nama_lengkap, role 
FROM public.users 
WHERE is_active = true 
ORDER BY nama_lengkap;
```

### Lihat User dengan Role Tertentu

```sql
-- Lihat semua admin
SELECT username, nama_lengkap 
FROM public.users 
WHERE role = 'admin' AND is_active = true;

-- Lihat semua input operator
SELECT username, nama_lengkap 
FROM public.users 
WHERE role = 'input' AND is_active = true;
```

### Lihat Last Login Activity

```sql
-- User mana yang terakhir login
SELECT username, nama_lengkap, updated_at 
FROM public.users 
WHERE is_active = true 
ORDER BY updated_at DESC;
```

---

## 🚀 Bulk Create Users (dari CSV)

Jika punya banyak user dari file CSV/Excel:

**Format CSV:**
```
username,nama_lengkap,role
admin,Kepala Divisi,admin
budi,Budi Santoso,input
rini,Rini Operator,input
rina,Rina Finance,reader
```

**Convert ke SQL INSERT:**

```sql
INSERT INTO public.users (username, nama_lengkap, role, password_hash, is_active) VALUES
('admin', 'Kepala Divisi', 'admin', '$2a$10$...', true),
('budi', 'Budi Santoso', 'input', '$2a$10$...', true),
('rini', 'Rini Operator', 'input', '$2a$10$...', true),
('rina', 'Rina Finance', 'reader', '$2a$10$...', true);
```

**Jalankan di Supabase SQL Editor.**

---

## 📱 Testing User Login

Setelah membuat user, test login:

1. Buka aplikasi: `https://your-domain.com`
2. Masukkan username
3. Masukkan password
4. Klik Login
5. Pastikan dashboard muncul dengan role yang sesuai

**Tips Testing:**
- Test setiap role (admin, input, reader) untuk memastikan permission OK
- Test non-active user tidak bisa login
- Test wrong password ditolak

---

## 🔐 Security Best Practices

### DO ✅

- ✅ Hash password sebelum insert ke database
- ✅ Ganti default admin password setelah setup
- ✅ Setup strong password policy
- ✅ Regular backup user list
- ✅ Monitor failed login attempts
- ✅ Audit trail untuk user changes

### DON'T ❌

- ❌ Simpan password plain text
- ❌ Share credentials via email/chat
- ❌ Buat user account untuk team sharing (1 user = 1 person)
- ❌ Lupa deactivate user yang resign
- ❌ Beri admin role ke semua user

---

## 🔧 Aplikasi UI untuk User Management

Untuk future enhancement, pertimbangkan tambahkan halaman **Admin Panel** dengan UI untuk:
- Create user baru
- Edit user
- Delete/Deactivate user
- Reset password
- View user activity

Untuk sekarang, gunakan Supabase SQL Editor yang sudah ada.

---

## 📞 Troubleshooting

### User tidak bisa login

**Debugging:**

```sql
-- 1. Check user exist
SELECT * FROM public.users WHERE username = 'budi';

-- 2. Check user aktif
SELECT username, is_active FROM public.users WHERE username = 'budi';

-- 3. Check password hash
SELECT username, password_hash FROM public.users WHERE username = 'budi';
```

### Lupa password admin

```sql
-- Reset admin password ke password baru yang sudah di-hash
UPDATE public.users 
SET password_hash = '$2a$10$...new_hash...'
WHERE username = 'admin';
```

### Terlalu banyak user, susah dikelola

- Gunakan format Excel/CSV untuk bulk operations
- Buat naming convention konsisten (contoh: `nama.divisi` seperti `budi.supir`)
- Dokumentasikan setiap user yang dibuat

---

**✅ User Management setup selesai! Tim Anda bisa mulai akses aplikasi!**
