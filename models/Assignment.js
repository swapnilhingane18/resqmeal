const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: [true, "Food is required"]
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: [true, "NGO is required"]
    },
    score: {
      type: Number,
      required: true
    },
    totalScore: Number, // New scoring system
    distanceScore: Number,
    urgencyScore: Number,
    capacityScore: Number,
    loadBalanceScore: Number,
    distance: {
      type: Number,
      required: true
    },
    timeUrgency: {
      type: Number,
      required: true
    },
    responseScore: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "expired"],
      default: "pending"
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    notes: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
