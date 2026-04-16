const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../middleware/asyncHandler');

const loadSampleData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const existing = await Client.countDocuments({ user: userId });
  if (existing > 0) {
    return res.status(400).json({ error: 'Sample data already loaded. Clear your data first.' });
  }

  const clients = await Client.insertMany([
    { user: userId, name: 'Acme Corp', email: 'contact@acme.com', company: 'Acme Corporation', phone: '+1-555-0101', defaultHourlyRate: 85 },
    { user: userId, name: 'TechNova Ltd', email: 'hello@technova.io', company: 'TechNova Limited', phone: '+1-555-0102', defaultHourlyRate: 120 },
    { user: userId, name: 'GreenWave Agency', email: 'projects@greenwave.co', company: 'GreenWave Agency', phone: '+1-555-0103', defaultHourlyRate: 75 },
  ]);

  const projects = await Project.insertMany([
    { user: userId, client: clients[0]._id, title: 'E-Commerce Platform', description: 'Full-stack online store with payment integration', status: 'active', budget: 15000, currency: 'USD', deadline: new Date(Date.now() + 30 * 86400000), hourlyRate: 85 },
    { user: userId, client: clients[0]._id, title: 'Mobile App MVP', description: 'iOS and Android app for customer portal', status: 'planning', budget: 8000, currency: 'USD', deadline: new Date(Date.now() + 60 * 86400000), hourlyRate: 85 },
    { user: userId, client: clients[1]._id, title: 'Cloud Migration', description: 'Migrate legacy system to AWS microservices', status: 'active', budget: 25000, currency: 'USD', deadline: new Date(Date.now() + 45 * 86400000), hourlyRate: 120 },
    { user: userId, client: clients[2]._id, title: 'Brand Redesign Website', description: 'Full brand identity and website redesign', status: 'completed', budget: 5000, currency: 'USD', hourlyRate: 75 },
    { user: userId, client: clients[1]._id, title: 'API Integration Suite', description: 'Third-party API integrations and documentation', status: 'active', budget: 6000, currency: 'USD', deadline: new Date(Date.now() + 20 * 86400000), hourlyRate: 120 },
  ]);

  const tasks = await Task.insertMany([
    { user: userId, project: projects[0]._id, client: clients[0]._id, title: 'Design product catalog UI', status: 'done', priority: 'high', estimatedHours: 8 },
    { user: userId, project: projects[0]._id, client: clients[0]._id, title: 'Integrate Stripe payments', status: 'in_progress', priority: 'high', dueDate: new Date(Date.now() + 7 * 86400000), estimatedHours: 12 },
    { user: userId, project: projects[0]._id, client: clients[0]._id, title: 'Setup order management', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 14 * 86400000), estimatedHours: 10 },
    { user: userId, project: projects[2]._id, client: clients[1]._id, title: 'Audit existing infrastructure', status: 'done', priority: 'high', estimatedHours: 16 },
    { user: userId, project: projects[2]._id, client: clients[1]._id, title: 'Setup Docker containers', status: 'in_progress', priority: 'high', dueDate: new Date(Date.now() + 10 * 86400000), estimatedHours: 20 },
    { user: userId, project: projects[2]._id, client: clients[1]._id, title: 'Configure CI/CD pipeline', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 20 * 86400000), estimatedHours: 8 },
    { user: userId, project: projects[4]._id, client: clients[1]._id, title: 'Document OAuth flow', status: 'done', priority: 'medium', estimatedHours: 4 },
    { user: userId, project: projects[4]._id, client: clients[1]._id, title: 'Build webhook handlers', status: 'in_progress', priority: 'high', dueDate: new Date(Date.now() + 5 * 86400000), estimatedHours: 6 },
    { user: userId, project: projects[3]._id, client: clients[2]._id, title: 'Deliver final design files', status: 'done', priority: 'low', estimatedHours: 3 },
    { user: userId, project: projects[1]._id, client: clients[0]._id, title: 'Create wireframes', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 15 * 86400000), estimatedHours: 6 },
  ]);

  const daysAgo = (n) => new Date(Date.now() - n * 86400000);
  const timeLogs = await TimeLog.insertMany([
    { user: userId, project: projects[0]._id, task: tasks[0]._id, description: 'Design product catalog UI', startTime: daysAgo(14), endTime: daysAgo(14), duration: 480, hourlyRate: 85, amount: 680, billed: true, type: 'manual' },
    { user: userId, project: projects[0]._id, task: tasks[1]._id, description: 'Stripe payment integration - phase 1', startTime: daysAgo(7), endTime: daysAgo(7), duration: 300, hourlyRate: 85, amount: 425, billed: false, type: 'manual' },
    { user: userId, project: projects[2]._id, task: tasks[3]._id, description: 'Infrastructure audit and reporting', startTime: daysAgo(21), endTime: daysAgo(21), duration: 960, hourlyRate: 120, amount: 1920, billed: true, type: 'manual' },
    { user: userId, project: projects[2]._id, task: tasks[4]._id, description: 'Docker setup and configuration', startTime: daysAgo(10), endTime: daysAgo(10), duration: 240, hourlyRate: 120, amount: 480, billed: false, type: 'manual' },
    { user: userId, project: projects[4]._id, task: tasks[6]._id, description: 'OAuth documentation', startTime: daysAgo(5), endTime: daysAgo(5), duration: 240, hourlyRate: 120, amount: 480, billed: false, type: 'manual' },
    { user: userId, project: projects[3]._id, description: 'Brand strategy session', startTime: daysAgo(30), endTime: daysAgo(30), duration: 120, hourlyRate: 75, amount: 150, billed: true, type: 'manual' },
    { user: userId, project: projects[3]._id, description: 'Logo design iterations', startTime: daysAgo(28), endTime: daysAgo(28), duration: 360, hourlyRate: 75, amount: 450, billed: true, type: 'manual' },
    { user: userId, project: projects[3]._id, description: 'Website development', startTime: daysAgo(20), endTime: daysAgo(20), duration: 480, hourlyRate: 75, amount: 600, billed: true, type: 'manual' },
  ]);

  const invoices = await Invoice.insertMany([
    {
      user: userId,
      client: clients[0]._id,
      project: projects[0]._id,
      invoiceNumber: 'FF-2024-001',
      items: [{ description: 'E-Commerce Platform — UI Design', hours: 8, rate: 85, amount: 680 }],
      subtotal: 680, taxRate: 10, taxAmount: 68, total: 748,
      status: 'paid', paidAt: daysAgo(7), dueDate: daysAgo(3),
      timeLogs: [timeLogs[0]._id],
    },
    {
      user: userId,
      client: clients[1]._id,
      project: projects[2]._id,
      invoiceNumber: 'FF-2024-002',
      items: [{ description: 'Cloud Migration — Infrastructure Audit', hours: 16, rate: 120, amount: 1920 }],
      subtotal: 1920, taxRate: 0, taxAmount: 0, total: 1920,
      status: 'paid', paidAt: daysAgo(10), dueDate: daysAgo(5),
      timeLogs: [timeLogs[2]._id],
    },
    {
      user: userId,
      client: clients[2]._id,
      project: projects[3]._id,
      invoiceNumber: 'FF-2024-003',
      items: [
        { description: 'Brand Strategy', hours: 2, rate: 75, amount: 150 },
        { description: 'Logo Design', hours: 6, rate: 75, amount: 450 },
        { description: 'Website Development', hours: 8, rate: 75, amount: 600 },
      ],
      subtotal: 1200, taxRate: 5, taxAmount: 60, total: 1260,
      status: 'sent', dueDate: new Date(Date.now() + 14 * 86400000),
      timeLogs: [timeLogs[5]._id, timeLogs[6]._id, timeLogs[7]._id],
    },
  ]);

  res.json({
    success: true,
    message: 'Sample data loaded successfully! 🎉',
    summary: {
      clients: clients.length,
      projects: projects.length,
      tasks: tasks.length,
      timeLogs: timeLogs.length,
      invoices: invoices.length,
    }
  });
});

const clearSampleData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await Promise.all([
    Client.deleteMany({ user: userId }),
    Project.deleteMany({ user: userId }),
    Task.deleteMany({ user: userId }),
    TimeLog.deleteMany({ user: userId }),
    Invoice.deleteMany({ user: userId }),
  ]);

  res.json({ success: true, message: 'All data cleared.' });
});

module.exports = { loadSampleData, clearSampleData };
