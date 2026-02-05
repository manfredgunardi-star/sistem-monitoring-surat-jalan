# 🔧 Troubleshooting Guide - Deployment Issues

Panduan mengatasi masalah yang mungkin terjadi saat setup dan deployment.

---

## 🟡 Common Issues & Solutions

### 1. **"Build Failed" di Vercel**

**Error Message:**
```
Build failed with error: next: not found
```

**Solusi:**
```bash
# Lokal - test build
npm run build

# Jika error, fix terlebih dahulu
npm run lint --fix
npm install
npm run build
```

Kemudian push ke GitHub, Vercel akan auto-rebuild.

---

### 2. **"Cannot Find Module" Error**

**Error Message:**
```
Module not found: Can't resolve '@supabase/supabase-js'
```

**Solusi:**

Lokal:
```bash
npm install
npm run build
```

Jika Vercel: clear build cache
1. Vercel Dashboard → Project
2. Settings → Git
3. Deployments → Select failed deployment
4. Click **Redeploy** (tidak perlu push ulang)

---

### 3. **"Cannot Connect to Supabase"**

**Error Message di Browser:**
```
Missing Supabase environment variables. 
Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Debug Steps:**

1. **Check environment variables di Vercel:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Pastikan 2 variables ada:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Verify variable values:**
   ```bash
   # Lokal - check .env.local
   cat .env.local
   
   # Pastikan format:
   # NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...xxx...
   ```

3. **Test koneksi lokal dulu:**
   ```bash
   npm run dev
   # Coba akses http://localhost:3000
   ```

4. **Jika lokal OK tapi production tidak:**
   - Redeploy di Vercel
   - Clear browser cache (Ctrl+Shift+Del)
   - Coba incognito mode

---

### 4. **"Login Failed" - Username/Password Salah**

**Symptoms:**
- Login attempt failed
- "Username atau password salah" message

**Debug:**

1. **Verify user exist di database:**
   ```sql
   -- Supabase SQL Editor
   SELECT username, nama_lengkap, role, is_active 
   FROM public.users 
   WHERE username = 'admin';
   ```

2. **Check user aktif:**
   ```sql
   SELECT is_active FROM public.users WHERE username = 'admin';
   -- Should return: true
   ```

3. **Reset password jika lupa:**
   ```sql
   -- Generate new hash di https://bcrypt-generator.com/
   -- Kemudian jalankan:
   UPDATE public.users 
   SET password_hash = '$2a$10$...NEW_HASH...' 
   WHERE username = 'admin';
   ```

---

### 5. **"Database Error" - Connection Timeout**

**Error Message:**
```
Supabase connection timeout
NetworkError: Request failed
```

**Solusi:**

1. **Check Supabase status:**
   - Buka https://status.supabase.com
   - Lihat apakah ada service downtime

2. **Check internet connection:**
   ```bash
   ping 8.8.8.8
   ```

3. **Verify Supabase URL correct:**
   ```
   Format: https://[project-id].supabase.co
   Jangan lupa .co di akhir!
   ```

4. **Check Supabase project active:**
   - Buka https://app.supabase.com
   - Select project Anda
   - Lihat status (should be "Active")

---

### 6. **"Blank Page" atau "White Screen"**

**Symptoms:**
- Page loads tapi blank
- Tidak ada error di console

**Debug:**

1. **Open Developer Tools (F12)**
   - Console tab
   - Network tab
   - Check untuk error messages

2. **Check Browser Console:**
   ```javascript
   // Lihat apakah ada error messages
   // Biasanya related to:
   // - Supabase connection
   // - JavaScript errors
   // - CORS issues
   ```

3. **Check Network tab:**
   - Lihat API calls ke Supabase
   - Response status should be 200
   - Jika 401/403, problem dengan auth

4. **Try Incognito Mode:**
   - Buka aplikasi di incognito
   - Jika OK, problem = browser cache
   - Solution: clear cache (Ctrl+Shift+Del)

---

### 7. **"CORS Error" - Cross-Origin Request Blocked**

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solusi:**

Supabase CORS sudah otomatis handle untuk aplikasi Next.js. Jika masih error:

1. **Check Supabase CORS settings:**
   - Supabase Dashboard → Settings → API
   - Scroll ke "CORS"
   - Add domain Anda: `https://your-domain.com`

2. **Vercel deployment:**
   - Biasanya otomatis OK
   - Jika tidak, add Vercel domain

---

### 8. **"Slow Performance" - Website Lambat**

**Symptoms:**
- Dashboard lambat load
- API calls slow
- Data entry lag

**Debug:**

1. **Check server load:**
   - Vercel: Dashboard → Analytics → Performance
   - Self-hosted: `pm2 monit`

2. **Check database performance:**
   ```sql
   -- Supabase SQL Editor
   -- Run query, lihat execution time
   SELECT COUNT(*) FROM public.surat_jalan;
   ```

3. **Optimize queries:**
   - Add indexes untuk frequently queried columns
   - Limit result set
   - Cache hasil jika perlu

4. **Check network latency:**
   - Browser DevTools → Network tab
   - Lihat response times
   - Jika > 1s, problem di server/network

---

### 9. **"502 Bad Gateway" Error**

**Error:**
```
Error 502: Bad Gateway
```

**Solusi:**

1. **Check if server is running:**
   - Vercel: auto-restart
   - Self-hosted: `pm2 status`

2. **Restart application:**
   ```bash
   # Self-hosted
   pm2 restart surat-jalan
   
   # Docker
   docker-compose restart app
   ```

3. **Check logs:**
   ```bash
   # Self-hosted
   pm2 logs surat-jalan
   
   # Docker
   docker logs container-name
   ```

4. **Vercel redeploy:**
   - Vercel Dashboard → Deployments
   - Click "Redeploy"

---

### 10. **"SSL/HTTPS Certificate Error"**

**Error:**
```
"Your connection is not private"
"NET::ERR_CERT_AUTHORITY_INVALID"
```

**Solusi:**

1. **Vercel:**
   - Auto SSL management
   - If error, redeploy

2. **Self-hosted dengan certbot:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   sudo systemctl reload nginx
   ```

3. **Self-hosted manual:**
   - Purchase SSL certificate
   - Install di Nginx
   - Configure nginx.conf

---

## 📊 Performance Optimization

### Database Optimization

```sql
-- Add indexes untuk faster queries
CREATE INDEX idx_surat_jalan_status ON public.surat_jalan(status);
CREATE INDEX idx_surat_jalan_truck_id ON public.surat_jalan(truck_id);
CREATE INDEX idx_surat_jalan_created_at ON public.surat_jalan(created_at);
```

### Frontend Optimization

1. **Image optimization:**
   - Use Next.js Image component
   - Lazy load images

2. **Code splitting:**
   - Next.js auto code-split pages
   - Lazy load components if needed

3. **Caching:**
   - Browser cache (F12 → Network → Disable cache = OFF)
   - Vercel CDN cache
   - Application cache

---

## 🔍 Debugging Tools

### Vercel

```bash
# Check deployment logs
vercel logs --follow

# Check environment variables
vercel env list

# Redeploy specific deployment
vercel deploy --prod
```

### Docker

```bash
# View logs
docker logs -f container-name

# Enter container
docker exec -it container-name /bin/bash

# Check container status
docker ps -a
```

### Self-hosted

```bash
# PM2 logs
pm2 logs surat-jalan

# Monitor
pm2 monit

# Nginx logs
tail -f /var/log/nginx/surat-jalan-error.log
tail -f /var/log/nginx/surat-jalan-access.log

# System resources
htop
```

---

## 📞 Rollback Deployment

Jika deployment bermasalah dan perlu rollback:

### Vercel

1. Dashboard → Deployments
2. Cari deployment sebelumnya yang OK
3. Click "Redeploy"

### GitHub + Vercel

```bash
# Revert last commit
git revert HEAD~1
git push origin main

# Vercel auto-deploy previous version
```

### Docker

```bash
# Rollback image
docker pull image-name:previous-tag
docker-compose down
docker-compose up
```

### Self-hosted

```bash
# Rollback code
git checkout previous-commit
npm run build
pm2 restart surat-jalan
```

---

## 🚨 Emergency Procedures

### Emergency Downtime

Jika aplikasi down dan user tidak bisa akses:

1. **Immediate:**
   - Check platform status
   - Check database connection
   - Check server logs

2. **Quick fixes (under 5 min):**
   ```bash
   # Restart application
   npm restart surat-jalan  # PM2
   docker-compose restart   # Docker
   
   # Redeploy
   git push origin main     # Vercel
   ```

3. **Longer fixes (5+ min):**
   - Rollback ke previous version
   - Fix issue lokal
   - Re-deploy

### Database Emergency

Jika database tidak bisa diakses:

1. **Check Supabase status:**
   - https://status.supabase.com

2. **Restore dari backup:**
   - Supabase Dashboard → Backups
   - Restore point

3. **Emergency contact:**
   - Supabase support: https://supabase.com/support

---

## 📝 Monitoring Checklist

**Daily:**
- [ ] Check application accessible
- [ ] Monitor error logs
- [ ] User reports review

**Weekly:**
- [ ] Performance analysis
- [ ] Database size check
- [ ] Backup verification

**Monthly:**
- [ ] Security audit
- [ ] Dependencies update
- [ ] Capacity planning

---

**Still having issues? Check logs, search error message, atau contact Supabase/Vercel support!** 🆘
