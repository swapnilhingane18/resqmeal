const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Assignment = require('../models/Assignment');

async function checkFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const latestAssignment = await Assignment.findOne().sort({ createdAt: -1 });

        if (!latestAssignment) {
            console.log("No assignments found");
        } else {
            console.log("Latest Assignment Fields:");
            console.log("Total Score:", latestAssignment.totalScore);
            console.log("Distance Score:", latestAssignment.distanceScore);
            console.log("Urgency Score:", latestAssignment.urgencyScore);
            console.log("Capacity Score:", latestAssignment.capacityScore);
            console.log("Load Balance Score:", latestAssignment.loadBalanceScore);
            console.log("Full Object:", JSON.stringify(latestAssignment.toJSON(), null, 2));
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkFields();
