const Food = require("../models/Food");
const NGO = require("../models/NGO");
const Assignment = require("../models/Assignment");
const { calculateScore } = require("../services/priorityEngine");

// Helper function to find best NGO and create assignment
const findAndAssignBestNGO = async (food) => {
  const ngos = await NGO.find({ active: true, capacity: { $gt: 0 } });
  if (ngos.length === 0) {
    throw new Error("No active NGOs available");
  }

  let bestNgo = null;
  let bestScore = -1;
  let scoreDetails = null;

  ngos.forEach(ngo => {
    const scoreResult = calculateScore(food, ngo);
    if (scoreResult.totalScore > bestScore) {
      bestScore = scoreResult.totalScore;
      bestNgo = ngo;
      scoreDetails = scoreResult;
    }
  });

  // Create assignment record
  const assignment = new Assignment({
    food: food._id,
    ngo: bestNgo._id,
    score: bestScore,
    distance: scoreDetails.distance,
    timeUrgency: scoreDetails.timeUrgency,
    responseScore: scoreDetails.responseScore
  });

  await assignment.save();
  await NGO.findByIdAndUpdate(bestNgo._id, { $inc: { capacity: -1 } });

  // Update food status
  food.status = "assigned";
  food.assignedNgo = bestNgo._id;
  await food.save();

  return {
    assignment: await assignment.populate("food ngo"),
    score: Number(bestScore.toFixed(3))
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
    const query = status ? { status } : {};

    const assignments = await Assignment.find(query)
      .populate("food", "type quantity expiresAt status")
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
