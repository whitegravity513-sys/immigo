import { env } from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./utils/logger.js";
import { startCronJobs } from "./utils/cronJobs.js";
import { meetingScheduler } from "./services/meetingScheduler.service.js";

const PORT = env.PORT || process.env.PORT || 5000;

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception, shutting down:", error);
  process.exit(1);
});

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
    startCronJobs();
    meetingScheduler.start();
  });

  process.on("unhandledRejection", (error) => {
    logger.error("Unhandled promise rejection, closing server:", error);
    server.close(() => {
      process.exit(1);
    });
  });

  const gracefulShutdown = (signal) => {
    logger.info(`${signal} received, draining active connections...`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer();