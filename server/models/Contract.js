const mongoose = require('mongoose')

const contractSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  proposal: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
  status: { type: String, enum: ['draft', 'sent', 'signed', 'active', 'completed', 'cancelled'], default: 'draft' },
  value: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  terms: String,
  services: [String],
  paymentTerms: String,
  signedAt: Date,
}, { timestamps: true })

contractSchema.index({ user: 1, status: 1 })

module.exports = mongoose.model('Contract', contractSchema)