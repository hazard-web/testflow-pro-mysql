# TestFlow Pro - Logs Dashboard Quick Reference

## 🚀 Quick Start

### Access the Dashboard

```
1. Login: admin@testflow.dev / Password@123
2. Go to Settings page
3. Click "📊 Access Logs" tab
4. Dashboard appears with recent logs
```

## 📋 Dashboard at a Glance

### Summary Section

| Card           | Shows                        |
| -------------- | ---------------------------- |
| 📋 Total Logs  | Count of all recorded events |
| 👥 Total Users | Number of registered users   |
| 🔐 Admins      | Count of admin accounts      |

### Log Columns

| Column     | Content                          |
| ---------- | -------------------------------- |
| Timestamp  | Date/time of event               |
| User       | User name with avatar            |
| Email      | User email address               |
| Role       | admin / developer / tester       |
| Action     | Event type (login, logout, etc.) |
| IP Address | Source IP (::1 = localhost)      |
| Status     | ✓ Success or ✗ Failure           |
| Details    | Click "View" button              |

## 🔍 Filtering Tips

### Quick Buttons

```
🔑 Logins    → Show only user_logged_in events
🚪 Logouts   → Show only user_logged_out events
Clear        → Show all logs
```

### Advanced Filters

```
Action       → Select from dropdown (user_logged_in, etc.)
Status       → Success / Failure
Search       → Type user name, email, IP, or action
Start Date   → From date
End Date     → To date
Apply        → Apply all filters
```

## 👁️ Viewing Details

### Click "View" to see:

```
Timestamp       2024-01-15 10:30:45 AM
User           Admin User (admin@testflow.dev)
Role           admin
Action         user_logged_in
Entity Type    user
Entity ID      439e0ad4-9c52-4d2b-917e-1a75ddc6ac58
IP Address     ::1  (localhost)
User Agent     Mozilla/5.0 (Macintosh; Intel Mac OS X...)
Status         ✓ Success
Log ID         550e8400-e29b-41d4-a716-446655440000
```

## 📊 Example Queries

### What's Getting Logged

**Login Events**

```
Action: user_logged_in
- Who: User name/email
- When: Timestamp
- From: IP address
- How: Browser/device (user agent)
- Result: Success ✓ or Failure ✗
```

**Logout Events**

```
Action: user_logged_out
- Who: User name/email
- When: Timestamp
- From: IP address
- Result: Success ✓ or Failure ✗
```

**Other Events**

```
- user_registered: New user created
- created_resource: Resource created
- updated_resource: Resource modified
- deleted_resource: Resource deleted
- accessed_resource: Resource viewed
```

## 💡 Common Use Cases

### 1. See Who's Logged In Today

```
1. Click "Clear" to show all logs
2. Click "🔑 Logins" button
3. Scroll through login events
```

### 2. Track Logout Events

```
1. Click "Clear"
2. Click "🚪 Logouts" button
3. See when users logged out
```

### 3. Monitor Failed Logins

```
1. Select "Status" = "Failure"
2. Select "Action" = "user_logged_in" (if available)
3. Click "Apply Filters"
4. See failed login attempts
```

### 4. Search for Specific User

```
1. Type email or name in "Search" field
2. Click "Apply Filters"
3. See all events for that user
```

### 5. Check Activity by Date

```
1. Set "Start Date" = 2024-01-01
2. Set "End Date" = 2024-01-31
3. Click "Apply Filters"
4. See events from that month
```

### 6. Review Specific Activity

```
1. Click "View" on any log row
2. Modal opens with full details
3. See IP address, user agent, etc.
4. Close modal when done
```

## 🔒 Security Insights

### What the IP Address Tells You

```
::1 or 127.0.0.1  = Localhost (your computer)
192.168.x.x       = Local network
8.x.x.x - 223.x.x = Real internet IP
```

### What the User Agent Tells You

```
Mozilla/5.0       = Firefox or Chrome based
Safari            = Apple browser
Edge              = Microsoft browser
Macintosh         = Mac OS
Windows           = Windows OS
iPhone/iPad       = iOS device
Android           = Android device
```

## ⚙️ API Endpoint Reference

### Get All Logs (Admin Only)

```bash
GET /api/audit-logs
Headers:
  Authorization: Bearer <token>

Query Parameters:
  limit=50              # Results per page (default: 50)
  offset=0              # Starting position (default: 0)
  action=user_logged_in # Filter by event type
  status=success        # success or failure
  search=admin@         # Search in name, email, IP, action
  startDate=2024-01-01  # From date
  endDate=2024-01-31    # To date

Example:
GET /api/audit-logs?action=user_logged_in&limit=100
```

### Response Structure

```json
{
  "data": [
    {
      "id": "log-id",
      "user_id": "user-id",
      "user_name": "Admin User",
      "user_email": "admin@testflow.dev",
      "user_role": "admin",
      "action": "user_logged_in",
      "ip_address": "::1",
      "user_agent": "Mozilla/...",
      "status": "success",
      "created_at": "2024-01-15T10:30:45.000Z"
    }
  ],
  "pagination": {
    "total": 1243,
    "limit": 50,
    "offset": 0
  },
  "summary": {
    "total_admins": { "count": 1 },
    "total_users": { "count": 5 }
  }
}
```

## 🐛 Troubleshooting

| Problem                | Solution                             |
| ---------------------- | ------------------------------------ |
| No logs showing        | Click "Clear" to remove filters      |
| Can't access dashboard | Make sure you're logged in as admin  |
| IP shows as ::1        | This is correct for localhost        |
| Modal doesn't open     | Try refreshing page, then click View |
| Slow loading           | Reduce page limit or add date filter |
| Search not working     | Check for typos in search term       |

## 📱 Mobile Tips

### On Phone/Tablet

- Swipe left/right to scroll table
- Tap "View" for full details
- Details modal fills most of screen
- Filters stack vertically
- Single column layout

### Responsive Breakpoints

```
Desktop: 1200px+    → Full table layout
Tablet:  768-1200px → Adjusted spacing
Mobile:  <768px     → Single column
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action                     |
| -------- | -------------------------- |
| Tab      | Navigate between elements  |
| Enter    | Click focused button       |
| Escape   | Close modal                |
| Ctrl+F   | Browser search within page |

## 📈 Performance Tips

### Load Faster

1. Use date filters to limit results
2. Search for specific user to narrow down
3. Default 50 per page is optimized
4. Use action filter to reduce results

### Load More Logs

1. Click "Next" button to go to next page
2. Or adjust limit if available
3. Change offset in URL for more control

## 🔐 Admin-Only Access

```
✓ Only admins can:
  - View all audit logs
  - See all users' activities
  - Access the logs dashboard

✗ Regular users can:
  - Only view their own activity
  - Via /api/audit-logs/my-activity
  - Can't see others' logs
```

## 📞 Quick Support

### Can't See Logs Dashboard?

```
Check:
1. Are you logged in? (Top right corner shows user)
2. Are you admin? (Check role)
3. Refresh page (F5)
4. Clear browser cache (Ctrl+Shift+Del)
```

### Dashboard Shows "No Logs Found"

```
Reasons:
1. No events logged yet (try logging in again)
2. Filters are too restrictive (click Clear)
3. All events deleted (check database)
4. Query date range is empty
```

### IP Address Wrong or Missing

```
For Localhost:
- Shows as ::1 or 127.0.0.1 ✓ (Correct)

For Production:
- Check TRUST_PROXY setting
- Verify X-Forwarded-For header
- Check proxy configuration
```

## 📚 Learn More

### Full Documentation

- **LOGS_DASHBOARD_GUIDE.md** - Complete guide
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **Backend Code** - `src/routes/audit.routes.js`
- **Frontend Code** - `src/pages/Logs.jsx`

### Database Queries

```bash
# Count total logs
SELECT COUNT(*) FROM audit_logs;

# See action types
SELECT DISTINCT action FROM audit_logs;

# Get logins from IP
SELECT * FROM audit_logs
WHERE action = 'user_logged_in'
AND ip_address = '::1'
ORDER BY created_at DESC;
```

## 🎯 Best Practices

### Daily

- [ ] Check for failed login attempts
- [ ] Review unusual IP addresses
- [ ] Monitor resource access patterns

### Weekly

- [ ] Export logs for backup
- [ ] Review user activities summary
- [ ] Check for policy violations

### Monthly

- [ ] Archive old logs
- [ ] Review access trends
- [ ] Update security rules if needed

---

**Version**: 1.0
**Last Updated**: January 2024
**Status**: ✅ Production Ready

| **Backend API** | http://localhost:5000/api | API endpoints |

---

## 🔑 Test Credentials

After signup, you can test with:

- **Email**: test@example.com
- **Password**: Password@123

Or create your own account at signup page.

---

## 📱 2FA Setup

1. Login
2. Settings → "Manage Security Settings"
3. Tab: "Two-Factor Auth"
4. Click "Enable 2FA"
5. Scan QR code with:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - Any TOTP app
6. Enter 6-digit code to confirm
7. **Save backup codes** in safe location!

---

## 🔐 Password Reset Flow

### For Users

1. Go to http://localhost:3002/password-reset
2. Enter registered email
3. Check email for reset link
4. Click link from email
5. Enter new password (8+ chars, uppercase, number)
6. Confirm new password
7. Redirect to login automatically

### For Testing (Without Email)

- Check terminal logs for reset link
- Or configure local Mailhog:
  ```bash
  brew install mailhog
  mailhog  # Runs on http://localhost:1025
  # Set in .env: SMTP_HOST=localhost, SMTP_PORT=1025
  ```

---

## 📊 Activity Log Access

1. Login to dashboard
2. Go to Security Settings (http://localhost:3002/security)
3. Click "Activity Log" tab
4. View all account activities with:
   - Action type
   - Timestamp
   - IP address
   - Device info

---

## 🚨 Account Lockout

**Triggers**: 5 failed login attempts in 15 minutes

**What happens**:

- Account locked for 15 minutes
- Email notification sent
- Auto-unlock after duration
- User can reset password to regain access immediately

**Test**: Try logging in with wrong password 5 times

---

## 🔗 API Endpoints

### Authentication

```
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
POST /api/auth/refresh-token
```

### 2FA

```
POST /api/auth/2fa/setup
POST /api/auth/2fa/verify
POST /api/auth/2fa/verify-login
POST /api/auth/2fa/disable
GET  /api/auth/2fa/status
```

### Password Reset

```
POST /api/auth/password-reset/request
POST /api/auth/password-reset/confirm
POST /api/auth/change-password
```

### Audit Logs

```
GET /api/audit-logs/my-activity
GET /api/audit-logs (admin only)
GET /api/audit-logs/failed-logins (admin only)
```

---

## 🎮 Usage Examples

### Login with 2FA

```javascript
// Step 1: Initial login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password@123',
  }),
});
// If requiresTwoFA: true, get tempToken

// Step 2: Verify 2FA code
const verify = await fetch('http://localhost:5000/api/auth/2fa/verify-login', {
  method: 'POST',
  body: JSON.stringify({
    tempToken: tempToken,
    code: '123456', // From authenticator app
  }),
});
// Get accessToken and refreshToken
```

### Setup 2FA

```javascript
// Get QR code
const setup = await fetch('http://localhost:5000/api/auth/2fa/setup', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});
// Shows QR code and backup codes

// Verify code to enable
const verify = await fetch('http://localhost:5000/api/auth/2fa/verify', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({ code: '123456' }),
});
```

### Reset Password

```javascript
// Request reset link
await fetch('http://localhost:5000/api/auth/password-reset/request', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com' }),
});

// After clicking email link with token
await fetch('http://localhost:5000/api/auth/password-reset/confirm', {
  method: 'POST',
  body: JSON.stringify({
    token: urlToken,
    password: 'NewPassword@123',
  }),
});
```

---

## ✅ Checklist - Features to Test

- [ ] Create new account via signup
- [ ] Login with username/password
- [ ] Logout
- [ ] Access Security Settings
- [ ] Enable 2FA and scan QR code
- [ ] Logout and login with 2FA code
- [ ] Use backup code for 2FA
- [ ] Disable 2FA
- [ ] Change password in settings
- [ ] Request password reset
- [ ] Complete password reset flow
- [ ] View activity log
- [ ] Trigger account lockout (5 failed attempts)
- [ ] Try reset password after lockout

---

## 🛠️ Troubleshooting

| Issue                          | Solution                                              |
| ------------------------------ | ----------------------------------------------------- |
| "Port 3000 in use"             | Already running on 3002 - visit http://localhost:3002 |
| "2FA code invalid"             | Check system time sync; allow 30-sec window           |
| "Email not received"           | Configure SMTP in .env or use Mailhog                 |
| "Cannot access /security"      | Must login first; redirects to /login                 |
| "Forgot password link invalid" | Token expires after 30 minutes                        |
| "Account locked"               | Wait 15 minutes or reset password                     |

---

## 🎯 Key Features Summary

### Security

- ✅ Password hashing with bcryptjs (salt 12)
- ✅ JWT tokens with expiration
- ✅ TOTP-based 2FA
- ✅ Account lockout (5 attempts / 15 min)
- ✅ Token rotation on refresh
- ✅ One-time use reset tokens

### Usability

- ✅ Beautiful, modern UI
- ✅ Real-time validation
- ✅ Clear error messages
- ✅ Mobile responsive
- ✅ Dark/light theme support

### Compliance

- ✅ Complete audit logging
- ✅ GDPR-friendly design
- ✅ Security best practices
- ✅ Encrypted token storage
- ✅ IP tracking

---

## 📞 Support

For issues or questions:

1. Check logs: `npm run dev` in root directory
2. Review error messages in browser console (F12)
3. Test API endpoints directly with curl
4. Verify database: check security tables exist
5. Check .env configuration for SMTP settings

---

**Status**: ✅ All systems operational and ready for testing!
