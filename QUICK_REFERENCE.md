# 🎯 Quick Reference - Security Features

## 🌐 Access Points

| Feature               | URL                                  | Purpose             |
| --------------------- | ------------------------------------ | ------------------- |
| **Login**             | http://localhost:3002/               | Main authentication |
| **Signup**            | http://localhost:3002/signup         | Create account      |
| **Password Reset**    | http://localhost:3002/password-reset | Recover account     |
| **Security Settings** | http://localhost:3002/security       | 2FA, audit logs     |
| **Backend API**       | http://localhost:5000/api            | API endpoints       |

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
