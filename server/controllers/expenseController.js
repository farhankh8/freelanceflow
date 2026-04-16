const Expense = require('../models/Expense');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const VALID_CATEGORIES = ['software', 'hardware', 'travel', 'food', 'marketing', 'office', 'professional', 'communication', 'utilities', 'taxes', 'insurance', 'training', 'education', 'subscription', 'other'];
const VALID_METHODS = ['upi', 'bank_transfer', 'cash', 'card', 'check', 'other', 'credit_card', 'debit_card', 'net_banking'];

const expenseCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  paymentMethod: z.enum(VALID_METHODS).optional(),
  notes: z.string().max(500).optional(),
  currency: z.string().max(10).optional(),
  hasReceipt: z.boolean().optional(),
  receiptUrl: z.string().max(500).optional(),
  isTaxDeductible: z.boolean().optional(),
  gstAmount: z.number().min(0).optional(),
});

const expenseUpdateSchema = expenseCreateSchema.partial();

const getAll = asyncHandler(async (req, res) => {
  const items = await Expense.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = expenseCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, description, category, amount, date, clientId, projectId, paymentMethod, notes, currency, hasReceipt, receiptUrl, isTaxDeductible, gstAmount } = parsed.data;

  const normalizePaymentMethod = (m) => {
    if (!m) return 'upi';
    const map = { 'credit card': 'credit_card', 'debit card': 'debit_card', 'net banking': 'net_banking', 'upi': 'upi', 'cash': 'cash', 'card': 'card', 'bank transfer': 'bank_transfer', 'check': 'check', 'other': 'other' };
    return map[m.toLowerCase()] || 'upi';
  };

  const item = await Expense.create({
    user: req.user.id,
    title,
    description: description || '',
    category: category || 'other',
    amount,
    date: date ? new Date(date) : undefined,
    client: clientId || undefined,
    project: projectId || undefined,
    paymentMethod: normalizePaymentMethod(paymentMethod),
    notes: notes || '',
    currency: currency || 'INR',
    hasReceipt: hasReceipt || false,
    receiptUrl: receiptUrl || '',
    isTaxDeductible: isTaxDeductible ?? true,
    gstAmount: gstAmount || 0,
  });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = expenseUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, description, category, amount, date, clientId, projectId, paymentMethod, notes, currency, hasReceipt, receiptUrl, isTaxDeductible, gstAmount } = parsed.data;

  const item = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { title, description, category, amount, date: date ? new Date(date) : undefined, client: clientId, project: projectId, paymentMethod, notes, currency, hasReceipt, receiptUrl, isTaxDeductible, gstAmount } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Expense not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
