import Job from "../../models/Job.js";
import Project from "../../models/Project.js";
import ProjectAssignment from "../../models/ProjectAssignment.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

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

  const project = await Project.findOne({
    $or: [{ projectId }, { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null }],
  });

  if (!project) throw new ApiError(404, "Project not found.");

  const jobId = `JOB-${Date.now().toString().slice(-6)}`;

  const job = await Job.create({
    jobId,
    title: title.trim(),
    projectId: project.projectId || project._id.toString(),
    projectRef: project._id,
    projectName: project.title,
    clientId: project.clientId?.toString() || "",
    clientName: project.clientName || "",
    openings: Number(openings) || 1,
    skills: Array.isArray(skills) ? skills : [skills],
    experience,
    salaryRange: salaryRange || { min: 0, max: 0, currency: "INR" },
    location: location || "",
    country: country || "India",
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
    const allowedVendors = Array.isArray(req.user?.assignedVendors) ? req.user.assignedVendors : [];
    // Find active project assignments for this vendor
    const activeAssignments = await ProjectAssignment.find({
      assignmentType: "VENDOR_PROJECT",
      vendorId: { $in: allowedVendors },
      status: "Active",
    }).lean();

    const assignedProjectIds = activeAssignments.map((a) => a.projectId);
    filter.$or = [
      { projectId: { $in: assignedProjectIds } },
      { "assignedVendors.vendorId": { $in: allowedVendors } },
    ];
  } else if (projectId) {
    filter.projectId = projectId;
  }

  if (status && status !== "ALL") filter.status = status;
  if (search) {
    filter.title = { $regex: String(search).trim(), $options: "i" };
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

  Object.assign(job, req.body);
  await job.save();

  return ApiResponse.send(res, 200, "Job updated successfully", job);
});
