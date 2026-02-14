const { calculateUrgency } = require("./urgency.service");
const { findAndAssignBestNGO } = require("../controllers/assignmentController");
const Food = require("../models/Food");

/**
 * Checks a food item and triggers auto-assignment if it's an EMERGENCY
 * @param {Object} food - The food object (mongoose document)
 * @returns {Promise<Object>} Result of the operation
 */
const checkAndTriggerAutoAssignment = async (food) => {
    try {
        // 1. Calculate Urgency
        const { urgencyLevel, urgencyScore } = calculateUrgency(food);

        const isEmergency = urgencyLevel === "EMERGENCY";
        const isAvailable = food.status === "available";

        // 2. Check Triggers: Must be EMERGENCY and AVAILABLE
        if (isEmergency && isAvailable) {
            console.log(`[EmergencyTrigger] ⚡ Auto-Rescuing Food ${food._id} (Score: ${urgencyScore})`);

            // 3. Attempt Assignment
            // We reusing the logic from assignmentController which is transaction-safe
            // We pass the food object directly
            const result = await findAndAssignBestNGO(food, { autoAssign: true });

            if (result.assignment) {
                console.log(`[EmergencyTrigger] ✅ Successfully auto-assigned to ${result.assignment.ngo?.name}`);
                return {
                    autoTriggered: true,
                    success: true,
                    assignment: result.assignment,
                    urgencyScore,
                    urgencyLevel
                };
            } else {
                console.log(`[EmergencyTrigger] ⚠️ Emergency detected but no NGO found.`);
                return {
                    autoTriggered: true,
                    success: false,
                    reason: "NO_NGO_AVAILABLE",
                    urgencyScore,
                    urgencyLevel
                };
            }
        }

        // No action needed
        return {
            autoTriggered: false,
            urgencyScore,
            urgencyLevel
        };

    } catch (error) {
        console.error("[EmergencyTrigger] Error:", error);
        return {
            autoTriggered: false,
            error: error.message
        };
    }
};

module.exports = {
    checkAndTriggerAutoAssignment
};
