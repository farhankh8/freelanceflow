const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    match: [/^[a-zA-Z\s]+$/, 'Name must only contain letters and spaces']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    maxlength: [255, 'Email cannot exceed 255 characters']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [12, 'Password must be at least 12 characters']
  },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  planExpiry: { type: Date, default: null },
  paymentId: { type: String, default: null },
  phone: { type: String, default: '', maxlength: 20 },
  role: { type: String, enum: ['user', 'admin', 'viewer'], default: 'user' },
  refreshToken: { type: String, select: false },
  
  // Security enhancements
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    success: Boolean,
    failureReason: String
  }],
  passwordHistory: [{
    password: { type: String, select: false },
    changedAt: { type: Date, default: Date.now }
  }],
  passwordChangedAt: { type: Date, default: Date.now },
  
  // Two-factor authentication (prepared for future)
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  
  // Profile
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  
  // Settings
  settings: {
    currency: { type: String, default: 'INR', maxlength: 10 },
    timezone: { type: String, default: 'Asia/Kolkata', maxlength: 50 },
    gstin: { type: String, default: '', maxlength: 20 },
    businessName: { type: String, default: '', maxlength: 100 },
    businessAddress: { type: String, default: '', maxlength: 500 },
    upiId: { type: String, default: '', maxlength: 50 },
    bankName: { type: String, default: '', maxlength: 100 },
    accountNumber: { type: String, default: '', maxlength: 20 },
    ifsc: { type: String, default: '', maxlength: 20 },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    defaultRate: { type: Number, default: 500, min: 0 },
    notifications: {
      email: { type: Boolean, default: true },
      invoices: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      leads: { type: Boolean, default: false }
    }
  },
  
  // Marketing & Analytics
  source: { type: String, default: 'organic' },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

// Indexes for performance and security
userSchema.index({ plan: 1 })
userSchema.index({ referralCode: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ isActive: 1 })

// Pre-save hook for password hashing
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  
  // Store password history (keep last 5)
  if (this.isModified('password')) {
    const historyEntry = { password: this.password, changedAt: new Date() }
    this.passwordHistory = [historyEntry, ...(this.passwordHistory || []).slice(0, 4)]
    this.passwordChangedAt = new Date()
  }
  
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare password method
userSchema.methods.comparePassword = async function(p) {
  return bcrypt.compare(p, this.password)
}

// Check if account is locked
userSchema.methods.isLocked = function() {
  if (this.lockedUntil && this.lockedUntil > new Date()) {
    return true
  }
  return false
}

// Lock account method
userSchema.methods.lockAccount = function(reason = 'Too many failed login attempts') {
  this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  return this.save()
}

// Unlock account method
userSchema.methods.unlockAccount = function() {
  this.lockedUntil = null
  this.failedLoginAttempts = 0
  return this.save()
}

// Record login attempt
userSchema.methods.recordLoginAttempt = function(ip, userAgent, success, failureReason = null) {
  this.loginHistory.unshift({
    timestamp: new Date(),
    ip,
    userAgent,
    success,
    failureReason
  })
  
  // Keep only last 20 login attempts
  this.loginHistory = this.loginHistory.slice(0, 20)
  
  if (success) {
    this.failedLoginAttempts = 0
    this.lockedUntil = null
    this.lastLoginAt = new Date()
    this.lastLoginIP = ip
  } else {
    this.failedLoginAttempts += 1
    
    // Lock after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000)
    }
  }
  
  return this.save()
}

// JSON transform (remove sensitive fields)
userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.refreshToken
  delete obj.twoFactorSecret
  delete obj.passwordHistory
  return obj
}

// Static method to find by email (case-insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

module.exports = mongoose.model('User', userSchema)