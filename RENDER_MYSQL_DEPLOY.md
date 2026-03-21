# Deploy Backend to Render with MySQL

Since you're using MySQL, we'll deploy the backend to Render and connect it to MySQL (either keep Railway's MySQL or use a new managed MySQL).

---

## Option 1: Render Backend + Railway MySQL (Easiest)

Use your existing MySQL from Railway with the Render backend.

### Step 1: Create Render Backend Service

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect **testflow-pro-mysql** repo, **production** branch
4. **Configure:**
   - **Name**: `testflow-backend`
   - **Start Command**: `node backend/src/server.js`
   - **Plan**: Free
5. Click **"Create Web Service"** ⏳ Wait 2-5 minutes for build

### Step 2: Create Redis on Render

1. Click **"New +"** → **"Redis"**
2. **Name**: `testflow-redis`
3. **Plan**: Free
4. Click **"Create Redis"** ⏳ Wait ~1 minute

### Step 3: Get Redis Connection Details

1. Click **testflow-redis** service
2. Go to **"Info"** tab
3. Copy the **"Internal Redis URL"** (looks like `redis://:password@host:6379`)

Extract:

- `REDIS_HOST` = the host part
- `REDIS_PASSWORD` = password between `:` and `@`

### Step 4: Get MySQL Details from Railway

1. Go to **https://railway.app**
2. Click your **MySQL** service
3. Go to **"Connect"** tab
4. You'll see the connection URL

Extract:

- `DB_HOST` = domain (e.g., `containers-us-west-xxx.railway.app`)
- `DB_PORT` = port number (usually `3306`)
- `DB_USER` = `root`
- `DB_PASSWORD` = password from URL
- `DB_NAME` = database name (ask in chat if unsure)

### Step 5: Add Environment Variables to Render Backend

1. Click **testflow-backend** service on Render
2. Go to **"Environment"** tab
3. Add these variables:

```
NODE_ENV=production
PORT=5000

DB_HOST=<from Railway MySQL>
DB_PORT=3306
DB_NAME=testflow
DB_USER=root
DB_PASSWORD=<from Railway MySQL>

REDIS_HOST=<from Render Redis Info>
REDIS_PORT=6379
REDIS_PASSWORD=<from Render Redis Info>

JWT_SECRET=ZQ+7iGLiaIIyTxZIJ6WfcBtt88YCoxRgAAgol+3lVL4=
JWT_REFRESH_SECRET=O5CpnFQsn0IIRkArAdD7aAbYCehIET1piRNQabvlImg=

FRONTEND_URL=https://testflow-pro-mysql-frontend.vercel.app

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

4. Click **"Save"** ✅ Render redeploys automatically

### Step 6: Wait for Deployment

⏳ Watch until **testflow-backend** shows **green "Live"** (2-5 minutes)

### Step 7: Get Backend URL

Once Live, copy your backend URL from the top:

```
https://testflow-backend-xxxxx.onrender.com
```

### Step 8: Update Frontend

1. Go to **https://vercel.com** → Your project
2. **Settings** → **Environment Variables**
3. Set `VITE_BACKEND_URL` to your Render URL
4. Click **"Save"**

Vercel redeploys in 1-2 minutes.

### Step 9: Test Login

1. Go to **https://testflow-pro-mysql-frontend.vercel.app/login**
2. Try: `admin@testflow.dev` / `BDATech321@`

✅ **Done!**

---

## Option 2: Render Backend + Render MySQL

If you want everything on Render:

### Create MySQL on Render

**Unfortunately, Render doesn't have a managed MySQL service.**

Instead, use one of these:

- **Railway MySQL** (what you have now) ← Easiest
- **AWS RDS** (more expensive)
- **Clever Cloud** (cheaper MySQL option)
- **PlanetScale** (MySQL-compatible, free tier)

### Recommended: Use Neon PostgreSQL + Keep MySQL Code?

Actually, easier option: **Keep using Railway MySQL** with Render backend (Option 1 above).

---

## What You Need to Do

1. **Go to Render.com** → Sign up with GitHub
2. **Create Web Service** (backend)
   - Connect your GitHub repo
   - Start Command: `node backend/src/server.js`
   - Click Create
3. **Create Redis service** on Render
4. **From Railway**, copy your MySQL credentials
5. **Add all environment variables** to Render backend
6. **Wait for deployment** (watch the logs)
7. **Copy backend URL**
8. **Go to Vercel** → Update `VITE_BACKEND_URL`
9. **Test login**

---

Let me know when you're ready or what MySQL service you're using!
