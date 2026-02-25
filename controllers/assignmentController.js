const mongoose = require("mongoose");
const Food = require("../models/Food");
const NGO = require("../models/NGO");
const Assignment = require("../models/Assignment");
const { calculateScore } = require("../services/priorityEngine");
const { sendError } = require("../utils/errorResponse");

// Intelligent Weighted Routing Constants
const DISTANCE_WEIGHT = 0.6;
const RELIABILITY_WEIGHT = 0.4;

const ACTIVE_ASSIGNMENT_STATUSES = ["pending", "accepted"];
const ASSIGNMENT_STATUSES = ["pending", "accepted", "rejected", "timed_out", "completed", "cancelled"];

const buildError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const getFoodUpdateForStatus = (status) => {
  if (status === "rejected") {
    return { status: "available", assignedNgo: null, isAutoAssigned: false };
  }
  if (status === "completed") {
    return { status: "delivered" };
  }
  if (status === "timed_out" || status === "cancelled") {
    return { status: "available", assignedNgo: null, isAutoAssigned: false };
  }
  if (status === "pending" || status === "accepted") {
    return { status: "assigned" };
  }
  return null;
};

// Helper function to find best NGO and create assignment
const findAndAssignBestNGO = async (foodInput, options = {}) => {
  if (!foodInput || (!foodInput._id && typeof foodInput !== "string")) {
    console.warn("findAndAssignBestNGO called without valid food.");
    return { assignment: null, score: null };
  }

  const foodId = foodInput._id || foodInput;
  const { autoAssign = false } = options;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const food = await Food.findById(foodId).session(session);
    if (!food) {
      throw buildError("Food not found", 404, "NOT_FOUND");
    }

    const existing = await Assignment.findOne({
      food: food._id,
      status: { $in: ["pending", "accepted", "PENDING", "ACCEPTED"] }
    }).session(session);

    if (existing) {
      console.log(`Food ${food._id} already assigned — skipping duplicate assignment`);
      await session.abortTransaction();
      return { assignment: existing, score: null };
    }

    // Re-check status inside transaction to prevent race conditions.
    if (food.status !== "available") {
      await session.abortTransaction();
      console.warn("[assignment] transaction aborted: food not available", { foodId: String(foodId) });
      return { assignment: null, score: null };
    }

    const ngos = await NGO.find({ status: "active", capacity: { $gt: 0 } }).session(session);
    if (ngos.length === 0) {
      await session.abortTransaction();
      return { assignment: null, score: null };
    }

    const activeAssignments = await Assignment.aggregate([
      {
        $match: {
          status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
          ngo: { $in: ngos.map((n) => n._id) },
        },
      },
      {
        $group: {
          _id: "$ngo",
          count: { $sum: 1 },
        },
      },
    ]).session(session);

    const assignmentCounts = {};
    activeAssignments.forEach((item) => {
      assignmentCounts[item._id.toString()] = item.count;
    });

    // Intelligent Weighted Routing: Lightweight Pre-aggregation for historical reliability
    let reliabilityStats = {};
    try {
      const historicalStats = await Assignment.aggregate([
        {
          $match: { ngo: { $in: ngos.map((n) => n._id) } }
        },
        {
          $group: {
            _id: "$ngo",
            totalAssigned: { $sum: 1 },
            accepted: { $sum: { $cond: [{ $in: ["$status", ["accepted", "completed"]] }, 1, 0] } },
            timedOut: { $sum: { $cond: [{ $eq: ["$status", "timed_out"] }, 1, 0] } }
          }
        }
      ]).session(session);

      historicalStats.forEach((stat) => {
        const acceptanceRate = stat.totalAssigned > 0 ? stat.accepted / stat.totalAssigned : 0.5;
        // SLA Compliance: how often they pick up vs timeout on assignments
        const slaCompliance = stat.totalAssigned > 0 ? (stat.totalAssigned - stat.timedOut) / stat.totalAssigned : 0.5;

        // Reliability Score averages acceptance consistency and SLA response
        const reliabilityScore = (acceptanceRate + slaCompliance) / 2;

        reliabilityStats[stat._id.toString()] = {
          acceptanceRate,
          slaCompliance,
          reliabilityScore: isNaN(reliabilityScore) ? 0.5 : Math.max(0, Math.min(1, reliabilityScore)) // Normalize 0-1
        };
      });
    } catch (aggError) {
      console.warn("[assignment] Failed to aggregate history, falling back to neutral reliability", aggError);
    }

    const validNgos = [];

    for (const ngo of ngos) {
      const activeAssignments = await Assignment.countDocuments({
        ngo: ngo._id,
        status: { $in: ["pending", "accepted"] }
      });

      if (activeAssignments >= ngo.capacity) {
        console.log(
          `NGO ${ngo.name} skipped — capacity reached (${activeAssignments}/${ngo.capacity})`
        );
        continue;
      }

      const currentActiveCount = assignmentCounts[ngo._id.toString()] || 0;
      const scoreResult = calculateScore(food, ngo, currentActiveCount);

      // Intelligent Weighted Routing: Extract distance and normalize it inversely
      const distance = scoreResult.distance || 0;
      const inverseDistanceScore = 1 / (distance + 1); // Normalize so closer = vastly higher score (max nearly 1)

      // Fetch aggregated reliability or fallback to neutral
      const ngoStats = reliabilityStats[ngo._id.toString()] || { reliabilityScore: 0.5 };
      const reliabilityScore = ngoStats.reliabilityScore;

      // Compute weighted final score without touching absolute constraints
      const finalScore = (DISTANCE_WEIGHT * inverseDistanceScore) + (RELIABILITY_WEIGHT * reliabilityScore);

      validNgos.push({
        ngo,
        scoreResult,
        finalScore,
        routingMetrics: {
          inverseDistanceScore,
          reliabilityScore
        }
      });
    }

    if (validNgos.length === 0) {
      await session.abortTransaction();
      return { assignment: null, score: null };
    }

    // Intelligent Weighted Routing: Sort descending strictly via final weighted score
    validNgos.sort((a, b) => b.finalScore - a.finalScore);

    const bestCandidate = validNgos[0];
    const bestNgo = bestCandidate.ngo;
    const bestScoreDetails = bestCandidate.scoreResult; // We preserve original legacy metrics to satisfy the schema tracking
    const candidateQueue = validNgos.slice(1).map(item => item.ngo._id);

    // Conditional update prevents double-assignment under race.
    const foodUpdateResult = await Food.updateOne(
      { _id: food._id, status: "available" },
      {
        $set: {
          status: "pending_acceptance",
          assignedNgo: bestNgo._id,
          isAutoAssigned: autoAssign,
          acceptanceExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
          candidateQueue: candidateQueue
        }
      },
      { session }
    );

    if (foodUpdateResult.modifiedCount !== 1) {
      throw buildError("Food is no longer available for assignment", 409, "ASSIGNMENT_CONFLICT");
    }

    const ngoUpdateResult = await NGO.updateOne(
      { _id: bestNgo._id, capacity: { $gt: 0 } },
      { $inc: { capacity: -1 } },
      { session }
    );

    if (ngoUpdateResult.modifiedCount !== 1) {
      throw buildError("NGO capacity is no longer available", 409, "CAPACITY_CONFLICT");
    }

    const [assignment] = await Assignment.create(
      [
        {
          food: food._id,
          ngo: bestNgo._id,
          totalScore: bestScoreDetails.totalScore,
          distanceScore: bestScoreDetails.distanceScore,
          urgencyScore: bestScoreDetails.urgencyScore,
          capacityScore: bestScoreDetails.capacityScore,
          loadBalanceScore: bestScoreDetails.loadBalanceScore,
          score: bestScoreDetails.totalScore,
          distance: bestScoreDetails.distance,
          timeUrgency: bestScoreDetails.timeUrgency,
          responseScore: bestScoreDetails.responseScore,
          status: "pending",
          escalationDepth: 0,
          district: food.district || "Pune",
          expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    console.log("[assignment] transaction committed", {
      assignmentId: String(assignment._id),
      foodId: String(food._id),
      ngoId: String(bestNgo._id),
      autoAssign
    });

    console.log(`findAndAssignBestNGO completed for food ${food._id}`);

    return {
      assignment: await Assignment.findById(assignment._id).populate("food ngo"),
      score: bestCandidate.finalScore,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("[assignment] transaction aborted", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  } finally {
    session.endSession();
  }
};

// Assign food to best NGO
const assignFood = async (req, res, next) => {
  try {
    const { foodId } = req.body;
    const food = await Food.findById(foodId);

    if (!food) {
      return sendError(res, 404, "Food not found", "NOT_FOUND");
    }

    if (food.status !== "available") {
      return sendError(res, 400, "Food is not available for assignment", "VALIDATION_ERROR");
    }

    const { assignment, score } = await findAndAssignBestNGO(food);

    if (!assignment) {
      return res.status(200).json({
        message: "No active NGO found for assignment",
        assignment: null,
        score: null,
      });
    }

    return res.status(200).json({
      message: "Food assigned successfully",
      assignment,
      score,
    });
  } catch (error) {
    return next(error);
  }
};

// Get all assignments
const getAllAssignments = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !ASSIGNMENT_STATUSES.includes(status)) {
      return sendError(res, 400, "Invalid status filter", "VALIDATION_ERROR");
    }

    const query = status ? { status } : {};

    if (req.user.role === "NGO") {
      const ngo = await NGO.findOne({ user: req.user.id });
      // Defensive: if no NGO profile exists, return empty list instead of 404
      if (!ngo) {
        return res.status(200).json({ count: 0, assignments: [] });
      }
      query.ngo = ngo._id;
    } else if (req.user.role === "DONOR") {
      const foods = await Food.find({ "donor.user": req.user.id }).select("_id");
      query.food = { $in: foods.map((f) => f._id) };
    }

    const assignments = await Assignment.find(query)
      .populate("food", "type quantity unit expiresAt status description lat lng donor")
      .populate("ngo", "name lat lng contact")
      .sort({ assignedAt: -1 });

    return res.status(200).json({ count: assignments.length, assignments });
  } catch (error) {
    return next(error);
  }
};

// Get assignments for the currently authenticated NGO user
const getMyAssignments = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status && !ASSIGNMENT_STATUSES.includes(status)) {
      return sendError(res, 400, "Invalid status filter", "VALIDATION_ERROR");
    }

    // Find the NGO profile linked to this user
    const ngo = await NGO.findOne({ user: req.user.id });

    // Defensive: legacy NGO users without a profile get an empty list, not a crash
    if (!ngo) {
      return res.status(200).json({ count: 0, assignments: [] });
    }

    const query = { ngo: ngo._id };
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .populate("food", "type quantity unit expiresAt status description lat lng donor")
      .populate("ngo", "name lat lng contact")
      .sort({ assignedAt: -1 });

    return res.status(200).json({ count: assignments.length, assignments });
  } catch (error) {
    return next(error);
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).populate("food ngo");

    if (!assignment) {
      return sendError(res, 404, "Assignment not found", "NOT_FOUND");
    }

    return res.status(200).json({ assignment });
  } catch (error) {
    return next(error);
  }
};

// Update assignment status
const updateAssignmentStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ASSIGNMENT_STATUSES.includes(status)) {
    return sendError(res, 400, "Invalid status", "VALIDATION_ERROR");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await Assignment.findById(id).session(session);
    if (!existing) {
      await session.abortTransaction();
      return sendError(res, 404, "Assignment not found", "NOT_FOUND");
    }

    if (req.user.role === "NGO") {
      const ngoProfile = await NGO.findOne({ user: req.user.id }).select("_id").session(session);
      if (!ngoProfile) {
        await session.abortTransaction();
        return sendError(res, 404, "NGO profile not found for this user", "NOT_FOUND");
      }

      if (existing.ngo.toString() !== ngoProfile._id.toString()) {
        await session.abortTransaction();
        return sendError(res, 403, "Not authorized to update this assignment", "FORBIDDEN");
      }
    }

    const previousStatus = existing.status;
    const wasActive = ACTIVE_ASSIGNMENT_STATUSES.includes(previousStatus);
    const willBeActive = ACTIVE_ASSIGNMENT_STATUSES.includes(status);

    let capacityDelta = 0;
    if (wasActive && !willBeActive) capacityDelta = 1;
    if (!wasActive && willBeActive) capacityDelta = -1;

    const now = new Date();
    existing.status = status;

    // Analytics Metrics Interception
    if (status === "completed") existing.completedAt = now;
    if (status === "accepted") {
      existing.acceptedAt = now;
      if (existing.assignedAt) {
        existing.responseTime = now.getTime() - existing.assignedAt.getTime();
      }
    }
    if (status === "rejected") {
      existing.rejectedAt = now;
    }

    await existing.save({ session });

    let foodUpdate = getFoodUpdateForStatus(status);

    // Explicit 2-min limit handlers
    if (status === "accepted") {
      foodUpdate = { status: "assigned", acceptanceExpiresAt: undefined };
    }

    let escalatedToNext = false;

    if (status === "rejected") {
      const targetFood = await Food.findById(existing.food).session(session);
      if (targetFood && targetFood.candidateQueue && targetFood.candidateQueue.length > 0) {
        const nextNgoId = targetFood.candidateQueue.shift();

        foodUpdate = null; // Cancel default status update

        await Food.updateOne({ _id: targetFood._id }, {
          $set: {
            status: "pending_acceptance",
            assignedNgo: nextNgoId,
            acceptanceExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
            candidateQueue: targetFood.candidateQueue
          }
        }, { session });

        await NGO.updateOne({ _id: nextNgoId }, { $inc: { capacity: -1 } }, { session });

        // Use existing depth but cap to 0 just in case
        const nextDepth = (existing.escalationDepth || 0) + 1;

        await Assignment.create([{
          food: targetFood._id,
          ngo: nextNgoId,
          score: 0,
          distance: 0,
          timeUrgency: 0,
          responseScore: 0,
          status: "pending",
          escalationDepth: nextDepth,
          district: targetFood.district || "Pune",
          expiresAt: new Date(Date.now() + 2 * 60 * 1000)
        }], { session });

        escalatedToNext = true;
      } else {
        foodUpdate = { status: "available", assignedNgo: null, isAutoAssigned: false, acceptanceExpiresAt: undefined };
      }
    }

    if (foodUpdate) {
      // Use $unset for undefined values instead of $set
      const setPayload = {};
      const unsetPayload = {};

      for (const [key, val] of Object.entries(foodUpdate)) {
        if (val === undefined || val === null) {
          if (key === "acceptanceExpiresAt") unsetPayload[key] = 1;
          else setPayload[key] = null;
        } else {
          setPayload[key] = val;
        }
      }

      const updateOp = {};
      if (Object.keys(setPayload).length > 0) updateOp.$set = setPayload;
      if (Object.keys(unsetPayload).length > 0) updateOp.$unset = unsetPayload;

      await Food.updateOne({ _id: existing.food }, updateOp, { session });
    }

    if (capacityDelta !== 0) {
      const query = capacityDelta < 0
        ? { _id: existing.ngo, capacity: { $gte: Math.abs(capacityDelta) } }
        : { _id: existing.ngo };

      const capacityResult = await NGO.updateOne(query, { $inc: { capacity: capacityDelta } }, { session });
      if (capacityResult.modifiedCount !== 1) {
        throw buildError("Unable to update NGO capacity", 409, "CAPACITY_CONFLICT");
      }
    }

    await session.commitTransaction();
    console.log("[assignment] status transaction committed", {
      assignmentId: String(existing._id),
      previousStatus,
      nextStatus: status,
    });

    const assignment = await Assignment.findById(existing._id).populate("food ngo");
    return res.status(200).json({ message: "Assignment updated", assignment });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("[assignment] status transaction aborted", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return next(error);
  } finally {
    session.endSession();
  }
};

// Trust Layer: Verified Pickup
const markPickedUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return sendError(res, 404, "Assignment not found", "NOT_FOUND");
    }

    if (assignment.status !== "accepted") {
      return sendError(res, 400, "Can only mark accepted assignments as picked up", "VALIDATION_ERROR");
    }

    assignment.pickedUpAt = new Date();
    await assignment.save();

    return res.status(200).json({ message: "Pickup verified", assignment });
  } catch (error) {
    return next(error);
  }
};

// Trust Layer: Verified Delivery
const markDelivered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return sendError(res, 404, "Assignment not found", "NOT_FOUND");
    }

    if (assignment.status !== "accepted") {
      return sendError(res, 400, "Can only mark accepted assignments as delivered", "VALIDATION_ERROR");
    }

    assignment.deliveredAt = new Date();
    assignment.deliveryVerified = true;
    await assignment.save();

    return res.status(200).json({ message: "Delivery verified", assignment });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  assignFood,
  getAllAssignments,
  getMyAssignments,
  getAssignmentById,
  updateAssignmentStatus,
  findAndAssignBestNGO,
  markPickedUp,
  markDelivered,
};
