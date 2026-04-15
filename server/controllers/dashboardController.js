const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');

// ============================================
// EXISTING FUNCTIONS (Kept for backward compatibility)
// ============================================

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalClients,
      activeProjects,
      totalProjects,
      pendingInvoices,
      totalTasks,
      doneTasks,
      paidInvoicesAgg,
      pendingAgg,
      recentInvoices,
      upcomingDeadlines,
    ] = await Promise.all([
      Client.countDocuments({ user: userId }),
      Project.countDocuments({ user: userId, status: 'active' }),
      Project.countDocuments({ user: userId }),
      Invoice.countDocuments({ user: userId, status: { $in: ['sent', 'overdue'] } }),
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'done' }),
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: { $in: ['sent', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.find({ user: userId })
        .populate('client', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('invoiceNumber total status client createdAt'),
      Project.find({
        user: userId,
        status: 'active',
        deadline: { $gte: new Date(), $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
      }).populate('client', 'name').select('title deadline client status').limit(5),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId.createFromHexString(userId),
          status: 'paid',
          paidAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const revenueByClient = await Invoice.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'paid' } },
      { $group: { _id: '$client', total: { $sum: '$total' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
      { $unwind: '$client' },
      { $project: { name: '$client.name', total: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalClients,
        activeProjects,
        totalProjects,
        pendingInvoices,
        totalTasks,
        doneTasks,
        totalRevenue: paidInvoicesAgg[0]?.total || 0,
        pendingAmount: pendingAgg[0]?.total || 0,
      },
      recentInvoices,
      upcomingDeadlines,
      monthlyRevenue,
      revenueByClient,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

// ============================================
// NEW ENHANCED FUNCTIONS (Enterprise Standard)
// ============================================

/**
 * Get single comprehensive dashboard summary (NEW)
 */
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'all' } = req.query;

    // Date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for performance
    const [
      // Counts
      clientsCount,
      projectsCount,
      invoicesCount,
      leadsCount,
      tasksCount,
      expensesTotal,
      // Aggregations
      totalRevenue,
      monthlyRevenue,
      quarterlyRevenue,
      outstandingAmount,
      // Project counts
      activeProjectsCount,
      completedProjectsCount,
    ] = await Promise.all([
      Client.countDocuments({ user: userId }),
      Project.countDocuments({ user: userId }),
      Invoice.countDocuments({ user: userId }),
      Lead.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId }),
      
      Expense.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Total paid revenue
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Monthly revenue
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'paid', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),

      // Quarterly revenue (last 3 months)
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'paid', 
          paidAt: { $gte: new Date(now.setMonth(now.getMonth() - 3)) } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),

      // Outstanding invoices
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: { $in: ['pending', 'sent', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),

      Project.countDocuments({ user: userId, status: 'active' }),
      Project.countDocuments({ user: userId, status: 'completed' }),
    ]);

    // Recent items
    const [recentInvoices, recentClients, recentProjects] = await Promise.all([
      Invoice.find({ user: userId }).populate('client', 'name').sort({ createdAt: -1 }).limit(5).lean(),
      Client.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Project.find({ user: userId }).populate('client', 'name').sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Calculate net profit
    const revenue = totalRevenue[0]?.total || 0;
    const expenses = expensesTotal[0]?.total || 0;
    const netProfit = revenue - expenses;

    // Build response
    const summary = {
      overview: {
        totalClients,
        totalProjects: projectsCount,
        totalInvoices: invoicesCount,
        totalLeads: leadsCount,
        totalTasks,
        totalRevenue: revenue,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        quarterlyRevenue: quarterlyRevenue[0]?.total || 0,
        outstandingAmount: outstandingAmount[0]?.total || 0,
        netProfit,
        totalExpenses: expenses,
      },
      projects: {
        active: activeProjectsCount,
        completed: completedProjectsCount,
        total: projectsCount,
      },
      invoices: {
        total: invoicesCount,
        outstanding: outstandingAmount[0]?.count || 0,
        pendingAmount: outstandingAmount[0]?.total || 0,
      },
      recent: {
        invoices: recentInvoices,
        clients: recentClients,
        projects: recentProjects,
      }
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved',
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DASHBOARD SUMMARY ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      timestamp: new Date().toISOString() 
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = { 
  // Legacy
  getStats,
  // NEW enhanced
  getDashboardSummary
};