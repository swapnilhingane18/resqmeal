const validateFood = (req, res, next) => {
  const { type, quantity, lat, lng, expiresAt, unit } = req.body;

  if (!type) return res.status(400).json({ error: "Food type is required" });
  if (!["cooked", "raw", "packaged", "prepared"].includes(type)) {
    return res.status(400).json({ error: "Invalid food type" });
  }

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than 0" });
  }

  if (unit && !["kg", "liters", "portions", "boxes"].includes(unit)) {
    return res.status(400).json({ error: "Invalid unit" });
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "Valid latitude and longitude required" });
  }

  if (!expiresAt || new Date(expiresAt) <= new Date()) {
    return res.status(400).json({ error: "Expiration time must be in the future" });
  }

  next();
};

const validateNGO = (req, res, next) => {
  const { name, lat, lng, contact } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "NGO name is required" });
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "Valid latitude and longitude required" });
  }

  if (!contact || contact.trim() === "") {
    return res.status(400).json({ error: "Contact information is required" });
  }

  next();
};

module.exports = {
  validateFood,
  validateNGO
};
