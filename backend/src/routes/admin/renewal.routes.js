import express from "express";
import {
  createRenewal,
  getRenewals,
  updateRenewal,
  deleteRenewal,
  getRenewalAlerts,
} from "../../controllers/renewal.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.post("/renewals", ...requireAdminAccess, createRenewal);
router.get("/renewals", ...requireAdminAccess, getRenewals);
router.get("/renewals/alerts", ...requireAdminAccess, getRenewalAlerts);
router.put("/renewals/:id", ...requireAdminAccess, updateRenewal);
router.delete("/renewals/:id", ...requireAdminAccess, deleteRenewal);

export default router;
