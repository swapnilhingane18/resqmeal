const express = require("express");

const { getSummary } = require("../controllers/demo.controller");

const router = express.Router();

router.get("/summary", getSummary);

module.exports = router;
