const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { blockWorker } = require('../middleware/roleAuth')
const { getAll, create, update, remove } = require('../controllers/proposalController')

router.use(protect)
router.use(blockWorker)
router.get('/', getAll)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)

module.exports = router
