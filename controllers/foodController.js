const Food = require("../models/Food");
const { findAndAssignBestNGO } = require("./assignmentController");
const { sendError } = require("../utils/errorResponse");

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

    // Find and assign best NGO
    const { assignment, score } = await findAndAssignBestNGO(food);

    if (!assignment) {
      return res.status(201).json({
        message: "Food listing created but not assigned (no active NGOs)",
        food,
        assignment: null,
        score: null
      });
    }

    res.status(201).json({
      message: "Food listing created and assigned",
      food: await food.populate("assignedNgo", "name lat lng contact"),
      assignment,
      score
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

    res.status(200).json({ count: foods.length, foods });
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

    res.status(200).json({ food });
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

    res.status(200).json({ message: "Food status updated", food });
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

    res.status(200).json({ message: "Food listing deleted", food });
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
