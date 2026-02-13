require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const { sendError } = require("./utils/errorResponse");
const { initExpiryCron, stopExpiryCron } = require("./services/expiryCron");
const { normalizeAssignmentStatuses } = require("./services/statusMigration");

const authRoutes = require("./routes/auth.routes");
const foodRoutes = require("./routes/food.routes");
const ngoRoutes = require("./routes/ngo.routes");
const assignmentRoutes = require("./routes/assignment.routes");

const app = express();

let envValidated = false;
let httpServer = null;
let isShuttingDown = false;

const getDbStateLabel = () => {
  const map = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return map[mongoose.connection.readyState] || "unknown";
};

const validateEnvironment = () => {
  const missing = [];

  if (!process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (!process.env.MONGO_URI) {
    missing.push("MONGO_URI");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  envValidated = true;
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/ngos", ngoRoutes);
app.use("/api/assignments", assignmentRoutes);

app.get("/health", (req, res) => {
  const dbState = getDbStateLabel();
  const isHealthy = envValidated && dbState === "connected";

  return res.status(200).json({
    status: isHealthy ? "OK" : "DEGRADED",
    uptime: process.uptime(),
    dbState,
    envValidated,
    timestamp: new Date().toISOString(),
  });
});

app.get("/db-test", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 503, "Database not connected", "DB_NOT_CONNECTED");
    }
    await mongoose.connection.db.admin().ping();
    return res.status(200).json({ status: "success", message: "Database ping successful" });
  } catch (error) {
    console.error("[db-test] error:", error.stack || error.message);
    return sendError(res, 500, "Database check failed", "DB_TEST_FAILED");
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "ResQMeal Backend API",
    version: "1.0.0",
    documentation: "/api/docs (placeholder)",
  });
});

app.use((req, res) => {
  return sendError(res, 404, "Route not found", "NOT_FOUND");
});

app.use(errorHandler);

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[server] graceful shutdown initiated (${signal})`);

  try {
    stopExpiryCron();

    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    console.log("[server] graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("[server] shutdown error:", error.stack || error.message);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDB();
    await normalizeAssignmentStatuses();
    initExpiryCron();

    const PORT = process.env.PORT || 3000;
    httpServer = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[server] critical startup error:", error.stack || error.message);
    process.exit(1);
  }
};

startServer();
