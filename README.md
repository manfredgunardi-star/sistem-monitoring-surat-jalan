# 📦 Sistem Monitoring Surat Jalan

Aplikasi web untuk tracking dan manajemen pengiriman surat jalan dengan role-based access control.

## 🎯 Fitur Utama

✅ **Authentication** - Login dengan username/password  
✅ **Role Management** - Admin, Operator, Reader dengan permissions berbeda  
✅ **Master Data** - Manajemen Supir, Truck, Material, Rute  
✅ **Surat Jalan** - Input dan tracking pengiriman  
✅ **Reporting** - Laporan dan analytics pengiriman  
✅ **Invoice** - Management invoice & billing  
✅ **Audit Trail** - Tracking semua perubahan data  

## 🚀 Quick Start (10 menit)

### Development Lokal

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# 3. Setup database
# - Buka Supabase SQL Editor
# - Copy-paste scripts/setup-database.sql
# - Run

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Deploy (Pilih salah satu)

**Option 1: Vercel (Recommended - 5 menit)**
- Baca: [`QUICK_START.md`](QUICK_START.md)

**Option 2: Docker**
```bash
docker-compose up --build
```

**Option 3: VPS/Self-Hosted**
- Baca: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)

## 📚 Dokumentasi

| File | Deskripsi |
|------|-----------|
| [`QUICK_START.md`](QUICK_START.md) | ⚡ Deploy dalam 10 menit (START HERE!) |
| [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) | 📖 Panduan deployment lengkap semua opsi |
| [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) | ✅ Checklist production-ready & monitoring |
| [`SUPABASE_SETUP_GUIDE.md`](SUPABASE_SETUP_GUIDE.md) | 🗄️ Setup database Supabase |
| [`USER_MANAGEMENT_GUIDE.md`](USER_MANAGEMENT_GUIDE.md) | 👥 Membuat & mengelola user |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Database**: PostgreSQL with RLS
- **Deployment**: Vercel / Docker / Self-hosted

## 📋 Project Structure

```
app/                    # Next.js routes
├── page.tsx            # Login page
└── dashboard/          # Main dashboard
    ├── input-surat-jalan/
    ├── invoice/
    ├── laporan/
    ├── master/         # Master data management
    ├── realisasi/
    ├── uang-jalan/
    └── users/

components/             # React components
└── ui/                # UI components (button, input, etc)

contexts/              # React contexts
└── auth-context.tsx   # Authentication context

lib/                   # Utilities & helpers
├── supabase.ts        # Supabase client
├── storage.ts         # Local storage utils
└── supabase-storage.ts # Service layer

types/                 # TypeScript types
scripts/               # Database scripts
```

## 🔐 Database Schema

- **users** - User authentication & roles
- **supir** - Driver data
- **truck** - Vehicle data
- **material** - Cargo/material data
- **rute** - Routes & allowances
- **surat_jalan** - Main transaction table
- **audit_log** - Change tracking

## 🚢 Available Scripts

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint check
```

## 🔑 Environment Variables

Required variables (copy dari `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...xxx...
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build failed | `rm -rf .next && npm run build` |
| Cannot login | Check Supabase URL & Key di `.env.local` |
| Database error | Verify database schema di Supabase SQL Editor |
| Slow performance | Check Vercel/Server analytics |

Lihat dokumentasi lengkap di file-file di atas.

## 📞 Support

- 📖 Baca dokumentasi di folder ini terlebih dahulu
- 🗄️ Check Supabase docs: https://supabase.com/docs
- ⚡ Check Next.js docs: https://nextjs.org/docs

## 📄 License

Private project - untuk internal use only

---

**Ready to deploy? Start with [`QUICK_START.md`](QUICK_START.md)!** 🚀
