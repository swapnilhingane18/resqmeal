const express = require('express');
const router = express.Router();
const {
  createFood,
  getAllFood,
  getFoodById,
  updateFoodStatus,
  deleteFood,
  getMyDonations,
} = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('DONOR'), createFood);
router.get('/me', protect, authorizeRoles('DONOR'), getMyDonations);
router.get('/', getAllFood);
router.get('/:id', getFoodById);
router.put('/:id', protect, authorizeRoles('DONOR', 'ADMIN'), updateFoodStatus);
router.delete('/:id', protect, authorizeRoles('DONOR', 'ADMIN'), deleteFood);

module.exports = router;
