const express = require("express");
const router = express.Router();
const { validateNGO } = require("../middleware/validation");
const {
  createNGO,
  getAllNGOs,
  getNGOById,
  updateNGO,
  deleteNGO
} = require("../controllers/ngoController");

// POST /api/ngos
router.post("/", validateNGO, createNGO);

// GET /api/ngos
router.get("/", getAllNGOs);

// GET /api/ngos/:id
router.get("/:id", getNGOById);

// PUT /api/ngos/:id
router.put("/:id", validateNGO, updateNGO);

// DELETE /api/ngos/:id
router.delete("/:id", deleteNGO);

module.exports = router;
