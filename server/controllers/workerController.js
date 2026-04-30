const User = require('../models/User')
const AuditLog = require('../models/AuditLog')

const createWorker = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name is required (min 2 characters)' })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' })
    }
    if (!password || password.length < 12) {
      return res.status(400).json({ success: false, message: 'Password must be at least 12 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' })
    }

    const worker = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: 'worker',
      managerId: req.user.id,
      isWorkerAccount: true,
      plan: 'free',
    })

    await AuditLog.log({
      userId: req.user.id,
      action: 'WORKER_CREATE',
      resource: 'Worker',
      resourceId: worker._id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.status(201).json({
      success: true,
      message: 'Worker created successfully',
      worker: { id: worker._id, name: worker.name, email: worker.email },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const getWorkers = async (req, res) => {
  try {
    const workers = await User.find({ managerId: req.user.id, isWorkerAccount: true })
      .select('name email role createdAt isWorkerAccount')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: workers })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const getWorker = async (req, res) => {
  try {
    const worker = await User.findOne({ _id: req.params.id, managerId: req.user.id, isWorkerAccount: true })
      .select('name email role createdAt isWorkerAccount')
      .lean()

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' })
    }

    res.json({ success: true, data: worker })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const deleteWorker = async (req, res) => {
  try {
    const worker = await User.findOneAndDelete({ _id: req.params.id, managerId: req.user.id, isWorkerAccount: true })

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' })
    }

    await AuditLog.log({
      userId: req.user.id,
      action: 'WORKER_DELETE',
      resource: 'Worker',
      resourceId: req.params.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.json({ success: true, message: 'Worker removed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

module.exports = { createWorker, getWorkers, getWorker, deleteWorker }
