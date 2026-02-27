const express = require('express');
const router = express.Router();
const {
  createFood,
  getAllFood,
  getFoodById,
  updateFoodStatus,
  deleteFood
} = require('../controllers/foodController');
const { updateVolunteerLocation, getTracking } = require('../controllers/volunteerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('DONOR'), createFood);
router.get('/', getAllFood);
router.get('/:id', getFoodById);
router.get('/:id/tracking', getTracking);
router.patch('/volunteer/location/:foodId', protect, updateVolunteerLocation);
router.put('/:id', protect, authorizeRoles('DONOR', 'ADMIN'), updateFoodStatus);
router.delete('/:id', protect, authorizeRoles('DONOR', 'ADMIN'), deleteFood);

module.exports = router;
