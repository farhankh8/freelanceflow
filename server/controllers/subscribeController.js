const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PLANS = {
  pro: {
    name: 'Pro',
    amount: 149900,
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
  console.log("Creating order, key:", process.env.RAZORPAY_KEY_ID);
  const user = await User.findById(req.user.id);
  
  if (user.plan === 'pro') {
    return res.status(400).json({ success: false, message: 'Already on Pro' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: 149900,
      currency: 'INR',
      receipt: 'ff_' + Date.now(),
      notes: { userId: user.id, email: user.email, plan: 'pro' }
    });
    
    console.log("Order created:", order.id);
    
    await Order.create({
      orderId: order.id,
      userId: user.id,
      plan: 'pro',
      amount: order.amount,
      currency: order.currency,
      status: 'pending',
      notes: { email: user.email }
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (err) {
    console.error("Razorpay error:", err.error || err.message);
    res.status(500).json({ success: false, message: err.error?.description || err.message });
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing payment details' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  await Order.findOneAndUpdate({ orderId: razorpay_order_id }, { status: 'paid', paymentId: razorpay_payment_id, paidAt: new Date() });

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  await User.findByIdAndUpdate(userId, { plan: 'pro', planExpiry: expiryDate, paymentId: razorpay_payment_id });

  res.json({ success: true, message: 'Payment verified! Pro plan activated' });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const isPro = user.plan === 'pro' && user.planExpiry && user.planExpiry > new Date();

  res.json({
    success: true,
    data: {
      currentPlan: user.plan,
      isPro: isPro,
      planExpiry: user.planExpiry,
      limits: { free: FREE_LIMITS, pro: 'unlimited' }
    }
  });
});

module.exports = { createOrder, verifyPayment, getPaymentStatus, FREE_LIMITS, PLANS };