const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { blockWorker } = require('../middleware/roleAuth');
const {
  getTasks, createTask, getTask, updateTask, deleteTask
} = require('../controllers/taskController');

router.use(protect);
router.get('/', getTasks);
router.post('/', blockWorker, createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', blockWorker, deleteTask);

module.exports = router;
