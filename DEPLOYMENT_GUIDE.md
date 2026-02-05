# 📦 Panduan Deployment - Sistem Monitoring Surat Jalan

Panduan lengkap untuk men-deploy aplikasi ini ke production sehingga dapat diakses oleh user-user Anda.

---

## 📋 Daftar Checklist Pre-Deployment

Sebelum deploy, pastikan sudah melakukan ini:

- [ ] Supabase project sudah dibuat dan database sudah di-setup (lihat SUPABASE_SETUP_GUIDE.md)
- [ ] Semua environment variables sudah dikonfigurasi di server/platform deployment
- [ ] Build test lokal sudah berhasil: `npm run build`
- [ ] Tidak ada error di console development
- [ ] Testing login dengan beberapa user sudah dilakukan

---

## 🚀 Pilihan Deployment

Ada beberapa pilihan untuk deploy aplikasi ini:

### **Option 1: Vercel (RECOMMENDED - Paling Mudah)**

Vercel adalah platform official untuk Next.js. Deployment paling mudah dan cepat.

#### Keuntungan:
✅ Gratis untuk project kecil-menengah  
✅ Auto-scaling  
✅ Deploy cukup push ke GitHub  
✅ Performance tinggi (Edge Network global)  
✅ Environment variables mudah dikonfigurasi  

#### Step-by-step:

**Langkah 1: Siapkan GitHub Repository**

```bash
# Jika belum ada git repository
git init
git add .
git commit -m "Initial commit"

# Push ke GitHub (create repo di github.com terlebih dahulu)
git remote add origin https://github.com/your-username/sistem-monitoring-surat-jalan.git
git branch -M main
git push -u origin main
```

**Langkah 2: Deploy ke Vercel**

1. Buka https://vercel.com
2. Klik **"Add New..."** → **"Project"**
3. Pilih **"Import Git Repository"**
4. Authorize GitHub dan select repository `sistem-monitoring-surat-jalan`
5. Klik **"Import"**
6. Di **"Configure Project"** → **"Environment Variables"**:
   
   Tambahkan 2 variable:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = ey...xxx...
   ```

7. Klik **"Deploy"**
8. Tunggu ~5 menit sampai deploy selesai
9. ✅ Aplikasi live! URL: `https://project-name.vercel.app`

**Langkah 3: Setup Custom Domain (Optional)**

Jika punya domain sendiri (misal: `tracking.perusahaan.com`):

1. Di Vercel Dashboard → Project Anda → **Settings** → **Domains**
2. Klik **"Add"** dan masukkan domain Anda
3. Update DNS records domain Anda ke Vercel (lihat panduan di Vercel)
4. ✅ Selesai, akses via domain custom

---

### **Option 2: Self-Hosted (VPS/Server Sendiri)**

Jika ingin full control dan tidak ingin tergantung platform third-party.

#### Requirements:
- Server Linux (Ubuntu 20.04+) atau Windows Server
- Node.js 18+ sudah terinstall
- NPM atau Yarn
- Akses SSH ke server

#### Step-by-step (Linux/Ubuntu):

**Langkah 1: Clone Project ke Server**

```bash
# SSH ke server
ssh user@your-server-ip

# Buat folder untuk project
mkdir -p /var/www/surat-jalan
cd /var/www/surat-jalan

# Clone dari GitHub
git clone https://github.com/your-username/sistem-monitoring-surat-jalan.git .
```

**Langkah 2: Install Dependencies**

```bash
npm install
# atau
yarn install
```

**Langkah 3: Setup Environment Variables**

```bash
# Copy .env.example jadi .env.local
cp .env.example .env.local

# Edit dengan credentials Supabase
nano .env.local
```

Masukkan:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...xxx...
```

**Langkah 4: Build for Production**

```bash
npm run build
```

**Langkah 5: Jalankan dengan Process Manager (PM2)**

```bash
# Install PM2 globally
npm install -g pm2

# Jalankan aplikasi
pm2 start "npm start" --name "surat-jalan"

# Setup auto-start di server reboot
pm2 startup
pm2 save
```

**Langkah 6: Setup Reverse Proxy (Nginx)**

```bash
# Install Nginx
sudo apt-get install nginx

# Create config
sudo nano /etc/nginx/sites-available/surat-jalan
```

Paste ini:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/surat-jalan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Langkah 7: Setup SSL Certificate (HTTPS)**

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate (gratis via Let's Encrypt)
sudo certbot --nginx -d your-domain.com
```

**Langkah 8: Akses Aplikasi**

```
https://your-domain.com
```

---

### **Option 3: Docker + Cloud Platform**

Jika ingin containerize aplikasi (untuk scalability lebih baik):

**Buat Dockerfile:**

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Deploy ke cloud platform:**
- **Railway.app** - Paling mudah, gratis tier tersedia
- **Render.com** - Similar dengan Railway
- **AWS/Google Cloud/Azure** - Enterprise-grade

---

## 🔒 Security Checklist untuk Production

Sebelum user-user mengakses, pastikan:

- [ ] HTTPS/SSL certificate sudah setup
- [ ] Environment variables TIDAK di-commit ke GitHub
- [ ] `next.config.js` sudah di-review untuk security
- [ ] Database backups sudah dikonfigurasi di Supabase
- [ ] Monitoring/logging sudah setup
- [ ] Rate limiting sudah diterapkan untuk API (optional tapi recommended)

---

## 📊 Monitoring & Maintenance

### Setup Monitoring

**Option 1: Built-in (Vercel)**
- Vercel Dashboard → Analytics
- Lihat real-time traffic, errors, performance

**Option 2: Third-party**
- Sentry.io - Error tracking
- New Relic - Performance monitoring
- DataDog - Enterprise monitoring

### Regular Maintenance

```bash
# Update dependencies (1x per bulan)
npm update

# Check security vulnerabilities
npm audit

# Rebuild jika ada changes
npm run build

# Test build lokal sebelum deploy
npm run start
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

```bash
npm install --save @supabase/supabase-js
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

Pastikan environment variable sudah set di platform deployment (Vercel/server).

### Error: "Build failed"

```bash
# Clear build cache dan rebuild
rm -rf .next
npm run build
```

### Aplikasi loading tapi blank page

1. Check console browser (F12 → Console tab)
2. Check server logs
3. Pastikan Supabase URL dan key benar

---

## 📞 Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## ✅ Checklist Post-Deployment

Setelah aplikasi live:

- [ ] User-user sudah bisa login
- [ ] Master data (Supir, Truck, Material, Rute) sudah di-input
- [ ] Test input surat jalan berhasil
- [ ] Test laporan/reporting berfungsi
- [ ] Test invoice processing berfungsi
- [ ] Backup database sudah di-schedule
- [ ] Monitoring sudah aktif

Selamat! 🎉 Aplikasi Anda sudah siap digunakan!
