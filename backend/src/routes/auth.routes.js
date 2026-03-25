// ─────────────────────────────────────────────
//  Enhanced Auth Routes with Security Features
// ─────────────────────────────────────────────
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const {
  hashToken,
  generateRandomToken,
  verify2FACode,
  generateBackupCodes,
  sendPasswordResetEmail,
  sendAccountLockedEmail,
  send2FASetupEmail,
  createAuditLog,
} = require('../utils/security');

// ── JWT Configuration ──
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('❌ JWT_SECRET environment variable is not set');
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

const REFRESH_TOKEN_EXPIRY = '30d';
const ACCESS_TOKEN_EXPIRY = '15m';
const LOCK_THRESHOLD = 5; // Lock after 5 failed attempts
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// ─────────────────────────────────────────
// Helper: Sign tokens
// ─────────────────────────────────────────
const signAccessToken = user =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

const signRefreshToken = user =>
  jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

// ─────────────────────────────────────────
// Helper: Check account lockout
// ─────────────────────────────────────────
async function isAccountLocked(email) {
  const user = await db('users').where({ email }).first();
  if (!user) return false;

  if (user.is_locked && user.locked_until) {
    if (new Date(user.locked_until) > new Date()) {
      return true; // Still locked
    } else {
      // Unlock expired
      await db('users').where({ email }).update({ is_locked: false, locked_until: null });
      return false;
    }
  }
  return false;
}

// ─────────────────────────────────────────
// Helper: Record failed login attempt
// ─────────────────────────────────────────
async function recordFailedLogin(email, ipAddress, userAgent) {
  try {
    const user = await db('users').where({ email }).first();

    // Insert failed attempt
    await db('failed_login_attempts').insert({
      id: uuidv4(),
      user_id: user?.id || null,
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Count recent failed attempts (last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - LOCK_DURATION);
    const failedCount = await db('failed_login_attempts')
      .where({ email })
      .andWhere('attempted_at', '>=', fifteenMinutesAgo)
      .count('* as count')
      .first();

    if (failedCount.count >= LOCK_THRESHOLD) {
      const lockUntil = new Date(Date.now() + LOCK_DURATION);
      if (user) {
        await db('users').where({ id: user.id }).update({
          is_locked: true,
          locked_until: lockUntil,
        });

        await sendAccountLockedEmail(email, lockUntil);
        logger.warn(`Account locked: ${email}`);
      }
    }
  } catch (error) {
    logger.error('Error recording failed login:', error);
  }
}

// ─────────────────────────────────────────
// Helper: Clear failed login attempts
// ─────────────────────────────────────────
async function clearFailedLogins(email) {
  try {
    await db('failed_login_attempts').where({ email }).del();
  } catch (error) {
    logger.error('Error clearing failed logins:', error);
  }
}

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        'Password must contain uppercase letter, number, and special character (@$!%*?&)'
      ),
  ],
  async (req, res, _next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { name, email, password, team_type } = req.body;
      const existing = await db('users').where({ email }).first();
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const password_hash = await bcrypt.hash(password, 12);
      const initials = name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const userId = uuidv4();
      // Self-registration only allows QA Engineer or Developer (no Admin/Manager)
      const userRole = team_type === 'developer' ? 'Developer' : 'QA Engineer';

      await db('users').insert({
        id: userId,
        name,
        email,
        password_hash,
        initials,
        role: userRole,
        is_active: true,
      });

      // Create 2FA settings (disabled by default)
      await db('two_fa_settings').insert({
        id: uuidv4(),
        user_id: userId,
        is_enabled: false,
      });

      // Audit log
      await createAuditLog(db, {
        userId,
        action: 'user_registered',
        entityType: 'user',
        entityId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Generate tokens for new user (auto-login after signup)
      const user = { id: userId, email, name, role: userRole, initials, avatar_color: 'blue' };
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      // Store refresh token
      const tokenHash = hashToken(refreshToken);
      await db('refresh_tokens').insert({
        id: uuidv4(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.status(201).json({
        message: 'Registration successful',
        user: { id: userId, email, name, role: userRole, initials, avatar_color: 'blue' },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res, _next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { email, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      // Check if account is locked
      if (await isAccountLocked(email)) {
        return res
          .status(403)
          .json({ error: 'Account temporarily locked due to failed login attempts' });
      }

      const user = await db('users').where({ email }).first();
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        await recordFailedLogin(email, ipAddress, userAgent);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is inactive' });
      }

      // Clear failed login attempts
      await clearFailedLogins(email);

      // Update last_login timestamp
      await db('users').where({ id: user.id }).update({ last_login: new Date() });

      // Check if 2FA is enabled
      const twoFA = await db('two_fa_settings').where({ user_id: user.id }).first();
      if (twoFA && twoFA.is_enabled) {
        // Return temporary token for 2FA verification
        const tempToken = jwt.sign({ id: user.id, email: user.email, temp: true }, JWT_SECRET, {
          expiresIn: '5m',
        });
        return res.json({ requiresAuth: true, tempToken, userId: user.id });
      }

      // Generate tokens
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      // Delete all existing refresh tokens for this user (instead of just revoking)
      await db('refresh_tokens').where({ user_id: user.id }).del();

      // Store refresh token in database
      const tokenHash = hashToken(refreshToken);
      await db('refresh_tokens').insert({
        id: uuidv4(),
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Audit log
      await createAuditLog(db, {
        userId: user.id,
        action: 'user_logged_in',
        entityType: 'user',
        entityId: user.id,
        ipAddress,
        userAgent,
      });

      res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ─────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    // Quick validation - user ID must exist in JWT
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Set timeout for database query
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    );

    const userPromise = db('users').where({ id: req.user.id }).first();
    const user = await Promise.race([userPromise, timeoutPromise]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        initials: user.initials,
        avatar_color: user.avatar_color,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);

    // Return 503 for timeout/connection issues
    if (error.message === 'Database query timeout' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/refresh-token
// ─────────────────────────────────────────
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    // Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Check if token is in database and not revoked
    const tokenHash = hashToken(refreshToken);
    const storedToken = await db('refresh_tokens')
      .where({ token_hash: tokenHash, user_id: decoded.id })
      .first();

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token has been revoked or is invalid' });
    }

    // Get user
    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Generate new access token and refresh token
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    // Delete old refresh token
    await db('refresh_tokens').where({ id: storedToken.id }).del();

    // Store new refresh token
    const newTokenHash = hashToken(newRefreshToken);
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token_hash: newTokenHash,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await db('refresh_tokens').where({ token_hash: tokenHash }).update({ is_revoked: true });
    }

    await createAuditLog(db, {
      userId: req.user.id,
      action: 'user_logged_out',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/2fa/setup
// ─────────────────────────────────────────
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate 2FA secret
    const { generate2FASecret } = require('../utils/security');
    const { secret, qrCode } = generate2FASecret(user.email);
    const backupCodes = generateBackupCodes(10);

    // Store temporarily (not verified yet)
    const twoFA = await db('two_fa_settings').where({ user_id: req.user.id }).first();
    if (twoFA) {
      await db('two_fa_settings')
        .where({ user_id: req.user.id })
        .update({
          secret_key: secret,
          backup_codes: JSON.stringify(backupCodes),
        });
    }

    res.json({ secret, qrCode, backupCodes });
  } catch (error) {
    logger.error('2FA setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/2fa/verify
// ─────────────────────────────────────────
router.post(
  '/2fa/verify',
  authenticate,
  [body('code').isLength({ min: 6, max: 6 })],
  async (req, res) => {
    try {
      const { code } = req.body;
      const twoFA = await db('two_fa_settings').where({ user_id: req.user.id }).first();

      if (!twoFA || !twoFA.secret_key) {
        return res.status(400).json({ error: '2FA not set up' });
      }

      if (!verify2FACode(twoFA.secret_key, code)) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }

      // Enable 2FA
      await db('two_fa_settings').where({ user_id: req.user.id }).update({
        is_enabled: true,
        verified_at: new Date(),
      });

      await createAuditLog(db, {
        userId: req.user.id,
        action: '2fa_enabled',
        entityType: 'user',
        entityId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: '2FA enabled successfully' });
    } catch (error) {
      logger.error('2FA verify error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ─────────────────────────────────────────
// POST /api/auth/2fa/verify-login
// ─────────────────────────────────────────
router.post('/2fa/verify-login', [body('code').isLength({ min: 6, max: 6 })], async (req, res) => {
  try {
    const { code, tempToken } = req.body;

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (!decoded.temp) throw new Error('Invalid temp token');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid temporary token' });
    }

    const user = await db('users').where({ id: decoded.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const twoFA = await db('two_fa_settings').where({ user_id: user.id }).first();
    if (!twoFA || !twoFA.is_enabled) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    if (!verify2FACode(twoFA.secret_key, code)) {
      // Check backup code
      const backupCodes = JSON.parse(twoFA.backup_codes || '[]');
      const codeIndex = backupCodes.indexOf(code);
      if (codeIndex === -1) {
        return res.status(401).json({ error: 'Invalid 2FA code or backup code' });
      }
      backupCodes.splice(codeIndex, 1);
      await db('two_fa_settings')
        .where({ user_id: user.id })
        .update({
          backup_codes: JSON.stringify(backupCodes),
        });
    }

    // Record successful 2FA attempt
    await db('two_fa_attempts').insert({
      id: uuidv4(),
      user_id: user.id,
      is_verified: true,
      ip_address: req.ip,
    });

    // Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Delete all existing refresh tokens for this user
    await db('refresh_tokens').where({ user_id: user.id }).del();

    // Store refresh token
    const tokenHash = hashToken(refreshToken);
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    logger.error('2FA login verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/password-reset/request
// ─────────────────────────────────────────
router.post('/password-reset/request', [body('email').isEmail()], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db('users').where({ email }).first();

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db('password_reset_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Send email with reset link
    const frontendUrl =
      process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/password-reset?token=${resetToken}`;
    await sendPasswordResetEmail(email, resetLink);

    // In development, log the link to console for testing
    if (process.env.NODE_ENV === 'development') {
      logger.info(`🔗 DEV MODE - Password reset link: ${resetLink}`);
    }

    await createAuditLog(db, {
      userId: user.id,
      action: 'password_reset_requested',
      entityType: 'user',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Return different response based on environment
    const response = { message: 'If email exists, reset link will be sent' };
    if (process.env.NODE_ENV === 'development') {
      response.devResetLink = resetLink;
      response.devMessage = '🔗 (DEV MODE) Click link above to reset password';
    }
    res.json(response);
  } catch (error) {
    logger.error('Password reset request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// POST /api/auth/password-reset/confirm
// ─────────────────────────────────────────
router.post(
  '/password-reset/confirm',
  [
    body('token').notEmpty(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req, res) => {
    try {
      const { token, password } = req.body;
      const tokenHash = hashToken(token);

      const resetToken = await db('password_reset_tokens').where({ token_hash: tokenHash }).first();

      if (!resetToken || new Date() > new Date(resetToken.expires_at) || resetToken.used_at) {
        return res.status(401).json({ error: 'Invalid or expired reset token' });
      }

      const newPasswordHash = await bcrypt.hash(password, 12);

      // Update password
      await db('users').where({ id: resetToken.user_id }).update({
        password_hash: newPasswordHash,
      });

      // Mark token as used
      await db('password_reset_tokens')
        .where({ id: resetToken.id })
        .update({ used_at: new Date() });

      // Revoke all refresh tokens (force re-login)
      await db('refresh_tokens')
        .where({ user_id: resetToken.user_id })
        .update({ is_revoked: true });

      await createAuditLog(db, {
        userId: resetToken.user_id,
        action: 'password_reset_completed',
        entityType: 'user',
        entityId: resetToken.user_id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      logger.error('Password reset confirm error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ─────────────────────────────────────────
// POST /api/auth/create-user (ADMIN ONLY)
// ─────────────────────────────────────────
router.post(
  '/create-user',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('team_type').notEmpty(),
  ],
  async (req, res) => {
    try {
      // Check admin role only
      if (req.user.role?.toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Only admins can create users' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { name, email, team_type } = req.body;

      // Check if email exists
      const existing = await db('users').where({ email }).first();
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      // Generate temporary password
      const tempPassword = generateRandomToken().slice(0, 12);
      const password_hash = await bcrypt.hash(tempPassword, 12);

      const initials = name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const userId = uuidv4();
      const roleMap = {
        developer: 'Developer',
        manager: 'Manager',
        lead_qa: 'Lead QA',
        admin: 'Admin',
      };
      const userRole = roleMap[team_type] || 'QA Engineer';

      // Create user
      await db('users').insert({
        id: userId,
        name,
        email,
        password_hash,
        initials,
        role: userRole,
        is_active: true,
      });

      // Add to team (developers, managers, or testers)
      if (team_type === 'developer') {
        await db('developers').insert({
          id: uuidv4(),
          name,
          email,
          initials,
          avatar_color: 'av-green',
          specialisation: 'Full Stack',
        });
      } else if (team_type === 'manager') {
        await db('managers').insert({
          id: uuidv4(),
          name,
          email,
          initials,
          avatar_color: 'av-amber',
          department: 'QA',
        });
      } else {
        await db('testers').insert({
          id: uuidv4(),
          name,
          email,
          initials,
          avatar_color: 'av-blue',
          role: userRole,
        });
      }

      // Create 2FA settings
      await db('two_fa_settings').insert({
        id: uuidv4(),
        user_id: userId,
        is_enabled: false,
      });

      // Audit log
      await createAuditLog(db, {
        userId: req.user.id,
        action: 'admin_created_user',
        entityType: 'user',
        entityId: userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Return user with temporary password (in production, send via email)
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: userId,
          name,
          email,
          role: userRole,
          temporary_password: tempPassword,
          note: 'User should change password after first login',
        },
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ─────────────────────────────────────────
// PATCH /api/auth/change-password
// ─────────────────────────────────────────
router.patch(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain uppercase letter, number, and special character'),
  ],
  async (req, res, _next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

      const { currentPassword, newPassword } = req.body;
      const user = await db('users').where({ id: req.user.id }).first();
      if (!user) return res.status(404).json({ error: 'User not found' });

      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

      const password_hash = await bcrypt.hash(newPassword, 12);
      await db('users').where({ id: req.user.id }).update({ password_hash });

      // Audit log
      await createAuditLog(db, {
        userId: req.user.id,
        action: 'password_changed',
        entityType: 'user',
        entityId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      logger.info(`Password changed for user ${req.user.id}`);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;
