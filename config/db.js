const mongoose = require("mongoose");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  const maxRetries = Number(process.env.DB_CONNECT_RETRIES || 5);
  const baseDelayMs = Number(process.env.DB_CONNECT_RETRY_BASE_MS || 1000);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      console.log(`[db] connecting to MongoDB (attempt ${attempt}/${maxRetries})...`);
      const isAtlasSrv = uri.startsWith("mongodb+srv://");
      const conn = await mongoose.connect(uri, {
        tls: isAtlasSrv,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log(`[db] connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[db] connection failed (attempt ${attempt}/${maxRetries}): ${error.message}`);

      if (error?.reason?.servers?.size) {
        for (const [server, details] of error.reason.servers.entries()) {
          if (details?.error?.message) {
            console.error(`[db] ${server}: ${details.error.message}`);
          }
        }
      }

      if (attempt === maxRetries) {
        throw error;
      }

      const delayMs = baseDelayMs * (2 ** (attempt - 1));
      console.log(`[db] retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
};

module.exports = connectDB;
