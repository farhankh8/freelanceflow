const Task = require('../models/Task');
const Project = require('../models/Project');

const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority } = req.query;
    const filter = { user: req.user.id };
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('project', 'title status')
      .populate('client', 'name')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, status, priority, dueDate, estimatedHours } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and project are required' });

    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const task = await Task.create({
      user: req.user.id,
      project: projectId,
      client: project.client,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      estimatedHours: estimatedHours || 0,
    });

    const populated = await task.populate([
      { path: 'project', select: 'title status' },
      { path: 'client', select: 'name' }
    ]);
    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id })
      .populate('project', 'title status')
      .populate('client', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'title status').populate('client', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };
