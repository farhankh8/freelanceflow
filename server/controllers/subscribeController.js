const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Order = require('../models/Order');

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
  console.log("Creating payment link for user:", req.user.id);
  const user = await User.findById(req.user.id);
  console.log("User plan:", user.plan, "key:", process.env.RAZORPAY_KEY_ID);
  
  if (user.plan === 'pro') {
    return res.status(400).json({
      success: false,
      message: 'Already on Pro'
    });
  }

  try {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const razorpayRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 149900,
        currency: 'INR',
        description: 'FreelanceFlow Pro Plan',
        customer: {
          email: user.email,
          name: user.name
        },
        notify: {
          sms: false,
          email: false
        },
        callback_url: `${process.env.CLIENT_URL}/app?payment=success`,
        callback_method: 'get'
      })
    });

    const paymentLink = await razorpayRes.json();
    
    if (!paymentLink.short_url) {
      console.log("Razorpay error:", paymentLink);
      throw new Error(paymentLink.error?.description || 'Failed to create payment link');
    }

    console.log("Payment link created:", paymentLink.id);

    res.status(201).json({
      success: true,
      message: 'Payment link created',
      data: {
        url: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (razorpayErr) {
    console.error("Razorpay error:", razorpayErr);
    res.status(500).json({ success: false, message: razorpayErr.message || 'Payment failed' });
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Payment verified via callback' });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  const proExpiry = user.planExpiry;
  const isPro = user.plan === 'pro' && proExpiry && proExpiry > new Date();

  res.json({
    success: true,
    data: {
      currentPlan: user.plan,
      isPro: isPro,
      planExpiry: proExpiry,
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