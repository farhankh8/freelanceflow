const Client = require('../models/Client');
const AuditLog = require('../models/AuditLog');

/**
 * Get all clients with pagination, filtering, and sorting
 */
const getClients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const userId = req.user.id;
    const filter = { user: userId };
    
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [clients, total] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Client.countDocuments(filter)
    ]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: skip + clients.length < total,
      hasPrev: parseInt(page) > 1
    };

    // Backward compatible response
    res.status(200).json({
      success: true,
      message: 'Clients retrieved',
      data: clients,
      clients, // backward compat
      count: clients.length, // backward compat
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
 * Create a new client
 */
const createClient = async (req, res) => {
  try {
    const { 
      name, email, phone, company, address, notes, industry, 
      hourlyRate, website, status, gstin, pan 
    } = req.body;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client name is required (min 2 characters)',
        timestamp: new Date().toISOString()
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format',
        timestamp: new Date().toISOString()
      });
    }

    const client = await Client.create({ 
      user: req.user.id, 
      name: name.trim(),
      email: email?.toLowerCase().trim() || '',
      phone: phone?.trim() || '',
      company: company?.trim() || '',
      address: address?.trim() || '',
      notes: notes?.trim() || '',
      industry: industry?.trim() || '',
      website: website?.trim() || '',
      defaultHourlyRate: hourlyRate ? Number(hourlyRate) : 0,
      status: status || 'active',
      gstin: gstin?.trim() || '',
      pan: pan?.trim() || ''
    });

    // Log audit
    await AuditLog.log({
      userId: req.user.id,
      action: 'CLIENT_CREATE',
      resource: 'Client',
      resourceId: client._id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Backward compatible response
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
      client, // backward compat
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Client with this email already exists',
        timestamp: new Date().toISOString()
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      timestamp: new Date().toISOString() 
    });
  }
};

/**
 * Get single client by ID
 */
const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).lean();

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client retrieved',
      data: client,
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
 * Update client
 */
const updateClient = async (req, res) => {
  try {
    const { 
      name, email, phone, company, address, notes, industry, 
      hourlyRate, website, status, gstin, pan 
    } = req.body;

    if (name && name.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client name must be at least 2 characters',
        timestamp: new Date().toISOString()
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (company !== undefined) updateData.company = company.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (notes !== undefined) updateData.notes = notes.trim();
    if (industry !== undefined) updateData.industry = industry.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (hourlyRate !== undefined) updateData.defaultHourlyRate = Number(hourlyRate);
    if (status) updateData.status = status;
    if (gstin !== undefined) updateData.gstin = gstin.trim();
    if (pan !== undefined) updateData.pan = pan.trim();

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found',
        timestamp: new Date().toISOString()
      });
    }

    // Log audit
    await AuditLog.log({
      userId: req.user.id,
      action: 'CLIENT_UPDATE',
      resource: 'Client',
      resourceId: client._id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Backward compatible response
    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client,
      client, // backward compat
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
 * Delete client
 */
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found',
        timestamp: new Date().toISOString()
      });
    }

    // Log audit
    await AuditLog.log({
      userId: req.user.id,
      action: 'CLIENT_DELETE',
      resource: 'Client',
      resourceId: req.params.id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Client deleted successfully',
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

module.exports = { 
  getClients, 
  createClient, 
  getClient, 
  updateClient, 
  deleteClient 
};