import VendorManagementService from "../../services/vendorManagement.service.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await VendorManagementService.createVendor({
    ...req.body,
    actorUser: req.user,
  });
  emitRealtimeEvent({
    events: ["immigo:vendor-update", "immigo:dashboard-update", "immigo:vendor-hr-refresh"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR"],
    vendorId: vendor?.vendorId ? String(vendor.vendorId) : null,
  });
  return ApiResponse.send(res, 201, "Vendor created successfully", vendor);
});

export const getVendors = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.query;
  const result = await VendorManagementService.getVendorsList({
    search,
    status,
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 200, "Vendors fetched successfully", result);
});

export const getVendorDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Vendor ID is required");
  const details = await VendorManagementService.getVendorDetails(id);
  return ApiResponse.send(res, 200, "Vendor details fetched successfully", details);
});

export const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Vendor ID is required");
  const updated = await VendorManagementService.updateVendor(id, req.body, req.user);
  emitRealtimeEvent({
    events: ["immigo:vendor-update", "immigo:dashboard-update", "immigo:vendor-hr-refresh", "immigo:notification-update"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    vendorId: updated?.vendorId ? String(updated.vendorId) : String(id),
  });
  return ApiResponse.send(res, 200, "Vendor updated successfully", updated);
});
