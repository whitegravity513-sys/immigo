import RenewalService from "../services/renewal.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Renewal Controller
 */
export const createRenewal = asyncHandler(async (req, res) => {
  const renewal = await RenewalService.createRenewal(req.body);
  return res.status(201).json({ message: "Renewal created successfully", renewal });
});

export const getRenewals = asyncHandler(async (req, res) => {
  const renewals = await RenewalService.getRenewals();
  return res.status(200).json(renewals);
});

export const updateRenewal = asyncHandler(async (req, res) => {
  const renewal = await RenewalService.updateRenewal(req.params.id, req.body);
  return res.status(200).json({ message: "Renewal updated successfully", renewal });
});

export const deleteRenewal = asyncHandler(async (req, res) => {
  await RenewalService.deleteRenewal(req.params.id);
  return res.status(200).json({ message: "Renewal deleted successfully" });
});

export const getRenewalAlerts = asyncHandler(async (req, res) => {
  const alerts = await RenewalService.getRenewalAlerts();
  return res.status(200).json(alerts);
});

export default {
  createRenewal,
  getRenewals,
  updateRenewal,
  deleteRenewal,
  getRenewalAlerts,
};
