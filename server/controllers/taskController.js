const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');
const { z } = require('zod');

const taskCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  assignedTo: z.string().optional(),
});

const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
});

const getTasks = asyncHandler(async (req, res) => {
  const { projectId, status, priority } = req.query;
  const filter = { user: req.user.id };

  if (projectId) filter.project = projectId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  if (req.user.role === 'worker') {
    filter.assignedTo = req.user.id;
  }

  const tasks = await Task.find(filter)
    .populate('project', 'title status')
    .populate('client', 'name')
    .populate('assignedTo', 'name email')
    .sort({ dueDate: 1, createdAt: -1 });

  res.json({ success: true, count: tasks.length, data: tasks });
});

const createTask = asyncHandler(async (req, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const { title, description, projectId, status, priority, dueDate, estimatedHours, assignedTo } = parsed.data;

  let project = null;
  if (projectId) {
    project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) {
      return res.status(403).json({ success: false, message: 'Project not found or access denied' });
    }
  }

  const task = await Task.create({
    user: req.user.id,
    project: projectId || null,
    client: project?.client || null,
    title,
    description: description || '',
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate: dueDate || undefined,
    estimatedHours: estimatedHours || 0,
    assignedTo: assignedTo || null,
  });

  const populated = await task.populate([
    { path: 'project', select: 'title status' },
    { path: 'client', select: 'name' },
    { path: 'assignedTo', select: 'name email' }
  ]);

  res.status(201).json({ success: true, message: 'Task created', data: populated });
});

const getTask = async (req, res) => {
  try {
    let task;
    if (req.user.role === 'worker') {
      task = await Task.findOne({ _id: req.params.id, assignedTo: req.user.id })
        .populate('project', 'title status')
        .populate('client', 'name')
        .populate('assignedTo', 'name email');
    } else {
      task = await Task.findOne({ _id: req.params.id, user: req.user.id })
        .populate('project', 'title status')
        .populate('client', 'name')
        .populate('assignedTo', 'name email');
    }
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    if (req.user.role === 'worker') {
      const allowedFields = ['status', 'description'];
      const workerUpdates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) workerUpdates[field] = req.body[field];
      }
      if (Object.keys(workerUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, assignedTo: req.user.id },
        workerUpdates,
        { new: true, runValidators: true }
      ).populate('project', 'title status').populate('client', 'name').populate('assignedTo', 'name email');
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ success: true, task });
    } else {
      const parsed = taskUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }

      const { title, description, status, priority, dueDate, estimatedHours, actualHours, order } = parsed.data;

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { $set: { title, description, status, priority, dueDate, estimatedHours, actualHours, order } },
        { new: true, runValidators: true }
      ).populate('project', 'title status').populate('client', 'name').populate('assignedTo', 'name email');

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      res.json({ success: true, message: 'Task updated', data: task });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, message: 'Task deleted' });
});

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };
