const Project = require('../models/Project');
const Client = require('../models/Client');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../middleware/asyncHandler');

const getProjects = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    clientId,
    search, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  const userId = req.user.id;
  const filter = { user: userId };
  
  if (status) filter.status = status;
  if (clientId) filter.client = clientId;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('client', 'name email company')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Project.countDocuments(filter)
  ]);

  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    hasNext: skip + projects.length < total,
    hasPrev: parseInt(page) > 1
  };

  res.status(200).json({
    success: true,
    message: 'Projects retrieved',
    data: projects,
    count: projects.length,
    pagination,
    timestamp: new Date().toISOString()
  });
});

const createProjectEnhanced = asyncHandler(async (req, res) => {
  const { title, description, clientId, status, budget, currency, deadline, hourlyRate } = req.body;

  if (!title || title.trim().length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Project title is required (min 2 characters)',
      timestamp: new Date().toISOString()
    });
  }

  if (!clientId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Client is required',
      timestamp: new Date().toISOString()
    });
  }

  const client = await Client.findOne({ _id: clientId, user: req.user.id });
  if (!client) {
    return res.status(404).json({ 
      success: false, 
      message: 'Client not found',
      timestamp: new Date().toISOString()
    });
  }

  const project = await Project.create({
    user: req.user.id,
    client: clientId,
    title: title.trim(),
    description: description?.trim() || '',
    status: status || 'active',
    budget: budget ? Number(budget) : 0,
    currency: currency || 'USD',
    deadline,
    hourlyRate: hourlyRate ? Number(hourlyRate) : (client.defaultHourlyRate || 0),
  });

  const populated = await project.populate('client', 'name email company');

  await AuditLog.log({
    userId: req.user.id,
    action: 'PROJECT_CREATE',
    resource: 'Project',
    resourceId: project._id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: populated,
    timestamp: new Date().toISOString()
  });
});

const updateProjectEnhanced = asyncHandler(async (req, res) => {
  const { title, description, status, budget, deadline, hourlyRate } = req.body;

  if (title && title.trim().length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Project title must be at least 2 characters',
      timestamp: new Date().toISOString()
    });
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description.trim();
  if (status !== undefined) updateData.status = status;
  if (budget !== undefined) updateData.budget = Number(budget);
  if (deadline !== undefined) updateData.deadline = deadline || undefined;
  if (hourlyRate !== undefined) updateData.hourlyRate = Number(hourlyRate);

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('client', 'name email company');

  if (!project) {
    return res.status(404).json({ 
      success: false, 
      message: 'Project not found',
      timestamp: new Date().toISOString()
    });
  }

  await AuditLog.log({
    userId: req.user.id,
    action: 'PROJECT_UPDATE',
    resource: 'Project',
    resourceId: project._id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: project,
    timestamp: new Date().toISOString()
  });
});

const deleteProjectEnhanced = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndDelete({ 
    _id: req.params.id, 
    user: req.user.id 
  });

  if (!project) {
    return res.status(404).json({ 
      success: false, 
      message: 'Project not found',
      timestamp: new Date().toISOString()
    });
  }

  await AuditLog.log({
    userId: req.user.id,
    action: 'PROJECT_DELETE',
    resource: 'Project',
    resourceId: req.params.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    timestamp: new Date().toISOString()
  });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user.id })
    .populate('client', 'name email company');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, message: 'Project retrieved', data: project });
});

module.exports = {
  getProjects,
  createProjectEnhanced,
  getProject,
  updateProjectEnhanced,
  deleteProjectEnhanced
};
