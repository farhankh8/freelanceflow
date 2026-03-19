const mongoose = require('mongoose')

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hours: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
}, { _id: false })

const invoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  invoiceNumber: { type: String },
  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  dueDate: { type: Date },
  notes: { type: String },
  paidAt: { type: Date },
  paidAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['upi', 'bank', 'cash', 'card', 'other'], default: 'upi' },
  upiTransactionId: { type: String },
  timeLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeLog' }],
  gstin: { type: String, default: '' },
  clientGstin: { type: String, default: '' },
  placeOfSupply: { type: String, default: '' },
  isGstInvoice: { type: Boolean, default: false },
  sentAt: { type: Date },
  reminderSentAt: { type: Date },
}, { timestamps: true })

invoiceSchema.index({ user: 1, status: 1 })
invoiceSchema.index({ user: 1, createdAt: -1 })
invoiceSchema.index({ client: 1 })
invoiceSchema.index({ invoiceNumber: 1 })
invoiceSchema.index({ dueDate: 1 })
invoiceSchema.index({ status: 1, dueDate: 1 })

invoiceSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear()
    this.invoiceNumber = 'FF-' + year + '-' + Date.now()
  }
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0)
  if (this.isGstInvoice) {
    const halfRate = this.taxRate / 2
    this.cgstAmount = parseFloat((this.subtotal * halfRate / 100).toFixed(2))
    this.sgstAmount = parseFloat((this.subtotal * halfRate / 100).toFixed(2))
    this.igstAmount = 0
  } else {
    this.taxAmount = parseFloat((this.subtotal * (this.taxRate / 100)).toFixed(2))
    this.cgstAmount = 0
    this.sgstAmount = 0
    this.igstAmount = 0
  }
  this.total = parseFloat((this.subtotal + this.taxAmount + this.cgstAmount + this.sgstAmount + this.igstAmount).toFixed(2))
  next()
})

module.exports = mongoose.model('Invoice', invoiceSchema)
