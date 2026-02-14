const User = require("../models/User");
const NGO = require("../models/NGO");
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

const getMapData = async (req, res, next) => {
  try {
    const [donorDocs, ngoDocs, foodDocs] = await Promise.all([
      User.find({ role: { $in: ["DONOR", "donor"] } })
        .select("_id name role location")
        .lean(),
      NGO.find({})
        .select("_id name status lat lng")
        .lean(),
      Food.find({})
        .select("_id description type status lat lng")
        .lean(),
    ]);

    const donors = donorDocs.map((donor) => ({
      _id: donor._id,
      name: donor.name,
      role: donor.role,
      location: donor.location || null,
    }));

    const ngos = ngoDocs.map((ngo) => ({
      _id: ngo._id,
      name: ngo.name,
      active: ngo.status === "active",
      lat: ngo.lat,
      lng: ngo.lng,
    }));

    const food = foodDocs.map((item) => ({
      _id: item._id,
      description: item.description || item.type || "Food item",
      status: item.status,
      lat: item.lat,
      lng: item.lng,
    }));

    return res.status(200).json({ donors, ngos, food });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSummary,
  getMapData,
};
