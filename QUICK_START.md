# 🚀 QUICK START - Dari Lokal ke Production (10 menit)

Panduan tercepat untuk deploy aplikasi ini ke production dan bisa diakses user-user.

---

## 📋 5-Step Quick Path

### **STEP 1: Siapkan Supabase (2 menit)**

1. Buka https://app.supabase.com
2. Klik "New Project"
3. Isi:
   - Name: `surat-jalan-monitoring`
   - Region: `Singapore`
   - Plan: `Free`
4. Tunggu selesai (2 menit)
5. Klik **Settings → API**
6. Copy 2 values:
   - `Project URL` (contoh: `https://xxxxx.supabase.co`)
   - `anon public key` (contoh: `eyJhbGciOiJI...`)

### **STEP 2: Setup Database (2 menit)**

1. Di Supabase Dashboard → **SQL Editor**
2. Klik **New query**
3. Copy-paste semua isi file: `scripts/setup-database.sql`
4. Klik **Run**
5. ✅ Tunggu sampai selesai (success message)

### **STEP 3: Deploy ke Vercel (3 menit)**

1. Buka https://github.com/new
2. Buat repo baru: `sistem-monitoring-surat-jalan`
3. Di lokal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/sistem-monitoring-surat-jalan.git
   git branch -M main
   git push -u origin main
   ```

4. Buka https://vercel.com/new
5. Klik "Import Git Repository"
6. Select repo Anda
7. Di **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = (paste Project URL dari STEP 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (paste anon key dari STEP 1)
   ```
8. Klik **Deploy**
9. ✅ Tunggu 3-5 menit
10. Dapat URL: `https://sistem-monitoring-surat-jalan.vercel.app`

### **STEP 4: Buat User-User (1 menit)**

1. Buka Supabase Dashboard → **SQL Editor**
2. Klik **New query**
3. Copy-paste (update nama & email sesuai kebutuhan):
   ```sql
   INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) VALUES 
   ('admin', '$2a$10$GbC8VmEAI5bPSQAIfJJbE.Zc2IBqvYvJ3gOQvT5aPx2I0jvh9NLSq', 'Admin User', 'admin', true),
   ('operator1', '$2a$10$GbC8VmEAI5bPSQAIfJJbE.Zc2IBqvYvJ3gOQvT5aPx2I0jvh9NLSq', 'Operator 1', 'input', true);
   ```
   (password hash ini untuk: `password123`)

4. Klik **Run**
5. ✅ User berhasil dibuat

### **STEP 5: Test Akses (1 menit)**

1. Buka: `https://sistem-monitoring-surat-jalan.vercel.app` (atau URL Vercel Anda)
2. Login dengan:
   - Username: `admin`
   - Password: `password123`
3. ✅ Seharusnya bisa akses dashboard
4. Share URL ke user-user Anda!

---

## ✅ Done! 🎉

Aplikasi Anda sudah live dan bisa diakses oleh team!

**URL untuk share ke team:**
```
https://sistem-monitoring-surat-jalan.vercel.app
```

**Default credentials:**
- Username: `admin` / `operator1`
- Password: `password123`

---

## 📋 Next Steps (Optional tapi Recommended)

- [ ] **Update password** → User → Ubah password di aplikasi
- [ ] **Setup custom domain** → Vercel Dashboard → Settings → Domains (contoh: `tracking.perusahaan.com`)
- [ ] **Buat lebih banyak user** → Follow `USER_MANAGEMENT_GUIDE.md`
- [ ] **Input master data** → Supir, Truck, Material, Rute
- [ ] **Setup backup** → Supabase Dashboard → Settings → Backups

---

## 🔗 Quick Links

- 📖 **Full Deployment Guide**: Baca `DEPLOYMENT_GUIDE.md`
- 👥 **User Management**: Baca `USER_MANAGEMENT_GUIDE.md`
- ✅ **Production Checklist**: Baca `PRODUCTION_CHECKLIST.md`
- 🗄️ **Database Setup**: Baca `SUPABASE_SETUP_GUIDE.md`

---

## ⚡ Tips & Tricks

### Ganti Password Pengguna

```sql
-- Hash baru password di https://bcrypt-generator.com/ terlebih dahulu
UPDATE public.users 
SET password_hash = '$2a$10$...HASH_BARU...' 
WHERE username = 'admin';
```

### Tambah User Baru

```sql
INSERT INTO public.users (username, password_hash, nama_lengkap, role, is_active) 
VALUES ('username_baru', '$2a$10$...HASH...', 'Nama Lengkap', 'input', true);
```

### Nonaktifkan User

```sql
UPDATE public.users SET is_active = false WHERE username = 'operator1';
```

### Lihat Semua User

```sql
SELECT username, nama_lengkap, role, is_active FROM public.users;
```

---

## 🆘 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Vercel build failed | Check GitHub repo di `/settings` → push ulang |
| Cannot login | Check username & password di Supabase users table |
| Database error | Check SUPABASE_URL & KEY di Vercel env vars |
| Blank page | Open DevTools (F12) → check console untuk error messages |
| Slow performance | Check Vercel Analytics → optimization recommendations |

---

**Questions? Baca file guide lengkap atau contact support!**
