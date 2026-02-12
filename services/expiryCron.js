const mongoose = require("mongoose");
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

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const now = new Date();

      const foodsToExpire = await Food.find({
        expiresAt: { $lt: now },
        status: { $nin: ["delivered", "expired"] },
      })
        .select("_id")
        .session(session);

      if (!foodsToExpire.length) {
        await session.abortTransaction();
        return;
      }

      const foodIds = foodsToExpire.map((f) => f._id);

      await Food.updateMany(
        { _id: { $in: foodIds } },
        { $set: { status: "expired" } },
        { session }
      );

      const relatedAssignments = await Assignment.find({
        food: { $in: foodIds },
        status: { $in: ["pending", "accepted"] },
      })
        .select("_id ngo")
        .session(session);

      if (relatedAssignments.length) {
        const assignmentIds = relatedAssignments.map((a) => a._id);
        await Assignment.updateMany(
          { _id: { $in: assignmentIds } },
          { $set: { status: "expired" } },
          { session }
        );

        const ngoRecoveries = relatedAssignments.reduce((acc, assignment) => {
          if (!assignment.ngo) return acc;
          const ngoId = assignment.ngo.toString();
          acc[ngoId] = (acc[ngoId] || 0) + 1;
          return acc;
        }, {});

        for (const [ngoId, increment] of Object.entries(ngoRecoveries)) {
          await NGO.updateOne(
            { _id: ngoId },
            { $inc: { capacity: increment } },
            { session }
          );
        }
      }

      await session.commitTransaction();
      console.log("[expiryCron] transaction committed", {
        expiredFoodCount: foodIds.length,
        expiredAssignmentCount: relatedAssignments.length,
      });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      console.error("[expiryCron] transaction aborted", {
        message: err.message,
        stack: err.stack,
      });
    } finally {
      session.endSession();
      running = false;
    }
  });

  job.start();
  return job;
};

const stopExpiryCron = () => {
  if (job) {
    job.stop();
    job = null;
  }
};

module.exports = { initExpiryCron, stopExpiryCron };
