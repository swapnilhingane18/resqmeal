const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

// Verification Data
const TEST_NGO = {
    name: `Test NGO ${Date.now()}`,
    email: `testngo${Date.now()}@example.com`,
    password: 'password123',
    role: 'NGO'
};

const verifySystem = async () => {
    try {
        console.log("1. Testing NGO Registration...");

        // 1. Register User
        const regRes = await axios.post(`${BASE_URL}/auth/register`, TEST_NGO);

        if (regRes.status === 201 && regRes.data.token) {
            console.log(`   ✅ User Registered: ${regRes.data.email} (ID: ${regRes.data._id})`);

            // Check if NGO profile exists (Implicitly confirmed if we can use NGO-only endpoints later, or explicit DB check)
            // For now, we trust the controller logic we just wrote, but let's try to hit the scan endpoint which requires NGO/Admin role.
        } else {
            console.error("   ❌ Registration Failed:", regRes.data);
            return;
        }

        const token = regRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log("\n2. Testing Manual Emergency Scan (Protected Route)...");

        // 2. Trigger Scan
        const scanRes = await axios.post(`${BASE_URL}/emergency/scan`, {}, config);

        if (scanRes.status === 200 && scanRes.data.data) {
            console.log("   ✅ Scan Successful!");
            console.log("   📊 Result:", scanRes.data.data);
        } else {
            console.error("   ❌ Scan Failed:", scanRes.data);
        }

    } catch (error) {
        console.error("❌ Verification Failed:", error.response?.data || error.message);
    }
};

verifySystem();
