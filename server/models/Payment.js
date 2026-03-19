const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoiceNumber: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { 
    type: String, 
    enum: ['upi', 'bank_transfer', 'cash', 'card', 'check', 'other'],
    default: 'upi' 
  },
  status: { 
    type: String, 
    enum: ['completed', 'pending', 'failed', 'refunded'],
    default: 'completed' 
  },
  date: { type: Date, default: Date.now },
  transactionId: String,
  utr: String,
  notes: String,
  tdsDeducted: { type: Number, default: 0 },
  tdsCertificate: { type: String, default: '' }
}, { timestamps: true })

paymentSchema.index({ user: 1, date: -1 })
paymentSchema.index({ user: 1, status: 1 })
paymentSchema.index({ client: 1 })
paymentSchema.index({ invoiceId: 1 })

module.exports = mongoose.model('Payment', paymentSchema)
