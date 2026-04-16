const Invoice = require('../models/Invoice')
const Client = require('../models/Client')
const Payment = require('../models/Payment')
const Expense = require('../models/Expense')
const Lead = require('../models/Lead')
const Project = require('../models/Project')

class AIService {
  parseNaturalLanguage(text, userId) {
    const lower = text.toLowerCase()
    const result = {
      action: null,
      entity: null,
      parameters: {}
    }
    
    if (lower.includes('create') && (lower.includes('invoice') || lower.includes('bill'))) {
      result.action = 'create_invoice'
      result.entity = 'invoice'
      result.parameters = this.extractInvoiceParams(text)
    } else if (lower.includes('how much') || lower.includes('revenue') || lower.includes('earned')) {
      result.action = 'query_revenue'
      result.entity = 'stats'
    } else if (lower.includes('outstanding') || lower.includes('pending') || lower.includes('due')) {
      result.action = 'query_outstanding'
      result.entity = 'stats'
    } else if (lower.includes('client') && lower.includes('add')) {
      result.action = 'create_client'
      result.entity = 'client'
      result.parameters = this.extractClientParams(text)
    } else if (lower.includes('project') && lower.includes('create')) {
      result.action = 'create_project'
      result.entity = 'project'
    } else if (lower.includes('expense') && lower.includes('add')) {
      result.action = 'create_expense'
      result.entity = 'expense'
      result.parameters = this.extractExpenseParams(text)
    } else if (lower.includes('remind') || lower.includes('follow')) {
      result.action = 'send_reminder'
      result.entity = 'notification'
    } else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('price')) {
      result.action = 'pricing_recommendation'
      result.entity = 'ai'
    } else if (lower.includes('predict') || lower.includes('late')) {
      result.action = 'payment_prediction'
      result.entity = 'ai'
    }
    
    return result
  }
  
  extractInvoiceParams(text) {
    const params = { items: [] }
    
    const amountMatch = text.match(/₹?\s*([\d,]+(?:\.\d{2})?)|([\d,]+(?:\.\d{2})?)\s*rupees?/i)
    if (amountMatch) {
      const amount = parseFloat((amountMatch[1] || amountMatch[2]).replace(/,/g, ''))
      params.items.push({
        description: 'Services rendered',
        amount,
        rate: amount,
        hours: 1
      })
    }
    
    const hoursMatch = text.match(/(\d+)\s*(?:hours?|hrs?)/i)
    if (hoursMatch) {
      params.hours = parseInt(hoursMatch[1])
    }
    
    const clientMatch = text.match(/(?:for|to|from)\s+([A-Za-z\s]+?)(?:\s+(?:for|of|₹|\d)|$)/i)
    if (clientMatch) {
      params.clientName = clientMatch[1].trim()
    }
    
    const taxMatch = text.match(/(\d+)\s*%/i)
    if (taxMatch) {
      params.taxRate = parseInt(taxMatch[1])
    }
    
    return params
  }
  
  extractClientParams(text) {
    const params = {}
    
    const nameMatch = text.match(/(?:add|new)\s+(?:client\s+)?([A-Za-z][A-Za-z\s]+?)(?:\s+(?:at|from|with)|$)/i)
    if (nameMatch) {
      params.name = nameMatch[1].trim()
    }
    
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/i)
    if (emailMatch) {
      params.email = emailMatch[0]
    }
    
    const phoneMatch = text.match(/(?:\+91[\s.-]?)?[\d\s]{10}/)
    if (phoneMatch) {
      params.phone = phoneMatch[0].replace(/\s/g, '')
    }
    
    const companyMatch = text.match(/from\s+([A-Za-z][A-Za-z0-9\s]+?)(?:\s+(?:at|for|$)|$)/i)
    if (companyMatch) {
      params.company = companyMatch[1].trim()
    }
    
    return params
  }
  
  extractExpenseParams(text) {
    const params = {}
    
    const amountMatch = text.match(/₹?\s*([\d,]+(?:\.\d{2})?)/i)
    if (amountMatch) {
      params.amount = parseFloat(amountMatch[1].replace(/,/g, ''))
    }
    
    const categoryKeywords = {
      'software': ['software', 'saas', 'subscription', 'tool'],
      'hardware': ['laptop', 'computer', 'mouse', 'keyboard', 'hardware'],
      'travel': ['travel', 'flight', 'taxi', 'uber', 'train', 'bus'],
      'food': ['food', 'lunch', 'dinner', 'meal', 'restaurant'],
      'marketing': ['marketing', 'ads', 'advertising', 'seo'],
      'office': ['office', 'rent', 'supplies', 'stationery'],
      'professional': ['professional', 'legal', 'accountant', 'consulting'],
      'communication': ['phone', 'internet', 'mobile', 'call'],
      'utilities': ['electricity', 'water', 'power', 'bill'],
      'other': []
    }
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(k => text.toLowerCase().includes(k))) {
        params.category = category
        break
      }
    }
    
    return params
  }
  
  async predictLatePayments(userId) {
    try {
      const invoices = await Invoice.find({
        user: userId,
        status: { $in: ['sent', 'overdue'] }
      }).populate('client', 'name totalBilled totalPaid')
      
      const predictions = invoices.map(invoice => {
        const client = invoice.client
        let riskScore = 50
        
        const daysOverdue = invoice.dueDate
          ? Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
          : 0
        
        if (daysOverdue > 0) riskScore += Math.min(daysOverdue * 5, 30)
        
        if (client) {
          const paymentHistory = client.totalPaid || 0
          const totalBilled = client.totalBilled || 0
          if (totalBilled > 0) {
            const paymentRate = paymentHistory / totalBilled
            if (paymentRate < 0.5) riskScore += 20
            else if (paymentRate > 0.8) riskScore -= 15
          }
        }
        
        const amountCategory = invoice.total > 50000 ? 'high' : invoice.total > 20000 ? 'medium' : 'low'
        if (amountCategory === 'high') riskScore += 10
        
        return {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client?.name || 'Unknown',
          amount: invoice.total,
          dueDate: invoice.dueDate,
          daysOverdue: Math.max(0, daysOverdue),
          riskScore: Math.min(100, Math.max(0, riskScore)),
          riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
          recommendation: riskScore > 70
            ? 'Send reminder immediately'
            : riskScore > 40
            ? 'Follow up within 2-3 days'
            : 'Monitor normally'
        }
      })
      
      return predictions.sort((a, b) => b.riskScore - a.riskScore)
    } catch (error) {
      console.error('predictLatePayments error:', error)
      return []
    }
  }
  
  async getPricingRecommendations(userId) {
    try {
      const clients = await Client.find({ user: userId })
      const projects = await Project.find({ user: userId, status: 'completed' }).populate('client')
      
      if (clients.length === 0 || projects.length === 0) {
        return {
          message: 'Add more projects and clients to get personalized pricing recommendations.',
          suggestions: [
            'Start tracking your time to understand your hourly value',
            'Research market rates for your skills',
            'Consider value-based pricing for larger projects'
          ]
        }
      }
      
      const completedProjects = projects.filter(p => p.totalEarned > 0)
      const totalEarnings = completedProjects.reduce((s, p) => s + p.totalEarned, 0)
      const avgProjectValue = totalEarnings / completedProjects.length
      const totalHours = completedProjects.reduce((s, p) => s + p.totalHoursLogged, 0)
      const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0
      
      const recommendations = []
      
      recommendations.push({
        type: 'hourly_rate',
        current: Math.round(avgHourlyRate),
        suggested: Math.round(avgHourlyRate * 1.15),
        reason: 'Based on your completed projects, consider a 15% rate increase'
      })
      
      if (avgProjectValue < 25000) {
        recommendations.push({
          type: 'project_size',
          message: 'Consider taking larger projects. Your average project value is lower than industry standard.',
          suggested: 'Target projects worth ₹50,000+'
        })
      }
      
      const highValueClients = clients.filter(c => c.defaultHourlyRate > avgHourlyRate)
      if (highValueClients.length > 0) {
        recommendations.push({
          type: 'premium_clients',
          message: `${highValueClients.length} client(s) pay above your average rate. Consider onboarding similar clients.`
        })
      }
      
      return {
        averageHourlyRate: Math.round(avgHourlyRate),
        totalProjects: completedProjects.length,
        totalEarnings,
        recommendations
      }
    } catch (error) {
      console.error('getPricingRecommendations error:', error)
      return { message: 'Error generating recommendations', suggestions: [] }
    }
  }
  
  async generateWeeklyInsights(userId) {
    try {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      
      const [thisWeekInvoices, lastWeekInvoices, thisWeekPayments, lastWeekPayments, overdueInvoices, leads] = await Promise.all([
        Invoice.find({ user: userId, createdAt: { $gte: oneWeekAgo } }),
        Invoice.find({ user: userId, createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } }),
        Payment.find({ user: userId, createdAt: { $gte: oneWeekAgo } }),
        Payment.find({ user: userId, createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } }),
        Invoice.find({ user: userId, status: 'overdue' }),
        Lead.find({ user: userId })
      ])
      
      const thisWeekRevenue = thisWeekPayments.reduce((s, p) => s + p.amount, 0)
      const lastWeekRevenue = lastWeekPayments.reduce((s, p) => s + p.amount, 0)
      const revenueChange = lastWeekRevenue > 0
        ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
        : 0
      
      const insights = []
      
      if (revenueChange > 0) {
        insights.push(`Revenue is up ${revenueChange}% compared to last week! 🚀`)
      } else if (revenueChange < 0) {
        insights.push(`Revenue is down ${Math.abs(revenueChange)}% compared to last week. Focus on follow-ups.`)
      }
      
      if (overdueInvoices.length > 0) {
        insights.push(`${overdueInvoices.length} invoice(s) are overdue. Total outstanding: ₹${overdueInvoices.reduce((s, i) => s + i.total, 0).toLocaleString()}`)
      }
      
      const hotLeads = leads.filter(l => l.stage === 'negotiation')
      if (hotLeads.length > 0) {
        insights.push(`${hotLeads.length} lead(s) in negotiation stage. Potential value: ₹${hotLeads.reduce((s, l) => s + l.value, 0).toLocaleString()}`)
      }
      
      if (thisWeekInvoices.length > 0 && thisWeekInvoices.length > lastWeekInvoices.length) {
        insights.push(`You created ${thisWeekInvoices.length} invoices this week, more than last week!`)
      }
      
      const pendingInvoices = await Invoice.find({ user: userId, status: 'sent' })
      if (pendingInvoices.length > 3) {
        insights.push(`${pendingInvoices.length} invoices are awaiting payment. Consider sending reminders.`)
      }
      
      return {
        weekRevenue: thisWeekRevenue,
        revenueChange,
        invoicesCreated: thisWeekInvoices.length,
        paymentsReceived: thisWeekPayments.length,
        overdueCount: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((s, i) => s + i.total, 0),
        insights
      }
    } catch (error) {
      console.error('generateWeeklyInsights error:', error)
      return {
        weekRevenue: 0,
        revenueChange: 0,
        invoicesCreated: 0,
        paymentsReceived: 0,
        overdueCount: 0,
        overdueAmount: 0,
        insights: ['Unable to generate insights at this time.']
      }
    }
  }
}

module.exports = new AIService()
