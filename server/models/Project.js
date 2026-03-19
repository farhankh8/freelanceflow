const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'active'
  },
  budget: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  deadline: { type: Date },
  hourlyRate: { type: Number, default: 0 },
  totalHoursLogged: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
}, { timestamps: true })

projectSchema.index({ user: 1, status: 1 })
projectSchema.index({ client: 1 })
projectSchema.index({ deadline: 1 })

module.exports = mongoose.model('Project', projectSchema)
