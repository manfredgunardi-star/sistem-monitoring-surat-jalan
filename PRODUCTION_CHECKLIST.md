# 🔧 Production Checklist - Sistem Monitoring Surat Jalan

Panduan untuk memastikan aplikasi siap production dan dapat diakses user-user dengan stabil.

---

## ✅ Pre-Production Setup

### 1. **Database Supabase**

**Status Check:**
- [ ] Supabase project sudah dibuat
- [ ] Database schema sudah di-setup (jalankan `scripts/setup-database.sql`)
- [ ] Backups sudah dikonfigurasi di Supabase Dashboard

**Setup Backup Automatic:**
1. Buka Supabase Dashboard → **Settings** → **Backups**
2. Enable **"Backup scheduling"**
3. Pilih interval (recommended: daily)
4. ✅ Selesai

**Verify Database Connection:**
```bash
# Test di lokal
npm run dev

# Coba login di http://localhost:3000
# Jika berhasil, database connection OK
```

---

### 2. **Environment Variables**

**File yang perlu dibuat/konfigurasi:**

**Local Development** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...xxx...
```

**Production** (di platform deployment - Vercel/Server):
- Same variables sebagai `.env.local`
- Tapi dengan production-grade security

**PENTING:**
- ⚠️ JANGAN commit `.env.local` ke GitHub
- ✅ Sudah di `.gitignore` - OK
- ⚠️ JANGAN share credentials via email/chat
- ✅ Setup via platform dashboard saja

---

### 3. **Code Quality & Security**

**Run Linting:**
```bash
npm run lint
```

**Fix Auto-fixable Issues:**
```bash
npx eslint . --fix
```

**Security Check:**
```bash
npm audit
```

Jika ada vulnerabilities:
```bash
npm audit fix
```

---

### 4. **Build Test**

**Build untuk production:**
```bash
npm run build
```

Expected output:
```
> next build
  ✓ Linting and checking validity of types
  ✓ Creating an optimized production build
  ✓ Compiled successfully
  ✓ Collecting page data [...]
```

**Test built version lokal:**
```bash
npm run start
```

Buka http://localhost:3000 dan test full workflow:
1. Login dengan user test
2. Akses dashboard
3. Input data sample
4. Test semua menu

---

## 🚀 Deployment Options

### **Option A: Vercel (5 menit - RECOMMENDED)**

**Pro:**
- Paling cepat & mudah
- Gratis tier available
- Auto-scaling & high availability
- Support Next.js resmi

**Step:**

1. **Push ke GitHub:**
```bash
git init
git add .
git commit -m "Production ready"
git remote add origin https://github.com/your-username/sistem-monitoring-surat-jalan.git
git push -u origin main
```

2. **Deploy ke Vercel:**
   - Buka https://vercel.com/new
   - Import dari GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click Deploy

3. **Hasilnya:**
   - URL: `https://sistem-monitoring-surat-jalan.vercel.app`
   - Auto-deploy setiap push ke main branch

---

### **Option B: Self-Hosted VPS**

**Pro:**
- Full control
- Lebih murah untuk long-term
- Tidak tergantung platform third-party

**Requirements:**
- Ubuntu 20.04+ server
- Min 2GB RAM, 20GB disk
- Domain + DNS access
- SSL certificate (free via Let's Encrypt)

**Setup (copy-paste bisa langsung):**

```bash
# 1. SSH ke server
ssh user@your-server-ip

# 2. Update system
sudo apt update && sudo apt upgrade -y

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# 4. Install Nginx & PM2
sudo apt install nginx -y
sudo npm install -g pm2

# 5. Clone project
mkdir -p /var/www/surat-jalan
cd /var/www/surat-jalan
git clone https://github.com/your-username/sistem-monitoring-surat-jalan.git .

# 6. Install dependencies
npm install --production

# 7. Build
npm run build

# 8. Start dengan PM2
pm2 start "npm start" --name "surat-jalan"
pm2 startup
pm2 save

# 9. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/surat-jalan
```

Paste config:
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
    }
}
```

```bash
# 10. Enable & restart Nginx
sudo ln -s /etc/nginx/sites-available/surat-jalan /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 11. Setup SSL (HTTPS)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com

# 12. Done!
```

Aplikasi accessible: `https://your-domain.com`

---

### **Option C: Docker + Railway.app**

**Pro:**
- Cloud-based (tidak perlu manage server)
- Gratis tier $5/bulan
- Easy scaling

**Steps:**

1. **Create Dockerfile** (sudah disediakan di `Dockerfile.example`)

2. **Push ke GitHub**

3. **Deploy di Railway:**
   - Buka https://railway.app
   - Login dengan GitHub
   - New Project → Deploy from GitHub repo
   - Select repository
   - Add environment variables
   - ✅ Deploy otomatis

---

## 🔐 Security Hardening

### Mandatory:

- [ ] HTTPS/SSL enabled
- [ ] Environment variables secure
- [ ] Database password strong
- [ ] Regular security updates
- [ ] CORS properly configured

### Recommended:

- [ ] Rate limiting untuk login attempts
- [ ] IP whitelisting (optional)
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection

---

## 📊 Monitoring Setup

### **Option 1: Vercel Analytics (built-in)**
- Dashboard → Analytics
- Real-time traffic, errors, performance

### **Option 2: Sentry Error Tracking**

```bash
npm install @sentry/nextjs
```

Setup di `app/layout.tsx`

### **Option 3: PM2 Monitoring** (self-hosted)

```bash
pm2 install pm2-auto-pull
pm2 install pm2-logrotate
pm2 monit
```

---

## 📝 Maintenance Schedule

### Daily:
- Monitor error logs
- Check user reports

### Weekly:
- Performance review
- Backup verification

### Monthly:
- Security audit
- Dependencies update
- Database optimization

### Quarterly:
- Full security assessment
- Capacity planning

---

## 🆘 Post-Deployment Checklist

- [ ] Domain/URL sudah accessible
- [ ] HTTPS working
- [ ] Login functional
- [ ] Database queries fast (< 1s)
- [ ] Mobile responsive (test di HP)
- [ ] All pages loading properly
- [ ] Analytics working
- [ ] Backup running
- [ ] Team members bisa login
- [ ] Data persists correctly

---

## 📞 Quick Support Contacts

Jika ada issue post-deployment:

1. **Check Logs:**
   - Vercel: Dashboard → Logs
   - Self-hosted: `pm2 logs surat-jalan`

2. **Common Issues:**

   **"Cannot access website"**
   - Check domain DNS pointing
   - Check SSL certificate
   - Check server firewall

   **"Database error"**
   - Check SUPABASE_URL & KEY
   - Check internet connection
   - Check Supabase status

   **"Slow performance"**
   - Check server load
   - Check database query performance
   - Check network latency

3. **Emergency Rollback:**
   ```bash
   git revert HEAD~1
   git push
   # (platform auto-redeploy)
   ```

---

**Selamat! Aplikasi Anda sekarang siap untuk production user-user! 🎉**
