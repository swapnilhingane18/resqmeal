const Food = require("../models/Food");
const { calculateUrgency } = require("./urgency.service");
const { findAndAssignBestNGO } = require("../controllers/assignmentController");

/**
 * Sweeps through all available food items, recalculates urgency, 
 * and triggers auto-assignment if EMERGENCY level is detected.
 * 
 * @returns {Promise<Object>} Scan results
 */
const runEmergencyScan = async () => {
    const startTime = Date.now();

    // 1. Fetch available food
    // We only care about food that is currently 'available'.
    // If it's already assigned, we don't touch it.
    const foods = await Food.find({ status: "available" });

    const scannedItems = foods.length;
    let emergencyFound = 0;
    let autoAssignedCount = 0;
    const assignedDetails = [];

    console.log(`[EmergencyScan] Starting scan of ${scannedItems} items...`);

    // 2. Iterate and Process
    for (const food of foods) {
        try {
            // Recalculate urgency
            const { urgencyLevel, urgencyScore } = calculateUrgency(food);

            // Check if EMERGENCY
            if (urgencyLevel === "EMERGENCY") {
                emergencyFound++;

                // Double check status (idempotency) although we fetched 'available'
                // In a high concurrency env, we might want a re-fetch, but for this:
                if (food.status === "available" && !food.isAutoAssigned) {
                    console.log(`[EmergencyScan] 🚨 Found EMERGENCY item ${food._id} (Score: ${urgencyScore}). Attempting auto-assign...`);

                    // Call Allocation Service (reusing controller logic as requested)
                    // We pass { autoAssign: true } to flag it in the DB
                    const result = await findAndAssignBestNGO(food, { autoAssign: true });

                    if (result.assignment) {
                        autoAssignedCount++;
                        assignedDetails.push({
                            foodId: food._id,
                            ngoName: result.assignment.ngo?.name || "Unknown NGO",
                            urgencyScore
                        });
                        console.log(`[EmergencyScan] ✅ Assigned to ${result.assignment.ngo?.name}`);
                    } else {
                        console.log(`[EmergencyScan] ⚠️ Could not assign item ${food._id} (No NGO available?)`);
                    }
                }
            }
        } catch (err) {
            console.error(`[EmergencyScan] Error processing food ${food._id}:`, err);
            // Continue scanning others even if one fails
        }
    }

    const endTime = Date.now();
    const scanDurationMs = endTime - startTime;

    console.log(`[EmergencyScan] Completed in ${scanDurationMs}ms. Auto-assigned: ${autoAssignedCount}`);

    return {
        scannedItems,
        emergencyFound,
        autoAssignedCount,
        scanDurationMs,
        assignedDetails
    };
};

module.exports = {
    runEmergencyScan
};
