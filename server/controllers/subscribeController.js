const asyncHandler = require('../middleware/asyncHandler');

const createOrder = asyncHandler(async (req, res) => {
  console.log("Creating order for user:", req.user.id);
  const user = await User.findById(req.user.id);
  console.log("User plan:", user.plan, "expiry:", user.planExpiry);
  
  if (user.plan === 'pro') {
    return res.status(400).json({
      success: false,
      message: 'Already on Pro - contact support'
    });
  }

  const amount = 149900;
  const currency = 'INR';

  try {
    // Create Razorpay Payment Link directly via API
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const razorpayRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        description: 'FreelanceFlow Pro Plan - Monthly',
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