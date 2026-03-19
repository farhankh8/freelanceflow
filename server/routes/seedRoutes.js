const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { loadSampleData, clearSampleData } = require('../controllers/seedController');

router.use(protect);
router.post('/load', loadSampleData);
router.delete('/clear', clearSampleData);

module.exports = router;
