const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      error: "Validation failed",
      details: messages
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }

  // Duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ error: "Resource already exists" });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error"
  });
};

module.exports = errorHandler;
