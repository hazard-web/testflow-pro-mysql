// ─────────────────────────────────────────────
//  Database Configuration — Knex + MySQL 8
// ─────────────────────────────────────────────
const knex = require('knex');

const config = {
  client: 'mysql2',
  connection: {
    host    : process.env.DB_HOST     || 'localhost',
    port    : parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME     || 'testflow_dev',
    user    : process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl     : process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
    timezone: '+00:00',
    charset : 'utf8mb4',
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis : 10000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis   : 30000,
    reapIntervalMillis  : 1000
  },
  migrations: {
    directory: '../../database/migrations',
    tableName : 'knex_migrations'
  },
  seeds: {
    directory: '../../database/seeds'
  },
  debug: process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'debug',
  // Add query timeout
  queryTimeout: 10000
};

const db = knex(config);

// Health check - test connection on startup
db.raw('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

process.on('SIGINT',  () => { db.destroy(); process.exit(0); });
process.on('SIGTERM', () => { db.destroy(); process.exit(0); });

module.exports = db;
