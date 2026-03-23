const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendOwnerNotification } = require('../config/email');

const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Registration attempt:', { name, email, passwordLength: password?.length });
    
    if (!name || !email || !password) {
      console.log('Missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = await User.create({ name, email, password });
    console.log('User created:', user._id);
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    
    await Promise.all([
      sendWelcomeEmail(name, email).catch(e => console.error('Welcome email error:', e.message)),
      sendOwnerNotification(name, email).catch(e => console.error('Owner notification error:', e.message))
    ]);
    
    console.log('Sending success response');
    res.status(201).json({ success: true, accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, plan: user.plan } });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields are required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    res.status(200).json({ success: true, accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, plan: user.plan } });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ error: 'Invalid refresh token' });
    const accessToken = generateAccessToken(user._id);
    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

module.exports = { register, login, refresh, logout, getMe };