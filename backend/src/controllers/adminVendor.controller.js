import Vendor from "../models/Vendor.js";
import Notification from "../models/Notification.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({}).sort({ createdAt: -1 });

  const now = new Date();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  for (const v of vendors) {
    const isDocSubmitted = v.documentsUploaded || (Array.isArray(v.documents) && v.documents.length > 0);
    const regDate = new Date(v.createdAt || v.registeredAt || now);
    const ageMs = now - regDate;

    // 7-day rule: If documents not submitted within 7 days of registration, auto-reject
    if (!isDocSubmitted && ageMs > SEVEN_DAYS_MS && v.status !== "Approved" && v.status !== "Suspended") {
      if (v.status !== "Rejected") {
        v.status = "Rejected";
        v.rejectionReason = "Auto-rejected: Compliance documents not submitted within 7 days of registration.";
        await v.save();
      }
    }
  }

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

  // 7-day check
  const now = new Date();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isDocSubmitted = vendor.documentsUploaded || (Array.isArray(vendor.documents) && vendor.documents.length > 0);
  const regDate = new Date(vendor.createdAt || vendor.registeredAt || now);
  if (!isDocSubmitted && (now - regDate) > SEVEN_DAYS_MS && vendor.status !== "Approved" && vendor.status !== "Suspended") {
    if (vendor.status !== "Rejected") {
      vendor.status = "Rejected";
      vendor.rejectionReason = "Auto-rejected: Compliance documents not submitted within 7 days of registration.";
      await vendor.save();
    }
  }

  return res.status(200).json({ vendor });
});

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

  vendor.status = "MOU Pending";
  vendor.onboardingStage = "MOU_SENT";
  vendor.mouStatus = "Sent";
  vendor.mouDocument = {
    title: "Memorandum of Understanding (MOU) for Recruitment Services",
    sentAt: agreementDate ? new Date(agreementDate) : new Date(),
    agreementDate: agreementDate || new Date().toISOString().split("T")[0],
    validityYears: validityYears || "1 Year",
    commissionRate: commissionRate || "8.33% / 1 Month Gross Salary",
    paymentTerms: paymentTerms || "30 Days from candidate deployment",
    replacementPeriod: replacementPeriod || "90 Days free replacement warranty",
    sectors: sectors || "Construction, MEP, Hospitality, Logistics, Oil & Gas",
    specialClauses: specialClauses || "Standard international manpower ethical recruitment covenants apply.",
    adminSignatoryName: adminSignatoryName || "Authorized Operations Director, Vista Solutions",
    adminDesignation: adminDesignation || "Director - Global Alliances",
    termsVersion: "v1.0",
    fileUrl: "",
  };

  await vendor.save();

  // Notification for Vendor
  try {
    await Notification.create({
      type: "DOCUMENT_UPDATE",
      title: `Official MOU Issued for ${vendor.companyName}`,
      message: `Your compliance documents were approved by Vista Admin! Official MOU with agreed commission (${commissionRate || "Standard"}) has been issued. Please review and digitally sign your MOU.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification creation error:", err.message);
  }

  return res.status(200).json({
    message: "Documents approved and customized MOU sent successfully",
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
  vendor.onboardingStage = "COMPLETED";
  vendor.mouSigned = true;
  vendor.mouStatus = "Approved";
  await vendor.save();

  try {
    await Notification.create({
      type: "SYSTEM",
      title: `Vendor Account Approved: ${vendor.companyName}`,
      message: `Congratulations! Your vendor partner account has been fully approved by Vista Admin. You now have full access to candidate deployment and projects.`,
      targetRole: "ALL",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }

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
  approveDocsAndSendMou,
  approveVendor,
  rejectVendor,
  toggleSuspendVendor,
  updateVendor,
  deleteVendor,
};
