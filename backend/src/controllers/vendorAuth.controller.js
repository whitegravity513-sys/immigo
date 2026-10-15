import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Vendor from "../models/Vendor.js";
import ActivityService from "../services/activity.service.js";
import env from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Step 1: Vendor Registers (Short & Clean RA Style Form)
 */
export const vendorRegister = asyncHandler(async (req, res) => {
  const {
    companyName,
    contactPersonName,
    email,
    phone,
    state,
    city,
    address,
    pan,
    password,
    gstin,
    registrationNumber,
  } = req.body;

  if (!email || !password || !companyName || !contactPersonName || !phone || !pan) {
    throw new ApiError(400, "Agency Name, Contact Person, Email, Mobile, PAN, and Password are required.");
  }

  // Duplicate email check
  const existingEmail = await Vendor.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ApiError(400, "This official email is already registered as a vendor. Please sign in or contact support.");
  }

  // Duplicate phone check
  const cleanPhone = String(phone).replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    throw new ApiError(400, "Mobile number must be at least 10 digits.");
  }

  // PAN format validation
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const cleanPan = String(pan).trim().toUpperCase();
  if (!panRegex.test(cleanPan)) {
    throw new ApiError(400, "Invalid PAN format. Standard format is 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const vendorId = `VND-${Math.floor(1000 + Math.random() * 9000)}`;

  const newVendor = await Vendor.create({
    vendorId,
    companyName: companyName.trim(),
    contactPersonName: contactPersonName.trim(),
    email: email.trim().toLowerCase(),
    phone: cleanPhone,
    state: state || "",
    city: city || "",
    address: address || "",
    pan: cleanPan,
    gstin: gstin ? String(gstin).trim().toUpperCase() : "",
    registrationNumber: registrationNumber || `REG-${Date.now().toString().slice(-5)}`,
    password: hashedPassword,
    // Exact initial status: "Registration Pending"
    status: "Registration Pending",
    onboardingStage: "REGISTRATION_PENDING",
  });

  // Notify Admin of new vendor registration
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "VENDOR_REGISTERED",
      title: `New Vendor Registered: ${newVendor.companyName}`,
      message: `${newVendor.companyName} (${newVendor.vendorId}) has registered as a recruitment partner. Review and approval required.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: newVendor._id, vendorCode: newVendor.vendorId },
    });
  } catch (err) {
    console.error("Failed to notify admin of vendor registration:", err.message);
  }

  // Log Activity for Admin Dashboard
  await ActivityService.log({
    userType: "VENDOR",
    userId: newVendor.vendorId,
    userName: newVendor.companyName,
    action: "VENDOR_REGISTERED",
    title: `New Vendor Registered: ${newVendor.companyName}`,
    description: `${newVendor.companyName} (${newVendor.vendorId}) registered from ${city || state || "India"}. Status: Awaiting Admin Approval.`,
    entityType: "Vendor",
    entityId: newVendor.vendorId,
    entityName: newVendor.companyName,
    status: "Registration Pending",
    visibility: "ADMIN",
    metadata: { email: newVendor.email, phone: newVendor.phone, pan: newVendor.pan },
  });

  return res.status(201).json({
    success: true,
    message: "Registration submitted successfully! Your account is awaiting Admin approval.",
    vendorId: newVendor.vendorId,
    vendor: {
      id: newVendor._id.toString(),
      vendorId: newVendor.vendorId,
      companyName: newVendor.companyName,
      email: newVendor.email,
      status: newVendor.status,
    },
  });
});

/**
 * Step 3: Vendor Login (Secured with Onboarding Authorization Checks)
 */
export const vendorLogin = asyncHandler(async (req, res) => {
  const { emailOrId, password } = req.body;
  const identifier = String(emailOrId || "").trim().toLowerCase();

  if (!identifier || !password) {
    throw new ApiError(400, "Email/Vendor ID and password are required.");
  }

  const vendor = await Vendor.findOne({
    $or: [{ email: identifier }, { vendorId: identifier.toUpperCase() }],
  });

  if (!vendor) {
    throw new ApiError(401, "Invalid Vendor ID/Email or Password.");
  }

  // Check Onboarding & Approval Status Restrictions
  if (vendor.status === "Registration Pending" || vendor.status === "Pending") {
    throw new ApiError(
      403,
      "Your registration is awaiting Admin review and approval. You will receive an email confirmation once approved."
    );
  }

  if (vendor.status === "Registration On Hold") {
    throw new ApiError(
      403,
      `Your registration is on hold. Remarks: ${vendor.adminRemarks || "Pending administrative verification."}`
    );
  }

  if (vendor.status === "Registration Rejected" || vendor.status === "Rejected") {
    throw new ApiError(
      403,
      `Your vendor application was rejected by Admin. Reason: ${vendor.rejectionReason || "Verification criteria not met."}`
    );
  }

  if (vendor.status === "Suspended") {
    throw new ApiError(403, "Your vendor account has been temporarily Suspended. Please contact Vista Admin.");
  }

  const isMatch = await bcrypt.compare(password, vendor.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid Vendor ID/Email or Password.");
  }

  const token = jwt.sign(
    {
      id: vendor._id.toString(),
      vendorId: vendor.vendorId,
      companyName: vendor.companyName,
      role: "vendor",
      status: vendor.status,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    message: "Vendor logged in successfully",
    token,
    vendor,
  });
});

export const getVendorMe = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return res.status(200).json({
    vendor,
  });
});

/**
 * Step 4: Restricted Vendor Workspace - Upload Compliance Documents
 */
export const uploadVendorDocuments = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const { documents, bankDetails } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  if (Array.isArray(documents) && documents.length > 0) {
    vendor.documents = documents;
    vendor.documentsUploaded = true;
  }
  if (bankDetails) {
    vendor.bankDetails = bankDetails;
  }

  vendor.status = "Documents Under Review";
  vendor.onboardingStage = "DOCS_SUBMITTED";
  await vendor.save();

  // Create Notification for Admin
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "DOCUMENT_UPLOAD",
      title: `Vendor Documents Submitted: ${vendor.companyName}`,
      message: `${vendor.companyName} (${vendor.vendorId}) has uploaded compliance documents for review.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Failed to create admin notification:", err.message);
  }

  // Log Activity for Admin Dashboard
  await ActivityService.log({
    userType: "VENDOR",
    userId: vendor.vendorId,
    userName: vendor.companyName,
    action: "VENDOR_DOCUMENTS_UPLOADED",
    title: `Compliance Documents Uploaded: ${vendor.companyName}`,
    description: `${vendor.companyName} (${vendor.vendorId}) submitted compliance documents (PAN/Certificates) for admin verification.`,
    entityType: "Vendor",
    entityId: vendor.vendorId,
    entityName: vendor.companyName,
    status: "Documents Under Review",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Compliance documents submitted successfully. Admin review is in progress.",
    vendor,
  });
});

/**
 * Step 6: Vendor Signs and Submits MOU (Digital Acknowledgement or Upload)
 */
export const signVendorMou = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const {
    signatoryName,
    designation,
    signatureData,
    signedFileUrl,
    signMethod = "digital",
  } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.mouSigned = true;
  vendor.mouStatus = "Under Review";
  vendor.status = "MOU Under Review";
  vendor.onboardingStage = "MOU_SIGNED";
  vendor.mouSignMethod = signMethod;
  vendor.signedMouDocUrl = signedFileUrl || "";
  vendor.signedMou = {
    signatoryName: signatoryName || vendor.contactPersonName,
    designation: designation || "Authorized Signatory",
    signatureData: signatureData || "Digitally Signed & Acknowledged",
    signedFileUrl: signedFileUrl || "",
    signedAt: new Date(),
  };

  await vendor.save();

  // Create Notification for Admin
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "DOCUMENT_UPDATE",
      title: `Signed MOU Submitted: ${vendor.companyName}`,
      message: `${vendor.companyName} (${vendor.vendorId}) has submitted their signed MOU agreement (${signMethod.toUpperCase()} method). Admin review required.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Failed to create admin notification:", err.message);
  }

  // Log Activity for Admin Dashboard
  await ActivityService.log({
    userType: "VENDOR",
    userId: vendor.vendorId,
    userName: vendor.companyName,
    action: "VENDOR_MOU_SUBMITTED",
    title: `Signed MOU Submitted: ${vendor.companyName}`,
    description: `${vendor.companyName} (${vendor.vendorId}) submitted executed MOU via ${signMethod} method. Final admin approval pending.`,
    entityType: "Vendor",
    entityId: vendor.vendorId,
    entityName: vendor.companyName,
    status: "MOU Under Review",
    visibility: "ADMIN",
  });

  return res.status(200).json({
    message: "Signed MOU agreement submitted successfully for final Admin approval.",
    vendor,
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const vendor = await Vendor.findByIdAndUpdate(vendorId, req.body, { new: true, runValidators: true });
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return res.status(200).json({
    message: "Profile updated successfully",
    vendor,
  });
});

export default {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  uploadVendorDocuments,
  signVendorMou,
  updateVendorProfile,
};
