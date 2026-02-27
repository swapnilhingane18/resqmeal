const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["cooked", "raw", "packaged", "prepared"],
      required: [true, "Food type is required"]
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0
    },
    unit: {
      type: String,
      enum: ["kg", "liters", "portions", "boxes"],
      default: "kg"
    },
    description: {
      type: String,
      trim: true
    },
    district: {
      type: String,
      default: "Pune"
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration time is required"],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Expiration time must be in the future"
      }
    },
    donor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: String,
      contact: String,
      email: String
    },
    status: {
      type: String,
      enum: ["available", "pending_acceptance", "assigned", "matching", "picked_up", "delivered", "expired", "escalated"],
      default: "available"
    },
    engineStage: {
      type: String,
      enum: ["queued", "matching", "accepted", "rejected", "picked_up", "delivered", null],
      default: null
    },
    declinedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NGO"
      }
    ],
    escalationLevel: {
      type: Number,
      default: 0
    },
    foodExpiresAt: {
      type: Date,
      required: [true, "Food expiry date is required"]
    },
    assignedNgo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      default: null
    },
    notes: {
      type: String,
      trim: true
    },
    acceptanceExpiresAt: {
      type: Date
    },
    candidateQueue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NGO"
      }
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    volunteer: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number],
          default: []
        }
      },
      isSharingLocation: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

foodSchema.index({ location: "2dsphere" });
foodSchema.index({ "volunteer.location": "2dsphere" });

module.exports = mongoose.model("Food", foodSchema);
