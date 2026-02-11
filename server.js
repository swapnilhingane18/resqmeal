require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const { initExpiryCron } = require("./services/expiryCron");

const foodRoutes = require("./routes/food.routes");
const ngoRoutes = require("./routes/ngo.routes");
const assignmentRoutes = require("./routes/assignment.routes");

const app = express();

// Connect to MongoDB
connectDB();
initExpiryCron();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Routes
app.use("/api/food", foodRoutes);
app.use("/api/ngos", ngoRoutes);
app.use("/api/assignments", assignmentRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "ResQMeal backend running 🚀" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
