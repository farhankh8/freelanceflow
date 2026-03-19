const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');

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
      // Sum of all paid invoice amounts
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Sum of sent/overdue invoices
      Invoice.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), status: { $in: ['sent', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Last 5 invoices
      Invoice.find({ user: userId })
        .populate('client', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('invoiceNumber total status client createdAt'),
      // Projects with deadlines in next 14 days
      Project.find({
        user: userId,
        status: 'active',
        deadline: { $gte: new Date(), $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
      }).populate('client', 'name').select('title deadline client status').limit(5),
    ]);

    // Monthly revenue (last 6 months) for chart
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

    // Revenue by client (top 5)
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

module.exports = { getStats };
