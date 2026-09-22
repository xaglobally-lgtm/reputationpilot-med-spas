# App Template - Complete File Manifest

**Everything you need to deploy 100 production-grade apps.**

## Complete Repository Structure

```
app-template/
├── README.md                          # Main template overview
├── DEPLOYMENT.md                      # Step-by-step deployment guide
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore patterns
├── LICENSE                            # MIT License
│
├── frontend/                          # React 19 + Vite + Tailwind
│   ├── src/
│   │   ├── main.tsx                   # Entry point
│   │   ├── App.tsx                    # Main component
│   │   ├── App.css                    # Tailwind imports
│   │   ├── components/
│   │   │   ├── Header.tsx             # Reusable header
│   │   │   ├── Footer.tsx             # Reusable footer
│   │   │   └── ErrorBoundary.tsx      # Error handling
│   │   ├── utils/
│   │   │   ├── api.ts                 # API client (axios)
│   │   │   ├── i18n.ts                # i18n setup
│   │   │   └── currency.ts            # Currency formatter
│   │   └── types.ts                   # TypeScript types
│   ├── public/
│   │   ├── manifest.webmanifest       # PWA manifest
│   │   ├── favicon.ico                # Favicon
│   │   └── robots.txt                 # SEO robots file
│   ├── package.json                   # Dependencies & scripts
│   ├── tsconfig.json                  # TypeScript config
│   ├── vite.config.ts                 # Vite build config
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── postcss.config.js              # PostCSS config
│   └── index.html                     # HTML entry point
│
├── backend/                           # Express.js + Supabase
│   ├── src/
│   │   ├── server.ts                  # Main server file
│   │   ├── types.ts                   # TypeScript types
│   │   ├── api/
│   │   │   ├── health.ts              # Health check endpoint
│   │   │   ├── test.ts                # Test endpoint
│   │   │   └── index.ts               # Route registration
│   │   ├── services/
│   │   │   ├── database.ts            # Supabase client
│   │   │   ├── email.ts               # Email service
│   │   │   └── logger.ts              # Logging utility
│   │   ├── middleware/
│   │   │   ├── auth.ts                # API key validation
│   │   │   ├── errorHandler.ts        # Error handling
│   │   │   ├── cors.ts                # CORS configuration
│   │   │   └── rateLimit.ts           # Rate limiting
│   │   ├── utils/
│   │   │   ├── env.ts                 # Environment validation
│   │   │   └── hash.ts                # Hash utilities
│   │   └── config.ts                  # Configuration
│   ├── dist/                          # Built JavaScript (generated)
│   ├── package.json                   # Dependencies & scripts
│   ├── tsconfig.json                  # TypeScript config
│   └── .env.example                   # Environment template
│
├── supabase/                          # Database schema
│   ├── schema.sql                     # Complete SQL schema
│   ├── migrations/
│   │   ├── 001_initial_schema.sql     # Initial tables
│   │   ├── 002_rls_policies.sql       # Row-level security
│   │   └── 003_functions.sql          # Database functions
│   └── seed.sql                       # Sample data (optional)
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml        # Vercel deployment
│       └── deploy-backend.yml         # Render deployment
│
├── docs/
│   ├── ARCHITECTURE.md                # System design
│   ├── API.md                         # API endpoint documentation
│   ├── DATABASE.md                    # Database schema docs
│   ├── CUSTOMIZATION.md               # How to adapt template
│   ├── SECURITY.md                    # Security best practices
│   ├── MONITORING.md                  # Monitoring & alerting
│   └── TROUBLESHOOTING.md             # Common issues
│
├── vercel.json                        # Vercel configuration
├── render.json                        # Render configuration
└── .gitignore                         # Git patterns
```

## Files to Create in GitHub

When you clone this template into GitHub, create these files:

### 1. `README.md`
- Copy from: `/home/claude/app-template-README.md`

### 2. `frontend/package.json`
- Copy from: `/home/claude/frontend-package.json`

### 3. `backend/package.json`
- Copy from: `/home/claude/backend-package.json`

### 4. `backend/src/server.ts`
- Copy from: `/home/claude/backend-server.ts`

### 5. `frontend/src/App.tsx`
- Copy from: `/home/claude/frontend-App.tsx`

### 6. `supabase/schema.sql`
- Copy from: `/home/claude/supabase-schema.sql`

### 7. `.env.example`
- Copy from: `/home/claude/env-example.txt`

### 8. `vercel.json`
- Copy from: `/home/claude/vercel.json`

### 9. `render.json`
- Copy from: `/home/claude/render.json`

### 10. `.github/workflows/deploy-frontend.yml`
- Copy from: `/home/claude/github-actions-deploy-frontend.yml`

### 11. `.github/workflows/deploy-backend.yml`
- Copy from: `/home/claude/github-actions-deploy-backend.yml`

### 12. `DEPLOYMENT.md`
- Copy from: `/home/claude/DEPLOYMENT_GUIDE.md`

## Quick Start: From This Template

### For GitHub Setup:

1. **Create new repo** in xaglobally-lgtm org:
   - Name: `app-template`
   - Make PUBLIC (for Vercel)
   - Initialize with README ✓

2. **Upload all files above:**
   - Create folders: `frontend/src`, `backend/src`, `supabase`, `.github/workflows`, `docs`
   - Upload each file to correct location
   - Create `.gitignore` with:
     ```
     node_modules/
     .env.local
     dist/
     .DS_Store
     *.log
     ```

3. **Push first commit:**
   ```bash
   git add .
   git commit -m "init: app-template from claude"
   git push
   ```

### For Your First App Clone:

```bash
# Clone template
git clone https://github.com/xaglobally-lgtm/app-template.git my-app
cd my-app

# Rename all references
sed -i 's/app-template/my-app/g' frontend/package.json backend/package.json
sed -i 's/app_/myapp_/g' supabase/schema.sql

# Change git remote
git remote set-url origin https://github.com/xaglobally-lgtm/my-app.git

# Push
git add . && git commit -m "init: my-app from template" && git push
```

Follow `DEPLOYMENT.md` for Vercel & Render setup.

## What Each File Does

| File | Purpose |
|------|---------|
| **README.md** | Overview & architecture |
| **DEPLOYMENT.md** | Step-by-step deployment guide (5-15 min) |
| **.env.example** | Environment variables template |
| **frontend/package.json** | React dependencies |
| **frontend/src/App.tsx** | Main React component with UI |
| **backend/package.json** | Express dependencies |
| **backend/src/server.ts** | Express server with security & DB |
| **supabase/schema.sql** | Database schema (users, API keys, audit log, errors, metering) |
| **vercel.json** | Frontend deployment config |
| **render.json** | Backend deployment config |
| **deploy-*.yml** | GitHub Actions for auto-deploy |
| **docs/*** | Architecture, API, security, troubleshooting |

## Key Features Included

✅ **Security**
- API key validation
- CORS locked to origins
- Rate limiting (10/sec per IP)
- Error alerts to xaglobally@gmail.com
- Row-Level Security on all tables

✅ **Production Ready**
- TypeScript everywhere
- Error handling & logging
- Health checks
- Database migrations
- Environment management

✅ **Scalable**
- Shared Supabase project (all apps)
- Namespaced tables (app_*, myapp_*, etc.)
- Auto-deploy on push (GitHub Actions)
- Multi-app cost optimization ($7/app/mo)

✅ **Developer Experience**
- 14 languages (i18n)
- Multi-currency support
- Dark mode
- Responsive design
- Tailwind CSS v4
- React 19

✅ **Monitoring**
- `/health` endpoint
- Usage tracking
- Error tracking
- Performance metrics
- Email alerts

## Customization Guide

See `docs/CUSTOMIZATION.md` for:
- Adding custom routes
- Creating new database tables
- Integrating payment systems (Stripe)
- Adding external APIs
- Modifying UI components
- Changing styling

## Cost Breakdown (Per App)

| Service | Free? | Cost | Limits |
|---------|-------|------|--------|
| Supabase | Yes | Shared project | 500k rows |
| Vercel | Yes | Starter tier | 100GB/month bandwidth |
| Render | No | $7/mo | Generous for MVP |
| **Total** | — | **$7/mo** | Scales to 1000s users |

## Support & Questions

- **Documentation**: See `docs/` folder
- **Issues**: GitHub Issues in xaglobally-lgtm/app-template
- **Email**: xaglobally@gmail.com

---

**This template is designed to scale from 1 to 100 apps without increasing cost-per-app.**

Good luck! 🚀
