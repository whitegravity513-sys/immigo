import express from "express";
import {
  createMilestone,
  updateMilestone,
  markPaymentAsPaid,
  getMilestones,
  getPaymentAnalytics,
} from "../../controllers/v1/vendorPayment.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC);

router.post("/milestones", createMilestone);
router.put("/milestones/:id", updateMilestone);
router.post("/milestones/:id/pay", markPaymentAsPaid);
router.get("/milestones", getMilestones);
router.get("/analytics", getPaymentAnalytics);

export default router;
