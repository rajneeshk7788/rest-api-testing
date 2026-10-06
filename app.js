require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Security: Disable X-Powered-By header to avoid leaking server tech stack
app.disable('x-powered-by');

// Middleware
app.use(express.json({ limit: '10kb' }));

// Health / root endpoint
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// API Routes
app.use('/api/users', userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized Error Handler
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: 'A user with that email already exists' });
  }

  console.error('[ServerError]', error);
  return res.status(500).json({ error: 'Internal server error' });
});

// Server configuration & lifecycle management
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/user_collection';

let server;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('HTTP server closed');
  }

  await mongoose.connection.close(false);
  console.log('MongoDB connection closed');
  process.exit(0);
}

if (require.main === module) {
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  start();
}

module.exports = app;

