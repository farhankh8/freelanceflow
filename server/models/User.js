const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, maxlength: 100 },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: '', maxlength: 20 },
  
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
    razorpayKeyId: { type: String, default: '', maxlength: 100 },
    razorpayKeySecret: { type: String, default: '', maxlength: 100 },
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
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  planStartedAt: { type: Date },
  planEndsAt: { type: Date },
  
  // Security
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  passwordChangedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  
  // Consent
  acceptedTerms: { type: Boolean, default: true },
  acceptedAt: { type: Date },
  marketingEmails: { type: Boolean, default: false },
  
  // OAuth
  provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  providerId: { type: String },
  googleId: { type: String },
  facebookId: { type: String },
  
  // Refresh tokens for persistent sessions
  refreshTokens: [{
    token: { type: String },
    userAgent: { type: String },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
  }],
  
  // Meta
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

userSchema.index({ email: 1 })
userSchema.index({ referralCode: 1 })
userSchema.index({ 'refreshTokens.token': 1 })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.generateToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' })
}

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' })
}

userSchema.methods.getSignedJwt = function() {
  const accessToken = this.generateToken()
  const refreshToken = this.generateRefreshToken()
  return { accessToken, refreshToken }
}

userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now()
}

userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await User.findByIdAndUpdate(this._id, {
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    })
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } }
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }
  }
  
  return await User.findByIdAndUpdate(this._id, updates)
}

userSchema.methods.clearFailedAttempts = async function() {
  return await User.findByIdAndUpdate(this._id, {
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  })
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.passwordResetToken
  delete obj.passwordResetExpires
  delete obj.twoFactorSecret
  delete obj.refreshTokens
  delete obj.googleId
  delete obj.facebookId
  return obj
}

userSchema.statics.getReferralCode = async function() {
  let code
  do {
    code = crypto.randomBytes(3).toString('hex').toUpperCase()
  } while (await this.findOne({ referralCode: code }))
  return code
}

const User = mongoose.model('User', userSchema)

module.exports = User