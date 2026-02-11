const cron = require("node-cron");
const Food = require("../models/Food");
const Assignment = require("../models/Assignment");
const NGO = require("../models/NGO");

let job = null;
let running = false;

const initExpiryCron = () => {
  if (job) {
    return job;
  }

  job = cron.schedule("*/5 * * * *", async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();

      const foodsToExpire = await Food.find({
        expiresAt: { $lt: now },
        status: { $nin: ["delivered", "expired"] }
      });

      if (!foodsToExpire.length) {
        running = false;
        return;
      }

      const foodIds = foodsToExpire.map(f => f._id);

      await Food.updateMany(
        { _id: { $in: foodIds } },
        { $set: { status: "expired" } }
      );

      const relatedAssignments = await Assignment.find({
        food: { $in: foodIds },
        status: { $in: ["pending", "accepted"] }
      }).populate("ngo");

      if (relatedAssignments.length) {
        const assignmentIds = relatedAssignments.map(a => a._id);
        await Assignment.updateMany(
          { _id: { $in: assignmentIds } },
          { $set: { status: "rejected" } }
        );

        const incOps = relatedAssignments
          .filter(a => a.ngo && a.ngo._id)
          .map(a => NGO.findByIdAndUpdate(a.ngo._id, { $inc: { capacity: 1 } }));

        if (incOps.length) {
          await Promise.all(incOps);
        }
      }
    } catch (err) {
      console.error("[expiryCron] error:", err.message);
    } finally {
      running = false;
    }
  });

  job.start();
  return job;
};

module.exports = { initExpiryCron };
