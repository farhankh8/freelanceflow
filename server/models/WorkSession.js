const mongoose = require('mongoose')

const workSessionSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  description: { type: String, default: '' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

workSessionSchema.index({ worker: 1, isActive: 1 })
workSessionSchema.index({ worker: 1, startTime: -1 })
workSessionSchema.index({ task: 1 })

module.exports = mongoose.model('WorkSession', workSessionSchema)
