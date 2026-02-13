const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:3000/api';

const donorUser = {
    name: 'Test Donor',
    email: `donor_${Date.now()}@test.com`,
    password: 'password123',
    role: 'DONOR'
};

const ngoUser = {
    name: 'Test NGO User',
    email: `ngo_${Date.now()}@test.com`,
    password: 'password123',
    role: 'NGO'
};

const ngoProfile = {
    name: 'Test NGO Organization',
    lat: 40.7128,
    lng: -74.0060,
    contact: '1234567890',
    email: 'ngo@org.com',
    capacity: 100,
    avgResponseTime: 10,
    status: 'active'
};

const foodItem = {
    type: 'cooked',
    quantity: 10,
    unit: 'kg',
    description: 'Pasta',
    lat: 40.7128,
    lng: -74.0060,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    donor: { name: 'Donor Name', contact: '123', email: 'donor@test.com' }
};

require('dotenv').config();

async function runTest() {
    try {
        console.log('=== STARTING VERIFICATION ===');

        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        // Connect to MongoDB to clean up
        await mongoose.connect(mongoUri);
        console.log('🧹 Cleaning database...');
        await mongoose.connection.collection('users').deleteMany({});
        await mongoose.connection.collection('ngos').deleteMany({});
        await mongoose.connection.collection('foods').deleteMany({});
        await mongoose.connection.collection('assignments').deleteMany({});
        console.log('✅ Database cleaned');

        // 1. Register Donor
        console.log('1. Registering Donor...');
        const donorRes = await axios.post(`${API_URL}/auth/register`, donorUser);
        const donorToken = donorRes.data.token;
        console.log('✅ Donor registered');

        // 2. Register NGO User
        console.log('2. Registering NGO User...');
        const ngoUserRes = await axios.post(`${API_URL}/auth/register`, ngoUser);
        const ngoUserToken = ngoUserRes.data.token;
        console.log('✅ NGO User registered');

        // 3. Create NGO Profile (Active)
        console.log('3. Creating Active NGO Profile...');
        const ngoRes = await axios.post(`${API_URL}/ngos`, ngoProfile, {
            headers: { Authorization: `Bearer ${ngoUserToken}` }
        });
        const ngoId = ngoRes.data.ngo._id;
        console.log('✅ NGO Profile created with ID:', ngoId);

        // 4. Create Food (Expect Assignment)
        console.log('4. Creating Food (Expect Assignment)...');
        const foodRes = await axios.post(`${API_URL}/food`, foodItem, {
            headers: { Authorization: `Bearer ${donorToken}` }
        });
        console.log('Response:', foodRes.data.message);

        if (foodRes.data.assignment) {
            console.log('✅ Food assigned to NGO:', foodRes.data.assignment.ngo.name);
        } else {
            console.error('❌ Expected assignment but got none');
        }

        // 5. Deactivate NGO
        console.log('5. Deactivating NGO...');
        await axios.put(`${API_URL}/ngos/${ngoId}`, { status: 'inactive' }, {
            headers: { Authorization: `Bearer ${ngoUserToken}` }
        });
        console.log('✅ NGO deactivated');

        // 6. Create Food (Expect No Assignment)
        console.log('6. Creating Food (Expect No Assignment)...');
        const foodRes2 = await axios.post(`${API_URL}/food`, foodItem, {
            headers: { Authorization: `Bearer ${donorToken}` }
        });
        console.log('Response:', foodRes2.data.message);

        if (!foodRes2.data.assignment) {
            console.log('✅ Food created but NOT assigned (as expected)');
        } else {
            console.error('❌ Expected no assignment but got one');
        }

        console.log('=== VERIFICATION COMPLETE ===');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

runTest();
