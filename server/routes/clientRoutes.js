const express = require('express');
const router = express.Router();
const { getClients, createClient, getClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const { checkPlanLimit } = require('../middleware/checkPlanLimit');

router.use(protect);

router.get('/', getClients);
router.post('/', checkPlanLimit, createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;