import ActivityLog from "../../models/ActivityLog.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getHRActivities = asyncHandler(async (req, res) => {
  const {
    projectId,
    vendorId,
    hrUserId,
    candidateId,
    action,
    userType,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = req.query;

  const filter = {};

  const isVendorHR = req.user?.hrType === "VENDOR_HR";
  if (isVendorHR) {
    const allowedVendors = Array.isArray(req.user?.assignedVendors) ? req.user.assignedVendors : [];
    filter.vendorId = { $in: allowedVendors };
  } else if (vendorId) {
    filter.vendorId = vendorId;
  }

  if (candidateId) filter.candidateId = candidateId;
  if (hrUserId) filter.userId = hrUserId;
  if (userType && userType !== "ALL") filter.userType = userType;
  if (action && action !== "ALL") filter.action = action;
  if (status && status !== "ALL") filter.status = status;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const activities = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await ActivityLog.countDocuments(filter);

  return ApiResponse.send(res, 200, "HR activities retrieved successfully", {
    total,
    page: Number(page),
    limit: Number(limit),
    activities,
  });
});
