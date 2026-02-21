const Food = require("../models/Food");
const Assignment = require("../models/Assignment");
const { findAndAssignBestNGO } = require("./assignmentController");
const { calculateUrgency } = require("../services/urgency.service");
const { checkAndTriggerAutoAssignment } = require("../services/emergencyTrigger.service");
const { sendError } = require("../utils/errorResponse");

// Helper to inject dynamic urgency data
const withUrgency = (foodDoc) => {
  if (!foodDoc) return null;
  const food = foodDoc.toObject ? foodDoc.toObject() : foodDoc;
  const { urgencyScore, urgencyLevel, hoursRemaining } = calculateUrgency(food);
  return {
    ...food,
    urgencyScore,
    urgencyLevel,
    hoursRemaining
  };
};

// Create food listing and auto-assign to best NGO
const createFood = async (req, res, next) => {
  try {
    console.log("Incoming food payload:", req.body);
    const { type, quantity, unit, description, lat, lng, expiresAt, foodExpiresAt, donor, notes } =
      req.body;

    const food = new Food({
      type,
      quantity,
      unit,
      description,
      lat,
      lng,
      expiresAt,
      foodExpiresAt,
      donor: {
        ...donor,
        user: req.user.id
      },
      notes
    });

    await food.save();

    // ---------------------------------------------------------
    // EMERGENCY RESCUE ENGINE TRIGGER
    // ---------------------------------------------------------
    const emergencyResult = await checkAndTriggerAutoAssignment(food);

    // If auto-assigned by emergency trigger, return that result
    if (emergencyResult.autoTriggered && emergencyResult.success) {
      const updatedFood = await Food.findById(food._id).populate("assignedNgo", "name lat lng contact");
      return res.status(201).json({
        message: "⚡ EMERGENCY RESCUE ACTIVATED: Food auto-assigned!",
        food: withUrgency(updatedFood),
        assignment: emergencyResult.assignment,
        score: emergencyResult.urgencyScore,
        autoTriggered: true
      });
    }

    // Normal Flow (Low urgency or no NGO found yet)
    // We still try to find an assignment if specific logic demands, 
    // or just return the created food.
    // The original code called `findAndAssignBestNGO` here directly.
    let assignment = null;
    let score = null;
    let assignmentMsg = "Food listing created (waiting for assignment)";

    // Try standard assignment if available
    if (food.status === 'available') {
      const result = await findAndAssignBestNGO(food);
      if (result.assignment) {
        assignment = result.assignment;
        score = result.score;
        assignmentMsg = "Food listing created and assigned";
      }
    }

    const finalFood = await Food.findById(food._id).populate("assignedNgo", "name lat lng contact");

    res.status(201).json({
      message: assignmentMsg,
      food: withUrgency(finalFood),
      assignment,
      score,
      autoTriggered: false
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Food Validation Error:", error.errors);
      return res.status(400).json({
        success: false,
        message: error.message,
        details: Object.values(error.errors).map((e) => e.message)
      });
    }
    console.error("Food Create Error:", error);
    next(error);
  }
};

// Get all food listings
const getAllFood = async (req, res, next) => {
  try {
    const { status = "available" } = req.query;
    const query = status ? { status } : {};

    const foods = await Food.find(query)
      .populate("assignedNgo", "name lat lng")
      .sort({ createdAt: -1 });

    // Inject Urgency & Sort by Urgency Descending
    const foodsWithUrgency = foods.map(withUrgency).sort((a, b) => b.urgencyScore - a.urgencyScore);

    res.status(200).json({ count: foodsWithUrgency.length, foods: foodsWithUrgency });
  } catch (error) {
    next(error);
  }
};

// Get food by ID
const getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const food = await Food.findById(id).populate("assignedNgo");

    if (!food) {
      return sendError(res, 404, "Food listing not found", "NOT_FOUND");
    }

    res.status(200).json({ food: withUrgency(food) });
  } catch (error) {
    next(error);
  }
};

// Update food status
const updateFoodStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["available", "assigned", "delivered", "expired"].includes(status)) {
      return sendError(res, 400, "Invalid status", "VALIDATION_ERROR");
    }

    const existingFood = await Food.findById(id);
    if (!existingFood) {
      return sendError(res, 404, "Food listing not found", "NOT_FOUND");
    }

    const ownerId = existingFood.createdBy
      ? existingFood.createdBy.toString()
      : existingFood.donor?.user
        ? existingFood.donor.user.toString()
        : null;
    const isOwner = ownerId && ownerId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not authorized to modify this food listing", "FORBIDDEN");
    }

    const food = await Food.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

    if (!food) {
      return sendError(res, 404, "Food listing not found", "NOT_FOUND");
    }

    res.status(200).json({ message: "Food status updated", food: withUrgency(food) });
  } catch (error) {
    next(error);
  }
};

// Delete food listing
const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingFood = await Food.findById(id);
    if (!existingFood) {
      return sendError(res, 404, "Food listing not found", "NOT_FOUND");
    }

    const ownerId = existingFood.createdBy
      ? existingFood.createdBy.toString()
      : existingFood.donor?.user
        ? existingFood.donor.user.toString()
        : null;
    const isOwner = ownerId && ownerId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not authorized to delete this food listing", "FORBIDDEN");
    }

    const food = await Food.findByIdAndDelete(id);

    if (!food) {
      return sendError(res, 404, "Food listing not found", "NOT_FOUND");
    }

    res.status(200).json({ message: "Food listing deleted", food: withUrgency(food) });
  } catch (error) {
    next(error);
  }
};

// Get the authenticated donor's own food listings, with assigned NGO details
const getMyDonations = async (req, res, next) => {
  try {
    // Only return food donated by this user
    const foods = await Food.find({ "donor.user": req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const foodIds = foods.map((f) => f._id);

    // Fetch active/pending assignments for these foods, populating only safe NGO fields
    const assignments = await Assignment.find({
      food: { $in: foodIds },
      status: { $in: ["pending", "accepted"] },
    })
      .populate({
        path: "ngo",
        select: "name contact", // deliberately exclude email, capacity, internal metrics
      })
      .select("food ngo status currentLocation")
      .lean();

    // Build a lookup map: foodId -> assignment
    const assignmentByFood = {};
    assignments.forEach((a) => {
      assignmentByFood[a.food.toString()] = a;
    });

    // Attach NGO panel data to each food
    const enriched = foods.map((food) => {
      const assignment = assignmentByFood[food._id.toString()];
      const urgency = calculateUrgency(food);
      const result = { ...food, ...urgency };
      if (assignment) {
        result.assignedNGO = {
          name: assignment.ngo?.name || null,
          contact: assignment.ngo?.contact || null,
          currentLocation: assignment.currentLocation || null,
          assignmentStatus: assignment.status,
        };
      }
      return result;
    });

    return res.status(200).json({ count: enriched.length, foods: enriched });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFood,
  getAllFood,
  getFoodById,
  updateFoodStatus,
  deleteFood,
  getMyDonations,
};
