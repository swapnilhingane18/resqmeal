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
const { acceptFood, rejectFood, toggleLocationSharing } = require('../controllers/volunteerController');
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

// Volunteer tracking routes
router.post('/accept/:foodId', protect, authorizeRoles('NGO', 'ADMIN'), acceptFood);
router.post('/reject/:foodId', protect, authorizeRoles('NGO', 'ADMIN'), rejectFood);
router.patch('/location-sharing/:foodId', protect, authorizeRoles('NGO', 'ADMIN'), toggleLocationSharing);

module.exports = router;
