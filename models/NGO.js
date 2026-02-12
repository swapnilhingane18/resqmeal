const mongoose = require("mongoose");

const ngoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "NGO name is required"],
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
      default: 100,
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

module.exports = mongoose.model("NGO", ngoSchema);
