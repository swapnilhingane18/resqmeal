const Food = require("../models/Food");
const { findAndAssignBestNGO } = require("./assignmentController");

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
      donor,
      notes
    });

    await food.save();

    // Find and assign best NGO
    const { assignment, score } = await findAndAssignBestNGO(food);

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
      return res.status(404).json({ error: "Food listing not found" });
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
      return res.status(400).json({ error: "Invalid status" });
    }

    const food = await Food.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({ error: "Food listing not found" });
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
    const food = await Food.findByIdAndDelete(id);

    if (!food) {
      return res.status(404).json({ error: "Food listing not found" });
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
