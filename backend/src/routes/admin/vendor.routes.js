import express from "express";
import {
  getAllVendors,
  getVendorById,
  approveRegistration,
  holdRegistration,
  approveDocsAndSendMou,
  requestDocCorrection,
  approveMouAndActivate,
  requestMouCorrection,
  approveVendor,
  rejectVendor,
  toggleSuspendVendor,
  updateVendor,
  deleteVendor,
} from "../../controllers/adminVendor.controller.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/vendors", requirePermission("vendors.view"), getAllVendors);
router.get("/vendors/:id", requirePermission("vendors.view"), getVendorById);
router.put("/vendors/:id", requirePermission("vendors.update"), updateVendor);
router.delete("/vendors/:id", requirePermission("vendors.delete"), deleteVendor);

router.put("/vendors/:id/approve-registration", requirePermission("vendors.approve"), approveRegistration);
router.put("/vendors/:id/hold-registration", requirePermission("vendors.approve"), holdRegistration);
router.post("/vendors/:id/send-mou", requirePermission("vendors.approve"), approveDocsAndSendMou);
router.put("/vendors/:id/request-doc-correction", requirePermission("vendors.approve"), requestDocCorrection);
router.put("/vendors/:id/approve-mou", requirePermission("vendors.approve"), approveMouAndActivate);
router.put("/vendors/:id/request-mou-correction", requirePermission("vendors.approve"), requestMouCorrection);
router.put("/vendors/:id/approve", requirePermission("vendors.approve"), approveVendor);
router.put("/vendors/:id/reject", requirePermission("vendors.approve"), rejectVendor);
router.put("/vendors/:id/suspend", requirePermission("vendors.approve"), toggleSuspendVendor);

export default router;
