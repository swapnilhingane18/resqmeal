const NGO = require("../models/NGO");
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

module.exports = {
  createNGO,
  getAllNGOs,
  getNGOById,
  updateNGO,
  deleteNGO
};
