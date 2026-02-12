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
        validator: function(v) {
          return v > new Date();
        },
        message: "Expiration time must be in the future"
      }
    },
    donor: {
      name: String,
      contact: String,
      email: String
    },
    status: {
      type: String,
      enum: ["available", "assigned", "delivered", "expired"],
      default: "available"
    },
    assignedNgo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      default: null
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Food", foodSchema);
