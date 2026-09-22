import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { env } from "./env.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info("MongoDB already connected, reusing existing connection.");
    return;
  }

  const mongoUri = env.MONGO_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not defined in .env");
  }

  // Set connection event listeners once
  if (mongoose.connection.listenerCount("error") === 0) {
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB Runtime Connection Error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Will attempt reconnection...");
      isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully.");
      isConnected = true;
    });

    mongoose.connection.on("connected", () => {
      isConnected = true;
    });
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,           // Keep pool lean for Atlas free-tier / small apps
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      autoIndex: false, // Explicitly disabled to prevent startup query blocking on Atlas
    });

    isConnected = true;
    logger.info(`✅ MongoDB Connected (Host: ${conn.connection.host})`);
    return conn;
  } catch (error) {
    logger.error("❌ MongoDB Connection Failed:", error);
    throw error;
  }
};

export default connectDB;