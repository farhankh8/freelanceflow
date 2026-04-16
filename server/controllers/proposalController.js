const Proposal = require('../models/Proposal');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const VALID_STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'];

const proposalCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  client: z.string().min(1, 'Client name is required').max(100),
  company: z.string().max(100).optional(),
  amount: z.number().min(0).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  validUntil: z.string().optional(),
  services: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

const proposalUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  client: z.string().min(1).max(100).optional(),
  company: z.string().max(100).optional(),
  amount: z.number().min(0).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  validUntil: z.string().optional(),
  services: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

const getAll = asyncHandler(async (req, res) => {
  const items = await Proposal.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = proposalCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, client, company, amount, status, validUntil, services, notes } = parsed.data;

  const item = await Proposal.create({
    user: req.user.id,
    title,
    client,
    company: company || '',
    amount: amount || 0,
    status: status || 'draft',
    validUntil: validUntil ? new Date(validUntil) : undefined,
    services: services || [],
    notes: notes || '',
  });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = proposalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, client, company, amount, status, validUntil, services, notes } = parsed.data;

  const item = await Proposal.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { title, client, company, amount, status, validUntil: validUntil ? new Date(validUntil) : undefined, services, notes } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Proposal.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Proposal not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
