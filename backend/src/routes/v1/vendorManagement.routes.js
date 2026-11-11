import express from "express";
import {
  createVendor,
  getVendors,
  getVendorDetails,
  updateVendor,
} from "../../controllers/v1/vendorManagement.controller.js";
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC, blockEmployeeHR);

router.post("/", requireRoles("SUPER_ADMIN", "ADMIN"), createVendor);
router.get("/", requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), getVendors);
router.get("/:id", requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), getVendorDetails);
router.put("/:id", requireRoles("SUPER_ADMIN", "ADMIN"), updateVendor);

export default router;
