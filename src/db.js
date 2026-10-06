const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const isLocalhost = databaseUrl && (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1'));
const requiresSsl = process.env.NODE_ENV === 'production' || (databaseUrl && !isLocalhost);

const poolConfig = {
  max: Number(process.env.PG_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

const pool = new Pool(
  databaseUrl
    ? { connectionString: databaseUrl, ...poolConfig }
    : {
        host: process.env.PGHOST || '127.0.0.1',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'user_db',
        ...poolConfig,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initDb() {
  if (process.env.NODE_ENV === 'production' && !databaseUrl && !process.env.PGHOST) {
    throw new Error(
      'Missing DATABASE_URL environment variable. Please set DATABASE_URL in your hosting provider (e.g., Render Dashboard).'
    );
  }

  const initSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      age INTEGER CHECK (age >= 0),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);
  `;
  await pool.query(initSql);
}

module.exports = {
  pool,
  query,
  initDb,
};
