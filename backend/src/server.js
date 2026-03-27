require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const db = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { logActivity } = require('./middleware/logger');

// ── Routes ──
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const testCaseRoutes = require('./routes/testcase.routes');
const bugRoutes = require('./routes/bug.routes');
const testerRoutes = require('./routes/tester.routes');
const runRoutes = require('./routes/run.routes');
const commentRoutes = require('./routes/comment.routes');
const reportRoutes = require('./routes/report.routes');
const notifRoutes = require('./routes/notification.routes');
const aiRoutes = require('./routes/ai.routes');
const auditRoutes = require('./routes/audit.routes');
const workflowRoutes = require('./routes/workflow.routes');
const customFieldRoutes = require('./routes/customfield.routes');
const { projectRouter, managerRouter } = require('./routes/all.routes');

const app = express();

// ── Trust proxy for real IP addresses ──
// This is important when running behind a reverse proxy (nginx, load balancer, etc)
app.set('trust proxy', process.env.TRUST_PROXY || 1);

// ── Security ──
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    contentSecurityPolicy: false,
  })
);
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://testflow-pro-mysql-frontend-r3u3.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      // Allow any *.vercel.app origin (preview deployments)
      if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// ── Handle preflight OPTIONS requests explicitly (before rate limiter) ──
app.options('*', cors());

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100000,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.method === 'OPTIONS' || process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

// ── Body & utilities ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: msg => logger.http(msg.trim()) },
  })
);

// ── Activity Logging ──
app.use('/api/', logActivity);

// ── Static uploads ──
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

// ── Health check (quick, no DB) ──
app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    uptime: process.uptime(),
  })
);

// ── Deep health check (with DB) ──
app.get('/health/deep', async (req, res) => {
  try {
    // Set timeout for DB check
    const dbCheck = db.raw('SELECT 1');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    );

    await Promise.race([dbCheck, timeoutPromise]);

    res.json({
      status: 'healthy',
      database: 'connected',
      env: process.env.NODE_ENV,
      time: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      error: error.message,
      time: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/testers', testerRoutes);
app.use('/api/managers', managerRouter);
app.use('/api/runs', runRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/projects', projectRouter);
app.use('/api/workflow', workflowRoutes);
app.use('/api/custom-fields', customFieldRoutes);

// ── 404 handler ──
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.url} not found` }));

// ── Global error handler ──
app.use(errorHandler);

// ── Start server ──
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await db.raw('SELECT 1');
    logger.info(`✅ Database connected (${process.env.NODE_ENV})`);

    // ── One-time: fully remove ritikapandey611@gmail.com ──
    try {
      const email = 'ritikapandey611@gmail.com';
      const user = await db('users').where({ email }).first();
      if (user) {
        await db.raw('SET FOREIGN_KEY_CHECKS = 0');
        await db('refresh_tokens').where('user_id', user.id).del();
        await db('two_fa_settings').where('user_id', user.id).del();
        await db('audit_logs').where('user_id', user.id).del();
        await db('failed_login_attempts').where('user_id', user.id).del();
        await db('notifications').where('user_id', user.id).del();
        await db('comments').where('user_id', user.id).del();
        await db('password_reset_tokens').where('user_id', user.id).del();
        await db('users').where('id', user.id).del();
        await db.raw('SET FOREIGN_KEY_CHECKS = 1');
        logger.info(`🗑️  Fully removed user ${email} from users table`);
      }
      // Also remove from testers regardless
      const delTesters = await db('testers').where({ email }).del();
      if (delTesters > 0) logger.info(`🗑️  Removed ${delTesters} tester entry(s) for ${email}`);
    } catch (e) { logger.warn('Cleanup error:', e.message); }

    // ── Clean up testers table: remove duplicates and non-testers (Admin, Manager) ──
    try {
      // 1. Remove Admin and Manager roles from testers table — they don't belong there
      const removedRoles = await db('testers')
        .whereIn('role', ['Admin', 'Manager'])
        .del();
      if (removedRoles > 0) logger.info(`🧹 Removed ${removedRoles} Admin/Manager entries from testers`);

      // Also remove testers whose email belongs to an Admin or Manager in users table
      const adminManagerEmails = (await db('users')
        .whereIn('role', ['Admin', 'Manager'])
        .select('email'))
        .map(u => u.email)
        .filter(Boolean);
      if (adminManagerEmails.length > 0) {
        const removedByEmail = await db('testers').whereIn('email', adminManagerEmails).del();
        if (removedByEmail > 0) logger.info(`🧹 Removed ${removedByEmail} admin/manager user(s) from testers by email`);
      }

      // 2. Remove duplicate testers (keep only the first entry per email)
      const dupes = await db('testers')
        .select('email')
        .groupBy('email')
        .havingRaw('COUNT(*) > 1');
      for (const { email } of dupes) {
        if (!email) continue;
        const rows = await db('testers').where({ email }).orderBy('created_at', 'asc');
        if (rows.length > 1) {
          const idsToDelete = rows.slice(1).map(r => r.id);
          await db('testers').whereIn('id', idsToDelete).del();
          logger.info(`🧹 Removed ${idsToDelete.length} duplicate tester(s) for ${email}`);
        }
      }

      // 3. Sync only QA Engineers / Lead QA who are missing from testers
      const qaUsers = await db('users')
        .whereNotIn('role', ['Admin', 'Manager', 'Developer'])
        .select('id', 'name', 'email', 'role');
      const existingTesterEmails = (await db('testers').select('email')).map(t => t.email?.toLowerCase());
      const existingDevEmails = (await db('developers').select('email')).map(d => d.email?.toLowerCase());

      let synced = 0;
      for (const user of qaUsers) {
        if (!user.email) continue;
        const emailLower = user.email.toLowerCase();
        if (existingTesterEmails.includes(emailLower)) continue;
        const initials = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
        await db('testers').insert({
          id: require('uuid').v4(),
          name: user.name,
          email: user.email,
          initials,
          avatar_color: 'av-blue',
          role: user.role || 'QA Engineer',
        });
        synced++;
      }

      // Also sync developers who are missing
      const devUsers = await db('users').where({ role: 'Developer' }).select('id', 'name', 'email');
      for (const user of devUsers) {
        if (!user.email) continue;
        if (existingDevEmails.includes(user.email.toLowerCase())) continue;
        const initials = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
        await db('developers').insert({
          id: require('uuid').v4(),
          name: user.name,
          email: user.email,
          initials,
          avatar_color: 'av-green',
          specialisation: 'Full Stack',
        });
        synced++;
      }

      if (synced > 0) logger.info(`🔄 Synced ${synced} missing user(s) into testers/developers`);
    } catch (syncErr) {
      logger.warn('⚠️  User sync warning:', syncErr.message);
    }

    app.listen(PORT, () => {
      logger.info(`🚀 TestFlow API running on http://localhost:${PORT}`);
      logger.info(`   Environment : ${process.env.NODE_ENV}`);
      logger.info(`   Client URL  : ${process.env.CLIENT_URL}`);
    });
  } catch (err) {
    logger.error('❌ Failed to connect to database:', err.message);
    logger.error('   Check your .env file and ensure MySQL is running');
    process.exit(1);
  }
}

start();

module.exports = app; // for testing
