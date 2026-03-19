const mongoose = require('mongoose')

const timeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  description: { type: String, default: '' },
  duration: { type: Number, required: true },
  rate: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  billed: { type: Boolean, default: false },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  notes: { type: String },
}, { timestamps: true })

timeLogSchema.index({ user: 1, date: -1 })
timeLogSchema.index({ project: 1 })
timeLogSchema.index({ billed: 1 })

module.exports = mongoose.model('TimeLog', timeLogSchema)
