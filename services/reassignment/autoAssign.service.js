const Food = require("../../models/Food");
const { checkAndTriggerAutoAssignment } = require("../emergencyTrigger.service");
const { findAndAssignBestNGO } = require("../../controllers/assignmentController");

/**
 * Attempt to auto-assign a food item to an NGO by food ID.
 * Falls back to standard assignment if not an emergency.
 *
 * @param {string|ObjectId} foodId
 * @returns {Promise<Object>} Result of the assignment attempt
 */
const autoAssignFood = async (foodId) => {
    try {
        const food = await Food.findById(foodId);
        if (!food) {
            console.warn(`[autoAssign] Food ${foodId} not found.`);
            return { success: false, reason: "FOOD_NOT_FOUND" };
        }

        if (food.status !== "available") {
            console.log(`[autoAssign] Food ${foodId} is not available (status: ${food.status}). Skipping.`);
            return { success: false, reason: "NOT_AVAILABLE" };
        }

        // First try emergency trigger (handles EMERGENCY urgency only)
        const emergencyResult = await checkAndTriggerAutoAssignment(food);
        if (emergencyResult.autoTriggered && emergencyResult.success) {
            return { success: true, assignment: emergencyResult.assignment, method: "emergency" };
        }

        // Fall back to standard best-NGO assignment for non-emergency items
        const result = await findAndAssignBestNGO(food, { autoAssign: true });
        if (result.assignment) {
            console.log(`[autoAssign] ✅ Standard assigned Food ${foodId} to NGO.`);
            return { success: true, assignment: result.assignment, method: "standard" };
        }

        console.log(`[autoAssign] ⚠️ No NGO available for Food ${foodId}.`);
        return { success: false, reason: "NO_NGO_AVAILABLE" };

    } catch (error) {
        console.error(`[autoAssign] Error for Food ${foodId}:`, error.message);
        return { success: false, reason: "ERROR", error: error.message };
    }
};

module.exports = { autoAssignFood };
