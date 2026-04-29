const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { startSession, stopSession, getMySessions } = require('../controllers/workSessionController')

router.use(protect)

router.post('/start', startSession)
router.post('/:id/stop', stopSession)
router.get('/my', getMySessions)

module.exports = router
