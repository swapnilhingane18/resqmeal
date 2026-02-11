const express = require("express");
const router = express.Router();
const {
  assignFood,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus
} = require("../controllers/assignmentController");

// POST /api/assignments (create assignment)
router.post("/", assignFood);

// GET /api/assignments (list all)
router.get("/", getAllAssignments);

// GET /api/assignments/:id
router.get("/:id", getAssignmentById);

// PATCH /api/assignments/:id/status
router.patch("/:id/status", updateAssignmentStatus);

module.exports = router;
