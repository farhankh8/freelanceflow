const WorkSession = require('../models/WorkSession')
const Task = require('../models/Task')

const startSession = async (req, res) => {
  try {
    const { taskId, description } = req.body

    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, message: 'Only workers can start sessions' })
    }

    const existingActive = await WorkSession.findOne({ worker: req.user.id, isActive: true })
    if (existingActive) {
      return res.status(400).json({ success: false, message: 'Stop current session first' })
    }

    if (taskId) {
      const task = await Task.findOne({ _id: taskId, user: req.user.managerId })
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' })
      }
    }

    const session = await WorkSession.create({
      worker: req.user.id,
      manager: req.user.managerId,
      task: taskId || null,
      description: description || '',
      startTime: new Date(),
      isActive: true,
    })

    res.status(201).json({ success: true, data: session })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const stopSession = async (req, res) => {
  try {
    const session = await WorkSession.findOne({ _id: req.params.id, worker: req.user.id, isActive: true })

    if (!session) {
      return res.status(404).json({ success: false, message: 'Active session not found' })
    }

    const endTime = new Date()
    const duration = Math.round((endTime - session.startTime) / 1000)

    session.endTime = endTime
    session.duration = duration
    session.isActive = false
    await session.save()

    res.json({ success: true, data: session })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const getMySessions = async (req, res) => {
  try {
    const filter = req.user.role === 'manager'
      ? { manager: req.user.id }
      : { worker: req.user.id }

    const sessions = await WorkSession.find(filter)
      .populate('task', 'title')
      .sort({ startTime: -1 })
      .lean()

    res.json({ success: true, data: sessions })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

module.exports = { startSession, stopSession, getMySessions }
