const Food = require("../models/Food");
const NGO = require("../models/NGO");
const Assignment = require("../models/Assignment");
const { calculateScore } = require("../services/priorityEngine");

// Helper function to find best NGO and create assignment
const findAndAssignBestNGO = async (food) => {
  // 1. Find potential NGOs
  const ngos = await NGO.find({ status: "active", capacity: { $gt: 0 } });
  if (ngos.length === 0) {
    return { assignment: null, score: null };
  }

  // 2. Get active assignment counts for load balancing
  const activeAssignments = await Assignment.aggregate([
    {
      $match: {
        status: { $in: ["pending", "accepted", "assigned"] },
        ngo: { $in: ngos.map(n => n._id) }
      }
    },
    {
      $group: {
        _id: "$ngo",
        count: { $sum: 1 }
      }
    }
  ]);

  // Create integer map for O(1) lookup
  const assignmentCounts = {};
  activeAssignments.forEach(item => {
    assignmentCounts[item._id.toString()] = item.count;
  });

  // 3. Score all NGOs
  let bestNgo = null;
  let bestScore = -1;
  let bestScoreDetails = null;

  ngos.forEach(ngo => {
    const currentActiveCount = assignmentCounts[ngo._id.toString()] || 0;
    const scoreResult = calculateScore(food, ngo, currentActiveCount);

    // Greedy approach: simply take the highest score
    if (scoreResult.totalScore > bestScore) {
      bestScore = scoreResult.totalScore;
      bestNgo = ngo;
      bestScoreDetails = scoreResult;
    }
  });

  if (!bestNgo) {
    return { assignment: null, score: null };
  }

  // 4. Create assignment record with full breakdown
  const assignment = new Assignment({
    food: food._id,
    ngo: bestNgo._id,

    // New fields
    totalScore: bestScoreDetails.totalScore,
    distanceScore: bestScoreDetails.distanceScore,
    urgencyScore: bestScoreDetails.urgencyScore,
    capacityScore: bestScoreDetails.capacityScore,
    loadBalanceScore: bestScoreDetails.loadBalanceScore,

    // Legacy/Required fields
    score: bestScoreDetails.totalScore, // Map totalScore to legacy score
    distance: bestScoreDetails.distance,
    timeUrgency: bestScoreDetails.timeUrgency,
    responseScore: bestScoreDetails.responseScore
  });

  await assignment.save();
  await NGO.findByIdAndUpdate(bestNgo._id, { $inc: { capacity: -1 } });

  // Update food status
  food.status = "assigned";
  food.assignedNgo = bestNgo._id;
  await food.save();

  return {
    assignment: await assignment.populate("food ngo"),
    score: bestScore
  };
};

// Assign food to best NGO
const assignFood = async (req, res, next) => {
  try {
    const { foodId } = req.body;

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }

    if (food.status !== "available") {
      return res.status(400).json({ error: "Food is not available for assignment" });
    }

    const { assignment, score } = await findAndAssignBestNGO(food);

    if (!assignment) {
      return res.status(200).json({
        message: "No active NGO found for assignment",
        assignment: null,
        score: null
      });
    }

    res.status(200).json({
      message: "Food assigned successfully",
      assignment,
      score
    });
  } catch (error) {
    next(error);
  }
};

// Get all assignments
const getAllAssignments = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = status ? { status } : {};

    // Role-based filtering
    if (req.user.role === 'NGO') {
      const ngo = await NGO.findOne({ user: req.user.id });
      if (!ngo) {
        return res.status(404).json({ error: "NGO profile not found for this user" });
      }
      query.ngo = ngo._id;
    } else if (req.user.role === 'DONOR') {
      // Find foods created by this donor
      // Use distinct to get food IDs, then filter assignments by those food IDs
      const foods = await Food.find({ "donor.user": req.user.id }).select('_id');
      const foodIds = foods.map(f => f._id);
      query.food = { $in: foodIds };
    }
    // ADMIN sees all (no additional filter)

    const assignments = await Assignment.find(query)
      .populate("food", "type quantity expiresAt status description") // Added description
      .populate("ngo", "name lat lng contact")
      .sort({ assignedAt: -1 });

    res.status(200).json({ count: assignments.length, assignments });
  } catch (error) {
    next(error);
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).populate("food ngo");

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.status(200).json({ assignment });
  } catch (error) {
    next(error);
  }
};

// Update assignment status
const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const existing = await Assignment.findById(id).populate("food ngo");
    if (!existing) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const prevStatus = existing.status;
    let foodUpdate = null;
    let ngoIncPromise = null;

    if (status === "rejected" && prevStatus !== "rejected") {
      ngoIncPromise = NGO.findByIdAndUpdate(existing.ngo._id, { $inc: { capacity: 1 } });
      foodUpdate = { status: "available", assignedNgo: null };
    } else if (status === "completed") {
      foodUpdate = { status: "delivered" };
    }

    const updated = await Assignment.findByIdAndUpdate(
      id,
      {
        status,
        completedAt: status === "completed" ? new Date() : null
      },
      { new: true, runValidators: true }
    ).populate("food ngo");

    const ops = [];
    if (ngoIncPromise) ops.push(ngoIncPromise);
    if (foodUpdate) ops.push(Food.findByIdAndUpdate(existing.food._id, foodUpdate));
    if (ops.length) await Promise.all(ops);

    res.status(200).json({ message: "Assignment updated", assignment: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignFood,
  getAllAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  findAndAssignBestNGO
};
