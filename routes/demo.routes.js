const express = require("express");

const {
    getSummary,
    getMapData,
    loadPresentationData,
} = require("../controllers/demo.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/map-data", protect, getMapData);

// 🔥 Add this line for presentation dataset
router.post("/load-presentation-data", loadPresentationData);

module.exports = router;