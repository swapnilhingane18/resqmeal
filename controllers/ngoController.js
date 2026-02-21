const NGO = require("../models/NGO");
const Assignment = require("../models/Assignment");
const Food = require("../models/Food");
const { findAndAssignBestNGO } = require("./assignmentController");
const { sendError } = require("../utils/errorResponse");

// Create NGO
const createNGO = async (req, res, next) => {
  try {
    const { name, lat, lng, contact, email, capacity, avgResponseTime, status } = req.body;

    const ngo = new NGO({
      name,
      lat,
      lng,
      contact,
      email,
      capacity,
      avgResponseTime,
      status,
      user: req.user.id
    });

    await ngo.save();
    res.status(201).json({ message: "NGO created", ngo });
  } catch (error) {
    next(error);
  }
};

// Get all NGOs
const getAllNGOs = async (req, res, next) => {
  try {
    const { status = "active" } = req.query;
    const query = status ? { status } : {};

    const ngos = await NGO.find(query).sort({ name: 1 });

    res.status(200).json({ count: ngos.length, ngos });
  } catch (error) {
    next(error);
  }
};

// Get NGO by ID
const getNGOById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ngo = await NGO.findById(id);

    if (!ngo) {
      return sendError(res, 404, "NGO not found", "NOT_FOUND");
    }

    res.status(200).json({ ngo });
  } catch (error) {
    next(error);
  }
};

// Update NGO
const updateNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, lat, lng, contact, email, capacity, avgResponseTime, status } =
      req.body;

    const existingNgo = await NGO.findById(id);
    if (!existingNgo) {
      return sendError(res, 404, "NGO not found", "NOT_FOUND");
    }

    const isOwner = existingNgo.user && existingNgo.user.toString() === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not authorized to modify this NGO profile", "FORBIDDEN");
    }

    const ngo = await NGO.findByIdAndUpdate(
      id,
      { name, lat, lng, contact, email, capacity, avgResponseTime, status },
      { new: true, runValidators: true }
    );

    if (!ngo) {
      return sendError(res, 404, "NGO not found", "NOT_FOUND");
    }

    res.status(200).json({ message: "NGO updated", ngo });
  } catch (error) {
    next(error);
  }
};

// Delete NGO
const deleteNGO = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingNgo = await NGO.findById(id);
    if (!existingNgo) {
      return sendError(res, 404, "NGO not found", "NOT_FOUND");
    }

    const isOwner = existingNgo.user && existingNgo.user.toString() === req.user.id;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "Not authorized to delete this NGO profile", "FORBIDDEN");
    }

    const ngo = await NGO.findByIdAndDelete(id);

    if (!ngo) {
      return sendError(res, 404, "NGO not found", "NOT_FOUND");
    }

    res.status(200).json({ message: "NGO deleted", ngo });
  } catch (error) {
    next(error);
  }
};

// Get current NGO profile
const getMe = async (req, res, next) => {
  try {
    console.log("Auth user ID:", req.user.id);
    const ngo = await NGO.findOne({ user: req.user.id });
    console.log("NGO lookup result:", ngo);
    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }
    const activeAssignments = await Assignment.countDocuments({
      ngo: ngo._id,
      status: { $in: ["pending", "accepted", "PENDING", "ACCEPTED"] }
    });

    res.status(200).json({
      success: true,
      ngo: {
        ...ngo.toObject(),
        activeAssignments,
        availableSlots: Math.max(ngo.capacity - activeAssignments, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update NGO status (Online/Offline)
const updateNGOStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return sendError(res, 400, "Invalid status. Must be 'active' or 'inactive'", "VALIDATION_ERROR");
    }

    const ngo = await NGO.findOneAndUpdate(
      { user: req.user.id },
      { status },
      { new: true, runValidators: true }
    );

    if (!ngo) {
      return res.status(404).json({ message: "NGO profile not found" });
    }

    if (status === "inactive") {
      const activeAssignments = await Assignment.find({
        ngo: ngo._id,
        status: { $in: ["pending", "accepted", "PENDING", "ACCEPTED"] }
      });

      if (activeAssignments.length > 0) {
        console.log(`NGO ${ngo.name} went offline — reassigning ${activeAssignments.length} assignments`);

        for (const assignment of activeAssignments) {
          const food = await Food.findById(assignment.food);

          await Assignment.deleteOne({ _id: assignment._id });

          if (food) {
            food.status = "available";
            food.assignedNgo = null;
            food.isAutoAssigned = false;
            await food.save();

            // Re-run the auto-assigner for this food to find a new NGO
            await findAndAssignBestNGO(food, { autoAssign: true });
          }
        }
      }
    }

    res.status(200).json({ success: true, ngo });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNGO,
  getAllNGOs,
  getNGOById,
  updateNGO,
  deleteNGO,
  getMe,
  updateNGOStatus
};
