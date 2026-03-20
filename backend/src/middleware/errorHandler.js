// ─────────────────────────────────────────────
//  Global Error Handler Middleware
// ─────────────────────────────────────────────
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log full error in non-production
  if (process.env.NODE_ENV !== 'production') {
    logger.error(`[${req.method} ${req.url}] ${status}: ${message}`);
    if (err.stack) logger.debug(err.stack);
  } else {
    if (status >= 500) logger.error(`${status} ${message} - ${req.method} ${req.url}`);
  }

  // Knex / DB errors
  if (err.code === '23505') return res.status(409).json({ error: 'Duplicate entry — this record already exists' });
  if (err.code === '23503') return res.status(409).json({ error: 'Related record not found (foreign key violation)' });
  if (err.code === '42P01') return res.status(500).json({ error: 'Database table not found — run migrations' });

  res.status(status).json({
    error  : status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
