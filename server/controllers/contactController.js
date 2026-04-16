const Contact = require('../models/Contact');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const VALID_TAGS = ['Client', 'Freelancer', 'Partner', 'Vendor', 'Friend', 'Other'];
const VALID_COLORS = ['#6c63ff', '#ff6584', '#00d97e', '#ffb800', '#2CA5E0', '#ff4d6d', '#a78bfa', '#00c9a7'];

const contactCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  company: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  tag: z.enum(VALID_TAGS).optional(),
  source: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  starred: z.boolean().optional(),
  color: z.enum(VALID_COLORS).optional(),
});

const contactUpdateSchema = contactCreateSchema.partial();

const getAll = asyncHandler(async (req, res) => {
  const items = await Contact.find({ user: req.user.id }).sort({ starred: -1, createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = contactCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { name, company, email, phone, tag, source, city, notes, starred, color } = parsed.data;

  const item = await Contact.create({
    user: req.user.id,
    name,
    company: company || '',
    email: email || '',
    phone: phone || '',
    tag: tag || 'Client',
    source: source || '',
    city: city || '',
    notes: notes || '',
    starred: starred || false,
    color: color || VALID_COLORS[0],
  });
  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = contactUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { name, company, email, phone, tag, source, city, notes, starred, color } = parsed.data;

  const item = await Contact.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { name, company, email, phone, tag, source, city, notes, starred, color } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Contact not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await Contact.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Contact not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
