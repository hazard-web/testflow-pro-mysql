// ─────────────────────────────────────────────
//  Auth Routes — /api/auth  (MySQL)
// ─────────────────────────────────────────────
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const signToken = user =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)/),
    body('role').isIn(['qa_engineer', 'lead_qa', 'developer', 'admin']).optional(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      const { name, email, password, role, team_type } = req.body;
      const existing = await db('users').where({ email }).first();
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const password_hash = await bcrypt.hash(password, 12);
      const initials = name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const id = uuidv4();
      const userRole = role || (team_type === 'developer' ? 'developer' : 'qa_engineer');
      await db('users').insert({ id, name, email, password_hash, initials, role: userRole });

      // Auto-create tester or developer record
      if (team_type === 'qa' || team_type === 'qa_engineer') {
        const testerId = uuidv4();
        const colors = ['av-blue', 'av-green', 'av-amber', 'av-violet', 'av-red', 'av-cyan'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        await db('testers').insert({
          id: testerId,
          name,
          initials,
          role: 'QA Engineer',
          avatar_color: randomColor,
          is_active: true,
          email,
        });
      } else if (team_type === 'developer') {
        const devId = uuidv4();
        const colors = ['av-blue', 'av-green', 'av-amber', 'av-violet'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        await db('developers').insert({
          id: devId,
          name,
          initials,
          specialisation: 'Full Stack',
          avatar_color: randomColor,
          email,
        });
      }

      const user = await db('users')
        .where({ id })
        .select('id', 'name', 'email', 'role', 'initials', 'avatar_color')
        .first();
      res.status(201).json({ token: signToken(user), user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      const { email, password } = req.body;
      const user = await db('users').where({ email, is_active: 1 }).first();
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
      await db('users').where({ id: user.id }).update({ last_login: new Date() });
      const { password_hash, ...safeUser } = user;
      res.json({ token: signToken(user), user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const { password_hash, ...user } = req.user;
  res.json({ user });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// PATCH /api/auth/change-password
router.patch(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
      const { currentPassword, newPassword } = req.body;
      const user = await db('users').where({ id: req.user.id }).first();
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      const password_hash = await bcrypt.hash(newPassword, 12);
      await db('users').where({ id: req.user.id }).update({ password_hash });
      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
