const { sendError } = require('../utils/errorResponse');

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return sendError(
                res,
                403,
                `User role ${req.user.role} is not authorized to access this route`,
                'FORBIDDEN'
            );
        }
        next();
    };
};

module.exports = { authorizeRoles };
