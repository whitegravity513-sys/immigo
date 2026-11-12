import Job from "../../models/Job.js";
import ProjectAssignment from "../../models/ProjectAssignment.js";
import User from "../../models/User.js";
import Vendor from "../../models/Vendor.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { findProjectAcrossSources } from "../../utils/projectResolver.js";
import { escapeRegex } from "../../utils/regex.js";

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

export const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    projectId,
    openings = 1,
    skills = [],
    experience = "1-3 Years",
    salaryRange,
    location,
    country = "India",
    jobType = "Overseas Deployment",
    description = "",
    requirements = [],
    assignedVendors = [],
  } = req.body;

  if (!title || !projectId) {
    throw new ApiError(400, "Job title and project ID are required.");
  }

  const resolvedProject = await findProjectAcrossSources(projectId);
  if (!resolvedProject) throw new ApiError(404, "Project not found.");

  const jobId = `JOB-${Date.now().toString().slice(-6)}`;

  const job = await Job.create({
    jobId,
    title: title.trim(),
    projectId: resolvedProject.projectId,
    ...(resolvedProject.projectRef ? { projectRef: resolvedProject.projectRef } : {}),
    projectName: resolvedProject.projectName,
    clientId: resolvedProject.clientId || "",
    clientName: resolvedProject.clientName || "",
    openings: Number(openings) || 1,
    skills: Array.isArray(skills) ? skills : [skills],
    experience,
    salaryRange: salaryRange || { min: 0, max: 0, currency: "INR" },
    location: location || "",
    country: country || resolvedProject.destinationCountry || "India",
    jobType,
    description,
    requirements: Array.isArray(requirements) ? requirements : [requirements],
    assignedVendors,
    status: "Open",
  });

  return ApiResponse.send(res, 201, "Job position created successfully", job);
});

export const getJobs = asyncHandler(async (req, res) => {
  const { projectId, status, search } = req.query;
  const filter = {};

  const isVendorHR = req.user?.hrType === "VENDOR_HR";
  if (isVendorHR) {
    const userIdStr = req.user?._id?.toString() || req.user?.id || "";
    let allowedVendors = Array.isArray(req.user?.assignedVendors)
      ? req.user.assignedVendors.map(String)
      : [];
    if (userIdStr) {
      try {
        const freshUser = await User.findById(userIdStr).select("assignedVendors").lean();
        if (freshUser && Array.isArray(freshUser.assignedVendors)) {
          allowedVendors = freshUser.assignedVendors.map(String);
        }
      } catch {}
    }

    const hexIds = allowedVendors.filter(isValidObjectId);
    const vendorDocs =
      allowedVendors.length > 0
        ? await Vendor.find({
            $or: [
              { vendorId: { $in: allowedVendors } },
              { id: { $in: allowedVendors } },
              ...(hexIds.length > 0 ? [{ _id: { $in: hexIds } }] : []),
            ],
          })
            .select("vendorId _id")
            .lean()
        : [];
    const expandedVendors = Array.from(
      new Set([
        ...allowedVendors,
        ...vendorDocs.flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean)),
      ])
    );

    const [activeAssignments, hrHistory] = await Promise.all([
      ProjectAssignment.find({
        $or: [
          ...(expandedVendors.length > 0 ? [{ vendorId: { $in: expandedVendors } }] : []),
          ...(userIdStr ? [{ userId: userIdStr }] : []),
        ],
        status: "Active",
      }).lean(),
      userIdStr
        ? ProjectAssignment.find({
            assignmentType: "VENDOR_HR_PROJECT",
            userId: userIdStr,
            status: { $in: ["Active", "Removed"] },
          }).lean()
        : Promise.resolve([]),
    ]);

    const activeHRProjectIds = new Set(
      hrHistory.filter((a) => a.status === "Active").map((a) => String(a.projectId))
    );
    const removedHRProjectIds = new Set(
      hrHistory
        .filter((a) => a.status === "Removed" && !activeHRProjectIds.has(String(a.projectId)))
        .map((a) => String(a.projectId))
    );

    const assignedProjectIds = Array.from(
      new Set(
        activeAssignments
          .filter(
            (a) =>
              activeHRProjectIds.has(String(a.projectId)) ||
              !removedHRProjectIds.has(String(a.projectId))
          )
          .map((a) => String(a.projectId))
      )
    );

    filter.$or = [
      ...(assignedProjectIds.length > 0 ? [{ projectId: { $in: assignedProjectIds } }] : []),
      ...(expandedVendors.length > 0
        ? [{ "assignedVendors.vendorId": { $in: expandedVendors } }]
        : []),
    ];
    if (filter.$or.length === 0) {
      filter._id = null;
    }
  } else if (projectId) {
    filter.projectId = projectId;
  }

  if (status && status !== "ALL") filter.status = status;
  if (search) {
    const s = escapeRegex(String(search).trim());
    if (s) {
      filter.title = { $regex: s, $options: "i" };
    }
  }

  const jobs = await Job.find(filter).sort({ createdAt: -1 }).lean();
  return ApiResponse.send(res, 200, "Jobs fetched successfully", jobs);
});

export const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await Job.findOne({
    $or: [{ jobId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  }).lean();

  if (!job) throw new ApiError(404, "Job position not found.");
  return ApiResponse.send(res, 200, "Job fetched successfully", job);
});

export const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await Job.findOne({
    $or: [{ jobId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  });

  if (!job) throw new ApiError(404, "Job position not found.");

  const ALLOWED_JOB_FIELDS = [
    "title",
    "department",
    "openings",
    "filledPositions",
    "skills",
    "experience",
    "salaryRange",
    "location",
    "country",
    "jobType",
    "description",
    "requirements",
    "status",
    "assignedVendors",
  ];
  for (const field of ALLOWED_JOB_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field) && req.body[field] !== undefined) {
      job[field] = req.body[field];
    }
  }
  await job.save();

  return ApiResponse.send(res, 200, "Job updated successfully", job);
});
