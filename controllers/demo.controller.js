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
        .select("_id name status location")
        .lean(),
      NGO.find({})
        .select("_id name status location")
        .lean(),
      Food.find({
        $or: [
          { status: { $ne: "expired" } },
          { status: "expired", updatedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } }
        ]
      })
        .select("_id description type status location")
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
      lat: ngo.location?.coordinates?.[1] || 0,
      lng: ngo.location?.coordinates?.[0] || 0,
    }));

    const food = foodDocs.map((item) => ({
      _id: item._id,
      description: item.description || item.type || "Food item",
      status: item.status,
      lat: item.location?.coordinates?.[1] || 0,
      lng: item.location?.coordinates?.[0] || 0,
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
    // Clear ONLY Demo Data (do not corrupt real assignment history)
    await Food.deleteMany({});
    await NGO.deleteMany({});

    // Keep existing users, just recreate matching demo ones or rely on defaults.
    // Ensure we delete our demo users so they don't block unique constraints
    await User.deleteMany({ email: { $regex: "demo" } });

    // Create 1 Donor
    const donor1 = await User.create({
      name: "Demo Donor HQ",
      email: "donor1@demo.com",
      password: "password123",
      role: "DONOR",
    });

    // Create 3 NGO Users (2 active, 1 inactive)
    const ngoUser1 = await User.create({
      name: "Demo Active NGO 1",
      email: "ngo1@demo.com",
      password: "password123",
      role: "NGO",
    });

    const ngoUser2 = await User.create({
      name: "Demo Active NGO 2",
      email: "ngo2@demo.com",
      password: "password123",
      role: "NGO",
    });

    const ngoUser3 = await User.create({
      name: "Demo Inactive NGO",
      email: "ngo3@demo.com",
      password: "password123",
      role: "NGO",
    });

    // Create NGO Profiles
    // 2 Active NGOs
    const ngoProfile1 = await NGO.create({
      name: "Demo Active NGO 1 Foundation",
      location: {
        type: "Point",
        coordinates: [72.877, 19.076],
      },
      contact: "1234567890",
      email: "ngo1@demo.com",
      capacity: 50,
      status: "active",
      user: ngoUser1._id,
    });
    console.log("Created NGO 1:", ngoProfile1);

    const ngoProfile2 = await NGO.create({
      name: "Demo Active NGO 2 Relief",
      location: {
        type: "Point",
        coordinates: [72.880, 19.080],
      },
      contact: "0987654321",
      email: "ngo2@demo.com",
      capacity: 50,
      status: "active",
      user: ngoUser2._id,
    });

    // 1 Inactive NGO
    const ngoProfile3 = await NGO.create({
      name: "Demo Inactive NGO Trust",
      location: {
        type: "Point",
        coordinates: [72.860, 19.090],
      },
      contact: "1112223334",
      email: "ngo3@demo.com",
      capacity: 50,
      status: "inactive",
      user: ngoUser3._id,
    });

    // Create 6 Foods
    const foods = await Food.insertMany([
      // EMERGENCY (1 auto, 1 manual)
      {
        type: "cooked",
        quantity: 50,
        location: {
          type: "Point",
          coordinates: [72.875, 19.075],
        },
        expiresAt: new Date(now + 1 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id },
      },
      {
        type: "prepared",
        quantity: 60,
        location: {
          type: "Point",
          coordinates: [72.878, 19.078],
        },
        expiresAt: new Date(now + 1.5 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id }, // Updated to single donor
      },

      // CRITICAL
      {
        type: "packaged",
        quantity: 100,
        location: {
          type: "Point",
          coordinates: [72.881, 19.081],
        },
        expiresAt: new Date(now + 6 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id },
      },
      {
        type: "cooked",
        quantity: 40,
        location: {
          type: "Point",
          coordinates: [72.872, 19.072],
        },
        expiresAt: new Date(now + 8 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id }, // Updated to single donor
      },

      // STABLE
      {
        type: "raw",
        quantity: 20,
        location: {
          type: "Point",
          coordinates: [72.885, 19.085],
        },
        expiresAt: new Date(now + 50 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id },
      },
      {
        type: "raw",
        quantity: 25,
        location: {
          type: "Point",
          coordinates: [72.888, 19.088],
        },
        expiresAt: new Date(now + 72 * HOUR),
        foodExpiresAt: new Date(now + 3 * HOUR),
        donor: { user: donor1._id }, // Updated to single donor
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