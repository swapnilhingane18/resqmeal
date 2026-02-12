const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/errorResponse');

const normalizeRole = (inputRole) => {
    if (!inputRole) return 'DONOR';

    const cleaned = String(inputRole).trim().toLowerCase();
    const roleMap = {
        donor: 'DONOR',
        'food donor': 'DONOR',
        ngo: 'NGO',
        'ngo / volunteer': 'NGO',
        'ngo/volunteer': 'NGO',
        admin: 'ADMIN'
    };

    return roleMap[cleaned] || null;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedPassword = typeof password === 'string' ? password : '';

        if (!normalizedName || !normalizedEmail || !normalizedPassword) {
            return sendError(res, 400, 'Please add all fields', 'VALIDATION_ERROR');
        }

        const normalizedRole = normalizeRole(role);

        // Validate role enum if provided
        if (!normalizedRole) {
            return sendError(res, 400, 'Invalid role specified', 'VALIDATION_ERROR');
        }

        // Check if user exists
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return sendError(res, 409, 'User with this email already exists', 'DUPLICATE_RESOURCE');
        }

        // Create user
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password: normalizedPassword,
            role: normalizedRole
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            return sendError(res, 400, 'Invalid user data', 'VALIDATION_ERROR');
        }
    } catch (error) {
        console.error('Register Error:', error.stack || error.message);

        // Handle Duplicate Key Error (Race condition catch)
        if (error.code === 11000) {
            return sendError(res, 409, 'User with this email already exists', 'DUPLICATE_RESOURCE');
        }

        // Handle Mongoose Validation Errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', messages);
        }

        return sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, 'Please add email and password', 'VALIDATION_ERROR');
        }

        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            return sendError(res, 401, 'Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
        }
    } catch (error) {
        console.error("Login Error:", error.stack || error.message);
        return sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return sendError(res, 404, 'User not found', 'NOT_FOUND');
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("GetMe Error:", error.stack || error.message);
        return sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
    }
};

// Generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};
