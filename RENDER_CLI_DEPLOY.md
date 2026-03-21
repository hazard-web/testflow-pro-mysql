# Deploy Backend to Render from Terminal

Quick terminal-based deployment to Render.

---

## Option 1: Auto-Deploy via Git Push (Easiest)

Since you already have GitHub synced, just push to trigger auto-deploy:

```bash
cd /Users/shivambhardwaj/Downloads/testflow-pro-mysql

# Make sure code is committed
git add .
git commit -m "Deploy backend to Render"

# Push to GitHub (Render watches this)
git push origin production
```

That's it! Render will auto-deploy within 2-5 minutes.

**To check deployment status:**
1. Go to https://dashboard.render.com
2. Click your backend service
3. Watch the deploy logs

---

## Option 2: Using Render CLI (Advanced)

If you want more control from terminal:

### 1. Install Render CLI

```bash
# Using npm (requires Node.js)
npm install -g @render-com/cli

# Or using Homebrew
brew install render-cli
```

### 2. Login to Render

```bash
render login
```

This opens browser to authenticate. Click "Allow" and return to terminal.

### 3. Deploy Backend

```bash
cd /Users/shivambhardwaj/Downloads/testflow-pro-mysql/backend

# Deploy (pushes code to Render)
render deploy
```

Wait 2-5 minutes for deployment. ⏳

### 4. Get Backend URL

```bash
render services
```

Look for your **testflow-backend** service URL. It'll be something like:
```
https://testflow-backend-xxxxx.onrender.com
```

---

## Option 3: Deploy Services via CLI (Full Setup)

If Render services don't exist yet, create them from terminal:

```bash
# Login first
render login

# Create backend service
render create-service \
  --name testflow-backend \
  --runtime node \
  --start-command "node backend/src/server.js" \
  --github-repo hazard-web/testflow-pro-mysql \
  --branch production

# Create PostgreSQL database
render create-database \
  --name testflow-db \
  --plan free

# Create Redis
render create-redis \
  --name testflow-redis \
  --plan free
```

Then add environment variables:

```bash
render env-set \
  --service testflow-backend \
  --var NODE_ENV=production \
  --var PORT=5000 \
  --var DB_HOST=your-db-host \
  --var DB_USER=postgres \
  --var DB_PASSWORD=your-password \
  --var JWT_SECRET=ZQ+7iGLiaIIyTxZIJ6WfcBtt88YCoxRgAAgol+3lVL4=
```

---

## Recommended: Simple Push Method

**This is the easiest:**

```bash
# From root directory
cd /Users/shivambhardwaj/Downloads/testflow-pro-mysql

# Commit changes
git add .
git commit -m "Deploy backend to Render"

# Push (Render auto-deploys)
git push origin production

# Wait 2-5 minutes, then check:
# https://dashboard.render.com
```

That's it! No extra CLI needed.

---

## After Deployment

Once backend is live on Render:

1. **Get backend URL** from Render dashboard
2. **Update frontend** on Vercel:
   ```bash
   # Or manually in Vercel Settings → Environment Variables
   VITE_BACKEND_URL=https://your-render-backend-url
   ```
3. **Test login**:
   - Go to https://testflow-pro-mysql-frontend.vercel.app/login
   - Try: admin@testflow.dev / BDATech321@

---

## Check Deployment Status

```bash
# If using Render CLI
render logs --service testflow-backend

# Or check browser
# https://dashboard.render.com → Your Service → Logs
```

---

## Troubleshooting

**Backend won't start:**
```bash
# Check logs
render logs --service testflow-backend --tail

# Look for errors, most common:
# - Missing environment variables
# - Wrong database credentials
# - Port already in use
```

**Can't find backend URL:**
```bash
# List all services
render services

# Get specific service URL
render info --service testflow-backend
```

**Redeploy after changes:**
```bash
git push origin production
# Or
render deploy
```

---

## ✅ Complete Flow

```bash
# 1. Commit code
cd /Users/shivambhardwaj/Downloads/testflow-pro-mysql
git add .
git commit -m "Backend deployment"

# 2. Push to GitHub (triggers Render auto-deploy)
git push origin production

# 3. Wait 2-5 minutes...

# 4. Copy backend URL from Render dashboard

# 5. Update frontend
# Go to: https://vercel.com → Your Project → Settings → Environment Variables
# Set: VITE_BACKEND_URL = https://your-render-url

# 6. Wait for Vercel redeploy (1-2 minutes)

# 7. Test login
# https://testflow-pro-mysql-frontend.vercel.app/login
```

Done! 🚀
