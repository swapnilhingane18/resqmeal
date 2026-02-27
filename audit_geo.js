const mongoose = require("mongoose");
require("dotenv").config();
const NGO = require("./models/NGO");
const Food = require("./models/Food");

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Audit...");

        // Old Document Detection
        const totalNGOS = await NGO.countDocuments();
        const missingGeoJSON = await NGO.countDocuments({ location: { $exists: false } });
        const primitiveLatLng = await NGO.countDocuments({
            $or: [
                { lat: { $exists: true } },
                { lng: { $exists: true } }
            ]
        });

        console.log("=== Old Document Report ===");
        console.log(`Total NGOs: ${totalNGOS}`);
        console.log(`NGOs missing GeoJSON (location): ${missingGeoJSON}`);
        console.log(`NGOs still using primitive lat/lng: ${primitiveLatLng}`);
        console.log("===========================");

        process.exit(0);
    } catch (err) {
        console.error("Audit Error:", err);
        process.exit(1);
    }
};

runAudit();
