require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}

const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
// Ensure all models are registered for populate
require('./models/user.model');
require('./models/category.model');
require('./models/event.model');
require('./models/registration.model');
require('./models/message.model');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const eventsRoutes = require('./routes/events.routes');
const registrationsRoutes = require('./routes/registrations.routes');
const announcementsRoutes = require('./routes/announcements.routes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
// express-mongo-sanitize is not compatible with Express 5 query handling
// Using custom sanitization instead - disable for now to avoid 500 errors
// app.use(mongoSanitize());
// Custom NoSQL injection protection (lightweight)
app.use((req, res, next) => {
  // Sanitize body
  if (req.body) {
    for (const key in req.body) {
      if (key.includes('$') || key.includes('.')) {
        delete req.body[key];
      }
    }
  }
  next();
});

// Health endpoint (must be before auth)
app.get('/health', async (req, res) => {
  let dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let dbError = null;
  if (dbStatus !== 'connected') {
    try { 
      await connectDB(); 
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (e) { dbError = e.message; }
  }
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    ...(dbError && { dbError }),
    timestamp: new Date().toISOString(),
  });
});

// Alternative health path for compatibility
app.get('/api/health', async (req, res) => {
  let dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  let dbError = null;
  if (dbStatus !== 'connected') {
    try { 
      await connectDB(); 
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (e) { dbError = e.message; }
  }
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    ...(dbError && { dbError }),
    timestamp: new Date().toISOString(),
  });
});

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/announcements', announcementsRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'EventPulse API is running. Visit /api-docs for docs or /health for status.' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// Central error handler (must be last)
app.use(errorHandler);

// Create HTTP server and Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('join-event', (eventId) => {
    socket.join(eventId);
    console.log(`User ${socket.id} joined room: ${eventId}`);
  });

  // Also support generic join
  socket.on('join', (eventId) => {
    socket.join(eventId);
    console.log(`User ${socket.id} joined room: ${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Only start if this file is run directly (not required for tests)
if (require.main === module) {
  start();
} else if (process.env.NODE_ENV !== 'test') {
  // For Vercel serverless: connect DB on import (tests use mocked DB)
  connectDB().catch((err) => console.error('Vercel DB connect error:', err.message));
}

module.exports = app;
module.exports.app = app;
module.exports.httpServer = httpServer;
module.exports.io = io;
module.exports.start = start;
