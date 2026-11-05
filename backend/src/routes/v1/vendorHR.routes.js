import express from "express";
import {
  vendorHRLogin,
  getVendorHRDashboard,
} from "../../controllers/v1/vendorHR.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.post("/auth/login", vendorHRLogin);
router.get("/dashboard", authenticateRBAC, getVendorHRDashboard);

export default router;
