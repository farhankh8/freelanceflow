const Lead = require('../models/Lead');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const VALID_STAGES = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];

const leadCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  company: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  value: z.number().min(0).optional(),
  stage: z.enum(VALID_STAGES).optional(),
  source: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  lastContactedAt: z.string().optional(),
  nextFollowUp: z.string().optional(),
});

const leadUpdateSchema = leadCreateSchema.partial();

const getAll = asyncHandler(async (req, res) => {
  const items = await Lead.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = leadCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { name, company, email, phone, value, stage, source, notes, lastContactedAt, nextFollowUp } = parsed.data;

  const item = await Lead.create({
    user: req.user.id,
    name,
    company: company || '',
    email: email || '',
    phone: phone || '',
    value: value || 0,
    stage: stage || 'new',
    source: source || 'Website',
    notes: notes || '',
    lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : undefined,
    nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined,
  });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = leadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { name, company, email, phone, value, stage, source, notes, lastContactedAt, nextFollowUp } = parsed.data;

  const item = await Lead.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { name, company, email, phone, value, stage, source, notes, lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : undefined, nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Lead not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Lead.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Lead not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
