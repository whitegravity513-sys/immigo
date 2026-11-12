import express from "express";
import {
  getHrDashboard,
  getHrEmployees,
  getHrAttendance,
  getHrLeaves,
  getHrPerformanceReport,
} from "../controllers/hrDashboard.controller.js";
import {
  authenticateRBAC,
  requirePermission,
  requireRoles,
} from "../middleware/rbac.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticateRBAC,
  requirePermission(["employees.view", "attendance.view", "leaves.view"], { mode: "any" }),
  getHrDashboard
);

router.get(
  "/employees",
  authenticateRBAC,
  requirePermission("employees.view"),
  getHrEmployees
);

router.get(
  "/attendance",
  authenticateRBAC,
  requirePermission("attendance.view"),
  getHrAttendance
);

router.get(
  "/leaves",
  authenticateRBAC,
  requirePermission("leaves.view"),
  getHrLeaves
);

router.get(
  "/performance-reports",
  authenticateRBAC,
  requireRoles("SUPER_ADMIN", "ADMIN", "HR", "EMPLOYEE_HR", "VENDOR_HR"),
  getHrPerformanceReport
);

export default router;
