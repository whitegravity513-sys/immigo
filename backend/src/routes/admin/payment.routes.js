import express from "express";
import {
  createProjectPayment,
  getAllProjectPayments,
  getPaymentsByProject,
  updateProjectPayment,
  deleteProjectPayment,
} from "../../controllers/payment.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.post("/payments", ...requireAdminAccess, createProjectPayment);
router.get("/payments", ...requireAdminAccess, getAllProjectPayments);
router.get("/payments/project/:projectId", ...requireAdminAccess, getPaymentsByProject);
router.put("/payments/:id", ...requireAdminAccess, updateProjectPayment);
router.delete("/payments/:id", ...requireAdminAccess, deleteProjectPayment);

export default router;
