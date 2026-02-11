const express = require("express");
const router = express.Router();
const { validateFood } = require("../middleware/validation");
const {
  createFood,
  getAllFood,
  getFoodById,
  updateFoodStatus,
  deleteFood
} = require("../controllers/foodController");

// POST /api/food
router.post("/", validateFood, createFood);

// GET /api/food
router.get("/", getAllFood);

// GET /api/food/:id
router.get("/:id", getFoodById);

// PATCH /api/food/:id/status
router.patch("/:id/status", updateFoodStatus);

// DELETE /api/food/:id
router.delete("/:id", deleteFood);

module.exports = router;
