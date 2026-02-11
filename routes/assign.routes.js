const express = require("express");
const router = express.Router();

const ngos = require("../data/ngos");
const { calculateScore } = require("../services/priorityEngine");

// POST /api/assign
router.post("/assign", (req, res) => {
  const food = req.body.food;

  let bestNgo = null;
  let bestScore = -1;

  ngos.forEach(ngo => {
    const score = calculateScore(food, ngo);
    if (score > bestScore) {
      bestScore = score;
      bestNgo = ngo;
    }
  });

  res.json({
    assignedNgo: bestNgo,
    score: Number(bestScore.toFixed(3))
  });
});

module.exports = router;
