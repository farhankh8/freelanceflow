const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPlanLimit } = require('../middleware/checkPlanLimit');
const {
  getInvoices, createInvoice, generateFromTimeLogs,
  updateInvoice, markPaid, deleteInvoice, downloadPDF
} = require('../controllers/invoiceController');

router.use(protect);
router.get('/', getInvoices);
router.post('/', checkPlanLimit, createInvoice);
router.post('/generate', generateFromTimeLogs);
router.get('/:id/pdf', downloadPDF);
router.put('/:id/pay', markPaid);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
