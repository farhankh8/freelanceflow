const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const timeLogCreateSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  projectId: z.string().min(1, 'Project is required'),
  clientId: z.string().optional(),
  taskId: z.string().optional(),
  duration: z.number().min(0.25, 'Duration must be at least 0.25 hours').max(24, 'Duration cannot exceed 24 hours'),
  rate: z.number().min(0).optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const timeLogUpdateSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  taskId: z.string().optional(),
  duration: z.number().min(0.25).max(24).optional(),
  rate: z.number().min(0).optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
  billed: z.boolean().optional(),
});

const getAll = asyncHandler(async (req, res) => {
  const items = await TimeLog.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, data: items });
});

const create = asyncHandler(async (req, res) => {
  const parsed = timeLogCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { description, projectId, clientId, taskId, duration, rate, date, notes } = parsed.data;

  const project = await Project.findOne({ _id: projectId, user: req.user.id });
  if (!project) {
    return res.status(403).json({ success: false, message: 'Project not found or access denied' });
  }

  const item = await TimeLog.create({
    user: req.user.id,
    project: projectId,
    client: clientId || project.client,
    task: taskId || undefined,
    description,
    duration,
    rate: rate || 0,
    date: date ? new Date(date) : undefined,
    notes: notes || '',
  });

  res.status(201).json({ success: true, data: item });
});

const update = asyncHandler(async (req, res) => {
  const parsed = timeLogUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { description, projectId, clientId, taskId, duration, rate, date, notes, billed } = parsed.data;

  if (projectId) {
    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) {
      return res.status(403).json({ success: false, message: 'Project not found or access denied' });
    }
  }

  const item = await TimeLog.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { description, project: projectId, client: clientId, task: taskId, duration, rate, date: date ? new Date(date) : undefined, notes, billed } },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: 'Time log not found' });
  }

  res.json({ success: true, data: item });
});

const remove = asyncHandler(async (req, res) => {
  const item = await TimeLog.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!item) {
    return res.status(404).json({ success: false, message: 'Time log not found' });
  }

  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getAll, create, update, remove };
