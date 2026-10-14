import express from "express";
import {
  getAllVendors,
  getVendorById,
  approveDocsAndSendMou,
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
router.post("/vendors/:id/send-mou", verifyAdmin, approveDocsAndSendMou);
router.put("/vendors/:id/approve", verifyAdmin, approveVendor);
router.put("/vendors/:id/reject", verifyAdmin, rejectVendor);
router.put("/vendors/:id/suspend", verifyAdmin, toggleSuspendVendor);

export default router;
