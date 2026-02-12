const sendError = (res, status, message, code, details) => {
  const payload = {
    success: false,
    message,
  };

  if (code) payload.code = code;
  if (details !== undefined) payload.details = details;

  return res.status(status).json(payload);
};

module.exports = { sendError };
