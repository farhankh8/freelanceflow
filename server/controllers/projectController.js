const Project = require('../models/Project');
const Client = require('../models/Client');

const getProjects = async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const filter = { user: req.user.id };
    if (clientId) filter.client = clientId;
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .populate('client', 'name email company')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { title, description, clientId, status, budget, currency, deadline, hourlyRate } = req.body;
    if (!title || !clientId) return res.status(400).json({ error: 'Title and client are required' });

    const client = await Client.findOne({ _id: clientId, user: req.user.id });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const project = await Project.create({
      user: req.user.id,
      client: clientId,
      title,
      description,
      status: status || 'active',
      budget: budget || 0,
      currency: currency || 'USD',
      deadline,
      hourlyRate: hourlyRate || client.defaultHourlyRate || 0,
    });

    const populated = await project.populate('client', 'name email company');
    res.status(201).json({ success: true, project: populated });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id })
      .populate('client', 'name email company');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('client', 'name email company');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };
