import ProjectAssignment from "../models/ProjectAssignment.js";
import Vendor from "../models/Vendor.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { ApiError } from "../utils/apiError.js";
import { findProjectAcrossSources } from "../utils/projectResolver.js";
import { invalidateUserAuthCache } from "../middleware/rbac.middleware.js";
import PermissionService from "./permission.service.js";
import NotificationService from "./notification.service.js";

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

const resolveLogUserType = (actorUser) => {
  const roleUpper = String(actorUser?.role || "").toUpperCase();
  if (actorUser?.isSuperAdmin || roleUpper === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (roleUpper === "ADMIN") return "ADMIN";
  if (roleUpper === "HR" || roleUpper === "VENDOR_HR" || roleUpper === "EMPLOYEE_HR") return "HR";
  return "SYSTEM";
};

export class ProjectAssignmentService {
  static async assignVendorToProject({
    projectId,
    vendorId,
    actorUser,
    notes = "",
  }) {
    if (!projectId || !vendorId) {
      throw new ApiError(400, "Project ID and Vendor ID are required.");
    }

    const vStr = String(vendorId).trim();
    const [resolvedProject, vendor] = await Promise.all([
      findProjectAcrossSources(projectId),
      Vendor.findOne({
        $or: [
          { vendorId: vStr },
          { id: vStr },
          ...(isValidObjectId(vStr) ? [{ _id: vStr }] : []),
        ],
      }),
    ]);

    if (!resolvedProject) throw new ApiError(404, "Project not found.");
    if (!vendor) throw new ApiError(404, "Vendor not found.");

    const normalizedProjId = resolvedProject.projectId;
    const normalizedVendorId = vendor.vendorId || vendor._id.toString();

    const existingAssignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_PROJECT",
      projectId: { $in: resolvedProject.rawIdCandidates },
      vendorId: normalizedVendorId,
      status: "Active",
    });

    if (existingAssignment) {
      throw new ApiError(409, "This vendor is already assigned to this project.");
    }

    const assignment = await ProjectAssignment.create({
      assignmentType: "VENDOR_PROJECT",
      projectId: normalizedProjId,
      ...(resolvedProject.projectRef ? { projectRef: resolvedProject.projectRef } : {}),
      projectName: resolvedProject.projectName,
      vendorId: normalizedVendorId,
      vendorRef: vendor._id,
      vendorName: vendor.companyName,
      status: "Active",
      assignedBy: actorUser?._id?.toString() || actorUser?.id || "System",
      assignedByName: actorUser?.name || "Administrator",
      assignedByRole: actorUser?.role || "SUPER_ADMIN",
      notes: notes || "Vendor assigned to project",
    });

    if (resolvedProject.projectDoc) {
      const isAlreadyInProjectList = (resolvedProject.projectDoc.assignedVendors || []).some(
        (v) => v.vendorId === normalizedVendorId
      );
      if (!isAlreadyInProjectList) {
        resolvedProject.projectDoc.assignedVendors =
          resolvedProject.projectDoc.assignedVendors || [];
        resolvedProject.projectDoc.assignedVendors.push({
          vendorId: normalizedVendorId,
          vendorName: vendor.companyName,
          assignedAt: new Date(),
          status: "Active",
        });
        await resolvedProject.projectDoc.save();
      }
    }

    try {
      await ActivityLog.create({
        userType: resolveLogUserType(actorUser),
        userId: actorUser?._id?.toString() || actorUser?.id || "System",
        userName: actorUser?.name || "Administrator",
        action: "VENDOR_PROJECT_ASSIGNED",
        title: `Assigned [${vendor.companyName}] to [${resolvedProject.projectName}]`,
        description: `Vendor ${vendor.companyName} (${normalizedVendorId}) was assigned to project ${resolvedProject.projectName}.`,
        entityType: "Project",
        entityId: normalizedProjId,
        entityName: resolvedProject.projectName,
        vendorId: normalizedVendorId,
        vendorName: vendor.companyName,
        status: "Assigned",
        visibility: "ALL",
        remarks: notes || "Assigned via Vendor Project workflow",
      });
    } catch {}

    return assignment;
  }

  static async assignVendorToMultipleProjects({
    vendorId,
    projectIds = [],
    actorUser,
    notes = "",
  }) {
    if (!vendorId || !Array.isArray(projectIds) || projectIds.length === 0) {
      throw new ApiError(400, "Vendor ID and an array of Project IDs are required.");
    }

    const results = [];
    for (const pId of projectIds) {
      try {
        const res = await this.assignVendorToProject({
          projectId: pId,
          vendorId,
          actorUser,
          notes,
        });
        results.push({ projectId: pId, success: true, assignment: res });
      } catch (err) {
        results.push({ projectId: pId, success: false, message: err.message });
      }
    }

    return results;
  }

  static async assignMultipleVendorsToOneProject({
    projectId,
    vendorIds = [],
    actorUser,
    notes = "",
  }) {
    if (!projectId || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      throw new ApiError(400, "Project ID and an array of Vendor IDs are required.");
    }

    const results = [];
    for (const vId of vendorIds) {
      try {
        const res = await this.assignVendorToProject({
          projectId,
          vendorId: vId,
          actorUser,
          notes,
        });
        results.push({ vendorId: vId, success: true, assignment: res });
      } catch (err) {
        results.push({ vendorId: vId, success: false, message: err.message });
      }
    }

    return results;
  }

  static async removeVendorFromProject({ projectId, vendorId, actorUser, reason = "" }) {
    const resolvedProject = await findProjectAcrossSources(projectId);
    const projectIds = resolvedProject ? resolvedProject.rawIdCandidates : [projectId];

    const assignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_PROJECT",
      projectId: { $in: projectIds },
      vendorId,
      status: "Active",
    });

    if (!assignment) {
      throw new ApiError(404, "Active project assignment for this vendor was not found.");
    }

    assignment.status = "Removed";
    assignment.removedAt = new Date();
    assignment.removedBy = actorUser?.name || "Administrator";
    assignment.notes = reason ? `${assignment.notes} | Unassigned: ${reason}` : assignment.notes;
    await assignment.save();

    if (resolvedProject?.projectDoc && Array.isArray(resolvedProject.projectDoc.assignedVendors)) {
      resolvedProject.projectDoc.assignedVendors =
        resolvedProject.projectDoc.assignedVendors.filter((v) => v.vendorId !== vendorId);
      await resolvedProject.projectDoc.save();
    }

    try {
      await ActivityLog.create({
        userType: resolveLogUserType(actorUser),
        userId: actorUser?._id?.toString() || actorUser?.id || "System",
        userName: actorUser?.name || "Administrator",
        action: "VENDOR_PROJECT_REMOVED",
        title: `Removed Vendor [${assignment.vendorName}] from Project [${assignment.projectName}]`,
        description: `Vendor assignment was unlinked from project.`,
        entityType: "Project",
        entityId: projectId,
        entityName: assignment.projectName,
        vendorId,
        vendorName: assignment.vendorName,
        status: "Removed",
        visibility: "ALL",
        remarks: reason || "Unassigned from project",
      });
    } catch {}

    return assignment;
  }

  static async assignVendorHRToProject({
    vendorHRUserId,
    vendorId,
    projectId,
    actorUser,
    notes = "",
  }) {
    const user = await User.findById(vendorHRUserId);
    if (!user) throw new ApiError(404, "Vendor HR user account not found.");

    const resolvedProject = await findProjectAcrossSources(projectId);
    if (!resolvedProject) throw new ApiError(404, "Project not found.");

    const normalizedProjId = resolvedProject.projectId;
    const rawVendorKey = vendorId || (Array.isArray(user.assignedVendors) ? user.assignedVendors[0] : "");
    let vendorDoc = null;
    if (rawVendorKey) {
      const vStr = String(rawVendorKey).trim();
      vendorDoc = await Vendor.findOne({
        $or: [
          { vendorId: vStr },
          { id: vStr },
          ...(isValidObjectId(vStr) ? [{ _id: vStr }] : []),
        ],
      });
    }

    const effectiveVendorId = vendorDoc ? (vendorDoc.vendorId || vendorDoc._id.toString()) : String(rawVendorKey || "");

    if (effectiveVendorId) {
      const existingVendors = Array.isArray(user.assignedVendors) ? user.assignedVendors : [];
      if (!existingVendors.includes(effectiveVendorId)) {
        user.assignedVendors = Array.from(new Set([...existingVendors, effectiveVendorId]));
        await user.save();
      }
    }

    let vendorAssignment = null;
    if (effectiveVendorId) {
      vendorAssignment = await ProjectAssignment.findOne({
        assignmentType: "VENDOR_PROJECT",
        projectId: { $in: resolvedProject.rawIdCandidates },
        vendorId: effectiveVendorId,
        status: "Active",
      });

      if (!vendorAssignment) {
        vendorAssignment = await this.assignVendorToProject({
          projectId: normalizedProjId,
          vendorId: effectiveVendorId,
          actorUser,
          notes: "Auto-linked via Vendor HR assignment",
        });
      }
    }

    const existingHRAssignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_HR_PROJECT",
      projectId: { $in: resolvedProject.rawIdCandidates },
      vendorId: effectiveVendorId,
      userId: user._id,
      status: "Active",
    });

    if (existingHRAssignment) {
      throw new ApiError(409, "This Vendor HR is already assigned to this project.");
    }

    const assignment = await ProjectAssignment.create({
      assignmentType: "VENDOR_HR_PROJECT",
      projectId: normalizedProjId,
      ...(resolvedProject.projectRef ? { projectRef: resolvedProject.projectRef } : {}),
      projectName: resolvedProject.projectName,
      vendorId: effectiveVendorId,
      ...(vendorDoc?._id ? { vendorRef: vendorDoc._id } : {}),
      vendorName: vendorDoc?.companyName || vendorAssignment?.vendorName || "",
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: "VENDOR_HR",
      status: "Active",
      assignedBy: actorUser?._id?.toString() || actorUser?.id || "System",
      assignedByName: actorUser?.name || "Administrator",
      assignedByRole: actorUser?.role || "SUPER_ADMIN",
      notes: notes || "Vendor HR assigned to project",
    });

    if (resolvedProject.projectDoc) {
      const isAlreadyInList = (resolvedProject.projectDoc.assignedVendorHRs || []).some(
        (hr) => String(hr.userId) === String(user._id) && hr.vendorId === effectiveVendorId
      );
      if (!isAlreadyInList) {
        resolvedProject.projectDoc.assignedVendorHRs =
          resolvedProject.projectDoc.assignedVendorHRs || [];
        resolvedProject.projectDoc.assignedVendorHRs.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          vendorId: effectiveVendorId,
          assignedAt: new Date(),
        });
        await resolvedProject.projectDoc.save();
      }
    }

    invalidateUserAuthCache(user._id);
    PermissionService.invalidateUserCache(user._id);

    try {
      const vendorLabel = vendorDoc?.companyName || vendorAssignment?.vendorName || effectiveVendorId;
      await Promise.all([
        NotificationService.createNotification({
          type: "PROJECT_ASSIGNED",
          title: "New Project Assigned",
          message: `${actorUser?.name || "Administrator"} assigned a project${vendorLabel ? ` (${vendorLabel})` : ""} to you. View details in My Projects.`,
          targetRole: "VENDOR_HR",
          targetRoles: ["VENDOR_HR"],
          targetType: "SPECIFIC",
          targetUserId: String(user._id),
          targetVendorId: effectiveVendorId || null,
          actor: actorUser,
          moduleScope: "VENDOR",
          metadata: {
            link: "/hr/vendor-dashboard?view=projects",
            hrUserId: String(user._id),
            hrUserName: user.name,
            vendorId: effectiveVendorId,
            projectId: normalizedProjId,
          },
        }),
        NotificationService.notifyStaffAction({
          actor: actorUser,
          type: "PROJECT_ASSIGNED",
          title: "Vendor HR Project Allocation Updated",
          message: `${actorUser?.name || "Administrator"} assigned ${user.name} to project "${resolvedProject.projectName}"${vendorLabel ? ` (${vendorLabel})` : ""}.`,
          moduleScope: "VENDOR",
          targetVendorId: null,
          metadata: {
            link: "/admin/hr-activities?tab=vendorHRDashboard&view=assignments",
            hrUserId: String(user._id),
            hrUserName: user.name,
            vendorId: effectiveVendorId,
            projectId: normalizedProjId,
          },
        }),
      ]);
    } catch {}

    return assignment;
  }

  static async batchAssignHRToProjectsAndVendors({
    hrUserId,
    projectIds = [],
    vendorIds = [],
    actorUser,
    notes = "",
  }) {
    if (!hrUserId) {
      throw new ApiError(400, "HR User ID is required.");
    }
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new ApiError(400, "At least one Project must be selected.");
    }
    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      throw new ApiError(400, "At least one Vendor must be selected.");
    }

    const user = await User.findById(hrUserId);
    if (!user) throw new ApiError(404, "HR user account not found.");

    const resolvedVendors = [];
    const seenVendorIds = new Set();
    for (const rawVId of vendorIds) {
      const vStr = String(rawVId || "").trim();
      if (!vStr) continue;
      const vendor = await Vendor.findOne({
        $or: [
          { vendorId: vStr },
          { id: vStr },
          ...(isValidObjectId(vStr) ? [{ _id: vStr }] : []),
        ],
      });
      if (!vendor) continue;
      const canonicalVId = String(vendor.vendorId || vendor._id.toString());
      if (!seenVendorIds.has(canonicalVId)) {
        seenVendorIds.add(canonicalVId);
        resolvedVendors.push({ doc: vendor, vendorId: canonicalVId });
      }
    }

    if (resolvedVendors.length === 0) {
      throw new ApiError(404, "None of the selected recruitment agencies were found.");
    }

    const resolvedProjects = [];
    const seenProjectIds = new Set();
    for (const rawPId of projectIds) {
      const pStr = String(rawPId || "").trim();
      if (!pStr) continue;
      const proj = await findProjectAcrossSources(pStr);
      if (!proj) continue;
      if (!seenProjectIds.has(proj.projectId)) {
        seenProjectIds.add(proj.projectId);
        resolvedProjects.push(proj);
      }
    }

    if (resolvedProjects.length === 0) {
      throw new ApiError(404, "None of the selected projects were found.");
    }

    const canonicalVendorIds = resolvedVendors.map((v) => v.vendorId);
    const currentAssigned = Array.isArray(user.assignedVendors)
      ? user.assignedVendors.map(String)
      : [];
    user.assignedVendors = Array.from(new Set([...currentAssigned, ...canonicalVendorIds]));
    await user.save();

    const createdAssignments = [];

    for (const { doc: vendor, vendorId: normalizedVendorId } of resolvedVendors) {
      for (const resolvedProj of resolvedProjects) {
        const normalizedProjId = resolvedProj.projectId;

        let vendorAssignment = await ProjectAssignment.findOne({
          assignmentType: "VENDOR_PROJECT",
          projectId: { $in: resolvedProj.rawIdCandidates },
          vendorId: normalizedVendorId,
          status: "Active",
        });

        if (!vendorAssignment) {
          try {
            vendorAssignment = await this.assignVendorToProject({
              projectId: normalizedProjId,
              vendorId: normalizedVendorId,
              actorUser,
              notes: notes || "Auto-assigned via HR Project & Vendor batch allocation",
            });
          } catch {}
        }

        let hrAssignment = await ProjectAssignment.findOne({
          assignmentType: "VENDOR_HR_PROJECT",
          projectId: { $in: resolvedProj.rawIdCandidates },
          vendorId: normalizedVendorId,
          userId: user._id,
          status: "Active",
        });

        if (!hrAssignment) {
          hrAssignment = await ProjectAssignment.create({
            assignmentType: "VENDOR_HR_PROJECT",
            projectId: normalizedProjId,
            ...(resolvedProj.projectRef ? { projectRef: resolvedProj.projectRef } : {}),
            projectName: resolvedProj.projectName,
            vendorId: normalizedVendorId,
            vendorRef: vendor._id,
            vendorName: vendor.companyName,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.hrType || user.role || "VENDOR_HR",
            status: "Active",
            assignedBy: actorUser?._id?.toString() || actorUser?.id || "System",
            assignedByName: actorUser?.name || "Administrator",
            assignedByRole: actorUser?.role || "SUPER_ADMIN",
            notes: notes || "HR assigned to Project and Vendor",
          });
          createdAssignments.push(hrAssignment);
        }

        if (resolvedProj.projectDoc) {
          resolvedProj.projectDoc.assignedVendorHRs =
            resolvedProj.projectDoc.assignedVendorHRs || [];
          const alreadyInProject = resolvedProj.projectDoc.assignedVendorHRs.some(
            (h) => String(h.userId) === String(user._id) && h.vendorId === normalizedVendorId
          );
          if (!alreadyInProject) {
            resolvedProj.projectDoc.assignedVendorHRs.push({
              userId: user._id,
              name: user.name,
              email: user.email,
              vendorId: normalizedVendorId,
              assignedAt: new Date(),
            });
            await resolvedProj.projectDoc.save();
          }
        }
      }
    }

    invalidateUserAuthCache(user._id);
    PermissionService.invalidateUserCache(user._id);

    const projectNames = resolvedProjects.map((p) => p.projectName);
    const vendorNames = resolvedVendors.map((v) => v.doc.companyName);
    const projectSummary =
      projectNames.length <= 2
        ? projectNames.join(", ")
        : `${projectNames.slice(0, 2).join(", ")} +${projectNames.length - 2} more`;
    const vendorSummary =
      vendorNames.length <= 2
        ? vendorNames.join(", ")
        : `${vendorNames.slice(0, 2).join(", ")} +${vendorNames.length - 2} more`;
    const assignedProjectIds = resolvedProjects.map((p) => p.projectId);

    try {
      await ActivityLog.create({
        userType: resolveLogUserType(actorUser),
        userId: actorUser?._id?.toString() || actorUser?.id || "System",
        userName: actorUser?.name || "Administrator",
        action: "VENDOR_HR_BATCH_ASSIGNED",
        title: `Assigned [${user.name}] to ${resolvedProjects.length} project(s) & ${resolvedVendors.length} agency(ies)`,
        description: `Projects: ${projectSummary} | Agencies: ${vendorSummary}`,
        entityType: "Project",
        entityId: assignedProjectIds[0] || "",
        entityName: projectSummary,
        vendorId: canonicalVendorIds[0] || "",
        vendorName: vendorSummary,
        status: "Assigned",
        visibility: "ALL",
        remarks: notes || "Assigned via Assign HR workspace",
      });
    } catch {}

    try {
      await Promise.all([
        NotificationService.createNotification({
          type: "PROJECT_ASSIGNED",
          title: "New Project & Agency Assigned",
          message: `${actorUser?.name || "Administrator"} assigned ${resolvedProjects.length} project(s) (${vendorSummary}) to you. View details in My Projects.`,
          targetRole: "VENDOR_HR",
          targetRoles: ["VENDOR_HR"],
          targetType: "SPECIFIC",
          targetUserId: String(user._id),
          targetVendorId: canonicalVendorIds[0] || null,
          actor: actorUser,
          moduleScope: "VENDOR",
          metadata: {
            link: "/hr/vendor-dashboard?view=projects",
            hrUserId: String(user._id),
            hrUserName: user.name,
            vendorId: canonicalVendorIds[0] || "",
            vendorIds: canonicalVendorIds,
            projectIds: assignedProjectIds,
          },
        }),
        NotificationService.notifyStaffAction({
          actor: actorUser,
          type: "PROJECT_ASSIGNED",
          title: "Vendor HR Assignment Updated",
          message: `${actorUser?.name || "Administrator"} assigned ${user.name} to ${projectSummary} (${vendorSummary}).`,
          moduleScope: "VENDOR",
          targetVendorId: null,
          metadata: {
            link: "/admin/hr-activities?tab=vendorHRDashboard&view=assignments",
            hrUserId: String(user._id),
            hrUserName: user.name,
            vendorIds: canonicalVendorIds,
            projectIds: assignedProjectIds,
          },
        }),
      ]);
    } catch {}

    return createdAssignments;
  }

  static async removeAssignmentById({ assignmentId, actorUser, reason = "" }) {
    const assignment = await ProjectAssignment.findById(assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Project assignment not found.");
    }

    assignment.status = "Removed";
    assignment.removedAt = new Date();
    assignment.removedBy = actorUser?.name || "Administrator";
    assignment.notes = reason ? `${assignment.notes} | Unassigned: ${reason}` : assignment.notes;
    await assignment.save();

    const resolvedProject = await findProjectAcrossSources(
      assignment.projectId || (assignment.projectRef ? assignment.projectRef.toString() : "")
    );

    if (resolvedProject?.projectDoc) {
      const project = resolvedProject.projectDoc;
      if (assignment.assignmentType === "VENDOR_PROJECT" && Array.isArray(project.assignedVendors)) {
        project.assignedVendors = project.assignedVendors.filter(
          (v) => v.vendorId !== assignment.vendorId
        );
      }
      if (
        assignment.assignmentType === "VENDOR_HR_PROJECT" &&
        Array.isArray(project.assignedVendorHRs)
      ) {
        project.assignedVendorHRs = project.assignedVendorHRs.filter(
          (hr) =>
            !(
              String(hr.userId) === String(assignment.userId) &&
              hr.vendorId === assignment.vendorId
            )
        );
      }
      await project.save();
    }

    if (assignment.userId) {
      invalidateUserAuthCache(assignment.userId);
      PermissionService.invalidateUserCache(assignment.userId);
    }

    return assignment;
  }
}

export default ProjectAssignmentService;
