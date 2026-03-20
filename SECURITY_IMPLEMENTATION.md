# TestFlow Pro - Security Features Implementation Guide

## ✅ Implemented Security Features

This document outlines the 5 major security features added to TestFlow Pro.

---

## 1. **Refresh Token Rotation** ✅

### What it does:

- Issues short-lived access tokens (15 minutes) and long-lived refresh tokens (30 days)
- Automatically rotates refresh tokens on each use
- Revokes old tokens to prevent token hijacking

### Database Tables:

- `refresh_tokens` - Stores all issued refresh tokens with revocation status

### API Endpoints:

- `POST /api/auth/login` - Returns both access and refresh tokens
- `POST /api/auth/refresh-token` - Exchanges old refresh token for new tokens
- `POST /api/auth/logout` - Revokes refresh token

### How to Use:

```javascript
// Frontend stores both tokens
localStorage.setItem('tf_token', accessToken); // Short-lived
localStorage.setItem('tf_refresh_token', refreshToken); // Long-lived

// When access token expires, use refresh endpoint
const response = await fetch('/api/auth/refresh-token', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});
```

---

## 2. **Account Lockout** ✅

### What it does:

- Tracks failed login attempts
- Locks account after 5 failed attempts in 15 minutes
- Auto-unlocks after 15 minutes
- Sends email notification when account is locked

### Database Tables:

- `failed_login_attempts` - Tracks all login failures
- Added fields to `users`: `is_locked`, `locked_until`

### Security Benefits:

- Prevents brute force password attacks
- Automatically recovers without manual intervention
- IP address and user agent logged for forensics

### Configuration:

```javascript
const LOCK_THRESHOLD = 5; // Lock after 5 failures
const LOCK_DURATION = 15 * 60 * 1000; // 15 minute lockout
```

---

## 3. **2FA (Two-Factor Authentication)** ✅

### What it does:

- Implements TOTP (Time-based One-Time Password)
- Compatible with Google Authenticator, Authy, Microsoft Authenticator
- Provides 10 backup codes for emergency access
- Tracks 2FA verification attempts

### Database Tables:

- `two_fa_settings` - Stores user 2FA configuration and backup codes
- `two_fa_attempts` - Tracks verification attempts

### API Endpoints:

- `POST /api/auth/2fa/setup` - Generate 2FA secret and QR code
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/2fa/verify-login` - Verify 2FA code during login

### How to Enable:

```javascript
// 1. User requests 2FA setup
const response = await fetch('/api/auth/2fa/setup', {
  headers: { Authorization: `Bearer ${token}` },
});
const { secret, qrCode, backupCodes } = await response.json();

// 2. User scans QR code in authenticator app
// 3. User enters 6-digit code to verify
await fetch('/api/auth/2fa/verify', {
  method: 'POST',
  body: JSON.stringify({ code: userCode }),
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 4. **Audit Logging** ✅

### What it does:

- Logs all user actions with timestamps
- Tracks IP address and user agent for each action
- Records successful and failed operations
- Allows users to view their own activity
- Allows admins to view all activity and failed logins

### Database Tables:

- `audit_logs` - Comprehensive activity log

### Logged Actions:

- `user_registered` - New user signup
- `user_logged_in` - Successful login
- `user_logged_out` - Logout event
- `2fa_enabled` - 2FA activated
- `password_reset_requested` - Password reset initiated
- `password_reset_completed` - Password successfully changed
- All CRUD operations on test cases, bugs, runs, etc.

### API Endpoints:

- `GET /api/audit-logs/my-activity` - User's own activity log
- `GET /api/audit-logs` - All activity logs (admin only)
- `GET /api/audit-logs/failed-logins` - Failed login attempts (admin only)

### Example Response:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "action": "test_case_created",
  "entity_type": "test_case",
  "entity_id": "uuid",
  "changes": { "title": "Login test", "steps": [...] },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "status": "success",
  "created_at": "2026-03-20T10:30:00Z"
}
```

---

## 5. **Password Reset with Email** ✅

### What it does:

- Initiates password reset via email link
- Generates time-limited reset tokens (30-minute expiry)
- Prevents token reuse
- Revokes all existing refresh tokens after password change
- Forces user to re-login on all devices

### Database Tables:

- `password_reset_tokens` - Stores reset tokens with expiration

### API Endpoints:

- `POST /api/auth/password-reset/request` - Request password reset email
- `POST /api/auth/password-reset/confirm` - Complete password reset with token

### Security Features:

- Doesn't reveal if email exists (prevents account enumeration)
- 30-minute token expiration
- One-time use only
- Email notifications sent to user
- All active sessions invalidated

### Example Flow:

```javascript
// 1. User requests password reset
await fetch('/api/auth/password-reset/request', {
  method: 'POST',
  body: JSON.stringify({ email: 'user@example.com' }),
});

// 2. User receives email with link containing token
// 3. User visits reset page and submits new password
await fetch('/api/auth/password-reset/confirm', {
  method: 'POST',
  body: JSON.stringify({
    token: 'token-from-email',
    password: 'NewPassword@123',
  }),
});
```

---

## Installation & Setup

### 1. Install New Dependencies

```bash
cd backend
npm install speakeasy qrcode nodemailer
npm install
```

### 2. Run Database Migrations

```bash
npm run db:migrate
# or manually execute database/migrations/security_features.sql
```

### 3. Environment Variables (.env)

```env
# Email Configuration (for password reset and notifications)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# JWT Settings
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
```

### 4. Start Services

```bash
# Backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

---

## Frontend Components to Create

### LoginPage Updates

- Handle 2FA verification step after password
- Show account locked message
- Password reset link

### SettingsPage New Sections

- **Security Tab**:
  - Enable 2FA with QR code display
  - View/manage backup codes
  - View account activity log
  - Change password with current password verification
  - View failed login attempts
  - Manage active sessions / logout from other devices

### New Pages

- **PasswordResetPage** - Form to reset password with token
- **SecuritySettingsPage** - Comprehensive security settings dashboard

---

## Testing the Features

### Test Refresh Token Rotation

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Password@123"}'

# Response includes accessToken and refreshToken
# Use refreshToken to get new tokens after access token expires
```

### Test Account Lockout

```bash
# Login 5 times with wrong password
# Account will be locked for 15 minutes
```

### Test 2FA Setup

```bash
# After login, call 2FA setup endpoint
# Scan QR code with authenticator app
# Enter 6-digit code to verify
```

### Test Password Reset

```bash
# Request reset: POST /api/auth/password-reset/request
# Check email for reset link
# Confirm reset: POST /api/auth/password-reset/confirm with token
```

### View Audit Logs

```bash
# User's activity
curl http://localhost:5000/api/audit-logs/my-activity \
  -H "Authorization: Bearer {token}"

# Admin only - all activity
curl http://localhost:5000/api/audit-logs \
  -H "Authorization: Bearer {admin-token}"
```

---

## Security Best Practices Applied

✅ **Tokens**: Short-lived access tokens + long-lived refresh tokens  
✅ **Passwords**: Bcrypt with salt 12, minimum 8 chars with uppercase & numbers  
✅ **Brute Force**: Account lockout after 5 failed attempts  
✅ **Email**: Secure password reset with time-limited tokens  
✅ **2FA**: TOTP with backup codes, industry standard  
✅ **Audit**: Comprehensive logging of all actions with IP/User Agent  
✅ **Secrets**: Hashed tokens stored in database, never plain text  
✅ **Email Validation**: Prevents account enumeration attacks

---

## What's NOT Yet Implemented

- Frontend UI components (to be added separately)
- Email service configuration (currently uses dummy SMTP)
- Session management (logout from all devices)
- Rate limiting by user (vs global)
- OAuth/SSO integration
- Penetration testing

---

## Next Steps

1. ✅ Backend security features implemented
2. ⏳ Create frontend components for 2FA setup
3. ⏳ Create frontend components for password reset
4. ⏳ Add audit logs viewer to Settings page
5. ⏳ Create security dashboard for admins
6. ⏳ Configure email service for production
7. ⏳ Test all features end-to-end

---

## Support & Documentation

For more information on:

- **TOTP**: https://github.com/speakeasy-js/speakeasy
- **JWT Best Practices**: https://jwt.io/
- **OWASP Security**: https://owasp.org/
- **bcryptjs**: https://github.com/dcodeIO/bcrypt.js
