const mongoose = require('mongoose');

const energyCenterSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    contact: {
        type: String
    },
    address: {
        type: String
    },
    lat: {
        type: Number
    },
    lng: {
        type: Number
    },
    capacity: {
        type: Number,
        default: 0
    },
    activeAssignments: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('EnergyCenter', energyCenterSchema);
