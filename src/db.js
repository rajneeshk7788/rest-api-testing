const { Pool } = require('pg');

const poolConfig = {
  max: Number(process.env.PG_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ...poolConfig }
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
