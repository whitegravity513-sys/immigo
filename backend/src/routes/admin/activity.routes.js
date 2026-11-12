import express from "express";
import { getAdminActivities } from "../../controllers/activity.controller.js";
import { authenticateRBAC, requireRoles, blockVendorHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.get(
  "/activities",
  authenticateRBAC,
  blockVendorHR,
  requireRoles("SUPER_ADMIN", "ADMIN", "HR", "EMPLOYEE_HR"),
  getAdminActivities
);

export default router;
