# Deploy Backend on Render - Complete Guide

Render is more stable than Railway and works perfectly for your Express.js backend.

---

## Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Render to access your GitHub repositories

---

## Step 2: Deploy Backend Service

1. In Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. **Connect your repository:**
   - Click **"Connect account"** (link GitHub if not already connected)
   - Select **testflow-pro-mysql** repository
   - Click **"Connect"**

4. **Configure Web Service:**
   - **Name**: `testflow-backend`
   - **Region**: Choose closest to you (e.g., `Oregon` for USA)
   - **Branch**: `production`
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (leave as is)
   - **Start Command**: `node backend/src/server.js`
   - **Plan**: `Free` (for testing) or `Starter` ($7/month for reliability)

5. Click **"Create Web Service"**

Render will start building! ⏳ This takes 2-5 minutes.

---

## Step 3: Add PostgreSQL Database

Railway uses MySQL, but Render defaults to **PostgreSQL**. We need to change the code slightly.

**For now, let's skip PostgreSQL and add it to your backend config.**

1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. **Configure:**
   - **Name**: `testflow-db`
   - **Region**: Same as backend
   - **PostgreSQL Version**: Latest
   - **Plan**: `Free`

4. Click **"Create Database"**

Render will create the database. ⏳ Takes ~1 minute.

---

## Step 4: Get Database Connection Details

1. Click on the **testflow-db** PostgreSQL service
2. Go to **"Info"** tab
3. Look for **"Internal Database URL"** (for private connections)
4. It looks like:
   ```
   postgresql://user:password@hostname:5432/database
   ```

**Extract these values:**
- `DB_USER` = `user`
- `DB_PASSWORD` = `password`
- `DB_HOST` = `hostname`
- `DB_PORT` = `5432`
- `DB_NAME` = `database` (at the end)

---

## Step 5: Add Redis Cache

1. Click **"New +"**
2. Select **"Redis"**
3. **Configure:**
   - **Name**: `testflow-redis`
   - **Region**: Same as backend
   - **Plan**: `Free`

4. Click **"Create Redis"**

⏳ Takes ~1 minute.

---

## Step 6: Get Redis Connection Details

1. Click on **testflow-redis** service
2. Go to **"Info"** tab
3. Look for **"Internal Redis URL"**
4. It looks like:
   ```
   redis://default:password@hostname:6379
   ```

**Extract:**
- `REDIS_HOST` = `hostname`
- `REDIS_PORT` = `6379`
- `REDIS_PASSWORD` = `password` (the part between `:` and `@`)

---

## Step 7: Add Environment Variables to Backend

1. Go to **testflow-backend** service
2. Click **"Environment"** tab
3. Add all these variables:

```
NODE_ENV=production
PORT=5000

DB_HOST=<from PostgreSQL Info>
DB_PORT=5432
DB_NAME=<database name from URL>
DB_USER=<from PostgreSQL Info>
DB_PASSWORD=<from PostgreSQL Info>

REDIS_HOST=<from Redis Info>
REDIS_PORT=6379
REDIS_PASSWORD=<from Redis Info>

JWT_SECRET=ZQ+7iGLiaIIyTxZIJ6WfcBtt88YCoxRgAAgol+3lVL4=
JWT_REFRESH_SECRET=O5CpnFQsn0IIRkArAdD7aAbYCehIET1piRNQabvlImg=

FRONTEND_URL=https://testflow-pro-mysql-frontend.vercel.app

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

4. Click **"Save"**

Render will automatically redeploy with new variables! ✅

---

## Step 8: Wait for Deployment

1. Go to **testflow-backend** service
2. Watch the **"Deploy"** log
3. Wait for **green "Live"** status at the top

This takes 2-5 minutes.

---

## Step 9: Get Your Backend URL

Once deployment is **Live** (green):

1. Look at the top of the page
2. You'll see your **Backend URL**, like:
   ```
   https://testflow-backend-xxxxx.onrender.com
   ```

**Copy this URL** - you'll need it for the frontend!

---

## Step 10: Test Backend Health

Run this command in your terminal:

```bash
curl https://your-backend-url/health
```

Replace `your-backend-url` with your actual URL.

**You should see JSON response like:**
```json
{
  "status": "OK",
  "timestamp": "2026-03-21T...",
  "uptime": 125.3
}
```

✅ If you see this, backend is working!

---

## Step 11: Update Frontend

1. Go to **Vercel dashboard**
2. Select **testflow-pro-mysql-frontend** project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_BACKEND_URL`
5. Change it to your Render backend URL:
   ```
   VITE_BACKEND_URL=https://your-backend-url
   ```
6. Click **"Save"**

Vercel auto-redeploys! ⏳ Takes 1-2 minutes.

---

## Step 12: Test Login

Once Vercel finishes redeploying:

1. Go to **https://testflow-pro-mysql-frontend.vercel.app/login**
2. Try logging in with:
   - **Email**: admin@testflow.dev
   - **Password**: BDATech321@

✅ If login works, you're done!

---

## ✅ Final Checklist

- [ ] Backend deployed on Render (status: Live)
- [ ] PostgreSQL database created
- [ ] Redis cache created
- [ ] All environment variables added
- [ ] Backend health check passing (curl /health)
- [ ] Backend URL copied
- [ ] Frontend VITE_BACKEND_URL updated
- [ ] Frontend redeployed on Vercel
- [ ] Login test successful

---

## 🎯 Your Production URLs

**Frontend**: https://testflow-pro-mysql-frontend.vercel.app/login
**Backend**: https://testflow-backend-xxxxx.onrender.com
**Database**: PostgreSQL on Render
**Cache**: Redis on Render

---

## 🆘 Troubleshooting

**Backend won't deploy:**
- Check "Deploy" log for errors
- Verify Start Command: `node backend/src/server.js`
- Check Root Directory is correct

**Database connection fails:**
- Verify DB credentials in Environment Variables
- Ensure PostgreSQL service is "Live"
- Check DB_HOST, DB_USER, DB_PASSWORD are correct

**Redis connection fails:**
- Verify REDIS_HOST and REDIS_PASSWORD
- Ensure Redis service is "Live"

**Frontend can't reach backend:**
- Verify VITE_BACKEND_URL in Vercel
- Check backend is responding to /health
- Check browser console for CORS errors

---

## ✨ Advantages of Render

✅ More stable than Railway
✅ Better free tier
✅ Easier configuration
✅ Native PostgreSQL & Redis support
✅ GitHub auto-deploy on push
✅ Built-in monitoring and logs

Good luck! 🚀
