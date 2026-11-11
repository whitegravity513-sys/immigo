import RecruitmentService from "../../services/recruitment.service.js";
import CandidateApplication from "../../models/CandidateApplication.js";
import CrmCandidateApplication from "../../models/CrmCandidateApplication.js";
import ProjectAssignment from "../../models/ProjectAssignment.js";
import Interview from "../../models/Interview.js";
import User from "../../models/User.js";
import Vendor from "../../models/Vendor.js";
import { fetchAllMergedProjects } from "../../utils/projectResolver.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

const resolveVendorHRScope = async (reqUser) => {
  const userIdStr = reqUser?._id?.toString() || reqUser?.id || "";
  let allowed = Array.isArray(reqUser?.assignedVendors)
    ? reqUser.assignedVendors.map(String)
    : [];
  if (userIdStr) {
    try {
      const freshUser = await User.findById(userIdStr).select("assignedVendors").lean();
      if (freshUser && Array.isArray(freshUser.assignedVendors)) {
        allowed = freshUser.assignedVendors.map(String);
      }
    } catch {}
  }
  const hexIds = allowed.filter(isValidObjectId);
  const vendorDocs =
    allowed.length > 0
      ? await Vendor.find({
          $or: [
            { vendorId: { $in: allowed } },
            { id: { $in: allowed } },
            ...(hexIds.length > 0 ? [{ _id: { $in: hexIds } }] : []),
          ],
        })
          .select("vendorId _id")
          .lean()
      : [];
  const expandedVendors = Array.from(
    new Set([
      ...allowed,
      ...vendorDocs.flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean)),
    ])
  );

  const expandedVendorSet = new Set(expandedVendors.map(String));
  const [assignments, allProjects] = await Promise.all([
    ProjectAssignment.find({
      status: "Active",
      $or: [
        ...(expandedVendors.length > 0 ? [{ vendorId: { $in: expandedVendors } }] : []),
        ...(userIdStr ? [{ userId: userIdStr }, { vendorHRUserId: userIdStr }] : []),
      ],
    }).lean(),
    fetchAllMergedProjects(),
  ]);

  const projectIdsSet = new Set();
  (assignments || []).forEach((a) => {
    if (a.projectId) projectIdsSet.add(String(a.projectId));
    if (a.projectRef) projectIdsSet.add(String(a.projectRef));
  });
  (allProjects || []).forEach((p) => {
    const hasVendor = (p.assignedVendors || []).some((v) =>
      expandedVendorSet.has(String(v.vendorId || v.id || v._id || v))
    );
    const hasHR = (p.assignedVendorHRs || []).some(
      (h) => userIdStr && String(h.userId || h._id || "") === userIdStr
    );
    if (hasVendor || hasHR) {
      (p.rawIdCandidates || [p.projectId]).filter(Boolean).forEach((cid) => projectIdsSet.add(String(cid)));
    }
  });

  return {
    userIdStr,
    expandedVendors,
    allowedProjectIds: Array.from(projectIdsSet),
  };
};

export const submitCandidate = asyncHandler(async (req, res) => {
  const result = await RecruitmentService.submitCandidate({
    ...req.body,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 201, "Candidate submitted successfully", result);
});

export const updateCandidateStage = asyncHandler(async (req, res) => {
  const normalizedRole = String(req.userRole || req.user?.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  if (req.isVendor || ["VENDOR", "CANDIDATE", "EMPLOYEE"].includes(normalizedRole)) {
    throw new ApiError(403, "Only Admin, Super Admin, or Vendor HR can update processing stages.");
  }
  const { id } = req.params;
  const { stage, status, remarks, offerDetails, visaDetails, processMilestones, newDocument, documents } = req.body;
  const application = await RecruitmentService.updateCandidateStage({
    applicationId: id,
    newStage: stage,
    newStatus: status,
    remarks,
    offerDetails,
    visaDetails,
    processMilestones,
    newDocument,
    documents,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 200, "Candidate recruitment stage updated", application);
});

export const scheduleInterview = asyncHandler(async (req, res) => {
  const interview = await RecruitmentService.scheduleInterview({
    ...req.body,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 201, "Interview scheduled successfully", interview);
});

export const recordInterviewFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, feedback, recommendation } = req.body;
  const interview = await RecruitmentService.recordInterviewFeedback({
    interviewId: id,
    rating,
    feedback,
    recommendation,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 200, "Interview feedback recorded successfully", interview);
});

export const reassignCandidateApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { projectId, projectName, jobId, jobTitle, notes } = req.body;
  const application = await RecruitmentService.reassignCandidateApplication({
    applicationId: id,
    projectId,
    projectName,
    jobId,
    jobTitle,
    notes,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 200, "Candidate application successfully reassigned to new project", application);
});

export const getApplications = asyncHandler(async (req, res) => {
  const { projectId, vendorId, stage, status, search, page = 1, limit = 50 } = req.query;
  const baseFilter = {};

  const isVendorHR = req.user?.hrType === "VENDOR_HR";
  if (isVendorHR) {
    const scope = await resolveVendorHRScope(req.user);
    if (
      scope.expandedVendors.length === 0 &&
      scope.allowedProjectIds.length === 0 &&
      !scope.userIdStr
    ) {
      baseFilter._id = null;
    } else {
      baseFilter.$or = [
        ...(scope.expandedVendors.length > 0
          ? [{ vendorId: { $in: scope.expandedVendors } }]
          : []),
        ...(scope.allowedProjectIds.length > 0
          ? [{ projectId: { $in: scope.allowedProjectIds } }]
          : []),
        ...(scope.userIdStr ? [{ vendorHrId: scope.userIdStr }] : []),
      ];
    }
  } else if (vendorId) {
    baseFilter.vendorId = vendorId;
  }

  if (projectId) baseFilter.projectId = projectId;
  if (status && status !== "ALL") baseFilter.status = status;

  if (search) {
    const s = String(search).trim();
    const searchOr = [
      { candidateName: { $regex: s, $options: "i" } },
      { candidateEmail: { $regex: s, $options: "i" } },
      { candidatePhone: { $regex: s, $options: "i" } },
      { applicationId: { $regex: s, $options: "i" } },
    ];
    if (baseFilter.$or) {
      baseFilter.$and = [{ $or: baseFilter.$or }, { $or: searchOr }];
      delete baseFilter.$or;
    } else {
      baseFilter.$or = searchOr;
    }
  }

  const directFilter = { ...baseFilter };
  if (stage && stage !== "ALL") directFilter.recruitmentStage = stage;

  const crmFilter = { ...baseFilter };
  if (stage && stage !== "ALL" && !crmFilter.status) crmFilter.status = stage;

  const [directApps, crmApps] = await Promise.all([
    CandidateApplication.find(directFilter).sort({ createdAt: -1 }).lean(),
    CrmCandidateApplication.find(crmFilter).sort({ createdAt: -1 }).lean(),
  ]);

  const seen = new Map();
  const pushRec = (rec) => {
    const appId = String(rec.applicationId || rec._id || "");
    const existing = seen.get(appId);
    if (!existing) {
      seen.set(appId, { ...rec, id: appId, applicationId: appId });
    } else {
      seen.set(appId, { ...existing, ...rec, id: appId, applicationId: appId });
    }
  };
  (crmApps || []).forEach(pushRec);
  (directApps || []).forEach(pushRec);

  const allMerged = Array.from(seen.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const total = allMerged.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const applications = allMerged.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return ApiResponse.send(res, 200, "Applications fetched successfully", {
    total,
    page: pageNum,
    limit: limitNum,
    applications,
  });
});

export const getInterviews = asyncHandler(async (req, res) => {
  const { applicationId, candidateId, projectId, vendorId, status } = req.query;
  const filter = {};

  const isVendorHR = req.user?.hrType === "VENDOR_HR";
  if (isVendorHR) {
    const scope = await resolveVendorHRScope(req.user);
    if (scope.expandedVendors.length === 0 && scope.allowedProjectIds.length === 0) {
      filter._id = null;
    } else {
      filter.$or = [
        ...(scope.expandedVendors.length > 0
          ? [{ vendorId: { $in: scope.expandedVendors } }]
          : []),
        ...(scope.allowedProjectIds.length > 0
          ? [{ projectId: { $in: scope.allowedProjectIds } }]
          : []),
      ];
    }
  } else if (vendorId) {
    filter.vendorId = vendorId;
  }

  if (applicationId) filter.applicationId = applicationId;
  if (candidateId) filter.candidateId = candidateId;
  if (projectId) filter.projectId = projectId;
  if (status && status !== "ALL") filter.status = status;

  const interviews = await Interview.find(filter)
    .sort({ scheduledDate: 1, startTime: 1 })
    .lean();

  return ApiResponse.send(res, 200, "Interviews fetched successfully", interviews);
});
