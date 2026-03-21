# Railway Backend Deployment - Step by Step Guide

## Step 1: Confirm Backend Service is Deployed

In Railway dashboard:

1. You should see your **testflow-pro-mysql** project
2. Click on it
3. You should see a **Backend** service (Node.js)

**If Backend service is not showing or status is "Building":**

- Wait 2-5 minutes for initial deployment
- Check the **Deployments** tab to see build progress

---

## Step 2: Generate JWT Secrets

Copy and paste these commands in your terminal to generate secure secrets:

```bash
openssl rand -base64 32
```

Run this command **TWICE** and copy the outputs:

```
JWT_SECRET=<paste first output here>
JWT_REFRESH_SECRET=<paste second output here>
```

**Example output:**

```
aB12cD34eF56gH78iJ90kL12mN34oP56qR78sT90uV12
wX34yZ56aB78cD90eF12gH34iJ56kL78mN90oP12qR34
```

---

## Step 3: Create MySQL Database

In Railway:

1. Click **"New"** button (in your project)
2. Search for and select **"MySQL"**
3. Railway creates it automatically ✅
4. Wait for it to say **"Running"** (usually 30 seconds)

---

## Step 4: Get MySQL Connection Details

1. Click on the **MySQL** service
2. Go to **"Connect"** tab
3. You'll see something like:

```
mysql://root:PASSWORD@containers-us-west-XXX.railway.app:6729/railway
```

**Extract these values:**

- `DB_HOST` = `containers-us-west-XXX.railway.app` (the domain part)
- `DB_PORT` = `6729` (the port number)
- `DB_USER` = `root`
- `DB_PASSWORD` = `PASSWORD` (the password part)
- `DB_NAME` = `testflow_production`

---

## Step 5: Create Redis Cache

In Railway:

1. Click **"New"** again
2. Search for and select **"Redis"**
3. Railway creates it automatically ✅
4. Wait for it to say **"Running"**

---

## Step 6: Get Redis Connection Details

1. Click on the **Redis** service
2. Go to **"Connect"** tab
3. You'll see something like:

```
redis://:PASSWORD@containers-us-west-XXX.railway.app:6379
```

**Extract these values:**

- `REDIS_HOST` = `containers-us-west-XXX.railway.app`
- `REDIS_PORT` = `6379`
- `REDIS_PASSWORD` = `PASSWORD`

---

## Step 7: Configure Backend Environment Variables

In Railway:

1. Click on your **Backend** service
2. Go to **"Variables"** tab
3. Add all these environment variables (click "Add Variable" for each):

```
NODE_ENV = production

PORT = 5000

DB_HOST = <from MySQL Connect tab>
DB_PORT = 3306
DB_NAME = testflow_production
DB_USER = root
DB_PASSWORD = <from MySQL Connect tab>

REDIS_HOST = <from Redis Connect tab>
REDIS_PORT = 6379
REDIS_PASSWORD = <from Redis Connect tab>

JWT_SECRET = <generated secret 1>
JWT_REFRESH_SECRET = <generated secret 2>

FRONTEND_URL = https://testflow-pro-mysql-frontend.vercel.app

EMAIL_SERVICE = gmail
EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your-app-password

NODE_MODULES_CACHE = true
```

**Click "Save" after adding all variables**

---

## Step 8: Wait for Redeployment

After saving environment variables:

1. Railway automatically redeploys with new variables
2. Go to **"Deployments"** tab
3. Wait for new deployment to finish (green checkmark)
4. Takes about 2-5 minutes

---

## Step 9: Get Your Backend URL

Once deployed:

1. Click on Backend service
2. Go to **"Connect"** tab
3. You'll see a **Public URL** that looks like:

```
https://testflow-pro-mysql-production.up.railway.app
```

**Copy this URL** - you'll need it for the next step

---

## Step 10: Test Backend Health

In your terminal, run:

```bash
curl https://YOUR-BACKEND-URL/health
```

Replace `YOUR-BACKEND-URL` with your actual URL from Step 9.

**You should get a JSON response like:**

```json
{
  "status": "OK",
  "timestamp": "2026-03-20T...",
  "uptime": "..."
}
```

If it works ✅, move to Step 11.

If it fails ❌, check Railway logs for errors.

---

## Step 11: Update Frontend with Backend URL

Once you have confirmed the backend is working:

1. Go to **Vercel dashboard**
2. Select your **testflow-pro-mysql-frontend** project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_BACKEND_URL`
5. Update it to your Railway backend URL:

```
VITE_BACKEND_URL = https://YOUR-BACKEND-URL
```

6. Click "Save"
7. Vercel auto-redeploys (takes ~1-2 minutes)

---

## Step 12: Test Full Integration

Once Vercel redeploys:

1. Go to your frontend: https://testflow-pro-mysql-frontend.vercel.app/login
2. Try logging in with:
   - **Email**: admin@testflow.dev
   - **Password**: BDATech321@

**If login works ✅:**

- Frontend and backend are connected!
- You're ready to use the app in production!

**If login fails ❌:**

- Check frontend logs in Vercel
- Check backend logs in Railway
- Verify VITE_BACKEND_URL is correct

---

## 🎯 Summary Checklist

- [ ] MySQL database created and running
- [ ] Redis cache created and running
- [ ] All environment variables added to Backend
- [ ] Backend redeployed with new variables
- [ ] Backend health check passing (curl /health)
- [ ] Backend URL copied
- [ ] Frontend VITE_BACKEND_URL updated in Vercel
- [ ] Frontend redeployed
- [ ] Login test successful

---

## 📞 Troubleshooting

**Backend won't start:**

- Check Railway logs for errors
- Verify all environment variables are set
- Ensure MySQL and Redis are running

**Frontend can't reach backend:**

- Verify VITE_BACKEND_URL is correct in Vercel
- Check backend health endpoint: `curl https://YOUR-BACKEND-URL/health`
- Check browser console for CORS errors

**Database connection fails:**

- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check MySQL is running on Railway
- Ensure MySQL service status is "Running"

**Redis connection fails:**

- Verify REDIS_HOST, REDIS_PASSWORD are correct
- Check Redis service status is "Running"
- Test with: `redis-cli -h REDIS_HOST -p REDIS_PORT -a REDIS_PASSWORD ping`

---

## ✅ When Complete

You'll have:
✅ Frontend deployed on Vercel
✅ Backend deployed on Railway
✅ MySQL database running
✅ Redis cache running
✅ All services connected
✅ Production app live!

**App URL:** https://testflow-pro-mysql-frontend.vercel.app/login
**Backend API:** https://YOUR-BACKEND-URL

Good luck! 🚀
