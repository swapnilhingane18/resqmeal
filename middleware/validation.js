const { sendError } = require("../utils/errorResponse");

const validateFood = (req, res, next) => {
  const { type, quantity, lat, lng, expiresAt, unit } = req.body;

  if (!type) return sendError(res, 400, "Food type is required", "VALIDATION_ERROR");
  if (!["cooked", "raw", "packaged", "prepared"].includes(type)) {
    return sendError(res, 400, "Invalid food type", "VALIDATION_ERROR");
  }

  if (!quantity || quantity <= 0) {
    return sendError(res, 400, "Quantity must be greater than 0", "VALIDATION_ERROR");
  }

  if (unit && !["kg", "liters", "portions", "boxes"].includes(unit)) {
    return sendError(res, 400, "Invalid unit", "VALIDATION_ERROR");
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return sendError(res, 400, "Valid latitude and longitude required", "VALIDATION_ERROR");
  }

  if (!expiresAt || new Date(expiresAt) <= new Date()) {
    return sendError(res, 400, "Expiration time must be in the future", "VALIDATION_ERROR");
  }

  next();
};

const validateNGO = (req, res, next) => {
  const { name, lat, lng, contact } = req.body;

  if (!name || name.trim() === "") {
    return sendError(res, 400, "NGO name is required", "VALIDATION_ERROR");
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    return sendError(res, 400, "Valid latitude and longitude required", "VALIDATION_ERROR");
  }

  if (!contact || contact.trim() === "") {
    return sendError(res, 400, "Contact information is required", "VALIDATION_ERROR");
  }

  next();
};

module.exports = {
  validateFood,
  validateNGO
};
