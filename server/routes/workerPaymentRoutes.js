const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { createPayment, getPayments, updatePayment, deletePayment } = require('../controllers/workerPaymentController')

router.use(protect)

router.post('/', createPayment)
router.get('/', getPayments)
router.put('/:id', updatePayment)
router.delete('/:id', deletePayment)

module.exports = router
