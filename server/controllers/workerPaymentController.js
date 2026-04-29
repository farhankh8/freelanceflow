const WorkerPayment = require('../models/WorkerPayment')
const User = require('../models/User')

const createPayment = async (req, res) => {
  try {
    const { workerId, amount, notes } = req.body

    if (!workerId || !amount) {
      return res.status(400).json({ success: false, message: 'Worker ID and amount are required' })
    }

    const worker = await User.findOne({ _id: workerId, managerId: req.user.id, isWorkerAccount: true })
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' })
    }

    const payment = await WorkerPayment.create({
      manager: req.user.id,
      worker: workerId,
      amount: Number(amount),
      notes: notes || '',
    })

    res.status(201).json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const getPayments = async (req, res) => {
  try {
    const filter = req.user.role === 'manager'
      ? { manager: req.user.id }
      : { worker: req.user.id }

    const payments = await WorkerPayment.find(filter)
      .populate(req.user.role === 'manager' ? 'worker' : null, 'name email')
      .sort({ date: -1 })
      .lean()

    res.json({ success: true, data: payments })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const updatePayment = async (req, res) => {
  try {
    const payment = await WorkerPayment.findOne({ _id: req.params.id, manager: req.user.id })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    if (req.body.status) payment.status = req.body.status
    if (req.body.amount !== undefined) payment.amount = Number(req.body.amount)
    if (req.body.notes !== undefined) payment.notes = req.body.notes

    await payment.save()

    res.json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

const deletePayment = async (req, res) => {
  try {
    const payment = await WorkerPayment.findOneAndDelete({ _id: req.params.id, manager: req.user.id })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    res.json({ success: true, message: 'Payment deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
}

module.exports = { createPayment, getPayments, updatePayment, deletePayment }
