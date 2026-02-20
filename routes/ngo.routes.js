const express = require('express');
const router = express.Router();
const {
  createNGO,
  getAllNGOs,
  getNGOById,
  updateNGO,
  deleteNGO,
  getMe,
  updateNGOStatus
} = require('../controllers/ngoController');
const { getMyAssignments } = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('NGO', 'ADMIN'), createNGO);
router.get('/', getAllNGOs);

// Must be before /:id to prevent routes being treated as an id param
router.get('/me', protect, authorizeRoles('NGO', 'ADMIN'), getMe);
router.patch('/status', protect, authorizeRoles('NGO', 'ADMIN'), updateNGOStatus);
router.get('/assignments', protect, authorizeRoles('NGO', 'ADMIN'), getMyAssignments);

router.get('/:id', getNGOById);
router.put('/:id', protect, authorizeRoles('NGO', 'ADMIN'), updateNGO);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteNGO);

module.exports = router;
