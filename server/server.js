/**
 * FreelanceFlow Enterprise Server
 * Production-grade Express server with security, logging, and monitoring
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const { logger, requestLogger, errorLogger } = require('./config/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const leadRoutes = require('./routes/leadRoutes');
const contactRoutes = require('./routes/contactRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const seedRoutes = require('./routes/seedRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration (production-ready)
const isProduction = process.env.NODE_ENV === 'production';
// Default allowed origins - add any known Vercel URLs here
const DEFAULT_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:3000',
  'https://freelanceflow-blue-delta.vercel.app',
  'https://freelanceflow.vercel.app',
  'https://freelanceflow.com'
];
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : DEFAULT_ORIGINS;

app.use(cors({
  origin: isProduction ? ALLOWED_ORIGINS : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

// Request logging (enterprise)
app.use(requestLogger);

// Body parsing with limits
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (enterprise - per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 200,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':' + (req.user?.id || 'anon')
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':auth'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 5 : 20,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':register'
});

// Stricter limiter for sensitive endpoints
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 50,
  message: { success: false, message: 'Too many requests on this endpoint.' },
  keyGenerator: (req) => req.ip + ':sensitive'
});

// Apply rate limiters
app.use('/api/', globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', registerLimiter);

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/timelogs', timeLogRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/dashboard', sensitiveLimiter, dashboardRoutes);
app.use('/api/v1/seed', seedRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/contracts', require('./routes/contractRoutes'));

// API version info
const API_VERSION = '3.0.0';

// Health check endpoint
app.get('/api/health', (req, res) => {
  const os = require('os');
  res.json({ 
    success: true,
    message: 'FreelanceFlow API - Healthy',
    version: API_VERSION,
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    system: {
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      loadAverage: os.loadavg()
    }
  });
});

// Root endpoint
app.get('/', (req, res) =>
  res.json({ 
    success: true,
    message: `FreelanceFlow API v${API_VERSION} — Enterprise Ready`,
    version: API_VERSION,
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      clients: '/api/v1/clients',
      projects: '/api/v1/projects',
      invoices: '/api/v1/invoices',
      contracts: '/api/v1/contracts',
      dashboard: '/api/v1/dashboard',
      health: '/api/health'
    }
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use(errorLogger);

// Error class for operational errors
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Final error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Don't expose error in production
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' && err.isOperational !== false
      ? 'Internal Server Error'
      : err.message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
    response.statusCode = err.statusCode;
  }

  res.status(err.statusCode).json(response);
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info({ port: PORT, environment: process.env.NODE_ENV || 'development' }, 'Server started');
    console.log(`
╔═══════════════════════════════════════════════════════╗
║     FreelanceFlow Enterprise API v${API_VERSION}              ║
║     Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║     Port: ${PORT.toString().padEnd(33)}║
║     Health: http://localhost:${PORT}/api/health         ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  logger.fatal({ error: err.message }, 'Failed to start server');
  process.exit(1);
});

module.exports = app;