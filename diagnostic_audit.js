const mongoose = require("mongoose");
require("dotenv").config();
const NGO = require("./models/NGO");
const Food = require("./models/Food");

const runDiagnostics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🟢 Connected to MongoDB for Diagnostics\\n");

        // ----------------------------------------------------
        // STEP 1: VERIFY FOOD DOCUMENTS
        // ----------------------------------------------------
        console.log("==================================\\n🔍 STEP 1 — VERIFY FOOD DOCUMENTS\\n==================================");
        const foods = await Food.find({}).sort({ createdAt: -1 }).limit(5).lean();
        if (foods.length === 0) console.log("No Food documents found.");
        foods.forEach((f, i) => {
            console.log(`Food #${i + 1}:`);
            console.log(`  _id: ${f._id}`);
            console.log(`  status: ${f.status}`);
            console.log(`  type/desc: ${f.type} / ${f.description}`);
            if (f.location) {
                console.log(`  location.type: ${f.location.type}`);
                console.log(`  location.coordinates: [${f.location.coordinates[0]}, ${f.location.coordinates[1]}]  // [lng, lat]`);
            } else {
                console.log("  location: MISSING");
            }
            if (f.lat !== undefined) console.log(`  lat primitive: ${f.lat}`);
            if (f.lng !== undefined) console.log(`  lng primitive: ${f.lng}`);
            console.log("");
        });


        // ----------------------------------------------------
        // STEP 2: VERIFY NGO DOCUMENTS
        // ----------------------------------------------------
        console.log("==================================\\n🔍 STEP 2 — VERIFY NGO DOCUMENTS\\n==================================");
        const ngos = await NGO.find({}).lean();
        let validGeoCount = 0;
        let missingGeoCount = 0;
        let oldFormatCount = 0;

        ngos.forEach((n, i) => {
            console.log(`NGO #${i + 1}:`);
            console.log(`  _id: ${n._id}`);
            console.log(`  name: ${n.name}`);
            console.log(`  status: ${n.status}`);
            console.log(`  capacity: ${n.capacity}`);

            let hasValidGeo = false;
            if (n.location && n.location.type === "Point" && Array.isArray(n.location.coordinates)) {
                console.log(`  location: [${n.location.coordinates[0]}, ${n.location.coordinates[1]}]  // [lng, lat]`);
                hasValidGeo = true;
                validGeoCount++;
            } else {
                console.log("  location: MISSING or INVALID");
                missingGeoCount++;
            }

            if (n.lat !== undefined || n.lng !== undefined) {
                console.log(`  primitive lat/lng: lat=${n.lat}, lng=${n.lng}`);
                oldFormatCount++;
            }
            console.log("");
        });

        console.log(`--- NGO Summary ---`);
        console.log(`Total NGOs: ${ngos.length}`);
        console.log(`Valid GeoJSON location: ${validGeoCount}`);
        console.log(`Missing location: ${missingGeoCount}`);
        console.log(`Has primitive lat/lng: ${oldFormatCount}`);
        console.log("");


        // ----------------------------------------------------
        // STEP 5: INDEX VALIDATION
        // ----------------------------------------------------
        console.log("==================================\\n🔍 STEP 5 — INDEX VALIDATION\\n==================================");
        const foodIndexes = await Food.collection.indexes();
        const ngoIndexes = await NGO.collection.indexes();

        console.log("Food Indexes:");
        foodIndexes.forEach(idx => console.log(`  - name: ${idx.name}, key: ${JSON.stringify(idx.key)}`));

        console.log("\\nNGO Indexes:");
        ngoIndexes.forEach(idx => console.log(`  - name: ${idx.name}, key: ${JSON.stringify(idx.key)}`));
        console.log("");

        // Simulate assignment geoquery
        if (foods.length > 0) {
            console.log("==================================\\n🔍 STEP 3 — ASSIGNMENT QUERY TEST\\n==================================");
            const latestFood = foods[0];
            console.log(`Testing query with Food ${latestFood._id} coordinates...`);

            let geoQuery = {};
            if (latestFood.location && latestFood.location.coordinates && latestFood.location.coordinates.length === 2) {
                geoQuery = {
                    location: {
                        $near: {
                            $geometry: latestFood.location,
                            $maxDistance: 10000
                        }
                    }
                };
                console.log(`GeoQuery built:`, JSON.stringify(geoQuery));

                try {
                    const matchedNgos = await NGO.find({
                        status: "active",
                        capacity: { $gt: 0 },
                        ...geoQuery
                    }).lean();
                    console.log(`Found ${matchedNgos.length} active NGOs within 10km using $near.`);
                } catch (err) {
                    console.error("GeoQuery FAILED:", err.message);
                }
            } else {
                console.log("Cannot test GeoQuery: Latest food lacks valid location coordinates.");
            }

            const noGeoNgos = await NGO.find({ status: "active" }).lean();
            console.log(`Baseline Active NGOs (without Geo constraints): ${noGeoNgos.length}`);
        }


        // Simulate Map Endpoint filter
        console.log("\\n==================================\\n🔍 STEP 4 — MAP ENDPOINT SIMULATION\\n==================================");
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const mapFoods = await Food.find({
            $or: [
                { status: { $ne: "expired" } },
                { status: "expired", updatedAt: { $gte: oneHourAgo } }
            ]
        }).select("_id description type status location").lean();
        console.log(`MAP FOOD COUNT: ${mapFoods.length}`);
        if (mapFoods.length > 0) {
            console.log("Sample Map Food Object:");
            console.log(JSON.stringify(mapFoods[0], null, 2));
        }


        process.exit(0);
    } catch (err) {
        console.error("Audit Error:", err);
        process.exit(1);
    }
};

runDiagnostics();
