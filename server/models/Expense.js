const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['software', 'hardware', 'travel', 'food', 'marketing', 'office', 'professional', 'communication', 'utilities', 'taxes', 'insurance', 'training', 'education', 'subscription', 'other'],
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

expenseSchema.pre('save', async function () {
  if (this.paymentMethod) {
    const METHOD_MAP = {
      'UPI': 'upi',
      'Credit Card': 'card',
      'Debit Card': 'card',
      'Net Banking': 'bank_transfer',
      'Bank Transfer': 'bank_transfer',
      'Cash': 'cash',
      'Cheque': 'check',
      'upi': 'upi',
      'bank_transfer': 'bank_transfer',
      'cash': 'cash',
      'card': 'card',
      'check': 'check',
      'other': 'other'
    }
    this.paymentMethod = METHOD_MAP[this.paymentMethod] || 'upi'
  }
  if (this.category) {
    const CATEGORY_MAP = {
      'Software & Tools': 'software',
      'Hardware': 'hardware',
      'Travel': 'travel',
      'Food & Dining': 'food',
      'Marketing': 'marketing',
      'Office & Supplies': 'office',
      'Professional': 'professional',
      'Communication': 'communication',
      'Utilities': 'utilities',
      'Taxes': 'taxes',
      'Insurance': 'insurance',
      'Training': 'training',
      'Education': 'education',
      'Subscriptions': 'subscription',
      'Other': 'other'
    }
    if (CATEGORY_MAP[this.category]) {
      this.category = CATEGORY_MAP[this.category]
    }
  }
})

module.exports = mongoose.model('Expense', expenseSchema)
