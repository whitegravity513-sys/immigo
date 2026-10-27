import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import AuditLog from "../models/AuditLog.js";
import { ROLES } from "../constants/roles.js";
import PermissionService from "../services/permission.service.js";
import { hashPassword } from "../utils/password.js";
import { logger } from "../utils/logger.js";

export const seedRBAC = async () => {
  try {
    await connectDB();
    logger.info("Initializing RBAC Permissions and Roles seed...");

    await PermissionService.seedPermissionsAndRoles();
    logger.info("Synchronized system permissions and role defaults.");

    const superEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@vista.com").trim().toLowerCase();
    const superName = process.env.SUPER_ADMIN_NAME || "Super Administrator";
    const superPass = (process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@Secure2026!").trim();
    const superHash = await hashPassword(superPass);

    let superUser = await User.findOne({ email: superEmail });
    if (!superUser) {
      superUser = await User.create({
        name: superName,
        email: superEmail,
        passwordHash: superHash,
        role: ROLES.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
      logger.info(`Super Admin created: ${superEmail}`);
    } else {
      superUser.role = ROLES.SUPER_ADMIN;
      superUser.passwordHash = superHash;
      superUser.isActive = true;
      await superUser.save();
      logger.info(`Super Admin verified & updated: ${superEmail}`);
    }

    await Admin.findOneAndUpdate(
      { email: superEmail },
      { email: superEmail, password: superHash },
      { upsert: true }
    );

    const adminEmail = "demo.admin@immigo.com";
    const adminPass = "Admin@123";
    const adminHash = await hashPassword(adminPass);
    let demoAdmin = await User.findOne({ email: adminEmail });
    if (!demoAdmin) {
      demoAdmin = await User.create({
        name: "Operations Admin",
        email: adminEmail,
        passwordHash: adminHash,
        role: ROLES.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
      logger.info(`Demo Admin created: ${adminEmail} (password: ${adminPass})`);
    }

    const hrEmail = "demo.hr@immigo.com";
    const hrPass = "Hr@123";
    const hrHash = await hashPassword(hrPass);
    let demoHr = await User.findOne({ email: hrEmail });
    if (!demoHr) {
      demoHr = await User.create({
        name: "Pooja Sharma (HR Lead)",
        email: hrEmail,
        passwordHash: hrHash,
        role: ROLES.HR,
        isActive: true,
        isEmailVerified: true,
      });
      logger.info(`Demo HR Lead created: ${hrEmail} (password: ${hrPass})`);
    }

    await AuditLog.create({
      userId: superUser._id.toString(),
      userEmail: superUser.email,
      userName: superUser.name,
      role: ROLES.SUPER_ADMIN,
      action: "RBAC_SYSTEM_INITIALIZED",
      targetResource: "SYSTEM",
      targetName: "Enterprise RBAC Engine",
      description: "RBAC permission registry, default roles, and super administrator setup initialized.",
      status: "SUCCESS",
    });

    logger.info("RBAC Seeding successfully completed!");
  } catch (err) {
    logger.error("Error during RBAC seeding:", err);
    throw err;
  }
};

if (process.argv[1]?.endsWith("rbac.seed.js")) {
  seedRBAC()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedRBAC;
