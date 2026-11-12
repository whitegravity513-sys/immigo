import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoicesByProject,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../../controllers/invoice.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.post("/invoices", ...requireAdminAccess, createInvoice);
router.get("/invoices", ...requireAdminAccess, getAllInvoices);
router.get("/invoices/project/:projectId", ...requireAdminAccess, getInvoicesByProject);
router.get("/invoices/:id", ...requireAdminAccess, getInvoiceById);
router.put("/invoices/:id", ...requireAdminAccess, updateInvoice);
router.delete("/invoices/:id", ...requireAdminAccess, deleteInvoice);

export default router;
