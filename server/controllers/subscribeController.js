const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SfH61mklxoBJWx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '8UBO39DQlrn23glGR7cuqlV8'
});

const PLANS = {
  pro: {
    name: 'Pro',
    amount: 99900, // ₹999 in paise
    currency: 'INR',
    features: ['unlimited_clients', 'unlimited_invoices', 'unlimited_projects', 'priority_support', 'custom_branding']
  }
};

const FREE_LIMITS = {
  clients: 5,
  invoices: 10,
  projects: 5,
  leads: 20,
  tasks: 20,
  contacts: 20,
  contracts: 5,
  expenses: 10
};

const createOrder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const isProActive = user.plan === 'pro' && user.planExpiry && new Date(user.planExpiry) > new Date();
  
  if (isProActive) {
    return res.status(400).json({
      success: false,
      message: 'You are already on Pro plan'
    });
  }

  const plan = 'pro';
  const planDetails = PLANS[plan];

  const order = await razorpay.orders.create({
    amount: planDetails.amount,
    currency: planDetails.currency,
    receipt: `ff_${user.id}_${Date.now()}`,
    notes: {
      userId: user.id.toString(),
      email: user.email,
      plan: plan
    }
  });

  await Order.create({
    orderId: order.id,
    userId: user.id,
    plan: plan,
    amount: order.amount,
    currency: order.currency,
    status: 'pending',
    notes: {
      email: user.email
    }
  });

  res.status(201).json({
    success: true,
    message: 'Order created',
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    }
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing payment details'
    });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    await Order.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { status: 'failed' }
    );
    
    return res.status(400).json({
      success: false,
      message: 'Invalid payment signature'
    });
  }

  const order = await Order.findOne({ orderId: razorpay_order_id });
  
  if (!order) {
    return res.status(400).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Payment already verified'
    });
  }

  order.status = 'paid';
  order.paymentId = razorpay_payment_id;
  order.paidAt = new Date();
  await order.save();

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  await User.findByIdAndUpdate(userId, {
    plan: 'pro',
    planExpiry: expiryDate,
    paymentId: razorpay_payment_id
  });

  res.json({
    success: true,
    message: 'Payment verified! Pro plan activated',
    data: {
      plan: 'pro',
      expiry: expiryDate
    }
  });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const orders = await Order.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-notes');

  const proExpiry = user.planExpiry;
  const isPro = user.plan === 'pro' && proExpiry && proExpiry > new Date();

  res.json({
    success: true,
    data: {
      currentPlan: user.plan,
      isPro: isPro,
      planExpiry: proExpiry,
      paymentId: user.paymentId,
      orders: orders,
      limits: {
        free: FREE_LIMITS,
        pro: 'unlimited'
      }
    }
  });
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus,
  FREE_LIMITS,
  PLANS
};