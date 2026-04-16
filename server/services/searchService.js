const Client = require('../models/Client')
const Project = require('../models/Project')
const Invoice = require('../models/Invoice')
const Lead = require('../models/Lead')
const Task = require('../models/Task')
const Payment = require('../models/Payment')
const Expense = require('../models/Expense')
const Contact = require('../models/Contact')
const Proposal = require('../models/Proposal')

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

class SearchService {
  async globalSearch(userId, query, options = {}) {
    const { limit = 20, type } = options
    
    if (!query || query.length < 2) {
      return { results: [], total: 0 }
    }
    
    const searchQuery = { user: userId }
    const safeQuery = escapeRegex(query)
    const regex = new RegExp(safeQuery, 'i')
    const results = []
    
    const collectionSearch = async (Model, searchFields, resultType, transform) => {
      if (type && type !== resultType) return []
      
      const items = await Model.find({
        ...searchQuery,
        $or: searchFields.map(field => ({ [field]: regex }))
      }).limit(limit).lean()
      
      return items.map(item => transform ? transform(item) : { ...item, type: resultType })
    }
    
    const clientResults = await collectionSearch(Client, ['name', 'email', 'company'], 'client', c => ({
      _id: c._id,
      type: 'client',
      title: c.name,
      subtitle: c.company || c.email || 'Client',
      status: c.status,
      icon: '👥'
    }))
    
    const projectResults = await collectionSearch(Project, ['title', 'description'], 'project', p => ({
      _id: p._id,
      type: 'project',
      title: p.title,
      subtitle: p.client?.name || 'Project',
      status: p.status,
      icon: '🚀'
    }))
    
    const invoiceResults = await collectionSearch(Invoice, ['invoiceNumber', 'notes'], 'invoice', i => ({
      _id: i._id,
      type: 'invoice',
      title: i.invoiceNumber,
      subtitle: `${i.client?.name || 'Client'} • ₹${i.total?.toLocaleString()}`,
      status: i.status,
      icon: '🧾',
      amount: i.total
    }))
    
    const leadResults = await collectionSearch(Lead, ['name', 'company', 'email'], 'lead', l => ({
      _id: l._id,
      type: 'lead',
      title: l.name,
      subtitle: `${l.company || 'Lead'} • ₹${l.value?.toLocaleString() || 0}`,
      status: l.stage,
      icon: '🎯',
      value: l.value
    }))
    
    const taskResults = await collectionSearch(Task, ['title', 'description'], 'task', t => ({
      _id: t._id,
      type: 'task',
      title: t.title,
      subtitle: t.project?.title || 'Task',
      status: t.status,
      icon: '✅',
      priority: t.priority
    }))
    
    const paymentResults = await collectionSearch(Payment, ['notes', 'transactionId'], 'payment', p => ({
      _id: p._id,
      type: 'payment',
      title: `₹${p.amount?.toLocaleString()}`,
      subtitle: `${p.client?.name || 'Payment'} • ${new Date(p.date).toLocaleDateString('en-IN')}`,
      status: p.status,
      icon: '💳',
      amount: p.amount
    }))
    
    const expenseResults = await collectionSearch(Expense, ['description', 'category'], 'expense', e => ({
      _id: e._id,
      type: 'expense',
      title: e.description,
      subtitle: `${e.category || 'Expense'} • ₹${e.amount?.toLocaleString()}`,
      icon: '💸',
      amount: e.amount
    }))
    
    const contactResults = await collectionSearch(Contact, ['name', 'email', 'phone'], 'contact', c => ({
      _id: c._id,
      type: 'contact',
      title: c.name,
      subtitle: c.company || c.email || 'Contact',
      icon: '📇'
    }))
    
    const proposalResults = await collectionSearch(Proposal, ['title', 'description'], 'proposal', p => ({
      _id: p._id,
      type: 'proposal',
      title: p.title,
      subtitle: `${p.client?.name || 'Proposal'} • ₹${p.value?.toLocaleString() || 0}`,
      status: p.status,
      icon: '📝',
      value: p.value
    }))
    
    results.push(
      ...clientResults,
      ...projectResults,
      ...invoiceResults,
      ...leadResults,
      ...taskResults,
      ...paymentResults,
      ...expenseResults,
      ...contactResults,
      ...proposalResults
    )
    
    return {
      results: results.slice(0, limit),
      total: results.length,
      breakdown: {
        clients: clientResults.length,
        projects: projectResults.length,
        invoices: invoiceResults.length,
        leads: leadResults.length,
        tasks: taskResults.length,
        payments: paymentResults.length,
        expenses: expenseResults.length,
        contacts: contactResults.length,
        proposals: proposalResults.length
      }
    }
  }
}

module.exports = new SearchService()
