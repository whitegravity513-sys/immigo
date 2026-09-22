import "dotenv/config";
import { User } from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { hashPassword } from "../utils/password.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";

const createSuperAdmin = async () => {
  try {
    await connectDB();

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@immigo.com").trim().toLowerCase();
    const superAdminName = process.env.SUPER_ADMIN_NAME || "Admin";
    const superAdminPassword = (process.env.SUPER_ADMIN_PASSWORD || "Abhi@123").trim();

    const existingSuperAdmin = await User.findOne({
      $or: [{ role: ROLES.SUPER_ADMIN }, { email: superAdminEmail }],
    });

    if (existingSuperAdmin) {
      logger.info("Super Admin already exists in the database.");
      process.exit(0);
    }

    const passwordHash = await hashPassword(superAdminPassword);

    await User.create({
      name: superAdminName,
      email: superAdminEmail,
      passwordHash,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    logger.info(`Super Admin [${superAdminEmail}] created successfully.`);
    process.exit(0);
  } catch (error) {
    logger.error("Super Admin seeding failed:", error);
    process.exit(1);
  }
};

createSuperAdmin();   