const express = require('express');
const router = express.Router();
const {
  createNGO,
  getAllNGOs,
  getNGOById,
  updateNGO,
  deleteNGO
} = require('../controllers/ngoController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('NGO', 'ADMIN'), createNGO);
router.get('/', getAllNGOs);
router.get('/:id', getNGOById);
router.put('/:id', protect, authorizeRoles('NGO', 'ADMIN'), updateNGO);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteNGO);

module.exports = router;
