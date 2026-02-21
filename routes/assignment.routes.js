const express = require('express');
const router = express.Router();
const {
  assignFood,
  getAllAssignments,
  getMyAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  updateAssignmentLocation,
  forceExpireAndRouteToEnergy
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Manual assignment trigger - ADMIN only
router.post('/assign', protect, authorizeRoles('ADMIN'), assignFood);
router.post('/force-expire/:foodId', protect, authorizeRoles('ADMIN'), forceExpireAndRouteToEnergy);

router.get('/me', protect, authorizeRoles('NGO'), getMyAssignments);
router.get('/', protect, getAllAssignments);
router.get('/:id', protect, getAssignmentById);
router.put('/:id/location', protect, authorizeRoles('NGO'), updateAssignmentLocation);
router.put('/:id', protect, authorizeRoles('NGO', 'ADMIN'), updateAssignmentStatus);

module.exports = router;
