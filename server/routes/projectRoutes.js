const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPlanLimit } = require('../middleware/checkPlanLimit');
const {
  getProjects,
  getProject,
  createProjectEnhanced,
  updateProjectEnhanced,
  deleteProjectEnhanced
} = require('../controllers/projectController');

router.use(protect);

router.get('/', getProjects);
router.post('/', checkPlanLimit, createProjectEnhanced);
router.get('/:id', getProject);
router.put('/:id', updateProjectEnhanced);
router.delete('/:id', deleteProjectEnhanced);

module.exports = router;
