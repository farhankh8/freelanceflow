const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../config/email');
const { register, login, refresh, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/send-reset-email', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email required' })
  
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    return res.json({ message: 'If account exists, email sent' })
  }
  
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' })
  
  await sendPasswordResetEmail(user.name, user.email, resetToken)
  
  res.json({ message: 'Password reset email sent' })
})

module.exports = router;