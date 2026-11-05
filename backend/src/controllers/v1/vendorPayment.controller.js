import VendorPaymentService from "../../services/vendorPayment.service.js";
import VendorPaymentMilestone from "../../models/VendorPaymentMilestone.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

const ensureAdminPrivilege = (user) => {
  if (user?.hrType === "VENDOR_HR") {
    throw new ApiError(403, "Access denied. Vendor HR cannot view or modify financial payment milestones.");
  }
};

export const createMilestone = asyncHandler(async (req, res) => {
  ensureAdminPrivilege(req.user);
  const milestone = await VendorPaymentService.createMilestone({
    ...req.body,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 201, "Vendor payment milestone created successfully", milestone);
});

export const updateMilestone = asyncHandler(async (req, res) => {
  ensureAdminPrivilege(req.user);
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Milestone ID is required");
  const milestone = await VendorPaymentService.updateMilestone(id, req.body, req.user);
  return ApiResponse.send(res, 200, "Milestone updated successfully", milestone);
});

export const markPaymentAsPaid = asyncHandler(async (req, res) => {
  ensureAdminPrivilege(req.user);
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Milestone ID is required");
  const milestone = await VendorPaymentService.markPaymentAsPaid({
    milestoneId: id,
    ...req.body,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 200, "Payment marked as paid successfully", milestone);
});

export const getMilestones = asyncHandler(async (req, res) => {
  ensureAdminPrivilege(req.user);
  const { vendorId, projectId, status } = req.query;
  const result = await VendorPaymentService.getMilestones({
    vendorId,
    projectId,
    status,
  });
  return ApiResponse.send(res, 200, "Milestones fetched successfully", result);
});

export const getPaymentAnalytics = asyncHandler(async (req, res) => {
  ensureAdminPrivilege(req.user);
  const milestones = await VendorPaymentMilestone.find().lean();

  const totalMilestones = milestones.length;
  const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
  const paidAmount = milestones.reduce(
    (sum, m) => sum + (m.paidAmount || (m.status === "Paid" ? m.amount : 0)),
    0
  );
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  const vendorSummaryMap = {};
  milestones.forEach((m) => {
    const vId = m.vendorId || "Unknown";
    if (!vendorSummaryMap[vId]) {
      vendorSummaryMap[vId] = {
        vendorId: vId,
        vendorName: m.vendorName || vId,
        totalMilestones: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      };
    }
    const currentPaid = m.paidAmount || (m.status === "Paid" ? m.amount : 0);
    vendorSummaryMap[vId].totalMilestones += 1;
    vendorSummaryMap[vId].totalAmount += m.amount || 0;
    vendorSummaryMap[vId].paidAmount += currentPaid;
    vendorSummaryMap[vId].pendingAmount += Math.max(0, (m.amount || 0) - currentPaid);
  });

  return ApiResponse.send(res, 200, "Payment analytics generated", {
    overview: {
      totalMilestones,
      totalAmount,
      paidAmount,
      pendingAmount,
    },
    vendorSummaries: Object.values(vendorSummaryMap),
  });
});
