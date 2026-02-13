const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");
const NGO = require("../models/NGO");
const Food = require("../models/Food");
const Assignment = require("../models/Assignment");
const { findAndAssignBestNGO } = require("../controllers/assignmentController");

const DEMO_PASSWORD = "Demo@123";

const DONOR_SEED = [
  {
    name: "Demo Donor One",
    email: "donor1@example.com",
    role: "DONOR",
  },
  {
    name: "Demo Donor Two",
    email: "donor2@example.com",
    role: "DONOR",
  },
];

const NGO_USER_SEED = [
  {
    name: "Demo NGO User One",
    email: "ngo1@example.com",
    role: "NGO",
  },
  {
    name: "Demo NGO User Two",
    email: "ngo2@example.com",
    role: "NGO",
  },
];

const NGO_PROFILE_SEED = [
  {
    userEmail: "ngo1@example.com",
    name: "Hope Kitchen NGO",
    lat: 19.0887,
    lng: 72.8679,
    avgResponseTime: 12,
    contact: "+91-9000000001",
    email: "ngo1@example.com",
    capacity: 2,
    status: "active",
  },
  {
    userEmail: "ngo2@example.com",
    name: "Care Share Foundation",
    lat: 19.0267,
    lng: 72.8553,
    avgResponseTime: 18,
    contact: "+91-9000000002",
    email: "ngo2@example.com",
    capacity: 1,
    status: "active",
  },
];

const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const buildFoodSeed = (now) => [
  {
    donorEmail: "donor1@example.com",
    type: "cooked",
    quantity: 30,
    unit: "portions",
    description: "Fresh cooked meals (high urgency)",
    lat: 19.0908,
    lng: 72.8602,
    expiresAt: addHours(now, 2).toISOString(),
    notes: "Very short shelf life",
  },
  {
    donorEmail: "donor1@example.com",
    type: "packaged",
    quantity: 12,
    unit: "boxes",
    description: "Packaged snack kits",
    lat: 19.0282,
    lng: 72.8504,
    expiresAt: addHours(now, 10).toISOString(),
    notes: "Easy transportation",
  },
  {
    donorEmail: "donor2@example.com",
    type: "raw",
    quantity: 18,
    unit: "kg",
    description: "Raw vegetables stock",
    lat: 19.1128,
    lng: 72.9104,
    expiresAt: addHours(now, 26).toISOString(),
    notes: "Lower urgency, larger quantity",
  },
  {
    donorEmail: "donor2@example.com",
    type: "prepared",
    quantity: 8,
    unit: "boxes",
    description: "Prepared meal kits (medium urgency)",
    lat: 19.0728,
    lng: 72.8826,
    expiresAt: addHours(now, 6).toISOString(),
    notes: "Moderate urgency",
  },
];

const clearCollections = async () => {
  await Assignment.deleteMany({});
  await Food.deleteMany({});
  await NGO.deleteMany({});
  await User.deleteMany({});
};

const createUsers = async (seedUsers) => {
  const created = await User.create(
    seedUsers.map((user) => ({
      ...user,
      password: DEMO_PASSWORD,
    }))
  );

  const byEmail = new Map();
  created.forEach((user) => byEmail.set(user.email, user));
  return { created, byEmail };
};

const createNgos = async (seedProfiles, ngoUsersByEmail) => {
  const ngoPayload = seedProfiles.map((profile) => {
    const { userEmail, ...ngoData } = profile;
    const user = ngoUsersByEmail.get(userEmail);
    if (!user) {
      throw new Error(`Missing NGO user for profile ${userEmail}`);
    }

    return {
      ...ngoData,
      user: user._id,
    };
  });

  return NGO.create(ngoPayload);
};

const createFoods = async (seedFoods, donorsByEmail) => {
  const foodPayload = seedFoods.map((item) => {
    const donorUser = donorsByEmail.get(item.donorEmail);
    if (!donorUser) {
      throw new Error(`Missing donor user for food seed ${item.donorEmail}`);
    }

    return {
      type: item.type,
      quantity: item.quantity,
      unit: item.unit,
      description: item.description,
      lat: item.lat,
      lng: item.lng,
      expiresAt: item.expiresAt,
      notes: item.notes,
      donor: {
        user: donorUser._id,
        name: donorUser.name,
        email: donorUser.email,
        contact: donorUser.email,
      },
    };
  });

  return Food.create(foodPayload);
};

const allocateFoods = async (foods) => {
  let assignmentsGenerated = 0;

  for (const food of foods) {
    const result = await findAndAssignBestNGO(food._id);
    if (result.assignment) {
      assignmentsGenerated += 1;
    }
  }

  return assignmentsGenerated;
};

const runDemoSeed = async () => {
  try {
    await connectDB();

    await clearCollections();

    const donorResult = await createUsers(DONOR_SEED);
    const ngoUserResult = await createUsers(NGO_USER_SEED);

    const ngos = await createNgos(NGO_PROFILE_SEED, ngoUserResult.byEmail);
    const foodSeed = buildFoodSeed(new Date());
    const foods = await createFoods(foodSeed, donorResult.byEmail);
    const assignmentsGenerated = await allocateFoods(foods);
    const unassignedFoods = await Food.countDocuments({ status: "available" });

    console.log(`✔ ${donorResult.created.length} Donors created`);
    console.log(`✔ ${ngos.length} NGOs created`);
    console.log(`✔ ${foods.length} Food items created`);
    console.log(`✔ ${assignmentsGenerated} Assignments generated`);
    console.log(`✔ ${unassignedFoods} Food items unassigned`);
    console.log("=== RESQMEAL DEMO SEED COMPLETE ===");
  } catch (error) {
    console.error("[demo_seed] failed:", error.stack || error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

runDemoSeed();
