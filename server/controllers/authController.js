/**
 * Enterprise Authentication Controller
 * Enhanced with security, validation, logging, and audit trails
 */

const jwt = require('jsonwebtoken')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const { sendWelcomeEmail, sendOwnerNotification } = require('../config/email')
const { ApiResponse, asyncHandler, sendSuccess, sendError } = require('../utils/apiResponse')
const { logger, securityLog } = require('../config/logger')
const { registerSchema, loginSchema, validate } = require('../utils/validators')

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
    const user = await User.create({ 
      name, 
      email: email.toLowerCase(), 
      password 
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
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
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
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan },
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

module.exports = { 
  register, 
  login, 
  refresh, 
  logout, 
  getMe, 
  updateProfile,
  changePassword
}