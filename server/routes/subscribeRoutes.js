const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  createOrder, 
  verifyPayment, 
  getPaymentStatus 
} = require('../controllers/subscribeController');

router.use(protect);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/status', getPaymentStatus);

module.exports = router;