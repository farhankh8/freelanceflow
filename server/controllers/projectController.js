const Project = require('../models/Project');
const Client = require('../models/Client');
const AuditLog = require('../models/AuditLog');

// ============================================
// EXISTING FUNCTIONS (Kept for backward compatibility)
// ============================================

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

// ============================================
// NEW ENHANCED FUNCTIONS (Enterprise Standard)
// ============================================

/**
 * Get all projects with pagination, filtering, and sorting (NEW)
 */
const getProjectsEnhanced = async (req, res) => {
  try {
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

    // Backward compatible response
    res.status(200).json({
      success: true,
      message: 'Projects retrieved',
      data: projects,
      projects, // backward compat
      count: projects.length, // backward compat
      pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      timestamp: new Date().toISOString() 
    });
  }
};

/**
 * Create a new project with validation (NEW)
 */
const createProjectEnhanced = async (req, res) => {
  try {
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

    // Log audit
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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      timestamp: new Date().toISOString() 
    });
  }
};

/**
 * Update project with audit (NEW)
 */
const updateProjectEnhanced = async (req, res) => {
  try {
    const { title, description, status, budget, deadline, hourlyRate } = req.body;

    if (title && title.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Project title must be at least 2 characters',
        timestamp: new Date().toISOString()
      });
    }

    const updateData = { ...req.body };
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (budget !== undefined) updateData.budget = Number(budget);
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

    // Log audit
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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      timestamp: new Date().toISOString() 
    });
  }
};

/**
 * Delete project with audit (NEW)
 */
const deleteProjectEnhanced = async (req, res) => {
  try {
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

    // Log audit
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
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      timestamp: new Date().toISOString() 
    });
  }
};

// ============================================
// EXPORTS - NEW enhanced versions
// ============================================

module.exports = { 
  // Legacy (backward compatible)
  getProjects, 
  createProject, 
  getProject, 
  updateProject, 
  deleteProject,
  // NEW enhanced versions
  getProjectsEnhanced,
  createProjectEnhanced,
  updateProjectEnhanced,
  deleteProjectEnhanced
};