const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "NGO name is required"],
      trim: true
    },
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
    avgResponseTime: {
      type: Number,
      default: 15,
      min: 0
    },
    contact: {
      type: String,
      required: [true, "Contact information is required"]
    },
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email format"]
    },
    capacity: {
      type: Number,
      default: 3,
      min: 0
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

ngoSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("NGO", ngoSchema);
