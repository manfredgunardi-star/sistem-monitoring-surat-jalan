# 📘 Panduan Setup Supabase untuk Sistem Monitoring Surat Jalan

Panduan lengkap untuk setup database Supabase dari awal hingga aplikasi siap digunakan.

---

## 🎯 Langkah 1: Buat Akun Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Klik **"Start your project"** atau **"Sign Up"**
3. Pilih metode sign up:
   - GitHub (Recommended - paling mudah)
   - Google
   - Email
4. Verifikasi email Anda jika menggunakan email

---

## 🏗️ Langkah 2: Buat Project Baru

1. Setelah login, klik **"New Project"**
2. Isi form:
   - **Name**: `surat-jalan-monitoring` (atau nama lain sesuai keinginan)
   - **Database Password**: Buat password yang kuat dan **SIMPAN** di tempat aman
   - **Region**: Pilih **Southeast Asia (Singapore)** untuk latensi paling rendah
   - **Pricing Plan**: Pilih **Free** (sudah cukup untuk aplikasi ini)
3. Klik **"Create new project"**
4. Tunggu 2-3 menit sampai project selesai dibuat

---

## 🗄️ Langkah 3: Setup Database Schema

1. Di dashboard Supabase, klik menu **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**
3. Copy semua isi file `/scripts/setup-database.sql` dari project ini
4. Paste ke SQL Editor
5. Klik **"Run"** (atau tekan `Ctrl+Enter`)
6. ✅ Tunggu sampai muncul pesan **"Success. No rows returned"**

**⚠️ PENTING**: Jika ada error, baca pesan errornya. Biasanya karena:
- Table sudah ada (aman, bisa diabaikan)
- Syntax error (cek kembali copy-paste nya lengkap)

---

## 🔐 Langkah 4: Ambil API Keys

1. Di dashboard Supabase, klik menu **"Settings"** (icon gear) di sidebar kiri
2. Klik **"API"** di submenu
3. Anda akan melihat 2 keys penting:
   
   **a. Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **b. anon/public key**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

4. **COPY kedua nilai ini** - Anda akan memerlukannya di langkah berikutnya

---

## ⚙️ Langkah 5: Konfigurasi Environment Variables

### Untuk Development di v0:

1. Di v0, buka **sidebar kiri** → Klik **"Vars"**
2. Tambahkan 2 environment variables:
   
   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (paste Project URL dari langkah 4a)
   
   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (paste anon key dari langkah 4b)

3. Klik **"Save"**

### Untuk Production (setelah deploy):

Jika Anda deploy ke Vercel:
1. Masuk ke Vercel Dashboard
2. Pilih project Anda
3. Klik **"Settings"** → **"Environment Variables"**
4. Tambahkan kedua variable yang sama seperti di atas

---

## 👤 Langkah 6: Setup Authentication (Opsional tapi Recommended)

1. Di dashboard Supabase, klik **"Authentication"** di sidebar
2. Klik **"Providers"**
3. Pastikan **"Email"** sudah enabled (default: ON)
4. Scroll ke **"Email Auth"** settings:
   - ✅ Enable "Confirm email" untuk keamanan
   - ✅ Set "Site URL" ke URL aplikasi Anda (nanti setelah deploy)

---

## 📊 Langkah 7: Verifikasi Database

Pastikan semua table berhasil dibuat:

1. Klik menu **"Table Editor"** di sidebar
2. Anda harus melihat table-table berikut:
   - ✅ users
   - ✅ supir
   - ✅ truck
   - ✅ material
   - ✅ rute
   - ✅ surat_jalan
   - ✅ audit_log
   - ✅ backup_schedule

3. Klik table **"users"** 
4. Anda akan melihat 1 baris data: user **"admin"** dengan role **"admin"**

---

## 🔒 Langkah 8: Test Login Admin

Setelah aplikasi berjalan:

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ **SANGAT PENTING**: 
- Setelah login pertama kali, segera ubah password default ini!
- Gunakan password yang kuat minimal 12 karakter

---

## 🎉 Langkah 9: Setup Selesai!

Database Supabase Anda sudah siap digunakan! Fitur yang sudah aktif:

✅ **Database Terpusat** - Semua user lihat data yang sama  
✅ **Real-time Sync** - Perubahan langsung terlihat di semua device  
✅ **Audit Log** - Semua perubahan tercatat otomatis  
✅ **Row Level Security (RLS)** - Keamanan level database  
✅ **Auto Timestamps** - Waktu create/update otomatis  
✅ **Backup Ready** - Supabase backup otomatis setiap hari  

---

## 🔧 Troubleshooting

### Problem: "Invalid API Key"
**Solusi**: 
- Pastikan Anda copy **anon/public** key, bukan **service_role** key
- Cek tidak ada spasi atau karakter tambahan saat copy-paste

### Problem: "Row Level Security policy violation"
**Solusi**:
- Pastikan Anda login dulu sebelum akses data
- User harus punya role yang sesuai (admin/input/reader)

### Problem: "Failed to fetch"
**Solusi**:
- Cek koneksi internet
- Pastikan Project URL benar dan tidak ada typo
- Cek Supabase project masih aktif (tidak paused karena inaktif 7 hari)

### Problem: SQL Script error saat run
**Solusi**:
- Jalankan script sedikit demi sedikit (per section)
- Pastikan UUID extension enabled
- Drop tables yang error lalu run ulang

---

## 📈 Monitoring & Maintenance

### Cek Kapasitas Database:
1. Supabase Dashboard → **"Settings"** → **"Usage"**
2. Monitor:
   - Database size (max 500MB di free tier)
   - API requests (max 50,000/bulan di free tier)
   - Bandwidth

### Auto Backup:
- Supabase otomatis backup database setiap hari
- Di free tier, backup disimpan 7 hari
- Untuk backup manual: **"Database"** → **"Backups"** → **"Create backup"**

### View Audit Log:
1. **"Table Editor"** → table **"audit_log"**
2. Lihat semua perubahan data: siapa, kapan, apa yang diubah

---

## 🚀 Next Steps

Setelah setup selesai:

1. ✅ Login ke aplikasi dengan akun admin default
2. ✅ Ubah password admin
3. ✅ Tambahkan user baru dengan role yang sesuai
4. ✅ Import master data (Supir, Truck, Material, Rute)
5. ✅ Mulai input surat jalan
6. ✅ Test fitur real-time sync dengan buka 2 browser berbeda

---

## 📞 Butuh Bantuan?

Jika mengalami kesulitan:
1. Cek [Supabase Documentation](https://supabase.com/docs)
2. Cek [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Hubungi developer aplikasi ini

---

**🎊 Selamat! Database Supabase Anda sudah siap production!**
