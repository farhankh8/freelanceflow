const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { allowManagerOnly } = require('../middleware/roleAuth')
const { createWorker, getWorkers, getWorker, deleteWorker } = require('../controllers/workerController')
const User = require('../models/User')

router.use(protect)
router.use(allowManagerOnly)

router.post('/', createWorker)
router.get('/', getWorkers)
router.get('/:id', getWorker)
router.delete('/:id', deleteWorker)

router.get('/assignable', async (req, res) => {
  try {
    const workers = await User.find({ managerId: req.user.id, isWorkerAccount: true })
      .select('_id name email')
      .sort({ name: 1 })
      .lean()
    res.json({ success: true, data: workers })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

module.exports = router
