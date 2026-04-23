const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')

const generateAccessToken = (id) => require('jsonwebtoken').sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
const generateRefreshToken = (id) => require('jsonwebtoken').sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase()
      if (!email) {
        return done(new Error('No email found in Google profile'), null)
      }

      let user = await User.findOne({ email })
      
      if (user) {
        if (user.googleId && user.googleId !== profile.id) {
          return done(new Error('Email already registered with another account'), null)
        }
        user.googleId = profile.id
        user.source = user.source || 'google'
      } else {
        const nameParts = profile.displayName?.split(' ') || []
        const firstName = nameParts[0] || 'User'
        const lastName = nameParts.slice(1).join(' ') || ''
        
        user = new User({
          name: profile.displayName || `${firstName} ${lastName}`.trim() || 'Google User',
          email,
          googleId: profile.id,
          password: require('crypto').randomBytes(32).toString('hex'),
          source: 'google',
          isVerified: true,
          verifiedAt: new Date()
        })
      }

      const token = generateAccessToken(user._id)
      const refresh = generateRefreshToken(user._id)
      user.refreshToken = refresh
      await user.save()
      
      return done(null, { user, accessToken: token, refreshToken: refresh })
    } catch (error) {
      return done(error, null)
    }
  }
)

module.exports = googleStrategy