import ProjectAssignmentService from "../../services/projectAssignment.service.js";
import ProjectAssignment from "../../models/ProjectAssignment.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

const emitAssignmentSync = (vendorId = null) => {
  emitRealtimeEvent({
    events: ["immigo:project-update", "immigo:dashboard-update", "immigo:vendor-hr-refresh", "immigo:notification-update"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    vendorId: vendorId ? String(vendorId) : null,
  });
};

export const assignVendorToProject = asyncHandler(async (req, res) => {
  const { projectId, vendorId, notes } = req.body;
  const assignment = await ProjectAssignmentService.assignVendorToProject({
    projectId,
    vendorId,
    notes,
    actorUser: req.user,
  });
  emitAssignmentSync(vendorId);
  return ApiResponse.send(res, 201, "Vendor assigned to project successfully", assignment);
});

export const assignVendorToMultipleProjects = asyncHandler(async (req, res) => {
  const { vendorId, projectIds, notes } = req.body;
  const results = await ProjectAssignmentService.assignVendorToMultipleProjects({
    vendorId,
    projectIds,
    notes,
    actorUser: req.user,
  });
  emitAssignmentSync(vendorId);
  return ApiResponse.send(res, 200, "Vendor multi-project assignments processed", results);
});

export const assignMultipleVendorsToOneProject = asyncHandler(async (req, res) => {
  const { projectId, vendorIds, notes } = req.body;
  const results = await ProjectAssignmentService.assignMultipleVendorsToOneProject({
    projectId,
    vendorIds,
    notes,
    actorUser: req.user,
  });
  emitAssignmentSync();
  return ApiResponse.send(res, 200, "Project multi-vendor assignments processed", results);
});

export const removeVendorFromProject = asyncHandler(async (req, res) => {
  const { projectId, vendorId, reason } = req.body;
  const assignment = await ProjectAssignmentService.removeVendorFromProject({
    projectId,
    vendorId,
    reason,
    actorUser: req.user,
  });
  emitAssignmentSync(vendorId);
  return ApiResponse.send(res, 200, "Vendor removed from project successfully", assignment);
});

export const assignVendorHRToProject = asyncHandler(async (req, res) => {
  const { vendorHRUserId, vendorId, projectId, notes } = req.body;
  const assignment = await ProjectAssignmentService.assignVendorHRToProject({
    vendorHRUserId,
    vendorId,
    projectId,
    notes,
    actorUser: req.user,
  });
  emitAssignmentSync(vendorId);
  return ApiResponse.send(res, 201, "Vendor HR assigned to project successfully", assignment);
});

export const batchAssignHRToProjectsAndVendors = asyncHandler(async (req, res) => {
  const { hrUserId, projectIds, vendorIds, notes } = req.body;
  const assignments = await ProjectAssignmentService.batchAssignHRToProjectsAndVendors({
    hrUserId,
    projectIds,
    vendorIds,
    notes,
    actorUser: req.user,
  });
  emitAssignmentSync();
  return ApiResponse.send(res, 201, "HR assigned to projects and vendors successfully", assignments);
});

export const removeAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignmentId, reason } = req.body || {};
  const targetId = id || assignmentId;
  const assignment = await ProjectAssignmentService.removeAssignmentById({
    assignmentId: targetId,
    reason,
    actorUser: req.user,
  });
  emitAssignmentSync(assignment?.vendorId || null);
  return ApiResponse.send(res, 200, "Assignment unlinked successfully", assignment);
});

export const getProjectAssignments = asyncHandler(async (req, res) => {
  const { projectId, vendorId, userId, assignmentType, status = "Active" } = req.query;
  const filter = {};
  if (projectId) filter.projectId = projectId;
  if (vendorId) filter.vendorId = vendorId;
  if (userId) filter.userId = userId;
  if (assignmentType) filter.assignmentType = assignmentType;
  if (status && status !== "ALL") filter.status = status;

  const assignments = await ProjectAssignment.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.send(res, 200, "Project assignments retrieved successfully", assignments);
});
