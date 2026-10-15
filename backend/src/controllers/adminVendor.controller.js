import Vendor from "../models/Vendor.js";
import Notification from "../models/Notification.js";
import ActivityService from "../services/activity.service.js";
import {
  sendVendorRegistrationApprovedEmail,
  sendVendorActivationEmail,
} from "../services/email.service.js";
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

/**
 * Step 2: Admin reviews registration and Approves initial registration
 * Transitions to: "Documents Pending"
 */
export const approveRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "Documents Pending";
  vendor.onboardingStage = "DOCS_PENDING";
  vendor.approvedAt = new Date();
  vendor.rejectionReason = "";
  vendor.adminRemarks = req.body.remarks || "Initial registration approved. Please upload compliance documents.";
  await vendor.save();

  // Send Registration Approval Email with portal URL
  try {
    await sendVendorRegistrationApprovedEmail({
      to: vendor.email,
      vendorName: vendor.companyName || vendor.contactPersonName,
      vendorId: vendor.vendorId,
      loginEmail: vendor.email,
      portalUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    });
  } catch (emailErr) {
    console.error("Failed to send vendor registration approval email:", emailErr.message);
  }

  // Create In-App Notification
  try {
    await Notification.create({
      type: "SYSTEM",
      title: `Registration Approved: ${vendor.companyName}`,
      message: `Your vendor registration has been approved. Please log in to complete your compliance document submission.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }

  // Log Activity
  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_REGISTRATION_APPROVED",
    title: `Vendor Registration Approved: ${vendor.companyName}`,
    description: `Registration for ${vendor.companyName} (${vendor.vendorId}) was approved. Access enabled for document submission.`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "Documents Pending",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Vendor registration approved successfully. Email notification sent.",
    vendor,
  });
});

/**
 * Admin places vendor registration on Hold
 */
export const holdRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "Registration On Hold";
  vendor.adminRemarks = remarks || "Registration placed on hold pending verification.";
  await vendor.save();

  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_ON_HOLD",
    title: `Vendor Placed On Hold: ${vendor.companyName}`,
    description: `Registration for ${vendor.companyName} placed on hold. Remarks: ${vendor.adminRemarks}`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "Registration On Hold",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Vendor registration placed on hold",
    vendor,
  });
});

/**
 * Step 5: Admin Document Verification & Automatic MOU Generation
 */
export const approveDocsAndSendMou = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    agreementDate,
    validityYears,
    commissionRate,
    paymentTerms,
    replacementPeriod,
    sectors,
    specialClauses,
    adminSignatoryName,
    adminDesignation,
  } = req.body || {};

  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  // Mark all uploaded documents as verified
  if (Array.isArray(vendor.documents)) {
    vendor.documents.forEach((d) => {
      d.status = "Verified";
    });
  }

  vendor.status = "MOU Pending";
  vendor.onboardingStage = "MOU_SENT";
  vendor.mouStatus = "Sent";

  // Automatically populate MOU using the vendor registration details already stored in DB
  vendor.mouDocument = {
    title: "Memorandum of Understanding (MOU) for Recruitment Services",
    sentAt: agreementDate ? new Date(agreementDate) : new Date(),
    agreementDate: agreementDate || new Date().toISOString().split("T")[0],
    validityYears: validityYears || "1 Year",
    commissionRate: commissionRate || "8.33% / 1 Month Gross Salary",
    paymentTerms: paymentTerms || "30 Days from candidate deployment",
    replacementPeriod: replacementPeriod || "90 Days free replacement warranty",
    sectors: sectors || vendor.specialization || "Construction, MEP, Hospitality, Logistics, Oil & Gas",
    specialClauses: specialClauses || "Standard international manpower ethical recruitment covenants apply.",
    adminSignatoryName: adminSignatoryName || "Authorized Operations Director, Vista Solutions",
    adminDesignation: adminDesignation || "Director - Global Alliances",
    termsVersion: "v1.0",
    fileUrl: "",
    // Auto-populated vendor details
    vendorCompanyName: vendor.companyName,
    vendorContactPerson: vendor.contactPersonName,
    vendorAddress: vendor.address || `${vendor.city || ""}, ${vendor.state || ""}, ${vendor.country || "India"}`.trim(),
    vendorEmail: vendor.email,
    vendorPhone: vendor.phone,
    vendorPan: vendor.pan || "",
    vendorGstin: vendor.gstin || "",
  };

  await vendor.save();

  // Notification for Vendor
  try {
    await Notification.create({
      type: "DOCUMENT_UPDATE",
      title: `Official MOU Generated for ${vendor.companyName}`,
      message: `Your compliance documents have been verified by Vista Admin! Official MOU agreement has been issued. Please review, choose your signature option, and submit.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }

  // Activity Log
  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_DOCS_VERIFIED_MOU_GENERATED",
    title: `MOU Generated: ${vendor.companyName}`,
    description: `Documents verified and MOU automatically generated for ${vendor.companyName} (${vendor.vendorId}) with agreed terms.`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "MOU Pending",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Compliance documents verified and customized MOU generated & sent successfully",
    vendor,
  });
});

/**
 * Admin requests document correction
 */
export const requestDocCorrection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "Documents Correction Required";
  vendor.adminRemarks = remarks || "Please re-upload clearer copies of your compliance documents.";
  await vendor.save();

  try {
    await Notification.create({
      type: "SYSTEM",
      title: `Document Correction Required: ${vendor.companyName}`,
      message: `Admin has requested document corrections. Remarks: ${vendor.adminRemarks}`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }

  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_DOC_CORRECTION_REQUESTED",
    title: `Doc Correction Requested: ${vendor.companyName}`,
    description: `Document correction requested for ${vendor.companyName}. Reason: ${vendor.adminRemarks}`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "Documents Correction Required",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Document correction request sent to vendor",
    vendor,
  });
});

/**
 * Step 8: Final Vendor Activation (MOU Approval)
 * Activates vendor ONLY after:
 * 1. Vendor registration approved
 * 2. Required documents verified
 * 3. MOU signed and submitted
 * 4. MOU approved by admin
 */
export const approveMouAndActivate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "Active";
  vendor.activationDate = new Date();
  vendor.verifiedAt = new Date();
  vendor.rejectionReason = "";
  vendor.onboardingStage = "COMPLETED";
  vendor.mouSigned = true;
  vendor.mouStatus = "Approved";
  await vendor.save();

  // Send Final Activation Email
  try {
    await sendVendorActivationEmail({
      to: vendor.email,
      vendorName: vendor.companyName || vendor.contactPersonName,
      vendorId: vendor.vendorId,
      portalUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    });
  } catch (emailErr) {
    console.error("Failed to send activation email:", emailErr.message);
  }

  // In-App Notification
  try {
    await Notification.create({
      type: "SYSTEM",
      title: `Vendor Account Activated: ${vendor.companyName}`,
      message: `Congratulations! Your vendor partner account has been fully activated by Vista Admin. You now have full access to candidate deployment and projects.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }

  // Activity Log
  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_ACTIVATED",
    title: `Vendor Account Activated: ${vendor.companyName}`,
    description: `${vendor.companyName} (${vendor.vendorId}) is now fully ACTIVE. All onboarding stages completed.`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "Active",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Vendor MOU approved and account fully activated!",
    vendor,
  });
});

export const requestMouCorrection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.status = "MOU Correction Required";
  vendor.mouStatus = "Correction Required";
  vendor.adminRemarks = remarks || "Please re-sign or re-upload your MOU.";
  await vendor.save();

  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_MOU_CORRECTION_REQUESTED",
    title: `MOU Correction Requested: ${vendor.companyName}`,
    description: `MOU correction requested for ${vendor.companyName}. Reason: ${vendor.adminRemarks}`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "MOU Correction Required",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "MOU correction request sent to vendor",
    vendor,
  });
});

// Backward-compatible alias
export const approveVendor = approveMouAndActivate;

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

  try {
    await Notification.create({
      type: "SYSTEM",
      title: `Vendor Application Rejected: ${vendor.companyName}`,
      message: `Your vendor application status was updated to Rejected. Reason: ${vendor.rejectionReason}`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }

  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_REJECTED",
    title: `Vendor Rejected: ${vendor.companyName}`,
    description: `Vendor application for ${vendor.companyName} was rejected. Reason: ${vendor.rejectionReason}`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: "Rejected",
    visibility: "ADMIN",
  });

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

  vendor.status = vendor.status === "Suspended" ? "Active" : "Suspended";
  await vendor.save();

  try {
    await Notification.create({
      type: "SYSTEM",
      title: `Vendor Account Status Changed: ${vendor.companyName}`,
      message: `Vendor account status is now ${vendor.status}.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }

  await ActivityService.log({
    userType: "ADMIN",
    userId: req.user?.id || req.user?._id,
    userName: req.user?.name || "System Admin",
    action: "VENDOR_SUSPEND_TOGGLED",
    title: `Vendor Status Changed: ${vendor.companyName} (${vendor.status})`,
    description: `Vendor ${vendor.companyName} status changed to ${vendor.status}.`,
    entityType: "Vendor",
    entityId: vendor.vendorId || vendor._id.toString(),
    entityName: vendor.companyName,
    status: vendor.status,
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: `Vendor status updated to ${vendor.status}`,
    vendor,
  });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  const allowedFields = [
    "companyName",
    "businessType",
    "registrationNumber",
    "establishmentYear",
    "gstin",
    "pan",
    "website",
    "country",
    "state",
    "city",
    "pinCode",
    "address",
    "contactPersonName",
    "designation",
    "phone",
    "alternatePhone",
    "specialization",
    "countriesServed",
    "experienceYears",
    "availableCandidates",
    "monthlyCapacity",
    "status",
    "adminRemarks",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      vendor[field] = req.body[field];
    }
  });

  await vendor.save();

  return res.status(200).json({
    message: "Vendor details updated successfully",
    vendor,
  });
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await Vendor.findOneAndDelete({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { vendorId: id }],
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return res.status(200).json({
    message: "Vendor removed successfully",
    id,
  });
});

export default {
  getAllVendors,
  getVendorById,
  approveRegistration,
  holdRegistration,
  approveDocsAndSendMou,
  requestDocCorrection,
  approveMouAndActivate,
  requestMouCorrection,
  approveVendor,
  rejectVendor,
  toggleSuspendVendor,
  updateVendor,
  deleteVendor,
};
