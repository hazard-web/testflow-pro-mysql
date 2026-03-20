/**
 * Security Utilities - Token Management, 2FA, Audit Logging
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const logger = require('./logger');

// ─────────────────────────────────────────
// Token Hashing (for secure storage)
// ─────────────────────────────────────────
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─────────────────────────────────────────
// 2FA - TOTP Setup
// ─────────────────────────────────────────
function generate2FASecret(email) {
  const secret = speakeasy.generateSecret({
    name: `TestFlow Pro (${email})`,
    issuer: 'TestFlow Pro',
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url,
  };
}

function verify2FACode(secret, code) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code,
    window: 2,
  });
}

function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

// ─────────────────────────────────────────
// Email Service
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || process.env.SMTP_HOST || 'localhost',
  port: process.env.MAIL_PORT || process.env.SMTP_PORT || 1025,
  secure: (process.env.MAIL_PORT || process.env.SMTP_PORT) === '465',
  auth:
    process.env.MAIL_USER || process.env.SMTP_USER
      ? {
          user: process.env.MAIL_USER || process.env.SMTP_USER,
          pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
        }
      : undefined,
});

async function sendPasswordResetEmail(email, resetLink) {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@testflow.pro',
      to: email,
      subject: 'Password Reset Request - TestFlow Pro',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
        <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetLink}</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    };

    // In development, log email instead of sending if no valid SMTP configured
    if (
      process.env.NODE_ENV === 'development' &&
      !process.env.MAIL_USER &&
      !process.env.SMTP_USER
    ) {
      logger.info(`📧 DEV MODE - Password reset email (not sent):`);
      logger.info(`   To: ${email}`);
      logger.info(`   Subject: ${mailOptions.subject}`);
      logger.info(`   Reset Link: ${resetLink}`);
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    logger.error('❌ Failed to send password reset email:', error.message);
  }
}

async function sendAccountLockedEmail(email, unlockTime) {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@testflow.pro',
      to: email,
      subject: 'Account Locked - TestFlow Pro',
      html: `
        <h2>Account Temporarily Locked</h2>
        <p>Your account has been locked due to multiple failed login attempts.</p>
        <p>It will automatically unlock at: ${new Date(unlockTime).toLocaleString()}</p>
        <p>If this wasn't you, please reset your password immediately.</p>
      `,
    };

    if (
      process.env.NODE_ENV === 'development' &&
      !process.env.MAIL_USER &&
      !process.env.SMTP_USER
    ) {
      logger.warn(`🔒 DEV MODE - Account locked notification (not sent): ${email}`);
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info(`✅ Account locked notification sent to ${email}`);
  } catch (error) {
    logger.error('❌ Failed to send account locked email:', error.message);
  }
}

async function send2FASetupEmail(email, qrCodeUrl) {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@testflow.pro',
      to: email,
      subject: '2FA Setup - TestFlow Pro',
      html: `
        <h2>Two-Factor Authentication Setup</h2>
        <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc):</p>
        <img src="${qrCodeUrl}" alt="2FA QR Code" style="width: 200px; height: 200px;">
        <p>Or enter this code manually: <strong style="font-family: monospace; font-size: 18px;">SECRET_HERE</strong></p>
        <p>Keep your backup codes safe!</p>
      `,
    };

    if (
      process.env.NODE_ENV === 'development' &&
      !process.env.MAIL_USER &&
      !process.env.SMTP_USER
    ) {
      logger.info(`📧 DEV MODE - 2FA setup email (not sent): ${email}`);
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info(`✅ 2FA setup email sent to ${email}`);
  } catch (error) {
    logger.error('❌ Failed to send 2FA setup email:', error.message);
  }
}

// ─────────────────────────────────────────
// Audit Logging
// ─────────────────────────────────────────
async function createAuditLog(
  db,
  { userId, action, entityType, entityId, changes, ipAddress, userAgent, status = 'success' }
) {
  try {
    const auditId = uuidv4();
    await db('audit_logs').insert({
      id: auditId,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes ? JSON.stringify(changes) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
    });
    logger.info(`Audit log created: ${action} by user ${userId}`);
  } catch (error) {
    logger.error('Failed to create audit log:', error.message, error.stack);
    throw error;
  }
}

module.exports = {
  hashToken,
  generateRandomToken,
  generate2FASecret,
  verify2FACode,
  generateBackupCodes,
  sendPasswordResetEmail,
  sendAccountLockedEmail,
  send2FASetupEmail,
  createAuditLog,
};
