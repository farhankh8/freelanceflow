/**
 * Enterprise Logger Configuration
 * Uses Pino for structured logging
 */

const pino = require('pino')

const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  
  // Transport configuration
  transport: isProduction 
    ? undefined 
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          customColors: {
            error: 'red',
            warn: 'yellow',
            info: 'cyan',
            debug: 'gray',
            fatal: 'magenta'
          }
        }
      },
  
  // Formatters
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      service: 'freelanceflow',
      environment: process.env.NODE_ENV || 'development',
      ...bindings
    })
  },
  
  // Timestamp
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  
  // Base fields (included in all logs)
  base: {
    service: 'freelanceflow',
    version: '3.0.0'
  },
  
  // Serializers (for req/res/err)
  serializers: {
    err: (err) => ({
      type: err.name,
      message: err.message,
      stack: isProduction ? undefined : err.stack,
      code: err.code,
      statusCode: err.statusCode
    }),
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent']
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },
  
  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.refreshToken',
      'req.body.accessToken',
      '*.password',
      '*.secret',
      '*.apiKey',
      '*.token'
    ],
    censor: '[REDACTED]'
  }
})

// Create child loggers for different contexts
const createLogger = (context) => logger.child(context)

// Request/Response logging Middleware
const requestLogger = (req, res, next) => {
  const start = Date.now()
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  
  req.requestId = requestId
  
  res.on('finish', () => {
    const duration = Date.now() - start
    
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    }, 'HTTP Request')
  })
  
  next()
}

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown'
  
  const logData = {
    requestId,
    method: req.method,
    url: req.url,
    error: {
      type: err.name,
      message: err.message,
      stack: isProduction ? undefined : err.stack
    },
    userId: req.user?.id,
    ip: req.ip
  }
  
  if (err.statusCode >= 500) {
    logger.error(logData, 'Server Error')
  } else if (err.statusCode >= 400) {
    logger.warn(logData, 'Client Error')
  } else {
    logger.info(logData, 'Request Error')
  }
  
  next(err)
}

// Security event logging
const securityLog = {
  loginAttempt: (userId, ip, success, details = {}) => {
    logger.info({ userId, ip, success, ...details }, success ? 'Login successful' : 'Login failed')
  },
  
  rateLimitExceeded: (ip, endpoint) => {
    logger.warn({ ip, endpoint }, 'Rate limit exceeded')
  },
  
  invalidToken: (userId, reason) => {
    logger.warn({ userId, reason }, 'Invalid token')
  },
  
  suspiciousActivity: (userId, details) => {
    logger.warn({ userId, ...details }, 'Suspicious activity detected')
  }
}

// Business event logging
const businessLog = {
  invoiceCreated: (userId, invoiceId, amount) => {
    logger.info({ userId, invoiceId, amount }, 'Invoice created')
  },
  
  paymentReceived: (userId, paymentId, amount) => {
    logger.info({ userId, paymentId, amount }, 'Payment received')
  },
  
  contractSigned: (userId, contractId) => {
    logger.info({ userId, contractId }, 'Contract signed')
  }
}

// Performance logging
const perfLog = {
  slowQuery: (query, duration) => {
    if (duration > 1000) {
      logger.warn({ query, duration }, 'Slow query detected')
    }
  }
}

module.exports = {
  logger,
  createLogger,
  requestLogger,
  errorLogger,
  securityLog,
  businessLog,
  perfLog
}