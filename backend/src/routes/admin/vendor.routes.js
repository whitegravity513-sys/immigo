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
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/vendors", verifyAdmin, getAllVendors);
router.get("/vendors/:id", verifyAdmin, getVendorById);
router.put("/vendors/:id", verifyAdmin, updateVendor);
router.delete("/vendors/:id", verifyAdmin, deleteVendor);


router.put("/vendors/:id/approve-registration", verifyAdmin, approveRegistration);
router.put("/vendors/:id/hold-registration", verifyAdmin, holdRegistration);
router.post("/vendors/:id/send-mou", verifyAdmin, approveDocsAndSendMou);
router.put("/vendors/:id/request-doc-correction", verifyAdmin, requestDocCorrection);
router.put("/vendors/:id/approve-mou", verifyAdmin, approveMouAndActivate);
router.put("/vendors/:id/request-mou-correction", verifyAdmin, requestMouCorrection);
router.put("/vendors/:id/approve", verifyAdmin, approveVendor);
router.put("/vendors/:id/reject", verifyAdmin, rejectVendor);
router.put("/vendors/:id/suspend", verifyAdmin, toggleSuspendVendor);

export default router;
