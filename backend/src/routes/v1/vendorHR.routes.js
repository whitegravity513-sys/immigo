import express from "express";
import {
  vendorHRLogin,
  getVendorHRDashboard,
} from "../../controllers/v1/vendorHR.controller.js";
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../../middleware/rbac.middleware.js";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/auth/login", authLimiter, vendorHRLogin);
router.get("/dashboard", authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), blockEmployeeHR, getVendorHRDashboard);

export default router;
