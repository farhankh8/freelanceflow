const Invoice = require('../models/Invoice')
const Payment = require('../models/Payment')
const Client = require('../models/Client')

class AutomationService {
  async checkOverdueInvoices() {
    try {
      const now = new Date()
      const overdueInvoices = await Invoice.find({
        status: 'sent',
        dueDate: { $lt: now }
      }).populate('client', 'email name company')
      
      let updated = 0
      for (const invoice of overdueInvoices) {
        try {
          invoice.status = 'overdue'
          await invoice.save()
          updated++
        } catch (err) {
          console.error(`Failed to update invoice ${invoice._id}:`, err.message)
        }
      }
      
      return updated
    } catch (error) {
      console.error('Error checking overdue invoices:', error)
      return 0
    }
  }

  async sendPaymentReminders() {
    try {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      
      const upcomingInvoices = await Invoice.find({
        status: 'sent',
        dueDate: {
          $gte: new Date(),
          $lte: threeDaysFromNow
        },
        reminderSentAt: null
      }).populate('client', 'email name company')
      
      let sent = 0
      for (const invoice of upcomingInvoices) {
        try {
          invoice.reminderSentAt = new Date()
          await invoice.save()
          sent++
        } catch (emailError) {
          console.error(`Failed to send reminder for invoice ${invoice.invoiceNumber}`)
        }
      }
      
      return sent
    } catch (error) {
      console.error('Error sending payment reminders:', error)
      return 0
    }
  }

  async generateRecurringInvoices() {
    try {
      const User = require('../models/User')
      const users = await User.find({ plan: 'pro' })
      
      let generated = 0
      for (const user of users) {
        try {
          const recurringInvoices = await Invoice.find({
            user: user._id,
            status: 'paid',
            isRecurring: true,
            nextRecurringDate: { $lte: new Date() }
          })
          
          for (const template of recurringInvoices) {
            try {
              await Invoice.create({
                user: user._id,
                client: template.client,
                project: template.project,
                items: template.items,
                taxRate: template.taxRate,
                notes: template.notes,
                status: 'draft',
                isRecurring: true,
                recurringPeriod: template.recurringPeriod,
                nextRecurringDate: this.calculateNextDate(template.recurringPeriod)
              })
              generated++
            } catch (createError) {
              console.error(`Failed to create recurring invoice for user ${user._id}:`, createError.message)
            }
          }
        } catch (userError) {
          console.error(`Failed to process recurring invoices for user ${user._id}:`, userError.message)
        }
      }
      
      return generated
    } catch (error) {
      console.error('Error generating recurring invoices:', error)
      return 0
    }
  }

  calculateNextDate(period) {
    const next = new Date()
    switch (period) {
      case 'weekly': next.setDate(next.getDate() + 7); break
      case 'monthly': next.setMonth(next.getMonth() + 1); break
      case 'quarterly': next.setMonth(next.getMonth() + 3); break
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break
      default: next.setMonth(next.getMonth() + 1)
    }
    return next
  }

  async getWeeklyInsights(userId) {
    try {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const [recentInvoices, recentPayments, overdueCount] = await Promise.all([
        Invoice.find({ user: userId, createdAt: { $gte: oneWeekAgo } }),
        Payment.find({ user: userId, createdAt: { $gte: oneWeekAgo } }),
        Invoice.countDocuments({ user: userId, status: 'overdue' })
      ])
      
      const totalBilled = recentInvoices.reduce((s, i) => s + i.total, 0)
      const totalCollected = recentPayments.reduce((s, p) => s + p.amount, 0)
      const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0
      
      return {
        weekRevenue: totalCollected,
        weekBilled: totalBilled,
        weekInvoices: recentInvoices.length,
        weekPayments: recentPayments.length,
        overdueInvoices: overdueCount,
        collectionRate,
        insights: this.generateInsights(totalCollected, overdueCount, collectionRate)
      }
    } catch (error) {
      console.error('Error getting weekly insights:', error)
      return {
        weekRevenue: 0,
        weekBilled: 0,
        weekInvoices: 0,
        weekPayments: 0,
        overdueInvoices: 0,
        collectionRate: 0,
        insights: ['Unable to generate insights at this time.']
      }
    }
  }

  generateInsights(revenue, overdue, rate) {
    const insights = []
    
    if (revenue > 0) {
      insights.push(`You earned ₹${revenue.toLocaleString()} this week!`)
    }
    
    if (overdue > 0) {
      insights.push(`${overdue} invoice(s) are overdue. Consider sending reminders.`)
    }
    
    if (rate > 80) {
      insights.push(`Great collection rate of ${rate}%!`)
    } else if (rate < 50) {
      insights.push(`Collection rate at ${rate}%. Focus on payment follow-ups.`)
    }
    
    return insights
  }
}

module.exports = new AutomationService()
