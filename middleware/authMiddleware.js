const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/errorResponse');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            if (!process.env.JWT_SECRET) {
                return sendError(res, 500, 'Server configuration error', 'CONFIG_ERROR');
            }

            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return sendError(res, 401, 'Not authorized, user not found', 'AUTH_USER_NOT_FOUND');
            }

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error.stack || error.message);
            return sendError(res, 401, 'Not authorized, token failed', 'AUTH_TOKEN_INVALID');
        }
    } else {
        return sendError(res, 401, 'Not authorized, no token', 'AUTH_NO_TOKEN');
    }
};

module.exports = { protect };
