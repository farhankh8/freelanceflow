const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ['software', 'hardware', 'travel', 'food', 'marketing', 'office', 'professional', 'communication', 'utilities', 'taxes', 'insurance', 'training', 'other'],
    default: 'other' 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  date: { type: Date, default: Date.now },
  paymentMethod: { 
    type: String, 
    enum: ['upi', 'bank_transfer', 'cash', 'card', 'check', 'other'],
    default: 'upi' 
  },
  notes: String,
  hasReceipt: { type: Boolean, default: false },
  receiptUrl: { type: String },
  isTaxDeductible: { type: Boolean, default: true },
  gstAmount: { type: Number, default: 0 },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }
}, { timestamps: true })

expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1 })
expenseSchema.index({ client: 1 })

module.exports = mongoose.model('Expense', expenseSchema)
