const Payment = require('../models/Payment');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');
const { sendSuccess } = require('../utils/apiResponse');

const VALID_METHODS = ['upi', 'bank_transfer', 'cash', 'card', 'check', 'other'];
const VALID_STATUSES = ['completed', 'pending', 'failed', 'refunded'];

const paymentCreateSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  invoiceId: z.string().optional(),
  invoiceNumber: z.string().max(50).optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().max(10).optional(),
  method: z.enum(VALID_METHODS).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  date: z.string().optional(),
  transactionId: z.string().max(100).optional(),
  utr: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  tdsDeducted: z.number().min(0).optional(),
  tdsCertificate: z.string().max(200).optional(),
});

const paymentUpdateSchema = paymentCreateSchema.partial();

const getAll = asyncHandler(async (req, res) => {
  const items = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = paymentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { client: clientId, invoiceId, invoiceNumber, amount, currency, method, status, date, transactionId, utr, notes, tdsDeducted, tdsCertificate } = parsed.data;

  const item = await Payment.create({
    user: req.user.id,
    client: clientId,
    invoiceId: invoiceId || undefined,
    invoiceNumber: invoiceNumber || '',
    amount,
    currency: currency || 'INR',
    method: method || 'upi',
    status: status || 'completed',
    date: date ? new Date(date) : undefined,
    transactionId: transactionId || '',
    utr: utr || '',
    notes: notes || '',
    tdsDeducted: tdsDeducted || 0,
    tdsCertificate: tdsCertificate || '',
  });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = paymentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { clientId, invoiceId, invoiceNumber, amount, currency, method, status, date, transactionId, utr, notes, tdsDeducted, tdsCertificate } = parsed.data;

  const item = await Payment.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { client: clientId, invoiceId, invoiceNumber, amount, currency, method, status, date: date ? new Date(date) : undefined, transactionId, utr, notes, tdsDeducted, tdsCertificate } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Payment.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
