const Assignment = require("../../models/Assignment");
const Food = require("../../models/Food");
const { findAndAssignBestNGO } = require("../../controllers/assignmentController");

const processExpiredAssignments = async () => {
    try {
        const expiredAssignments = await Assignment.find({
            status: "pending",
            expiresAt: { $lt: new Date() }
        });

        if (expiredAssignments.length === 0) return;

        console.log(`[expiry] Found ${expiredAssignments.length} expired assignments`);

        for (const assignment of expiredAssignments) {
            console.log("[expiry] Found expired assignment:", assignment._id);
            const food = await Food.findById(assignment.food);

            await Assignment.deleteOne({ _id: assignment._id });

            if (food && food.status !== "delivered") {
                food.status = "available";
                food.assignedNgo = null;
                food.isAutoAssigned = false;
                await food.save();

                console.log("[expiry] Reassigning food:", assignment.food);
                await findAndAssignBestNGO(food, { autoAssign: true });
            }
        }
    } catch (error) {
        console.error(`[expiry] Error processing expired assignments: ${error.message}`);
    }
};

module.exports = { processExpiredAssignments };
