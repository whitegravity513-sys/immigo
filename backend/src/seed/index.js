import "dotenv/config";
import { connectDB } from "../config/db.js";
import { seedDefaultEmployee } from "./employee.seed.js";
import { User } from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { hashPassword } from "../utils/password.js";
import { logger } from "../utils/logger.js";

export const runAllSeeds = async (exitOnComplete = true) => {
  try {
    await connectDB();

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@vista.com").trim().toLowerCase();
    const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";
    const superAdminPassword = (process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@Secure2026!").trim();

    const existingSuperAdmin = await User.findOne({
      $or: [{ role: ROLES.SUPER_ADMIN }, { email: superAdminEmail }],
    });

    if (!existingSuperAdmin) {
      const passwordHash = await hashPassword(superAdminPassword);
      await User.create({
        name: superAdminName,
        email: superAdminEmail,
        passwordHash,
        role: ROLES.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
      logger.info(`Super Admin [${superAdminEmail}] seeded successfully.`);
    }

    // await seedDefaultEmployee(false);
    logger.info("Database seeding completed successfully (Admin preserved).");

    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    logger.error("Database seeding failed:", error);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("seed/index.js")) {
  runAllSeeds(true);
}

export default runAllSeeds;
