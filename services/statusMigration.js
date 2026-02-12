const Assignment = require("../models/Assignment");

const normalizeAssignmentStatuses = async () => {
  const result = await Assignment.updateMany(
    { status: "assigned" },
    { $set: { status: "pending" } }
  );

  if (result.modifiedCount > 0) {
    console.log("[migration] normalized legacy assignment statuses", {
      from: "assigned",
      to: "pending",
      count: result.modifiedCount,
    });
  } else {
    console.log("[migration] no legacy assignment statuses found");
  }
};

module.exports = { normalizeAssignmentStatuses };
