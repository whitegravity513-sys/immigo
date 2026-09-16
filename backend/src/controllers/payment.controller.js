import PaymentService from "../services/payment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Project Payment Controller
 */
export const createProjectPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentService.createProjectPayment(req.body);
  return res.status(201).json({ message: "Payment added successfully!", payment });
});

export const getAllProjectPayments = asyncHandler(async (req, res) => {
  const payments = await PaymentService.getAllProjectPayments();
  return res.status(200).json({ payments });
});

export const getPaymentsByProject = asyncHandler(async (req, res) => {
  const payments = await PaymentService.getPaymentsByProject(req.params.projectId);
  return res.status(200).json({ payments });
});

export const updateProjectPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentService.updateProjectPayment(req.params.id, req.body);
  return res.status(200).json({ message: "Payment updated successfully!", payment });
});

export const deleteProjectPayment = asyncHandler(async (req, res) => {
  await PaymentService.deleteProjectPayment(req.params.id);
  return res.status(200).json({ message: "Payment deleted successfully." });
});

export default {
  createProjectPayment,
  getAllProjectPayments,
  getPaymentsByProject,
  updateProjectPayment,
  deleteProjectPayment,
};
