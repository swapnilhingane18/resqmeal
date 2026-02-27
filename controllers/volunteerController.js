const Food = require("../models/Food");
const NGO = require("../models/NGO");
const { findAndAssignBestNGO } = require("./assignmentController");
const { sendError } = require("../utils/errorResponse");

// -----------------------------------------------
// POST /api/ngo/accept/:foodId
// NGO accepts a pending food assignment
// -----------------------------------------------
const acceptFood = async (req, res, next) => {
    try {
        const { foodId } = req.params;
        const ngoUserId = req.user.id;

        // Find which NGO belongs to this logged-in user
        const ngo = await NGO.findOne({ user: ngoUserId });
        if (!ngo) {
            return sendError(res, 404, "NGO profile not found for this user", "NOT_FOUND");
        }

        const food = await Food.findById(foodId);
        if (!food) {
            return sendError(res, 404, "Food listing not found", "NOT_FOUND");
        }

        // Validate this NGO is the assigned one
        if (!food.assignedNgo || food.assignedNgo.toString() !== ngo._id.toString()) {
            return sendError(res, 403, "This food is not assigned to your NGO", "FORBIDDEN");
        }

        if (food.status !== "pending_acceptance") {
            return sendError(res, 400, `Food is in '${food.status}' state — cannot accept now`, "INVALID_STATE");
        }

        // Check acceptance window hasn't expired
        if (food.acceptanceExpiresAt && new Date() > food.acceptanceExpiresAt) {
            return sendError(res, 400, "Acceptance window has expired", "ACCEPTANCE_EXPIRED");
        }

        food.status = "assigned";
        food.engineStage = "accepted";
        food.volunteer = {
            user: ngoUserId,
            location: { type: "Point", coordinates: [] },
            isSharingLocation: true
        };

        await food.save();

        console.log(`✅ [Accept] Food ${food._id} accepted by NGO ${ngo.name}`);

        return res.status(200).json({
            message: "Food accepted successfully",
            food
        });
    } catch (error) {
        console.error("❌ [Accept] Error:", error);
        next(error);
    }
};

// -----------------------------------------------
// POST /api/ngo/reject/:foodId
// NGO rejects a pending food — triggers reassignment
// -----------------------------------------------
const rejectFood = async (req, res, next) => {
    try {
        const { foodId } = req.params;
        const ngoUserId = req.user.id;

        const ngo = await NGO.findOne({ user: ngoUserId });
        if (!ngo) {
            return sendError(res, 404, "NGO profile not found for this user", "NOT_FOUND");
        }

        const food = await Food.findById(foodId);
        if (!food) {
            return sendError(res, 404, "Food listing not found", "NOT_FOUND");
        }

        if (!food.assignedNgo || food.assignedNgo.toString() !== ngo._id.toString()) {
            return sendError(res, 403, "This food is not assigned to your NGO", "FORBIDDEN");
        }

        if (!["pending_acceptance", "assigned"].includes(food.status)) {
            return sendError(res, 400, `Food is in '${food.status}' state — cannot reject now`, "INVALID_STATE");
        }

        // Track this NGO as declined
        food.declinedBy = food.declinedBy || [];
        if (!food.declinedBy.map(String).includes(ngo._id.toString())) {
            food.declinedBy.push(ngo._id);
        }

        // Restore capacity to the rejecting NGO
        await NGO.updateOne({ _id: ngo._id }, { $inc: { capacity: 1 } });

        // Clear assignment
        food.assignedNgo = null;
        food.status = "matching";
        food.engineStage = "rejected";
        food.volunteer = { user: null, location: { type: "Point", coordinates: [] }, isSharingLocation: false };

        await food.save();

        console.log(`⚠️ [Reject] Food ${food._id} rejected by NGO ${ngo.name} — triggering reassignment`);

        // Trigger reassignment asynchronously (don't block response)
        findAndAssignBestNGO(food).then(result => {
            if (result.assignment) {
                console.log(`🔄 [Reject] Reassigned food ${food._id} to NGO ${result.assignment.ngo}`);
            } else {
                // Mark as available so cron can retry
                Food.findByIdAndUpdate(food._id, { status: "available" }).exec();
                console.log(`ℹ️ [Reject] No NGO found for reassignment — reverting to available`);
            }
        }).catch(err => console.error("❌ [Reject] Reassignment error:", err));

        return res.status(200).json({
            message: "Food rejected — reassignment triggered",
            foodId: food._id
        });
    } catch (error) {
        console.error("❌ [Reject] Error:", error);
        next(error);
    }
};

// -----------------------------------------------
// PATCH /api/volunteer/location/:foodId
// NGO volunteer updates live location
// -----------------------------------------------
const updateVolunteerLocation = async (req, res, next) => {
    try {
        const { foodId } = req.params;
        const { lat, lng } = req.body;

        if (lat === undefined || lng === undefined) {
            return sendError(res, 400, "lat and lng are required", "VALIDATION_ERROR");
        }

        const food = await Food.findById(foodId);
        if (!food) {
            return sendError(res, 404, "Food listing not found", "NOT_FOUND");
        }

        // Only the assigned volunteer can update location
        if (!food.volunteer?.user || food.volunteer.user.toString() !== req.user.id) {
            return sendError(res, 403, "Not authorized to update location for this food", "FORBIDDEN");
        }

        if (!food.volunteer.isSharingLocation) {
            return sendError(res, 400, "Location sharing is not enabled for this assignment", "SHARING_DISABLED");
        }

        food.volunteer.location = {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]  // GeoJSON: [lng, lat]
        };

        await food.save();

        return res.status(200).json({
            message: "Location updated",
            volunteerLocation: food.volunteer.location
        });
    } catch (error) {
        console.error("❌ [Location] Error:", error);
        next(error);
    }
};

// -----------------------------------------------
// GET /api/food/:id/tracking
// Donor polls this to get volunteer live status
// -----------------------------------------------
const getTracking = async (req, res, next) => {
    try {
        const { id } = req.params;

        const food = await Food.findById(id)
            .populate("assignedNgo", "name contact")
            .lean();

        if (!food) {
            return sendError(res, 404, "Food listing not found", "NOT_FOUND");
        }

        const volunteerCoords = food.volunteer?.location?.coordinates;
        const volunteerLocation = volunteerCoords && volunteerCoords.length === 2
            ? { lat: volunteerCoords[1], lng: volunteerCoords[0] }
            : null;

        return res.status(200).json({
            status: food.status,
            engineStage: food.engineStage,
            ngoName: food.assignedNgo?.name || null,
            ngoContact: food.assignedNgo?.contact || null,
            volunteerLocation,
            volunteerIsSharingLocation: food.volunteer?.isSharingLocation || false,
            acceptanceExpiresAt: food.acceptanceExpiresAt || null
        });
    } catch (error) {
        console.error("❌ [Tracking] Error:", error);
        next(error);
    }
};

// -----------------------------------------------
// PATCH /api/ngo/location-sharing/:foodId
// Toggle location sharing on/off
// -----------------------------------------------
const toggleLocationSharing = async (req, res, next) => {
    try {
        const { foodId } = req.params;
        const { isSharingLocation } = req.body;

        const food = await Food.findById(foodId);
        if (!food) {
            return sendError(res, 404, "Food listing not found", "NOT_FOUND");
        }

        if (!food.volunteer?.user || food.volunteer.user.toString() !== req.user.id) {
            return sendError(res, 403, "Not authorized", "FORBIDDEN");
        }

        food.volunteer.isSharingLocation = Boolean(isSharingLocation);
        await food.save();

        return res.status(200).json({
            message: `Location sharing ${food.volunteer.isSharingLocation ? "enabled" : "disabled"}`,
            isSharingLocation: food.volunteer.isSharingLocation
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    acceptFood,
    rejectFood,
    updateVolunteerLocation,
    getTracking,
    toggleLocationSharing
};
