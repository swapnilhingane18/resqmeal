const express = require('express');
const router = express.Router();
const {
  assignFood,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  markPickedUp,
  markDelivered
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Manual assignment trigger - ADMIN only
router.post('/assign', protect, authorizeRoles('ADMIN'), assignFood);

router.get('/', protect, getAllAssignments);
router.get('/:id', protect, getAssignmentById);
router.put('/:id', protect, authorizeRoles('NGO', 'ADMIN'), updateAssignmentStatus);

// Trust Layer Endpoints
router.post('/:id/mark-picked', protect, authorizeRoles('NGO', 'ADMIN'), markPickedUp);
router.post('/:id/mark-delivered', protect, authorizeRoles('NGO', 'ADMIN'), markDelivered);

module.exports = router;
