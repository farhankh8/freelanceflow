const Contract = require('../models/Contract');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const VALID_STATUSES = ['draft', 'sent', 'signed', 'active', 'completed', 'cancelled'];

const contractCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  clientId: z.string().optional(),
  proposalId: z.string().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  value: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  terms: z.string().max(10000).optional(),
  services: z.array(z.string()).optional(),
  paymentTerms: z.string().max(500).optional(),
});

const contractUpdateSchema = contractCreateSchema.partial();

const getAll = asyncHandler(async (req, res) => {
  const items = await Contract.find({ user: req.user.id })
    .populate('client', 'name company')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = contractCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, clientId, proposalId, status, value, startDate, endDate, terms, services, paymentTerms } = parsed.data;

  const item = await Contract.create({
    user: req.user.id,
    title,
    client: clientId || undefined,
    proposal: proposalId || undefined,
    status: status || 'draft',
    value: value || 0,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    terms: terms || '',
    services: services || [],
    paymentTerms: paymentTerms || '',
  });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = contractUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, clientId, proposalId, status, value, startDate, endDate, terms, services, paymentTerms } = parsed.data;

  const item = await Contract.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { title, client: clientId, proposal: proposalId, status, value, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, terms, services, paymentTerms } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Contract.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Contract not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
