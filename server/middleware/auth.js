const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

const requirePro = (req, res, next) => {
  if (req.user.plan !== 'pro') {
    return res.status(403).json({ error: 'Upgrade to Pro to access this feature' });
  }
  next();
};

module.exports = { protect, requirePro };