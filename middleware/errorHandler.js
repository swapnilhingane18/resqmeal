const { sendError } = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", {
    message: err.message,
    code: err.code,
    name: err.name,
    stack: err.stack,
  });

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, "Validation failed", "VALIDATION_ERROR", messages);
  }

  if (err.name === "CastError") {
    return sendError(res, 400, "Invalid ID format", "INVALID_ID");
  }

  if (err.code === 11000) {
    return sendError(res, 409, "Resource already exists", "DUPLICATE_RESOURCE", err.keyValue);
  }

  if (err.name === "JsonWebTokenError") {
    return sendError(res, 401, "Not authorized, token failed", "AUTH_INVALID_TOKEN");
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, 401, "Not authorized, token expired", "AUTH_TOKEN_EXPIRED");
  }

  const statusCode = err.statusCode || 500;
  if (statusCode < 500) {
    return sendError(res, statusCode, err.message || "Request failed", err.code || "REQUEST_ERROR");
  }

  return sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
};

module.exports = errorHandler;
