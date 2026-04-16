const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects,
  getProject,
  createProjectEnhanced,
  updateProjectEnhanced,
  deleteProjectEnhanced
} = require('../controllers/projectController');

router.use(protect);

router.get('/', getProjects);
router.post('/', createProjectEnhanced);
router.get('/:id', getProject);
router.put('/:id', updateProjectEnhanced);
router.delete('/:id', deleteProjectEnhanced);

module.exports = router;
