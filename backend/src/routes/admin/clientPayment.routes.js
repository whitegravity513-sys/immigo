import express from "express";
import {
  recordPayment,
  getPayments,
  getLedgerStats,
  reversePayment,
  updatePayment,
} from "../../controllers/clientPayment.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.post("/client-payments", ...requireAdminAccess, recordPayment);
router.get("/client-payments", ...requireAdminAccess, getPayments);
router.get("/client-payments/stats", ...requireAdminAccess, getLedgerStats);
router.put("/client-payments/:id", ...requireAdminAccess, updatePayment);
router.post("/client-payments/:id/reverse", ...requireAdminAccess, reversePayment);

export default router;
