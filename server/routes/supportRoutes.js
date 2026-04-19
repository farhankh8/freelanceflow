const express = require('express');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/v1/support - Submit support message
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required'
    });
  }

  const supportMessage = await SupportMessage.create({
    name,
    email,
    subject: subject || '',
    message,
    userId: req.user?.id || null
  });

  res.status(201).json({
    success: true,
    message: 'Support message received',
    data: supportMessage
  });
}));

// GET /api/v1/support - Get all messages (admin only - for owner)
router.get('/', asyncHandler(async (req, res) => {
  const messages = await SupportMessage.find()
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    count: messages.length,
    data: messages
  });
}));

module.exports = router;