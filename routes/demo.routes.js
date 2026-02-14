const express = require("express");

const { getSummary, getMapData } = require("../controllers/demo.controller");

const router = express.Router();

router.get("/summary", getSummary);
router.get("/map-data", getMapData);

module.exports = router;
