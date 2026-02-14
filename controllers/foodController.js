const Food = require("../models/Food");
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
    const { type, quantity, unit, description, lat, lng, expiresAt, donor, notes } =
      req.body;

    const food = new Food({
      type,
      quantity,
      unit,
      description,
      lat,
      lng,
      expiresAt,
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

module.exports = {
  createFood,
  getAllFood,
  getFoodById,
  updateFoodStatus,
  deleteFood
};
