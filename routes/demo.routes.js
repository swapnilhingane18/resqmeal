const express = require("express");

const {
    getSummary,
    getMapData,
    loadPresentationData,
} = require("../controllers/demo.controller");

const router = express.Router();

router.get("/summary", getSummary);
router.get("/map-data", getMapData);

// 🔥 Add this line for presentation dataset
router.post("/load-presentation-data", loadPresentationData);

module.exports = router;