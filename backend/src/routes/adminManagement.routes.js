import express from "express";
import {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminPermissions,
  updateAdminPermissions,
  getModulesAndPermissions,
  getAuditLogs,
  getMyPermissions,
} from "../controllers/adminManagement.controller.js";
import { ROLES } from "../constants/roles.js";
import {
  authenticateRBAC,
  requireSuperAdmin,
  requireRoles,
  requirePermission,
} from "../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/auth/me/permissions", authenticateRBAC, getMyPermissions);

router.get("/permissions/modules", authenticateRBAC, getModulesAndPermissions);

router.get("/permissions/audit-logs", authenticateRBAC, requireSuperAdmin, getAuditLogs);

router.get(
  "/admins",
  authenticateRBAC,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getAdmins
);

router.post(
  "/admins",
  authenticateRBAC,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  createAdmin
);

router.get(
  "/admins/:id",
  authenticateRBAC,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getAdminById
);

router.patch(
  "/admins/:id",
  authenticateRBAC,
  requireSuperAdmin,
  updateAdmin
);

router.delete(
  "/admins/:id",
  authenticateRBAC,
  requireSuperAdmin,
  deleteAdmin
);

router.get(
  "/admins/:id/permissions",
  authenticateRBAC,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getAdminPermissions
);

router.put(
  "/admins/:id/permissions",
  authenticateRBAC,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  updateAdminPermissions
);

export default router;
