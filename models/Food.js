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
    lat: {
      type: Number,
      required: [true, "Latitude is required"]
    },
    lng: {
      type: Number,
      required: [true, "Longitude is required"]
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
      enum: ["available", "pending_acceptance", "assigned", "picked_up", "delivered", "expired", "escalated"],
      default: "available"
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
        enum: ["Point"]
      },
      coordinates: {
        type: [Number]
      }
    }
  },
  {
    timestamps: true
  }
);

foodSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Food", foodSchema);
