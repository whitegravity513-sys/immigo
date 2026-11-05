import RecruitmentService from "../../services/recruitment.service.js";
import CandidateApplication from "../../models/CandidateApplication.js";
import Interview from "../../models/Interview.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

export const submitCandidate = asyncHandler(async (req, res) => {
  const result = await RecruitmentService.submitCandidate({
    ...req.body,
    actorUser: req.user,
  });
  return ApiResponse.send(res, 201, "Candidate submitted successfully", result);
});

export const updateCandidateStage = asyncHandler(async (req, res) => {
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

export const getApplications = asyncHandler(async (req, res) => {
  const { projectId, vendorId, stage, status, search, page = 1, limit = 50 } = req.query;
  const filter = {};

  const isVendorHR = req.user?.hrType === "VENDOR_HR";
  if (isVendorHR) {
    const allowed = Array.isArray(req.user?.assignedVendors) ? req.user.assignedVendors : [];
    filter.vendorId = { $in: allowed };
  } else if (vendorId) {
    filter.vendorId = vendorId;
  }

  if (projectId) filter.projectId = projectId;
  if (stage && stage !== "ALL") filter.recruitmentStage = stage;
  if (status && status !== "ALL") filter.status = status;

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { candidateName: { $regex: s, $options: "i" } },
      { candidateEmail: { $regex: s, $options: "i" } },
      { candidatePhone: { $regex: s, $options: "i" } },
      { applicationId: { $regex: s, $options: "i" } },
    ];
  }

  const applications = await CandidateApplication.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  const total = await CandidateApplication.countDocuments(filter);

  return ApiResponse.send(res, 200, "Applications fetched successfully", {
    total,
    page: Number(page),
    limit: Number(limit),
    applications,
  });
});

export const getInterviews = asyncHandler(async (req, res) => {
  const { applicationId, candidateId, projectId, vendorId, status } = req.query;
  const filter = {};

  const isVendorHR = req.user?.hrType === "VENDOR_HR";
  if (isVendorHR) {
    const allowed = Array.isArray(req.user?.assignedVendors) ? req.user.assignedVendors : [];
    filter.vendorId = { $in: allowed };
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
