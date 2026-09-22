# App Template - Deployment Guide

**Clone → Customize → Deploy → Done**

Complete step-by-step guide to deploy your first app using the template.

## Prerequisites

- GitHub account (logged in as xaglobally-lgtm org)
- Vercel account (connected to GitHub)
- Render account (for backend)
- Supabase account (xaglobally@gmail.com)
- Local: Node.js 20+, Git, Terminal/PowerShell

## Step 1: Clone the Template (2 min)

```bash
# Clone the master template
git clone https://github.com/xaglobally-lgtm/app-template.git my-app
cd my-app

# Rename for your app
sed -i 's/app-template/my-app/g' frontend/package.json backend/package.json
sed -i 's/app_/myapp_/g' supabase/schema.sql
```

## Step 2: Set Up Environment (3 min)

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your secrets
nano .env.local
```

**Required values to add:**

```
SUPABASE_URL=https://iwpfhalextbzbvcajtxu.supabase.co
SUPABASE_ANON_KEY=[copy from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[copy from Supabase dashboard]
API_ADMIN_KEY=[generate: openssl rand -hex 32]
API_ADMIN_PIN=1234
ALLOWED_ORIGINS=http://localhost:5173,https://my-app.vercel.app
```

## Step 3: Set Up Database (2 min)

### 3.1 Open Supabase Dashboard

- Go to: https://supabase.com/dashboard
- Select: "API Verifier LIVE" project
- Click: "SQL Editor"

### 3.2 Create Tables

- Open `supabase/schema.sql`
- Copy all contents
- Paste into Supabase SQL Editor
- Click "Run"

**You should see:**
```
CREATE TABLE
CREATE INDEX
... (8+ success messages)
```

## Step 4: Set Up GitHub (3 min)

### 4.1 Create New Repository

```bash
# Create new repo in xaglobally-lgtm org
# Go to: https://github.com/xaglobally-lgtm
# Click: "New"
# Name: "my-app"
# Make it PUBLIC (for Vercel auto-deploy)
```

### 4.2 Push Your Code

```bash
# In your local my-app folder:
git remote remove origin
git remote add origin https://github.com/xaglobally-lgtm/my-app.git
git branch -M main
git add .
git commit -m "init: my-app from template"
git push -u origin main
```

## Step 5: Deploy Frontend to Vercel (3 min)

### 5.1 Connect GitHub

- Go to: https://vercel.com
- Click: "New Project"
- Import: `xaglobally-lgtm/my-app`
- Framework: Auto-detect (should be "Vite")
- Environment variables:
  ```
  VITE_API_URL=https://my-app-api.render.com
  VITE_SUPABASE_URL=[from .env.local]
  VITE_SUPABASE_ANON_KEY=[from .env.local]
  VITE_APP_NAME=my-app
  VITE_ENVIRONMENT=production
  ```
- Click: "Deploy"

**Result:**
```
✅ Frontend deployed to: https://my-app.vercel.app
```

## Step 6: Deploy Backend to Render (5 min)

### 6.1 Create New Service

- Go to: https://dashboard.render.com
- Click: "New" → "Web Service"
- Connect: `xaglobally-lgtm/my-app`
- Settings:
  - **Name**: `my-app-api`
  - **Runtime**: Node
  - **Build Command**: `cd backend && npm install && npm run build`
  - **Start Command**: `node dist/server.js`
  - **Instance Type**: Starter (free tier)

### 6.2 Add Environment Variables

Add from your `.env.local`:

```
NODE_ENV=production
PORT=3000
APP_NAME=my-app
SUPABASE_URL=[value]
SUPABASE_SERVICE_ROLE_KEY=[value]
API_ADMIN_KEY=[value]
ALLOWED_ORIGINS=https://my-app.vercel.app
ERROR_ALERT_EMAIL=xaglobally@gmail.com
LOG_LEVEL=info
```

### 6.3 Deploy

- Click: "Create Web Service"
- Wait for build (~2 minutes)

**Result:**
```
✅ Backend deployed to: https://my-app-api.render.com
```

## Step 7: Verify Deployment (2 min)

### 7.1 Test Backend

```bash
# Check health endpoint
curl https://my-app-api.render.com/health

# Should return:
{
  "status": "healthy",
  "database": { "status": "connected", "responseTime": 45 },
  ...
}
```

### 7.2 Test Frontend

- Open: https://my-app.vercel.app
- You should see the app template UI
- Click "Run Test" button
- Should show: "API is working"

### 7.3 Update .env.local

Once backend is deployed, update your Vercel environment:

```
VITE_API_URL=https://my-app-api.render.com
```

Vercel will auto-redeploy with the new value.

## Step 8: Set Up GitHub Actions (1 min)

### 8.1 Add Secrets

- Go to: GitHub → Settings → Secrets and variables → Actions
- Add these secrets:
  ```
  VERCEL_ORG_ID=[from Vercel Settings]
  VERCEL_PROJECT_ID=[from Vercel Project Settings]
  VERCEL_TOKEN=[create at https://vercel.com/account/tokens]
  
  RENDER_SERVICE_ID=[from Render dashboard URL]
  RENDER_API_KEY=[create at https://dashboard.render.com/account/api-tokens]
  ```

### 8.2 Create Workflows

Create two files:

`.github/workflows/deploy-frontend.yml`
- Copy from template file

`.github/workflows/deploy-backend.yml`
- Copy from template file

Push to GitHub:

```bash
git add .github/
git commit -m "add: github actions workflows"
git push
```

**Now:**
- Any push to `main` → auto-deploys frontend to Vercel
- Any push to `main` → auto-deploys backend to Render

## Step 9: Customize Your App (15 min)

Now you have a live template. Customize for your app:

### 9.1 Frontend

Edit `frontend/src/App.tsx`:
- Change app name in header
- Update feature list
- Add your own routes
- Customize Tailwind colors

### 9.2 Backend

Edit `backend/src/server.ts`:
- Add custom routes in the routes section
- Implement business logic
- Connect to database operations

### 9.3 Database

Edit `supabase/schema.sql`:
- Add custom tables (use `myapp_` prefix)
- Add indexes
- Set up RLS policies

### 9.4 Push Changes

```bash
git add .
git commit -m "feat: customize for my app"
git push  # Auto-deploys to Vercel & Render
```

## Checklist: Before Going to Production

- [ ] All environment variables set (no placeholder values)
- [ ] Database tables created in Supabase
- [ ] Frontend tests pass (`npm test` in frontend/)
- [ ] Backend tests pass (`npm test` in backend/)
- [ ] `/health` endpoint returns "healthy"
- [ ] Frontend API test button works
- [ ] Error alerts configured (should receive test email)
- [ ] GitHub Actions secrets added
- [ ] Rate limiting configured (10 req/sec)
- [ ] CORS origins set correctly
- [ ] Error logging enabled
- [ ] Database backups configured (Supabase auto-backup)
- [ ] Monitoring dashboard reviewed

## Troubleshooting

### Frontend not loading

```bash
# Clear Vercel cache
vercel --prod --env-clear
# or re-deploy from dashboard
```

### Backend returning 503

```bash
# Check Render logs
# Dashboard → my-app-api → Logs
# Common issues:
# - Missing .env variables (check SUPABASE_URL, etc.)
# - Database connection (test from Supabase SQL editor)
# - Port not exposed (should be 3000)
```

### Database connection fails

```bash
# Test in Supabase SQL Editor
SELECT 1;  # Should return success

# Check SUPABASE_SERVICE_ROLE_KEY
# Must be the "service_role" key, not anon key
```

### Auto-deploy not triggering

```bash
# Check GitHub Actions
# Repo → Actions tab
# See logs for why workflow failed
# Common: Missing secrets or wrong branch
```

## Cost Estimate (per app)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | $0 | Shared project, free tier |
| Vercel | $0 | Free tier, generous limits |
| Render | $7 | Minimum paid tier |
| **Total** | **$7/mo** | Add $0.10 per extra 1GB bandwidth |

For 25 apps: **$175/mo**  
For 100 apps: **$700/mo**

## Next: Clone for App #2

Once this app is running, cloning for a new app takes **5 minutes**:

```bash
# Clone again
git clone https://github.com/xaglobally-lgtm/app-template.git app-2
cd app-2

# Rename
sed -i 's/app-template/app-2/g' frontend/package.json backend/package.json
sed -i 's/myapp_/app2_/g' supabase/schema.sql  # Update prefix

# Change remote
git remote set-url origin https://github.com/xaglobally-lgtm/app-2.git

# Push & deploy
git add . && git commit -m "init: app-2" && git push

# Connect Vercel & Render (repeat Step 5 & 6)
```

---

**Questions?** Check docs/ folder or email xaglobally@gmail.com
