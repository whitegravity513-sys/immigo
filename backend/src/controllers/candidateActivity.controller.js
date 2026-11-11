import ActivityLog from "../models/ActivityLog.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import CrmCandidate from "../models/CrmCandidate.js";
import Candidate from "../models/Candidate.js";
import { recordCandidateActivity } from "../services/candidateActivity.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

const verifyCandidateAccess = async (req, candidateId) => {
  const role = String(req.userRole || req.user?.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const hrType = String(req.hrType || req.user?.hrType || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const isSuperAdmin = req.isSuperAdmin || role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const isVendor = Boolean(req.isVendor || role === "VENDOR");
  const isVendorHR = role === "VENDORHR" || (role === "HR" && hrType === "VENDORHR");

  if (isSuperAdmin || isAdmin) {
    return { authorized: true };
  }

  if (!isVendor && !isVendorHR) {
    throw new ApiError(403, "Forbidden: You are not authorized to access candidate recruitment data.");
  }

  let vendorId = "";
  let candidateName = "";

  const [crmApp, crmCand, directCand] = await Promise.all([
    CrmCandidateApplication.findOne({
      $or: [{ candidateId }, { applicationId: candidateId }, { id: candidateId }],
    }).lean(),
    CrmCandidate.findOne({
      $or: [{ candidateId }, { id: candidateId }],
    }).lean(),
    Candidate.findOne({
      $or: [{ candidateId }, { id: candidateId }],
    }).lean(),
  ]);

  if (crmApp) {
    vendorId = crmApp.vendorId || "";
    candidateName = crmApp.candidateName || "";
  } else if (crmCand) {
    vendorId = crmCand.vendorId || "";
    candidateName = crmCand.fullName || "";
  } else if (directCand) {
    vendorId = directCand.vendorId || "";
    candidateName = directCand.fullName || "";
  }

  if (isVendor) {
    const allowedSet = new Set(
      [req.vendorId, req.userId, req.user?._id]
        .filter(Boolean)
        .map((v) => String(v).trim().toUpperCase())
    );
    if (!vendorId || !allowedSet.has(String(vendorId).trim().toUpperCase())) {
      throw new ApiError(403, "Forbidden: You are only authorized to access candidates submitted by your agency.");
    }
    return { authorized: true, vendorId, candidateName };
  }

  if (isVendorHR) {
    const assigned = (req.assignedVendors || []).map((v) => String(v).trim().toLowerCase());
    if (!vendorId || !assigned.includes(String(vendorId).trim().toLowerCase())) {
      throw new ApiError(403, "Forbidden: This candidate belongs to a vendor not assigned to your HR profile.");
    }
    return { authorized: true, vendorId, candidateName };
  }

  throw new ApiError(403, "Forbidden: Access restricted.");
};

export const getCandidateActivityHistory = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  if (!candidateId) {
    throw new ApiError(400, "Candidate ID is required.");
  }

  await verifyCandidateAccess(req, candidateId);

  const query = {
    $or: [
      { candidateId: String(candidateId) },
      { entityId: String(candidateId), entityType: "Candidate" },
    ],
  };

  const activities = await ActivityLog.find(query).sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    candidateId,
    count: activities.length,
    activities: activities.map((a) => ({
      ...a,
      id: a._id.toString(),
    })),
  });
});

export const addCandidateProcessRemark = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  const {
    remarks,
    actionType = "REMARK_ADDED",
    newStatus = "",
    previousStatus = "",
    newStage = "",
    previousStage = "",
    newMilestone = "",
    previousMilestone = "",
    vendorId = "",
    vendorName = "",
    candidateName = "",
  } = req.body;

  if (!candidateId) {
    throw new ApiError(400, "Candidate ID is required.");
  }

  const access = await verifyCandidateAccess(req, candidateId);

  const effectiveVendorId = access.vendorId || vendorId || req.vendorId || "";
  const effectiveCandidateName = access.candidateName || candidateName || candidateId;

  const role = String(req.userRole || req.user?.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const hrType = String(req.hrType || req.user?.hrType || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const canEditStages =
    req.isSuperAdmin ||
    role === "SUPERADMIN" ||
    role === "ADMIN" ||
    role === "VENDORHR" ||
    (role === "HR" && hrType === "VENDORHR");

  if (!canEditStages && (String(newStatus || "").trim() || String(newStage || "").trim() || String(newMilestone || "").trim())) {
    throw new ApiError(403, "Forbidden: Only Admin, Super Admin, or Vendor HR can update candidate stages or status.");
  }

  let userRoleLabel = req.userRole || req.user?.role || "ADMIN";
  if ((role === "HR" && hrType === "VENDORHR") || role === "VENDORHR") {
    userRoleLabel = "Vendor Management HR";
  } else if (role === "VENDOR" || req.isVendor) {
    userRoleLabel = "Vendor";
  } else if (role === "SUPERADMIN") {
    userRoleLabel = "Super Admin";
  }

  const updaterName = req.user?.name || req.user?.companyName || req.vendorName || "System";
  const updaterId = req.userId || req.user?._id?.toString() || req.user?.id || req.vendorId;

  const activity = await recordCandidateActivity({
    candidateId,
    candidateName: effectiveCandidateName,
    updatedByUserId: updaterId,
    updatedByName: updaterName,
    updatedByRole: userRoleLabel,
    vendorId: effectiveVendorId,
    vendorName: vendorName || req.vendorName || "",
    actionType: canEditStages ? actionType : "REMARK_ADDED",
    previousStatus,
    newStatus: canEditStages ? newStatus : "",
    previousStage,
    newStage: canEditStages ? newStage : "",
    previousMilestone,
    newMilestone: canEditStages ? newMilestone : "",
    remarks: remarks || "",
  });

  if (canEditStages) {
    try {
      const updateFields = {};
      if (newStatus) updateFields.status = newStatus;
      if (remarks) updateFields.adminRemarks = remarks;
      if (newStage) updateFields["candidateData.stage"] = newStage;
      if (Object.keys(updateFields).length > 0) {
        await CrmCandidateApplication.updateMany(
          { $or: [{ candidateId }, { applicationId: candidateId }] },
          { $set: updateFields }
        );
      }
    } catch (err) {
      console.warn("Failed to sync application fields:", err.message);
    }
  }

  return res.status(201).json({
    success: true,
    message: "Candidate process remark and activity recorded successfully.",
    activity,
  });
});

export const getCandidateProcessDetails = asyncHandler(async (req, res) => {
  const { candidateId } = req.params;
  await verifyCandidateAccess(req, candidateId);

  const [crmApp, crmCand, directCand, activities] = await Promise.all([
    CrmCandidateApplication.findOne({
      $or: [{ candidateId }, { applicationId: candidateId }, { id: candidateId }],
    }).lean(),
    CrmCandidate.findOne({
      $or: [{ candidateId }, { id: candidateId }],
    }).lean(),
    Candidate.findOne({
      $or: [{ candidateId }, { id: candidateId }],
    }).lean(),
    ActivityLog.find({
      $or: [{ candidateId }, { entityId: candidateId, entityType: "Candidate" }],
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return res.status(200).json({
    success: true,
    candidateId,
    application: crmApp || null,
    crmCandidate: crmCand || null,
    candidate: directCand || null,
    activityHistory: activities || [],
  });
});

