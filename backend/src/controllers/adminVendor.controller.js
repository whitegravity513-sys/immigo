import Vendor from "../models/Vendor.js";
import Notification from "../models/Notification.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    message: "Vendors retrieved successfully",
    vendors,
  });
});

export const getVendorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return res.status(200).json({ vendor });
});

export const approveDocsAndSendMou = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "MOU Pending";
  vendor.onboardingStage = "MOU_SENT";
  vendor.mouStatus = "Sent";
  vendor.mouDocument = {
    title: "Memorandum of Understanding (MOU) for Recruitment Services",
    sentAt: new Date(),
    termsVersion: "v1.0",
    fileUrl: "",
  };

  await vendor.save();

  // Notification for Vendor
  try {
    await Notification.create({
      type: "DOCUMENT_UPDATE",
      title: "MOU Agreement Issued",
      message: `Your compliance documents have been verified and approved! The official MOU has been issued. Please review and digitally sign your MOU to unlock your full portal.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }

  return res.status(200).json({
    message: "Documents approved and MOU sent successfully",
    vendor,
  });
});

export const approveVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "Approved";
  vendor.verifiedAt = new Date();
  vendor.rejectionReason = "";
  await vendor.save();

  return res.status(200).json({
    message: "Vendor approved successfully",
    vendor,
  });
});

export const rejectVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "Rejected";
  vendor.rejectionReason = reason || "Application requirements not fulfilled.";
  await vendor.save();

  return res.status(200).json({
    message: "Vendor rejected",
    vendor,
  });
});

export const toggleSuspendVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = vendor.status === "Suspended" ? "Approved" : "Suspended";
  await vendor.save();

  return res.status(200).json({
    message: `Vendor status updated to ${vendor.status}`,
    vendor,
  });
});

export default {
  getAllVendors,
  getVendorById,
  approveDocsAndSendMou,
  approveVendor,
  rejectVendor,
  toggleSuspendVendor,
};
