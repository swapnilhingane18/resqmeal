const mongoose = require('mongoose');
const User = require('./models/User');
const NGO = require('./models/NGO');
require('dotenv').config();

const debugNGO = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 1. Create Dummy User
        const email = `debug_user_${Date.now()}@test.com`;
        console.log(`Creating User: ${email}`);

        const user = await User.create({
            name: "Debug User",
            email: email,
            password: "password123",
            role: "NGO"
        });

        console.log(`User created: ${user._id}`);

        // 2. Attempt NGO Creation (Copy-paste logic from controller)
        console.log("Attempting NGO Creation...");

        try {
            const ngo = await NGO.create({
                user: user._id,
                name: user.name,
                email: user.email,
                contact: "Not Provided",
                lat: 18.5204,
                lng: 73.8567,
                status: "active"
            });
            console.log("✅ NGO Created Successfully:", ngo._id);
        } catch (ngoError) {
            console.error("❌ NGO Creation Failed:", ngoError);
        }

    } catch (err) {
        console.error("❌ General Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Done.");
    }
};

debugNGO();
