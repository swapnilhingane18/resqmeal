const User = require("../models/User");
const Food = require("../models/Food");
const Assignment = require("../models/Assignment");

const getSummary = async (req, res, next) => {
  try {
    const [totalDonors, totalNGOs, totalFood, totalAssignments, assignedFoodIds] =
      await Promise.all([
        User.countDocuments({ role: { $in: ["DONOR", "donor"] } }),
        User.countDocuments({ role: { $in: ["NGO", "ngo"] } }),
        Food.countDocuments({}),
        Assignment.countDocuments({}),
        Assignment.distinct("food"),
      ]);

    const unassignedFood = await Food.countDocuments({
      $or: [
        { _id: { $nin: assignedFoodIds } },
        { status: { $in: ["unassigned", "available"] } },
      ],
    });

    return res.status(200).json({
      totalDonors,
      totalNGOs,
      totalFood,
      totalAssignments,
      unassignedFood,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSummary,
};
