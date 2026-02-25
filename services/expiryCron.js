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

  job = cron.schedule("* * * * *", async () => {
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

      // 2. NGO 2-Minute Escalation Sweep
      const timedOutFoods = await Food.find({
        status: "pending_acceptance",
        acceptanceExpiresAt: { $lt: now }
      }).select("_id candidateQueue assignedNgo district").session(session);

      if (timedOutFoods.length) {
        for (const food of timedOutFoods) {
          const updatedAssignment = await Assignment.findOneAndUpdate(
            { food: food._id, status: "pending", ngo: food.assignedNgo },
            { $set: { status: "timed_out", completedAt: now, rejectedAt: now } },
            { session, new: false } // return original or just don't need 'new' true. We just need to know existing depth
          );

          if (updatedAssignment && food.assignedNgo) {
            await NGO.updateOne(
              { _id: food.assignedNgo },
              { $inc: { capacity: 1 } },
              { session }
            );
          }

          const nextDepth = updatedAssignment ? (updatedAssignment.escalationDepth || 0) + 1 : 1;

          if (food.candidateQueue && food.candidateQueue.length > 0) {
            const nextNgoId = food.candidateQueue.shift();

            await Food.updateOne({ _id: food._id }, {
              $set: {
                assignedNgo: nextNgoId,
                acceptanceExpiresAt: new Date(now.getTime() + 2 * 60 * 1000),
                candidateQueue: food.candidateQueue
              }
            }, { session });

            await NGO.updateOne({ _id: nextNgoId }, { $inc: { capacity: -1 } }, { session });

            await Assignment.create([{
              food: food._id,
              ngo: nextNgoId,
              score: 0,
              distance: 0,
              timeUrgency: 0,
              responseScore: 0,
              status: "pending",
              escalationDepth: nextDepth,
              district: food.district || "Pune",
              expiresAt: new Date(now.getTime() + 2 * 60 * 1000)
            }], { session });
          } else {
            await Food.updateOne({ _id: food._id }, {
              $set: { status: "available", assignedNgo: null, isAutoAssigned: false },
              $unset: { acceptanceExpiresAt: 1 }
            }, { session });
          }
        }
      }

      await session.commitTransaction();
      console.log("[expiryCron] transaction committed", {
        expiredFoodCount: foodIds?.length || 0,
        expiredAssignmentCount: relatedAssignments?.length || 0,
        escalatedFoodCount: timedOutFoods?.length || 0
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
