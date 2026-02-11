const NGO = require("../models/NGO");

// Create NGO
const createNGO = async (req, res, next) => {
  try {
    const { name, lat, lng, contact, email, capacity, avgResponseTime } = req.body;

    const ngo = new NGO({
      name,
      lat,
      lng,
      contact,
      email,
      capacity,
      avgResponseTime
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
    const { active = true } = req.query;
    const query = active !== "false" ? { active: true } : {};

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
      return res.status(404).json({ error: "NGO not found" });
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
    const { name, lat, lng, contact, email, capacity, avgResponseTime, active } =
      req.body;

    const ngo = await NGO.findByIdAndUpdate(
      id,
      { name, lat, lng, contact, email, capacity, avgResponseTime, active },
      { new: true, runValidators: true }
    );

    if (!ngo) {
      return res.status(404).json({ error: "NGO not found" });
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
    const ngo = await NGO.findByIdAndDelete(id);

    if (!ngo) {
      return res.status(404).json({ error: "NGO not found" });
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
