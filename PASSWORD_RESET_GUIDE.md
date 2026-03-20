# Password Reset Feature - Testing Guide

## Overview

The password reset feature now works in **two modes**:

### Mode 1: Production (SMTP Configured)

If you have SMTP credentials configured in `.env.development`:

- Email will be sent to the actual email address
- User will receive a real password reset link via email

### Mode 2: Development (No SMTP)

If no SMTP credentials are configured (default):

- Email is **NOT sent** to the user
- Instead, the reset link is **logged to the backend console**
- You can copy the link from console and manually test it

## How to Test

### Step 1: Enter Email on Password Reset Page

1. Navigate to `http://localhost:3000/password-reset`
2. Enter any registered email address
3. Click "Send Reset Link"
4. You'll see message: **"Reset link has been sent to email id"** ✅

### Step 2: Get Reset Link from Backend Console

Check your backend terminal/console output. You should see:

```
🔗 DEV MODE - Password reset link: http://localhost:3000/password-reset?token=abc123...
```

### Step 3: Open Reset Link

1. Copy the full URL from console
2. Paste into browser or click it
3. You'll land on the password reset page with the token automatically filled

### Step 4: Reset Password

1. Enter new password (must be 8+ chars, 1 uppercase, 1 number)
2. Click "Reset Password"
3. You'll be redirected to login page
4. Login with new credentials ✅

## Console Output Examples

### Successful Password Reset Request

```
📧 DEV MODE - Password reset email (not sent):
   To: user@example.com
   Subject: Password Reset Request - TestFlow Pro
   Reset Link: http://localhost:3000/password-reset?token=47eac568f19c772bfdbb99cf511cae38061e817423ecf...
```

### Account Locked Notification

```
🔒 DEV MODE - Account locked notification (not sent): user@example.com
```

### 2FA Setup Email

```
📧 DEV MODE - 2FA setup email (not sent): user@example.com
```

## Production Setup (Optional)

To enable actual email sending, add SMTP credentials to `.env.development`:

```dotenv
# Using Gmail (need App Password):
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@yourdomain.com

# Or using Mailtrap (free service for testing):
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-user
MAIL_PASS=your-mailtrap-password
MAIL_FROM=noreply@testflow.dev
```

Then restart the backend and emails will be sent!

## Files Modified

- `backend/src/utils/security.js` - Email sending utilities (added dev mode logging)
- `backend/src/routes/auth.routes.js` - Password reset endpoint (logs link in dev mode)
- `backend/src/context/AuthContext.jsx` - Updated token storage (access_token/refresh_token)
- `frontend/src/utils/api.js` - Updated token retrieval (access_token)
- `frontend/src/components/shared.jsx` - Updated token usage

## Troubleshooting

**Q: I don't see the reset link in console**

- Make sure your backend is running (`npm run dev`)
- Check the correct terminal/console output (should say "DEV MODE")
- Look for `🔗 Password reset link:` in the logs

**Q: Link doesn't work when I paste it**

- Make sure you copied the ENTIRE URL starting with `http://`
- Check that frontend is also running on `http://localhost:3000`
- Try the link in a fresh browser tab

**Q: Password reset says "Invalid token"**

- Token expires after 30 minutes
- Get a fresh link from console
- Make sure you're using the correct reset link format
