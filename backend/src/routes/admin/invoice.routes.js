import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoicesByProject,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../../controllers/invoice.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/invoices", verifyAdmin, createInvoice);
router.get("/invoices", verifyAdmin, getAllInvoices);
router.get("/invoices/project/:projectId", verifyAdmin, getInvoicesByProject);
router.get("/invoices/:id", verifyAdmin, getInvoiceById);
router.put("/invoices/:id", verifyAdmin, updateInvoice);
router.delete("/invoices/:id", verifyAdmin, deleteInvoice);

export default router;
