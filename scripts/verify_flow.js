const axios = require("axios");
const mongoose = require("mongoose");

require("dotenv").config();

const rawBaseUrl = process.env.VERIFY_API_BASE_URL || "http://localhost:3000";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const API_URL = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: Number(process.env.VERIFY_HTTP_TIMEOUT_MS || 15000),
  validateStatus: () => true,
});

const testPassword =
  process.env.VERIFY_TEST_PASSWORD || `Verify_${Date.now()}_Pass!`;

const donorUser = {
  name: "Test Donor",
  email: `donor_${Date.now()}@test.com`,
  password: testPassword,
  role: "DONOR",
};

const ngoUser = {
  name: "Test NGO User",
  email: `ngo_${Date.now()}@test.com`,
  password: testPassword,
  role: "NGO",
};

const ngoProfile = {
  name: "Test NGO Organization",
  lat: 40.7128,
  lng: -74.006,
  contact: "1234567890",
  email: "ngo@org.com",
  capacity: 100,
  avgResponseTime: 10,
  status: "active",
};

const foodItem = {
  type: "cooked",
  quantity: 10,
  unit: "kg",
  description: "Pasta",
  lat: 40.7128,
  lng: -74.006,
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  donor: { name: "Donor Name", contact: "123", email: "donor@test.com" },
};

const ensureSuccess = (response, step) => {
  if (response.status < 200 || response.status >= 300) {
    const error = new Error(`${step} failed with status ${response.status}`);
    error.response = response;
    throw error;
  }
  return response.data;
};

const extractHttpError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      body: error.response.data,
      method: error.response.config?.method,
      url: error.response.config?.url,
    };
  }

  return {
    message: error.message,
    code: error.code,
  };
};

async function runTest() {
  try {
    console.log("=== STARTING VERIFICATION ===");
    console.log(`[verify_flow] API_URL=${API_URL}`);

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("[verify_flow] Cleaning database...");
    await mongoose.connection.collection("users").deleteMany({});
    await mongoose.connection.collection("ngos").deleteMany({});
    await mongoose.connection.collection("foods").deleteMany({});
    await mongoose.connection.collection("assignments").deleteMany({});
    console.log("[verify_flow] Database cleaned");

    console.log("1. Registering Donor...");
    const donorData = ensureSuccess(
      await api.post("/auth/register", donorUser),
      "Register donor"
    );
    const donorToken = donorData.token;
    console.log("Donor registered");

    console.log("2. Registering NGO User...");
    const ngoUserData = ensureSuccess(
      await api.post("/auth/register", ngoUser),
      "Register NGO user"
    );
    const ngoUserToken = ngoUserData.token;
    console.log("NGO user registered");

    console.log("3. Creating Active NGO Profile...");
    const ngoData = ensureSuccess(
      await api.post("/ngos", ngoProfile, {
        headers: { Authorization: `Bearer ${ngoUserToken}` },
      }),
      "Create NGO profile"
    );
    const ngoId = ngoData.ngo._id;
    console.log("NGO profile created with ID:", ngoId);

    console.log("4. Creating Food (Expect Assignment)...");
    const foodData = ensureSuccess(
      await api.post("/food", foodItem, {
        headers: { Authorization: `Bearer ${donorToken}` },
      }),
      "Create food (expect assignment)"
    );
    console.log("Response:", foodData.message);

    if (foodData.assignment) {
      console.log("Food assigned to NGO:", foodData.assignment.ngo.name);
    } else {
      console.error("Expected assignment but got none");
    }

    console.log("5. Deactivating NGO...");
    ensureSuccess(
      await api.put(
        `/ngos/${ngoId}`,
        { status: "inactive" },
        { headers: { Authorization: `Bearer ${ngoUserToken}` } }
      ),
      "Deactivate NGO"
    );
    console.log("NGO deactivated");

    console.log("6. Creating Food (Expect No Assignment)...");
    const foodData2 = ensureSuccess(
      await api.post("/food", foodItem, {
        headers: { Authorization: `Bearer ${donorToken}` },
      }),
      "Create food (expect no assignment)"
    );
    console.log("Response:", foodData2.message);

    if (!foodData2.assignment) {
      console.log("Food created but NOT assigned (as expected)");
    } else {
      console.error("Expected no assignment but got one");
    }

    console.log("=== VERIFICATION COMPLETE ===");
  } catch (error) {
    console.error("Test Failed:", extractHttpError(error));
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runTest();
