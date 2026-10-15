import ClientPaymentService from "../services/clientPayment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const recordPayment = asyncHandler(async (req, res) => {
  const payment = await ClientPaymentService.recordPayment(req.body, req.user || {});
  return res.status(201).json({
    success: true,
    message: "Payment recorded successfully in ledger!",
    payment,
  });
});

export const getPayments = asyncHandler(async (req, res) => {
  const result = await ClientPaymentService.getPayments(req.query);
  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const getLedgerStats = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const stats = await ClientPaymentService.getLedgerStats(clientId);
  return res.status(200).json({
    success: true,
    stats,
  });
});

export const reversePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const payment = await ClientPaymentService.reversePayment(id, reason, req.user || {});
  return res.status(200).json({
    success: true,
    message: "Payment reversed successfully with audit trail.",
    payment,
  });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await ClientPaymentService.updatePayment(id, req.body, req.user || {});
  return res.status(200).json({
    success: true,
    message: "Payment updated successfully with audit trail.",
    payment,
  });
});

export default {
  recordPayment,
  getPayments,
  getLedgerStats,
  reversePayment,
  updatePayment,
};
