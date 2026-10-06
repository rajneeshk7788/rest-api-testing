require('dotenv').config();

const express = require('express');
const { pool, initDb } = require('./src/db');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Middleware: parse JSON with request size limit
app.use(express.json({ limit: '10kb' }));

// Root route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Health check endpoint (verifies server and DB status)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      database: 'unreachable',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized Error Handler
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }

  // PostgreSQL unique constraint violation (duplicate key)
  if (error.code === '23505') {
    return res.status(409).json({ error: 'A user with that email already exists' });
  }

  // PostgreSQL check constraint violation
  if (error.code === '23514') {
    return res.status(400).json({ error: 'Check constraint violation on user fields' });
  }

  // PostgreSQL invalid text representation / syntax
  if (error.code === '22P02') {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  console.error('[ServerError]', error);
  return res.status(500).json({ error: 'Internal server error' });
});

// Server configuration & lifecycle management
const PORT = Number(process.env.PORT) || 3000;

let server;
let isShuttingDown = false;

async function start() {
  try {
    await initDb();
    console.log('Connected to PostgreSQL & database schema verified');

    server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  // Force exit after 10 seconds if connections are hanging
  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing process exit...');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('HTTP server closed');
    }

    await pool.end();
    console.log('PostgreSQL pool connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  start();
}

module.exports = app;
