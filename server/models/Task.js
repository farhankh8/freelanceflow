const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labels: [{ type: String }],
}, { timestamps: true })

taskSchema.index({ user: 1, status: 1 })
taskSchema.index({ project: 1 })
taskSchema.index({ dueDate: 1 })
taskSchema.index({ priority: 1 })

module.exports = mongoose.model('Task', taskSchema)
