import express from "express";
import {
  createVendor,
  getVendors,
  getVendorDetails,
  updateVendor,
} from "../../controllers/v1/vendorManagement.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC);

router.post("/", createVendor);
router.get("/", getVendors);
router.get("/:id", getVendorDetails);
router.put("/:id", updateVendor);

export default router;
