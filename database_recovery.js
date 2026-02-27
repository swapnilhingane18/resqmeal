const mongoose = require("mongoose");
require("dotenv").config();
const NGO = require("./models/NGO");
const Food = require("./models/Food");
const User = require("./models/User");

const runRecovery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🟢 Connected to MongoDB for Recovery");

        // ----------------------------------------------------
        // STEP 1: HARD RESET NGO COLLECTION
        // ----------------------------------------------------
        console.log("\\n==================================");
        console.log("🧹 STEP 1 — CLEANING NGO COLLECTION");
        console.log("==================================");

        // Clear old NGOs to completely eliminate schema divergence
        await NGO.deleteMany({});

        let user1 = await User.create({ name: "Demo User 1", email: "pune1@demo.com", password: "password123", role: "NGO" });
        let user2 = await User.create({ name: "Demo User 2", email: "deccan2@demo.com", password: "password123", role: "NGO" });
        let user3 = await User.create({ name: "Demo User 3", email: "baner3@demo.com", password: "password123", role: "NGO" });

        // Insert 2 Active NGOs near Pune
        const activeNGO1 = await NGO.create({
            name: "Pune Central Relief",
            location: {
                type: "Point",
                coordinates: [73.8567, 18.5204] // [lng, lat]
            },
            contact: "1234567890",
            email: "pune1@demo.com",
            status: "active",
            capacity: 50,
            user: user1._id
        });

        const activeNGO2 = await NGO.create({
            name: "Deccan Food Reserve",
            location: {
                type: "Point",
                coordinates: [73.8296, 18.5144] // [lng, lat]
            },
            contact: "0987654321",
            email: "deccan2@demo.com",
            status: "active",
            capacity: 25,
            user: user2._id
        });

        // Insert 1 Inactive NGO near Pune
        const inactiveNGO = await NGO.create({
            name: "Baner Dormant Trust",
            location: {
                type: "Point",
                coordinates: [73.7766, 18.5590] // [lng, lat]
            },
            contact: "1112223333",
            email: "baner3@demo.com",
            status: "inactive",
            capacity: 10,
            user: user3._id
        });

        console.log("✅ 3 new Geo-compliant NGOs created.");

        // ----------------------------------------------------
        // STEP 2: VERIFY INDEXES
        // ----------------------------------------------------
        console.log("\\n==================================");
        console.log("⚙ STEP 2 — INDEX VERIFICATION");
        console.log("==================================");

        // Sync Indexes to force build if missing
        await NGO.syncIndexes();
        await Food.syncIndexes();

        const ngoIndexes = await NGO.collection.indexes();
        const foodIndexes = await Food.collection.indexes();

        const dbNgoGeoIdx = ngoIndexes.some(i => JSON.stringify(i.key).includes('2dsphere'));
        const dbFoodGeoIdx = foodIndexes.some(i => JSON.stringify(i.key).includes('2dsphere'));

        // ----------------------------------------------------
        // STEP 3: OPTIONAL FOOD CLEANUP
        // ----------------------------------------------------
        console.log("\\n==================================");
        console.log("🧹 STEP 3 — CLEANING LEGACY FOOD");
        console.log("==================================");

        // Find any Food missing the exact required geospatial coordinates path
        const legacyFoodQuery = {
            $or: [
                { location: { $exists: false } }, // No location wrapper
                { "location.coordinates": { $exists: false } }, // Missing coordinates array
                { "location.coordinates": { $size: 0 } }, // Empty array
                { lat: { $exists: true } }, // Legacy properties exist
                { lng: { $exists: true } }
            ]
        };

        const deletedFoodRes = await Food.deleteMany(legacyFoodQuery);
        console.log(`✅ Cleaned ${deletedFoodRes.deletedCount} legacy Food documents.`);


        // ----------------------------------------------------
        // FINAL REPORT
        // ----------------------------------------------------
        console.log("\\n==================================");
        console.log("📄 RECOVERY REPORT");
        console.log("==================================");
        console.log(`- Total NGOs Recreated: 3`);
        console.log(`- Sample NGO Coordinates: ${JSON.stringify(activeNGO1.location)}`);
        console.log(`- NGO 2dsphere Index Exists: ${dbNgoGeoIdx}`);
        console.log(`- Food 2dsphere Index Exists: ${dbFoodGeoIdx}`);
        console.log(`- Invalid Legacy Foods Purged: ${deletedFoodRes.deletedCount}`);

        process.exit(0);

    } catch (err) {
        console.error("Recovery Error:", err);
        process.exit(1);
    }
};

runRecovery();
