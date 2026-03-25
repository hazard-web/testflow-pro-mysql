# 🚨 Production Support Quick Reference Card

## Immediate Checks (Do These First)

### 1. Is the backend responding?
```bash
curl -s -m 5 https://prolific-mercy-production.up.railway.app/health | jq .
```
- ✅ **If success:** Backend is online
- ❌ **If timeout/error:** Backend is down → Check Railway dashboard

### 2. Is the database connected?
```bash
curl -s -m 5 https://prolific-mercy-production.up.railway.app/health/deep | jq .
```
- ✅ **If "status": "healthy":** Database is connected
- ⚠️  **If "status": "degraded":** Database is offline or unreachable

### 3. Can users login?
```bash
# Test with any email/password combination
curl -s -X POST https://prolific-mercy-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```
- ✅ **If returns token:** Authentication working
- ❌ **If timeout:** Auth middleware issue

---

## Common Issues & Quick Fixes

| Problem | Check First | Quick Fix | Escalation |
|---------|------------|-----------|-----------|
| **Users can't login** | `/health/deep` | Restart backend on Railway | Check DB connection |
| **Timeout errors (15s)** | Check auth middleware logs | Already fixed in 8c24570 | If still happening, restart Railway backend |
| **Export PDF fails** | Check backend logs | Ensure pdfkit installed | Check server disk space |
| **Custom fields not showing** | Check migration logs | Run npm run db:migrate | Check database schema |
| **Workflow states not working** | Check migration logs | Run npm run db:migrate | Verify tables exist |

---

## Critical Endpoints to Monitor

### Health Checks (Run these every 5 minutes)
```bash
# Add to monitoring system:
GET /health → Should respond in < 100ms
GET /health/deep → Should respond in < 3000ms

# Alert if:
- /health doesn't respond in 5 seconds
- /health/deep returns "degraded"
- Any error status codes other than 401/403/404
```

### Key API Endpoints  
```bash
# Test every route after changes:
POST /api/auth/login → Should work
GET /api/auth/me → Must work (requires token)
GET /api/reports/project/[ID] → Should work
POST /api/reports/export/[ID] → Should work
```

---

## When Something Goes Wrong

### Step 1: Check the Status
```bash
echo "=== HEALTH ==="
curl -s https://prolific-mercy-production.up.railway.app/health | jq .
echo "=== DEEP HEALTH ==="
curl -s https://prolific-mercy-production.up.railway.app/health/deep | jq .
```

### Step 2: Check Logs
1. Go to https://railway.app
2. Click "TestFlow Backend" service
3. Click "View Logs" tab
4. Look for `ERROR` or `TIMEOUT` messages
5. Find `[DATABASE]` messages for connection issues

### Step 3: Identify the Issue
- **"Database connection timeout"** → Database is down
- **"ETIMEDOUT"** → Network issue between services
- **"Connection pool exhausted"** → Too many active requests
- **"ECONNREFUSED"** → Database service not running

### Step 4: Take Action
```bash
# If database is down:
# Go to Railway > MySQL service > Redeploy

# If backend is crashing:
# Go to Railway > Backend service > Redeploy

# If connection pool is exhausted:
# Restart will clear it. If recurring, need config change.
```

---

## Environment Variables to Check

### Critical for Backend
```bash
DB_HOST=mysql-production.railway.internal
DB_PORT=3306
DB_NAME=testflow
DB_USER=root
DB_PASSWORD=[SHOULD BE SET]
DB_SSL=true
JWT_SECRET=[SHOULD BE SET]
NODE_ENV=production
```

### Check in Railway
1. Backend service → Variables tab
2. Verify all `DB_*` variables match MySQL details
3. Verify `JWT_SECRET` is set and consistent

---

## Emergency Procedures

### Emergency: Backend is completely down
```bash
# 1. Check health:
curl -s -m 2 https://prolific-mercy-production.up.railway.app/health

# 2. If no response, go to Railway.app:
#    - TestFlow Backend service
#    - Click "Redeploy"
#    - Wait 2 minutes for restart

# 3. Verify recovery:
curl -s https://prolific-mercy-production.up.railway.app/health | jq .
```

### Emergency: Database is down
```bash
# 1. Go to Railway.app
# 2. MySQL service → Click "Restart"
# 3. Wait 1 minute
# 4. Test connection:
curl -s https://prolific-mercy-production.up.railway.app/health/deep | jq .
```

### Emergency: Connection pool exhausted
```bash
# Symptom: All requests timeout, /health still works, /health/deep fails
# 
# Cause: Too many database connections active (bug or load spike)
# 
# Action: Restart backend
# Go to Railway > Backend > Redeploy
# This will clear all connections
```

---

## Recovery Checklist

After any outage:
- [ ] Verify `/health` endpoint responds
- [ ] Verify `/health/deep` shows "healthy"
- [ ] Test login with test user
- [ ] Test creating a custom field
- [ ] Test exporting a report
- [ ] Check backend logs for errors
- [ ] Notify users that service is restored

---

## Monitoring Setup (Recommended)

### Automated Health Checks
```bash
# Add to cron job (every 5 minutes):
#!/bin/bash
RESPONSE=$(curl -s -m 3 https://prolific-mercy-production.up.railway.app/health)
if [ -z "$RESPONSE" ]; then
  echo "ALERT: Backend not responding" | mail -s "TestFlow Backend Down" admin@company.com
fi
```

### Log Alerts to Watch For
```
ERROR Database connection timeout
ERROR Authentication error
ERROR Query timeout
ERROR Connection pool exhausted
TIMEOUT exceeded
ECONNREFUSED
ETIMEDOUT
```

---

## Performance Baselines

| Operation | Target | Alert If > |
|-----------|--------|-----------|
| `/health` | 100ms | 1000ms |
| `/health/deep` | 500ms | 3000ms |
| Login endpoint | 1000ms | 5000ms |
| `/api/auth/me` | 500ms | 5000ms |
| Report generation | 2000ms | 10000ms |
| PDF export | 2000ms | 5000ms |

---

## Contact & Escalation

### Tier 1: Check Dashboards
- Railway.app backend logs
- Vercel frontend logs
- Health check endpoints

### Tier 2: Try Restart
- Redeploy backend on Railway
- Redeploy database if needed
- Clear browser cache and retry

### Tier 3: Check Code
- Review recent commits
- Check git diff between main and production
- Verify environment variables match code

### Tier 4: Rollback
```bash
# If recent commit broke something:
git revert [COMMIT_HASH]
git push origin main
git push origin main:production --force
# Wait 2 minutes for Railway to redeploy
```

---

## Key Files to Know

| File | Purpose | Location |
|------|---------|----------|
| `PRODUCTION_TIMEOUT_FIX.md` | Detailed timeout solution | Root directory |
| `COMPLETE_STATUS_REPORT.md` | Full status & deliverables | Root directory |
| `backend/src/server.js` | Health check endpoints | Backend source |
| `backend/src/config/database.js` | Connection pool config | Backend config |
| `.env` (local) | Development config | Root (not committed) |
| `.env.production` (Railway) | Production config | Railway Variables tab |

---

## Quick Deployment

### Deploy a fix to production:
```bash
# 1. Make your code changes
# 2. Test locally
# 3. Commit:
git add .
git commit -m "fix: Description of fix"
git push origin main

# 4. Deploy to production:
git push origin main:production --force

# 5. Verify on Railway within 2 minutes
```

### Rollback if needed:
```bash
# Find the commit hash you want to revert to:
git log --oneline

# Revert to that commit:
git revert [COMMIT_HASH] --no-edit
git push origin main
git push origin main:production --force
```

---

## Testing Commands (Copy & Paste Ready)

```bash
# 1. Test health
curl -s https://prolific-mercy-production.up.railway.app/health | jq .

# 2. Test database connection
curl -s https://prolific-mercy-production.up.railway.app/health/deep | jq .

# 3. Test with a known token
TOKEN="[YOUR_JWT_TOKEN]"
curl -s -H "Authorization: Bearer $TOKEN" \
  https://prolific-mercy-production.up.railway.app/api/auth/me | jq .

# 4. Test export (requires valid project ID)
PROJECT_ID="1"
TOKEN="[YOUR_JWT_TOKEN]"
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf"}' \
  https://prolific-mercy-production.up.railway.app/api/reports/export/$PROJECT_ID \
  -o report.pdf

# 5. Test CSV export
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"csv"}' \
  https://prolific-mercy-production.up.railway.app/api/reports/export/$PROJECT_ID \
  -o report.csv
```

---

**Last Updated:** Post-Timeout-Fix (Commit: db25ee6)  
**Severity:** HIGH (Authentication-critical)  
**Status:** FIXED and DEPLOYED ✅
