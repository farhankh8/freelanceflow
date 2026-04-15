const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER', 
      'PASSWORD_CHANGE', 'PASSWORD_CHANGE_FAILED',
      'ACCOUNT_LOCK', 'ACCOUNT_UNLOCK', 'ACCOUNT_CREATE',
      
      // Client actions
      'CLIENT_CREATE', 'CLIENT_UPDATE', 'CLIENT_DELETE',
      
      // Project actions
      'PROJECT_CREATE', 'PROJECT_UPDATE', 'PROJECT_DELETE',
      
      // Invoice actions
      'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE', 
      'INVOICE_VIEW', 'INVOICE_DOWNLOAD',
      
      // Contract actions
      'CONTRACT_CREATE', 'CONTRACT_UPDATE', 'CONTRACT_DELETE',
      'CONTRACT_SIGN',
      
      // Payment actions
      'PAYMENT_CREATE', 'PAYMENT_UPDATE', 'PAYMENT_DELETE',
      'PAYMENT_MARK_PAID',
      
      // Expense actions
      'EXPENSE_CREATE', 'EXPENSE_UPDATE', 'EXPENSE_DELETE',
      
      // Time log actions
      'TIMELOG_CREATE', 'TIMELOG_UPDATE', 'TIMELOG_DELETE',
      
      // Lead actions
      'LEAD_CREATE', 'LEAD_UPDATE', 'LEAD_DELETE',
      
      // Settings actions
      'SETTINGS_UPDATE', 'PROFILE_UPDATE',
      
      // Admin actions
      'USER_SUSPEND', 'USER_UNSUSPEND', 'USER_impersonate'
    ],
    index: true
  },
  resource: { type: String, maxlength: 50 },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, maxlength: 500 },
  
  // Request metadata
  ip: { type: String, maxlength: 45 },
  userAgent: { type: String, maxlength: 500 },
  endpoint: { type: String, maxlength: 200 },
  method: { type: String, maxlength: 10 },
  
  // Request body (sanitized - no passwords)
  requestData: { type: mongoose.Schema.Types.Mixed },
  
  // Response metadata
  statusCode: { type: Number },
  responseTime: { type: Number },
  
  // Additional context
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Timestamp
  timestamp: { type: Date, default: Date.now, index: true }
}, { 
  timestamps: false,
  timeseries: false,
  autoIndex: true
})

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ resource: 1, resourceId: 1 })
auditLogSchema.index({ ip: 1, timestamp: -1 })

/**
 * AuditLog: Enterprise audit logging model
 * Tracks all user actions for security and compliance
 */
const AuditLog = mongoose.model('AuditLog', auditLogSchema)

/**
 * Log an action helper
 */
AuditLog.log = async function({ 
  userId, 
  action, 
  resource = null, 
  resourceId = null,
  description = null,
  ip = null,
  userAgent = null,
  endpoint = null,
  method = null,
  requestData = null,
  statusCode = null,
  responseTime = null,
  metadata = null
}) {
  try {
    const log = new AuditLog({
      userId,
      action,
      resource,
      resourceId,
      description,
      ip,
      userAgent,
      endpoint,
      method,
      requestData: sanitizeData(requestData),
      statusCode,
      responseTime,
      metadata
    })
    
    await log.save()
    return log
  } catch (error) {
    console.error('AUDIT_LOG_ERROR:', error.message)
    // Don't throw - audit logging should never break the app
    return null
  }
}

/**
 * Sanitize sensitive data from request bodies
 */
function sanitizeData(data) {
  if (!data) return null
  
  const sanitized = { ...data }
  const sensitiveFields = ['password', 'refreshToken', 'accessToken', 'token', 'secret', 'apiKey', 'gstin', 'accountNumber', 'ifsc']
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}

/**
 * Query helpers
 */
auditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const { limit = 50, action = null, startDate = null, endDate = null } = options
  
  const query = { userId }
  
  if (action) query.action = action
  if (startDate || endDate) {
    query.timestamp = {}
    if (startDate) query.timestamp.$gte = new Date(startDate)
    if (endDate) query.timestamp.$lte = new Date(endDate)
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
}

auditLogSchema.statics.getRecentLogins = function(userId, limit = 10) {
  return this.find({
    userId,
    action: { $in: ['LOGIN', 'LOGIN_FAILED'] }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean()
}

module.exports = AuditLog