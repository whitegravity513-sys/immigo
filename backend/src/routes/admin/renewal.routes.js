import express from "express";
import {
  createRenewal,
  getRenewals,
  updateRenewal,
  deleteRenewal,
  getRenewalAlerts,
} from "../../controllers/renewal.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/renewals", verifyAdmin, createRenewal);
router.get("/renewals", verifyAdmin, getRenewals);
router.get("/renewals/alerts", verifyAdmin, getRenewalAlerts);
router.put("/renewals/:id", verifyAdmin, updateRenewal);
router.delete("/renewals/:id", verifyAdmin, deleteRenewal);

export default router;
