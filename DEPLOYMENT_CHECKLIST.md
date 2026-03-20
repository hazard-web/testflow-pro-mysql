# Vercel Deployment Checklist

## Pre-Deployment (Local Setup)

- [ ] Review `VERCEL_DEPLOYMENT.md` for architecture overview
- [ ] Ensure all tests pass: `npm run test`
- [ ] Build frontend locally: `npm run build`
- [ ] Update production credentials in `.env.production.example`

## Step 1: Set Up Database (5 minutes)

- [ ] Create PlanetScale account at https://planetscale.com
- [ ] Create new database `testflow-pro`
- [ ] Generate admin password
- [ ] Copy connection credentials:
  ```
  DB_HOST: 
  DB_USER: 
  DB_PASSWORD: 
  ```

## Step 2: Deploy Backend API (15 minutes)

Choose one:

### Option A: Railway (Recommended)
- [ ] Sign up at https://railway.app with GitHub
- [ ] Create new project from GitHub repo
- [ ] Add MySQL plugin
- [ ] Set environment variables from `.env.production.example`
- [ ] Deploy and copy API URL: `https://your-railway-domain.up.railway.app`

### Option B: Render.com
- [ ] Sign up at https://render.com with GitHub
- [ ] Create new web service
- [ ] Configure Node.js build
- [ ] Set environment variables
- [ ] Deploy and copy API URL

## Step 3: Deploy Frontend to Vercel (10 minutes)

### Option A: Vercel Dashboard (Easiest)
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Select `testflow-pro-mysql` repository
- [ ] Configure:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output: `frontend/dist`
- [ ] Add Environment Variables:
  ```
  VITE_API_URL=https://your-backend-api.com/api
  VITE_ENV=production
  ```
- [ ] Deploy and copy domain: `https://your-project.vercel.app`

### Option B: Vercel CLI
- [ ] Install: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Deploy: `vercel --prod`
- [ ] Set environment variables when prompted

## Step 4: Update Environment Variables

- [ ] Update backend with frontend URL:
  ```
  CLIENT_URL=https://your-vercel-domain.vercel.app
  ```
- [ ] Update frontend with backend URL:
  ```
  VITE_API_URL=https://your-backend-api.com/api
  ```

## Step 5: Initialize Production Database (5 minutes)

```bash
# Temporarily update .env with PlanetScale credentials
export DB_HOST=aws.connect.psdb.cloud
export DB_USER=your_username
export DB_PASSWORD=your_password

# Run migrations and seed
npm run db:reset
```

## Step 6: Verify Deployment (5 minutes)

- [ ] Frontend loads: Visit `https://your-vercel-domain.vercel.app`
- [ ] Backend responds: 
  ```bash
  curl https://your-backend-api.com/health
  ```
- [ ] Login works: Test with credentials:
  ```
  Email: admin@testflow.dev
  Password: Password@123
  ```

## Step 7: Post-Deployment

- [ ] Set up custom domain (optional)
- [ ] Enable analytics in Vercel
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create backup schedule for PlanetScale
- [ ] Document API endpoints and credentials

## Rollback Plan

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push origin production

# Verify production environment after rollback
curl https://your-vercel-domain.vercel.app
```

## Common Issues

**Frontend not connecting to API:**
- Check `VITE_API_URL` matches backend URL exactly
- Verify backend CORS allows frontend domain
- Check browser console for errors

**Database connection fails:**
- Verify PlanetScale IP whitelist (default: all IPs allowed)
- Test locally with same credentials
- Check database password for special characters

**Build fails on Vercel:**
- Check build command works locally
- Verify all dependencies in package.json
- Check logs in Vercel dashboard

---

**Total Deployment Time:** ~30-45 minutes

**Questions?** Check `VERCEL_DEPLOYMENT.md` for detailed guide
