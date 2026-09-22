import { env } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";
import { startCronJobs } from "./utils/cronJobs.js";

const PORT = env.PORT || process.env.PORT || 5000;

// Catch unhandled exceptions
process.on("uncaughtException", (error) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...", error);
  process.exit(1);
});

const startServer = async () => {
  // Connect to database
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Vista Enterprise Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
    startCronJobs();
  });

  // Catch unhandled promise rejections
  process.on("unhandledRejection", (error) => {
    logger.error("UNHANDLED REJECTION! Shutting down gracefully...", error);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown signals
  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Closing HTTP server gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed. Process terminating.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer();