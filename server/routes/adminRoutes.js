const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Client = require('../models/Client')
const Project = require('../models/Project')
const Invoice = require('../models/Invoice')
const Lead = require('../models/Lead')
const Contact = require('../models/Contact')
const Expense = require('../models/Expense')
const Task = require('../models/Task')
const TimeLog = require('../models/TimeLog')
const Proposal = require('../models/Proposal')
const Contract = require('../models/Contract')
const Order = require('../models/Order')

router.delete('/all-users', async (req, res) => {
  try {
    await User.deleteMany({})
    await Client.deleteMany({})
    await Project.deleteMany({})
    await Invoice.deleteMany({})
    await Lead.deleteMany({})
    await Contact.deleteMany({})
    await Expense.deleteMany({})
    await Task.deleteMany({})
    await TimeLog.deleteMany({})
    await Proposal.deleteMany({})
    await Contract.deleteMany({})
    await Order.deleteMany({})
    
    res.json({ success: true, message: 'All data deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router