import InvoiceService from "../services/invoice.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Invoice Controller
 */
export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.createInvoice(req.body);
  return res.status(201).json({ message: "Invoice created successfully!", invoice });
});

export const getAllInvoices = asyncHandler(async (req, res) => {
  const invoices = await InvoiceService.getAllInvoices();
  return res.status(200).json({ invoices });
});

export const getInvoicesByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const invoices = await InvoiceService.getAllInvoices(projectId);
  return res.status(200).json({ invoices });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.getInvoiceById(req.params.id);
  return res.status(200).json({ invoice });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await InvoiceService.updateInvoice(req.params.id, req.body);
  return res.status(200).json({ message: "Invoice updated successfully!", invoice });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  await InvoiceService.deleteInvoice(req.params.id);
  return res.status(200).json({ message: "Invoice deleted successfully." });
});

export default {
  createInvoice,
  getAllInvoices,
  getInvoicesByProject,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
