import express from "express";
import {
  getHrDashboard,
  getHrEmployees,
  getHrAttendance,
  getHrLeaves,
} from "../controllers/hrDashboard.controller.js";
import {
  authenticateRBAC,
  requirePermission,
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

export default router;
