const Invoice = require('../models/Invoice')
const Client = require('../models/Client')
const Project = require('../models/Project')
const TimeLog = require('../models/TimeLog')

class InvoiceService {
  async getAll(userId, options = {}) {
    const { status, clientId, page = 1, limit = 50 } = options
    const filter = { user: userId }
    
    if (status) filter.status = status
    if (clientId) filter.client = clientId
    
    const skip = (page - 1) * limit
    
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('client', 'name email company phone gstin')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(filter)
    ])
    
    return { invoices, total, page, pages: Math.ceil(total / limit) }
  }

  async generateFromTimeLogs(userId, clientId, projectId, timeLogIds, options = {}) {
    const { taxRate = 18, dueDate, notes } = options
    
    const timeLogs = await TimeLog.find({
      _id: { $in: timeLogIds },
      user: userId,
      billed: false
    }).populate('project', 'title')
    
    if (timeLogs.length === 0) {
      throw new Error('No valid time logs found')
    }
    
    const client = await Client.findOne({ _id: clientId, user: userId })
    if (!client) throw new Error('Client not found')
    
    const items = timeLogs.map(tl => ({
      description: `${tl.project?.title || 'Project'} - ${tl.description || 'Work'}`,
      hours: tl.duration / 60,
      rate: tl.rate,
      amount: parseFloat(((tl.duration / 60) * tl.rate).toFixed(2))
    }))
    
    const invoice = await Invoice.create({
      user: userId,
      client: clientId,
      project: projectId,
      items,
      taxRate,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      timeLogs: timeLogIds,
      isGstInvoice: false,
      currency: 'INR'
    })
    
    await TimeLog.updateMany(
      { _id: { $in: timeLogIds } },
      { billed: true, invoiceId: invoice._id }
    )
    
    return invoice.populate([
      { path: 'client', select: 'name email company phone' },
      { path: 'project', select: 'title' }
    ])
  }

  async getStats(userId) {
    const [invoices, payments] = await Promise.all([
      Invoice.find({ user: userId }),
      require('../models/Payment').find({ user: userId, status: 'completed' })
    ])
    
    const stats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalRevenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
      totalPending: invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.total, 0),
      totalOverdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
      totalPayments: payments.reduce((s, p) => s + p.amount, 0)
    }
    
    return stats
  }

  async checkOverdueInvoices() {
    const now = new Date()
    const overdueInvoices = await Invoice.find({
      status: 'sent',
      dueDate: { $lt: now }
    })
    
    for (const invoice of overdueInvoices) {
      invoice.status = 'overdue'
      await invoice.save()
    }
    
    return overdueInvoices.length
  }
}

module.exports = new InvoiceService()
