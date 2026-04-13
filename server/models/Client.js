const mongoose = require('mongoose')
const clientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  address: { type: String, trim: true },
  notes: { type: String },
  defaultHourlyRate: { type: Number, default: 0 },
  industry: { type: String, default: '' },
  website: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive', 'prospect'], default: 'active' },
  gstin: { type: String, default: '' },
  pan: { type: String, default: '' },
  totalBilled: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
}, { timestamps: true })

clientSchema.index({ user: 1, status: 1 })
clientSchema.index({ user: 1, name: 'text' })
clientSchema.index({ email: 1 })

module.exports = mongoose.model('Client', clientSchema)