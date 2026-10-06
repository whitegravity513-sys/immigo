import express from "express";
import {
  createProjectPayment,
  getAllProjectPayments,
  getPaymentsByProject,
  updateProjectPayment,
  deleteProjectPayment,
} from "../../controllers/payment.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/payments", verifyAdmin, createProjectPayment);
router.get("/payments", verifyAdmin, getAllProjectPayments);
router.get("/payments/project/:projectId", verifyAdmin, getPaymentsByProject);
router.put("/payments/:id", verifyAdmin, updateProjectPayment);
router.delete("/payments/:id", verifyAdmin, deleteProjectPayment);

export default router;
