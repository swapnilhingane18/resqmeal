const User = require("../models/User");
const NGO = require("../models/NGO");
const Food = require("../models/Food");
const Assignment = require("../models/Assignment");
const { autoAssignFood } = require("../services/reassignment/autoAssign.service");

// ----------------------
// EXISTING SUMMARY API
// ----------------------
const getSummary = async (req, res, next) => {
  try {
    const [
      totalDonors,
      totalNGOs,
      totalFood,
      totalAssignments,
      assignedFoodIds,
    ] = await Promise.all([
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

// ----------------------
// EXISTING MAP API
// ----------------------
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

// ----------------------
// 🎭 MAX DRAMA DEMO SEED
// ----------------------
const loadPresentationData = async (req, res, next) => {
  try {
    // Clear all data
    await Assignment.deleteMany({});
    await Food.deleteMany({});
    await NGO.deleteMany({});
    await User.deleteMany({});

    // Create Donors
    const donor1 = await User.create({
      name: "Demo Donor 1",
      email: "donor1@demo.com",
      password: "password123",
      role: "DONOR",
    });

    const donor2 = await User.create({
      name: "Demo Donor 2",
      email: "donor2@demo.com",
      password: "password123",
      role: "DONOR",
    });

    // Create NGO Users
    const ngoUser1 = await User.create({
      name: "Demo NGO 1",
      email: "ngo1@demo.com",
      password: "password123",
      role: "NGO",
    });

    const ngoUser2 = await User.create({
      name: "Demo NGO 2",
      email: "ngo2@demo.com",
      password: "password123",
      role: "NGO",
    });

    // Create NGO Profiles
    const ngoProfile1 = await NGO.create({
      name: "Demo NGO 1 Foundation",
      lat: 19.076,
      lng: 72.877,
      contact: "1234567890",
      email: "ngo1@demo.com",
      capacity: 200,
      status: "active",
      user: ngoUser1._id,
    });
    console.log("Created NGO 1:", ngoProfile1);

    const ngoProfile2 = await NGO.create({
      name: "Demo NGO 2 Relief",
      lat: 19.080,
      lng: 72.880,
      contact: "0987654321",
      email: "ngo2@demo.com",
      capacity: 200,
      status: "active",
      user: ngoUser2._id,
    });
    console.log("Created NGO 2:", ngoProfile2);

    const now = Date.now();
    const HOUR = 60 * 60 * 1000;

    // Create 6 Foods
    const foods = await Food.insertMany([
      // EMERGENCY (1 auto, 1 manual)
      {
        type: "cooked",
        quantity: 50,
        lat: 19.075,
        lng: 72.875,
        expiresAt: new Date(now + 1 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id },
      },
      {
        type: "prepared",
        quantity: 60,
        lat: 19.078,
        lng: 72.878,
        expiresAt: new Date(now + 1.5 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor2._id },
      },

      // CRITICAL
      {
        type: "packaged",
        quantity: 100,
        lat: 19.081,
        lng: 72.881,
        expiresAt: new Date(now + 6 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id },
      },
      {
        type: "cooked",
        quantity: 40,
        lat: 19.072,
        lng: 72.872,
        expiresAt: new Date(now + 8 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor2._id },
      },

      // STABLE
      {
        type: "raw",
        quantity: 20,
        lat: 19.085,
        lng: 72.885,
        expiresAt: new Date(now + 50 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id },
      },
      {
        type: "raw",
        quantity: 25,
        lat: 19.088,
        lng: 72.888,
        expiresAt: new Date(now + 72 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor2._id },
      },
    ]);

    // 🔥 AUTO-ASSIGN ALL SEEDED FOODS
    for (const food of foods) {
      await autoAssignFood(food._id);
    }

    const assignmentsCreated = await Assignment.countDocuments();

    res.status(201).json({
      message: "Presentation dataset loaded",
      assignmentsCreated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getMapData,
  loadPresentationData,
};