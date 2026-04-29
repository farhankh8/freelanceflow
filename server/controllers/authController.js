/**
 * Enterprise Authentication Controller
 * Enhanced with security, validation, logging, and audit trails
 */

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const { sendWelcomeEmail, sendOwnerNotification, sendPasswordResetEmail } = require('../config/email')
const { ApiResponse, asyncHandler, sendSuccess, sendError } = require('../utils/apiResponse')
const { logger, securityLog } = require('../config/logger')
const { registerSchema, loginSchema, validate } = require('../utils/validators')

const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || process.env.JWT_ACCESS_SECRET

// JWT configuration
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m'
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'

const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: JWT_EXPIRY })
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY })

/**
 * Validate registration input
 */
const register = [
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body
    
    logger.info({ email: email.substring(0, 4) + '***' }, 'Registration attempt')
    
    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      securityLog.loginAttempt(null, req.ip, false, { reason: '_email_exists', email: email.substring(0, 4) + '***' })
      return sendError(res, 'An account with this email already exists', 400)
    }
    
    // Create user
    const ALLOWED_EMAIL = '25031@yenepoya.edu.in'
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password,
      plan: email.toLowerCase() === ALLOWED_EMAIL ? 'pro' : 'free'
    })
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)
    user.refreshToken = refreshToken
    await user.save()
    
    // Record login attempt
    await user.recordLoginAttempt(req.ip, req.get('user-agent'), true)
    
    // Log audit event
    await AuditLog.log({
      userId: user._id,
      action: 'REGISTER',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      endpoint: req.originalUrl,
      method: 'POST',
      metadata: { email: email.substring(0, 4) + '***' }
    })
    
    // Send welcome email asynchronously
    setTimeout(() => {
      sendWelcomeEmail(name, email).catch(e => logger.error({ error: e.message }, 'Welcome email failed'))
      sendOwnerNotification(name, email).catch(e => logger.error({ error: e.message }, 'Owner notification failed'))
    }, 100)
    
    logger.info({ userId: user._id }, 'User registered successfully')
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
    
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, httpOnly: true })

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, settings: user.settings, plan: user.plan, twoFactorEnabled: user.twoFactorEnabled, role: user.role || 'manager' },
      timestamp: new Date().toISOString()
    })
  })
]

/**
 * Validate login input
 */
const login = [
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    
    logger.info({ email: email.substring(0, 4) + '***' }, 'Login attempt')
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      securityLog.loginAttempt(null, req.ip, false, { reason: 'user_not_found' })
      return sendError(res, 'Invalid email or password', 401)
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      securityLog.loginAttempt(user._id, req.ip, false, { reason: 'account_locked' })
      return sendError(res, 'Account temporarily locked. Please try again later.', 423)
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      // Record failed attempt
      await user.recordLoginAttempt(req.ip, req.get('user-agent'), false, 'Invalid password')
      
      // Log audit event
      await AuditLog.log({
        userId: user._id,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.originalUrl,
        method: 'POST',
        metadata: { reason: 'Invalid password' }
      })
      
      securityLog.loginAttempt(user._id, req.ip, false, { reason: 'invalid_password' })
      return sendError(res, 'Invalid email or password', 401)
    }
    
    // Check if account is active
    if (!user.isActive) {
      return sendError(res, 'Account is suspended. Contact support.', 403)
    }

    // Auto-pro for allowed account, force free for all others
    const ALLOWED_EMAIL = '25031@yenepoya.edu.in'
    if (user.email === ALLOWED_EMAIL && user.plan !== 'pro') {
      user.plan = 'pro'
      await user.save()
    } else if (user.email !== ALLOWED_EMAIL && user.plan === 'pro') {
      user.plan = 'free'
      await user.save()
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)
    user.refreshToken = refreshToken
    await user.save()
    
    // Record successful login
    await user.recordLoginAttempt(req.ip, req.get('user-agent'), true)
    
    // Log audit event
    await AuditLog.log({
      userId: user._id,
      action: 'LOGIN',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      endpoint: req.originalUrl,
      method: 'POST'
    })
    
    logger.info({ userId: user._id }, 'User logged in successfully')
    securityLog.loginAttempt(user._id, req.ip, true)
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
    
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, httpOnly: true })

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, settings: user.settings, plan: user.plan, twoFactorEnabled: user.twoFactorEnabled, role: user.role || 'manager' },
      timestamp: new Date().toISOString()
    })
  })
]

/**
 * Refresh access token
 */
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    
  if (!refreshToken) {
    return sendError(res, 'Refresh token required', 401)
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id).select('+refreshToken')
    
    if (!user || user.refreshToken !== refreshToken) {
      securityLog.invalidToken(decoded.id, 'token_mismatch')
      return sendError(res, 'Invalid refresh token', 401)
    }
    
    if (!user.isActive) {
      return sendError(res, 'Account is suspended', 403)
    }
    
    const accessToken = generateAccessToken(user._id)
    
    await AuditLog.log({
      userId: user._id,
      action: 'TOKEN_REFRESH',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      endpoint: req.originalUrl,
      method: 'POST'
    })
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    })

    return res.status(200).json({
      success: true,
      message: 'Token refreshed',
      accessToken,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    securityLog.invalidToken(null, error.message)
    return sendError(res, 'Invalid refresh token', 401)
  }
})

/**
 * Logout
 */
const logout = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null })
    
    await AuditLog.log({
      userId: req.user.id,
      action: 'LOGOUT',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      endpoint: req.originalUrl,
      method: 'POST'
    })
    
    logger.info({ userId: req.user.id }, 'User logged out')
  }
  
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  })
})

/**
 * Get current user
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  
  if (!user) {
    return sendError(res, 'User not found', 404)
  }
  
  // Log audit for sensitive data access
  await AuditLog.log({
    userId: req.user.id,
    action: 'PROFILE_VIEW',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'GET'
  })
  
  // Backward compatible - user at root level
  return res.status(200).json({
    success: true,
    message: 'User retrieved',
    user,
    timestamp: new Date().toISOString()
  })
})

/**
 * Update profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  if (req.user.role === 'worker') {
    return sendError(res, 'Workers cannot update profile information. Contact your manager.', 403)
  }
  
  const allowedFields = ['name', 'phone', 'settings', 'avatar', 'bio']
  const updates = {}
  
  // Sanitize allowed fields
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === 'settings' && typeof req.body.settings === 'object') {
        updates.settings = { ...req.user.settings?.toObject?.() || req.user.settings || {}, ...req.body.settings }
      } else {
        updates[field] = req.body[field]
      }
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return sendError(res, 'No valid fields to update', 400)
  }
  
  updates.updatedAt = new Date()
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  )
  
  // Log audit
  await AuditLog.log({
    userId: req.user.id,
    action: 'PROFILE_UPDATE',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'PUT',
    metadata: { updated: Object.keys(updates) }
  })
  
  logger.info({ userId: req.user.id, fields: Object.keys(updates) }, 'Profile updated')
  
  // Backward compatible - user at root level
  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
    timestamp: new Date().toISOString()
  })
})

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return sendError(res, 'Current password and new password are required', 400)
  }

  if (newPassword.length < 8) {
    return sendError(res, 'New password must be at least 8 characters', 400)
  }

  const user = await User.findById(req.user.id).select('+password')

  if (!user) {
    return sendError(res, 'User not found', 404)
  }

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    return sendError(res, 'Current password is incorrect', 401)
  }

  user.password = newPassword
  await user.save()

  await AuditLog.log({
    userId: req.user.id,
    action: 'PASSWORD_CHANGE',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'PUT'
  })

  logger.info({ userId: req.user.id }, 'Password changed successfully')

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    timestamp: new Date().toISOString()
  })
})

/**
 * Forgot password - send reset email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  
  if (!email) {
    return sendError(res, 'Email is required', 400)
  }
  
  const user = await User.findOne({ email: email.toLowerCase() })
  
  if (user) {
    const resetToken = jwt.sign({ id: user._id }, JWT_RESET_SECRET, { expiresIn: '1h' })
    await sendPasswordResetEmail(user.name, user.email, resetToken)
  }
  
  return res.status(200).json({
    success: true,
    message: 'If an account exists, a password reset link has been sent',
    timestamp: new Date().toISOString()
  })
})

/**
 * Reset password with token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body
  
  if (!token || !newPassword) {
    return sendError(res, 'Token and new password are required', 400)
  }
  
  if (newPassword.length < 8) {
    return sendError(res, 'Password must be at least 8 characters', 400)
  }
  
  let decoded
  try {
    decoded = jwt.verify(token, JWT_RESET_SECRET)
  } catch (error) {
    return sendError(res, 'Invalid or expired reset token', 400)
  }
  
  const user = await User.findById(decoded.id)
  if (!user) {
    return sendError(res, 'User not found', 404)
  }
  
  user.password = newPassword
  user.refreshToken = null // Force re-login
  await user.save()
  
  await AuditLog.log({
    userId: user._id,
    action: 'PASSWORD_RESET',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'POST'
  })
  
  logger.info({ userId: user._id }, 'Password reset successfully')
  
  return res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.',
    timestamp: new Date().toISOString()
  })
})

/**
 * Setup 2FA - generate secret and QR code
 */
const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  
  if (!user) {
    return sendError(res, 'User not found', 404)
  }
  
  if (user.twoFactorEnabled) {
    return sendError(res, '2FA is already enabled', 400)
  }
  
  const secret = speakeasy.generateSecret({
    name: `FreelanceFlow (${user.email})`,
    issuer: 'FreelanceFlow'
  })
  
  user.twoFactorSecret = secret.base32
  await user.save()
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)
  
  await AuditLog.log({
    userId: user._id,
    action: '2FA_SETUP',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'POST'
  })
  
  return res.status(200).json({
    success: true,
    message: '2FA secret generated',
    qrCode: qrCodeUrl,
    secret: secret.base32,
    timestamp: new Date().toISOString()
  })
})

/**
 * Enable 2FA - verify token and enable
 */
const enable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body
  
  if (!token) {
    return sendError(res, 'Token is required', 400)
  }
  
  const user = await User.findById(req.user.id).select('+twoFactorSecret')
  
  if (!user || !user.twoFactorSecret) {
    return sendError(res, '2FA not set up', 400)
  }
  
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1
  })
  
  if (!verified) {
    return sendError(res, 'Invalid token', 400)
  }
  
  user.twoFactorEnabled = true
  user.twoFactorSecret = user.twoFactorSecret
  await user.save()
  
  await AuditLog.log({
    userId: user._id,
    action: '2FA_ENABLED',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'POST'
  })
  
  logger.info({ userId: user._id }, '2FA enabled')
  
  return res.status(200).json({
    success: true,
    message: '2FA enabled successfully',
    timestamp: new Date().toISOString()
  })
})

/**
 * Disable 2FA
 */
const disable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body
  
  const user = await User.findById(req.user.id).select('+password +twoFactorSecret')
  
  if (!user) {
    return sendError(res, 'User not found', 404)
  }
  
  if (!user.twoFactorEnabled) {
    return sendError(res, '2FA is not enabled', 400)
  }
  
  if (token) {
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1
    })
    
    if (!verified) {
      return sendError(res, 'Invalid token', 400)
    }
  }
  
  user.twoFactorEnabled = false
  user.twoFactorSecret = undefined
  await user.save()
  
  await AuditLog.log({
    userId: user._id,
    action: '2FA_DISABLED',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'POST'
  })
  
  logger.info({ userId: user._id }, '2FA disabled')
  
  return res.status(200).json({
    success: true,
    message: '2FA disabled successfully',
    timestamp: new Date().toISOString()
  })
})

/**
 * Verify 2FA token during login
 */
const verify2FA = asyncHandler(async (req, res) => {
  const { userId, token } = req.body
  
  if (!userId || !token) {
    return sendError(res, 'User ID and token required', 400)
  }
  
  const user = await User.findById(userId).select('+twoFactorSecret')
  
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return sendError(res, 'Invalid request', 400)
  }
  
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 1
  })
  
  return res.status(200).json({
    success: verified,
    message: verified ? 'Token verified' : 'Invalid token',
    timestamp: new Date().toISOString()
  })
})

const handleGoogleCallback = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = req.user
  
  await AuditLog.log({
    userId: user._id,
    action: 'GOOGLE_LOGIN',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    endpoint: req.originalUrl,
    method: 'GET'
  })
  
  logger.info({ userId: user._id }, 'User logged in with Google')
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
  
  res.cookie('refreshToken', refreshToken, cookieOptions)
  
  return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/google-auth?token=${accessToken}&userId=${user._id}`)
})

const googleAuthSuccess = asyncHandler(async (req, res) => {
  const { token, userId } = req.body
  
  if (!token || !userId) {
    return sendError(res, 'Token and userId required', 400)
  }
  
  const user = await User.findById(userId)
  if (!user) {
    return sendError(res, 'User not found', 404)
  }

  const ALLOWED_EMAIL = '25031@yenepoya.edu.in'
  if (user.email === ALLOWED_EMAIL && user.plan !== 'pro') {
    user.plan = 'pro'
    await user.save()
  } else if (user.email !== ALLOWED_EMAIL && user.plan === 'pro') {
    user.plan = 'free'
    await user.save()
  }
  
  return res.status(200).json({
    success: true,
    message: 'Google login successful',
    accessToken: token,
    user: { id: user._id, name: user.name, email: user.email, phone: user.phone, settings: user.settings, plan: user.plan, planExpiry: user.planExpiry, twoFactorEnabled: user.twoFactorEnabled, source: user.source, createdAt: user.createdAt, role: user.role || 'manager' },
    timestamp: new Date().toISOString()
  })
})

module.exports = { 
  register, 
  login, 
  refresh, 
  logout, 
  getMe, 
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FA,
  handleGoogleCallback,
  googleAuthSuccess
}
