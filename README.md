# App Template — Production-Grade Boilerplate for 100 Apps

**Clone this once. Deploy 100 times. 2-day builds. Shared infrastructure. Zero per-app overhead.**

## What You Get

- **Frontend**: React 19 + Tailwind CSS v4 + Vite (PWA-ready, 14 languages, multi-currency)
- **Backend**: Express.js + Node.js (Supabase client, API key validation, rate limiting, security hardened)
- **Database**: Namespaced schema in shared "API Verifier LIVE" Supabase project
- **CI/CD**: GitHub Actions (auto-deploy on push: frontend → Vercel, backend → Render)
- **Monitoring**: Error alerts to xaglobally@gmail.com, usage tracking, health checks
- **Deployment**: 5-minute setup (copy template, rename tables, push to GitHub, deploy)

## Architecture

```
app-template/
├── frontend/                 # React 19 + Vite
│   ├── src/
│   │   ├── App.tsx          # Main component
│   │   ├── components/      # Reusable UI
│   │   └── utils/           # Helpers (API, i18n, currency)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                  # Express.js + Supabase
│   ├── src/
│   │   ├── server.ts        # Main server
│   │   ├── api/             # Routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, rate limit, error handling
│   │   └── types.ts         # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── supabase/                 # Database schema
│   └── schema.sql           # Namespaced tables
├── .github/
│   └── workflows/           # GitHub Actions
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
├── docs/
│   ├── ARCHITECTURE.md      # System design
│   ├── DEPLOYMENT.md        # Step-by-step deploy
│   ├── API.md               # Backend endpoints
│   └── CUSTOMIZATION.md     # How to adapt
├── .env.example             # Environment template
├── vercel.json              # Frontend deploy config
├── render.json              # Backend deploy config
└── README.md                # This file
```

## Quick Start (5 minutes)

### 1. Clone the template

```bash
git clone https://github.com/xaglobally-lgtm/app-template.git my-app
cd my-app
```

### 2. Rename for your app

```bash
# Update package.json names
sed -i 's/app-template/my-app/g' frontend/package.json backend/package.json

# Rename database tables
sed -i 's/app_/myapp_/g' supabase/schema.sql
```

### 3. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your secrets:
# - SUPABASE_URL
# - SUPABASE_KEY
# - API_ADMIN_KEY
# - RENDER_API_KEY
# - VERCEL_API_KEY
```

### 4. Deploy database

- Go to Supabase dashboard → SQL Editor
- Open `supabase/schema.sql`
- Copy/paste → Run (creates your app's namespaced tables)

### 5. Deploy frontend (Vercel)

```bash
# Push to GitHub
git add .
git commit -m "Init: my-app"
git push origin main

# Vercel auto-deploys on push (GitHub connection already set up)
# Check: https://vercel.com/xaglobally/my-app
```

### 6. Deploy backend (Render)

```bash
# In Render dashboard:
# - New Web Service → Connect GitHub repo
# - Build command: cd backend && npm install && npm run build
# - Start command: node dist/server.js
# - Environment: paste from .env.local
# Check: https://my-app-api.render.com/health
```

**Done. Your app is live.**

## Shared Supabase Infrastructure

All apps share one Supabase project: **"API Verifier LIVE"** (org: xaglobally@gmail.com)

**Table naming**: Each app gets a prefix
- WatchDog: `watchdog_expectations`, `watchdog_proofs`, `watchdog_users`
- ForeSite: `foresite_alerts`, `foresite_detections`, `foresite_users`
- MyApp: `myapp_*` tables

**Row-Level Security (RLS)**: Enabled on all tables
- Users can only see their own data (enforced at DB level)
- API keys scoped per user
- Admin override with ADMIN_KEY env var

## Security Built In

✅ API key validation on every request
✅ Rate limiting (10 req/sec per IP, 100 req/min per API key)
✅ CORS locked to specific origins
✅ Secrets in .env (not hardcoded)
✅ Error logging to xaglobally@gmail.com (failures flagged instantly)
✅ Request/response logging (audit trail)
✅ Prisma ORM (SQL injection protection)
✅ TypeScript (type safety)

## Monitoring & Alerts

Every app gets:
- **Health check**: `/health` endpoint returns uptime, DB status, error count
- **Error alerts**: Any 500+ errors → email to xaglobally@gmail.com within 1 min
- **Usage tracking**: Metered API calls (for billing tiers)
- **Performance**: Response time histograms

## Cost Breakdown (per app, per month)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | $0 | Shared project, free tier |
| Vercel | $0 | Free tier, 100 GB bandwidth |
| Render | $7 | Cheapest paid tier (free tier spins down) |
| **Total** | **$7** | Unlimited scaling within limits |

**For 25 apps**: $175/mo (vs $625+ if separate projects)
**For 100 apps**: $700/mo (vs $2500+ if separate projects)

## Customization

Each app can:
- Add custom tables (follow `appname_` prefix)
- Override backend routes (in `backend/src/api/`)
- Customize frontend UI (Tailwind config, components)
- Add payment integration (Stripe/LemonSqueezy script)
- Add email service (SendGrid/resend)
- Add external APIs (OpenAI, Stripe, etc.)

See `docs/CUSTOMIZATION.md` for step-by-step examples.

## Deployment Checklist

- [ ] Clone repo
- [ ] Rename for your app
- [ ] Set .env.local
- [ ] Run Supabase SQL schema
- [ ] Push to GitHub
- [ ] Verify Vercel deploy (frontend)
- [ ] Connect Render (backend)
- [ ] Verify `/health` endpoint
- [ ] Test API endpoint (curl or Postman)
- [ ] Monitor error alerts (send test error)

**Time: 5 minutes. Done.**

## Files to Update Per App

When you clone, change these:

1. **package.json** (frontend + backend)
   - `name`: "my-app"
   - `description`: Your app description

2. **.env.local**
   - `SUPABASE_PROJECT_ID`: (stays same, shared project)
   - `APP_NAME`: "my-app" (for table prefixes, logging)
   - `API_ADMIN_KEY`: Generate new key (keep secure)

3. **supabase/schema.sql**
   - Change `app_` prefix to `myapp_` (tables)

4. **.github/workflows/** (optional)
   - Update deployment targets (Vercel project name, Render service name)

5. **Frontend** (optional)
   - Update app name in UI
   - Add app-specific colors (Tailwind config)

6. **Backend** (optional)
   - Add custom routes in `src/api/`
   - Update business logic

**Everything else is production-ready. Don't change it.**

## Next Steps

1. Use this as-is for your next app (clone → rename → deploy)
2. Share feedback (what broke, what took too long)
3. Update template with improvements
4. Rinse & repeat for app #2, #3, ... #100

## Support

- Questions? See `docs/`
- Bug? Email xaglobally@gmail.com
- Feature request? Update template, PR it

---

**Built for scale. Built for speed. Built to last.**
