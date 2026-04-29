const mongoose = require('mongoose')

const workerPaymentSchema = new mongoose.Schema({
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
}, { timestamps: true })

workerPaymentSchema.index({ worker: 1, status: 1 })
workerPaymentSchema.index({ manager: 1, date: -1 })

module.exports = mongoose.model('WorkerPayment', workerPaymentSchema)
