const mongoose = require('mongoose')

const leadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  company: String,
  email: String,
  phone: String,
  value: { type: Number, default: 0 },
  stage: { type: String, enum: ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'], default: 'new' },
  source: { type: String, default: 'Website' },
  notes: String,
  lastContactedAt: Date,
  nextFollowUp: Date,
}, { timestamps: true })

leadSchema.index({ user: 1, stage: 1 })
leadSchema.index({ user: 1, value: -1 })
leadSchema.index({ nextFollowUp: 1 })

module.exports = mongoose.model('Lead', leadSchema)
