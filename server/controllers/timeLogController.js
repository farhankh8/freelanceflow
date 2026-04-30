const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const timeLogCreateSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  task: z.string().min(1).max(500).optional(),
  project: z.string().min(1, 'Project is required'),
  client: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
  rate: z.number().min(0).optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(data => {
  if (!data.description && !data.task) {
    return { success: false, error: { message: 'Description or task is required' } }
  }
  return { success: true }
});

const timeLogUpdateSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  task: z.string().optional(),
  project: z.string().optional(),
  client: z.string().optional(),
  duration: z.number().min(1).max(1440).optional(),
  rate: z.number().min(0).optional(),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
  billed: z.boolean().optional(),
});

const getAll = asyncHandler(async (req, res) => {
  const items = await TimeLog.find({ user: req.user.id }).populate('project', 'title').sort({ createdAt: -1 }).lean();
  const normalized = items.map(item => ({
    ...item,
    _id: item._id.toString(),
    project: item.project ? item.project.title : '',
  }));
  res.json({ success: true, count: normalized.length, data: normalized });
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
  const { description, project: projectIdOrName, client: clientId, task: taskId, duration, rate, date, notes } = parsed.data;

  let project = await Project.findOne({ _id: projectIdOrName, user: req.user.id });
  if (!project) {
    project = await Project.findOne({ title: projectIdOrName, user: req.user.id });
  }
  if (!project) {
    return res.status(403).json({ success: false, message: 'Project not found or access denied' });
  }

  const item = await TimeLog.create({
    user: req.user.id,
    project: project._id,
    client: clientId || project.client,
    task: taskId || description || undefined,
    description: description || taskId || '',
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
  const { description, project: projectIdOrName, client: clientId, task: taskId, duration, rate, date, notes, billed } = parsed.data;

  let resolvedProject = undefined;
  let resolvedProjectId = undefined;
  if (projectIdOrName) {
    resolvedProject = await Project.findOne({ _id: projectIdOrName, user: req.user.id });
    if (!resolvedProject) {
      resolvedProject = await Project.findOne({ title: projectIdOrName, user: req.user.id });
    }
    if (!resolvedProject) {
      return res.status(403).json({ success: false, message: 'Project not found or access denied' });
    }
    resolvedProjectId = resolvedProject._id;
  }

  const item = await TimeLog.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: { description, task: taskId, project: resolvedProjectId, client: clientId, duration, rate, date: date ? new Date(date) : undefined, notes, billed } },
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
