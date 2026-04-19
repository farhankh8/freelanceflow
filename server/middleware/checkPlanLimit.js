const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');

const FREE_LIMITS = {
  clients: 5,
  invoices: 10,
  projects: 5,
  leads: 20,
  tasks: 20,
  contacts: 20,
  contracts: 5,
  expenses: 10
};

const checkPlanLimit = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // If Pro user and not expired, allow
  if (user.plan === 'pro' && user.planExpiry && user.planExpiry > new Date()) {
    return next();
  }

  // Get resource from route
  let resource = null;
  const path = req.path;
  
  if (path.startsWith('/clients') && req.method === 'POST') {
    resource = 'clients';
  } else if (path.startsWith('/invoices') && req.method === 'POST') {
    resource = 'invoices';
  } else if (path.startsWith('/projects') && req.method === 'POST') {
    resource = 'projects';
  } else if (path.startsWith('/leads') && req.method === 'POST') {
    resource = 'leads';
  } else if (path.startsWith('/tasks') && req.method === 'POST') {
    resource = 'tasks';
  } else if (path.startsWith('/contacts') && req.method === 'POST') {
    resource = 'contacts';
  } else if (path.startsWith('/contracts') && req.method === 'POST') {
    resource = 'contracts';
  } else if (path.startsWith('/expenses') && req.method === 'POST') {
    resource = 'expenses';
  }

  if (!resource) {
    return next();
  }

  let count = 0;
  switch (resource) {
    case 'clients':
      count = await Client.countDocuments({ user: req.user.id });
      break;
    case 'invoices':
      count = await Invoice.countDocuments({ user: req.user.id });
      break;
    case 'projects':
      count = await Project.countDocuments({ user: req.user.id });
      break;
    default:
      return next();
  }

  const limit = FREE_LIMITS[resource];
  const remaining = (limit || 0) - count;

  if (remaining <= 0) {
    return res.status(403).json({
      success: false,
      message: `Free limit reached for ${resource}. Upgrade to Pro to add more.`,
      upgradeRequired: true,
      resource: resource,
      currentPlan: 'free',
      limit: limit,
      proPrice: 999,
      proUrl: '/settings?tab=billing'
    });
  }

  res.set('X-Rate-Limit-Remaining', remaining);
  next();
});

module.exports = { checkPlanLimit, FREE_LIMITS };