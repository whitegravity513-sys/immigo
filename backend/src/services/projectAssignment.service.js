import ProjectAssignment from "../models/ProjectAssignment.js";
import Project from "../models/Project.js";
import Vendor from "../models/Vendor.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { ApiError } from "../utils/apiError.js";

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

    const [project, vendor] = await Promise.all([
      Project.findOne({
        $or: [
          { projectId },
          { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null },
        ],
      }),
      Vendor.findOne({
        $or: [
          { vendorId },
          { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null },
        ],
      }),
    ]);

    if (!project) throw new ApiError(404, "Project not found.");
    if (!vendor) throw new ApiError(404, "Vendor not found.");

    const normalizedProjId = project.projectId || project._id.toString();
    const normalizedVendorId = vendor.vendorId;

    const existingAssignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_PROJECT",
      projectId: normalizedProjId,
      vendorId: normalizedVendorId,
      status: "Active",
    });

    if (existingAssignment) {
      throw new ApiError(409, "This vendor is already assigned to this project.");
    }

    const assignment = await ProjectAssignment.create({
      assignmentType: "VENDOR_PROJECT",
      projectId: normalizedProjId,
      projectRef: project._id,
      projectName: project.title || project.projectName || "Project",
      vendorId: normalizedVendorId,
      vendorRef: vendor._id,
      vendorName: vendor.companyName,
      status: "Active",
      assignedBy: actorUser?._id?.toString() || actorUser?.id || "System",
      assignedByName: actorUser?.name || "Administrator",
      assignedByRole: actorUser?.role || "SUPER_ADMIN",
      notes: notes || "Vendor assigned to project",
    });

    const isAlreadyInProjectList = (project.assignedVendors || []).some(
      (v) => v.vendorId === normalizedVendorId
    );
    if (!isAlreadyInProjectList) {
      project.assignedVendors = project.assignedVendors || [];
      project.assignedVendors.push({
        vendorId: normalizedVendorId,
        vendorName: vendor.companyName,
        assignedAt: new Date(),
        status: "Active",
      });
      await project.save();
    }

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Administrator",
      action: "VENDOR_PROJECT_ASSIGNED",
      title: `Assigned [${vendor.companyName}] to [${project.title}]`,
      description: `Vendor ${vendor.companyName} (${vendor.vendorId}) was assigned to project ${project.title}.`,
      entityType: "Project",
      entityId: normalizedProjId,
      entityName: project.title,
      vendorId: normalizedVendorId,
      vendorName: vendor.companyName,
      status: "Assigned",
      visibility: "ALL",
      remarks: notes || "Assigned via Vendor Project workflow",
    });

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
    const assignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_PROJECT",
      projectId,
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

    const project = await Project.findOne({
      $or: [{ projectId }, { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null }],
    });
    if (project && Array.isArray(project.assignedVendors)) {
      project.assignedVendors = project.assignedVendors.filter(
        (v) => v.vendorId !== vendorId
      );
      await project.save();
    }

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
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

    const project = await Project.findOne({
      $or: [{ projectId }, { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null }],
    });
    if (!project) throw new ApiError(404, "Project not found.");

    const normalizedProjId = project.projectId || project._id.toString();

    const effectiveVendorId = vendorId || (Array.isArray(user.assignedVendors) ? user.assignedVendors[0] : "");

    let vendorAssignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_PROJECT",
      projectId: normalizedProjId,
      vendorId: effectiveVendorId,
      status: "Active",
    });

    if (!vendorAssignment && effectiveVendorId) {
      vendorAssignment = await this.assignVendorToProject({
        projectId: normalizedProjId,
        vendorId: effectiveVendorId,
        actorUser,
        notes: "Auto-linked via Vendor HR assignment",
      });
    }

    const existingHRAssignment = await ProjectAssignment.findOne({
      assignmentType: "VENDOR_HR_PROJECT",
      projectId: normalizedProjId,
      userId: user._id,
      status: "Active",
    });

    if (existingHRAssignment) {
      throw new ApiError(409, "This Vendor HR is already assigned to this project.");
    }

    const assignment = await ProjectAssignment.create({
      assignmentType: "VENDOR_HR_PROJECT",
      projectId: normalizedProjId,
      projectRef: project._id,
      projectName: project.title,
      vendorId: effectiveVendorId,
      vendorName: vendorAssignment?.vendorName || "",
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

    const isAlreadyInList = (project.assignedVendorHRs || []).some(
      (hr) => String(hr.userId) === String(user._id)
    );
    if (!isAlreadyInList) {
      project.assignedVendorHRs = project.assignedVendorHRs || [];
      project.assignedVendorHRs.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        vendorId,
        assignedAt: new Date(),
      });
      await project.save();
    }

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

    const currentAssigned = Array.isArray(user.assignedVendors) ? user.assignedVendors : [];
    const mergedVendors = Array.from(new Set([...currentAssigned, ...vendorIds]));
    user.assignedVendors = mergedVendors;
    await user.save();

    const createdAssignments = [];

    for (const vId of vendorIds) {
      const vendor = await Vendor.findOne({
        $or: [{ vendorId: vId }, { _id: vId.match(/^[0-9a-fA-F]{24}$/) ? vId : null }],
      });
      if (!vendor) continue;
      const normalizedVendorId = vendor.vendorId;

      for (const pId of projectIds) {
        const project = await Project.findOne({
          $or: [{ projectId: pId }, { _id: pId.match(/^[0-9a-fA-F]{24}$/) ? pId : null }],
        });
        if (!project) continue;
        const normalizedProjId = project.projectId || project._id.toString();

        let vendorAssignment = await ProjectAssignment.findOne({
          assignmentType: "VENDOR_PROJECT",
          projectId: normalizedProjId,
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
          } catch (e) {
          }
        }

        let hrAssignment = await ProjectAssignment.findOne({
          assignmentType: "VENDOR_HR_PROJECT",
          projectId: normalizedProjId,
          vendorId: normalizedVendorId,
          userId: user._id,
          status: "Active",
        });

        if (!hrAssignment) {
          hrAssignment = await ProjectAssignment.create({
            assignmentType: "VENDOR_HR_PROJECT",
            projectId: normalizedProjId,
            projectRef: project._id,
            projectName: project.title,
            vendorId: normalizedVendorId,
            vendorRef: vendor._id,
            vendorName: vendor.companyName,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role || "VENDOR_HR",
            status: "Active",
            assignedBy: actorUser?._id?.toString() || actorUser?.id || "System",
            assignedByName: actorUser?.name || "Administrator",
            assignedByRole: actorUser?.role || "SUPER_ADMIN",
            notes: notes || "HR assigned to Project and Vendor",
          });
          createdAssignments.push(hrAssignment);
        }

        project.assignedVendorHRs = project.assignedVendorHRs || [];
        const alreadyInProject = project.assignedVendorHRs.some(
          (h) => String(h.userId) === String(user._id) && h.vendorId === normalizedVendorId
        );
        if (!alreadyInProject) {
          project.assignedVendorHRs.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            vendorId: normalizedVendorId,
            vendorName: vendor.companyName,
            assignedAt: new Date(),
          });
          await project.save();
        }
      }
    }

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

    const project = await Project.findOne({
      $or: [
        { projectId: assignment.projectId },
        { _id: assignment.projectRef || (assignment.projectId.match(/^[0-9a-fA-F]{24}$/) ? assignment.projectId : null) },
      ],
    });

    if (project) {
      if (assignment.assignmentType === "VENDOR_PROJECT" && Array.isArray(project.assignedVendors)) {
        project.assignedVendors = project.assignedVendors.filter(
          (v) => v.vendorId !== assignment.vendorId
        );
      }
      if (assignment.assignmentType === "VENDOR_HR_PROJECT" && Array.isArray(project.assignedVendorHRs)) {
        project.assignedVendorHRs = project.assignedVendorHRs.filter(
          (hr) => !(String(hr.userId) === String(assignment.userId) && hr.vendorId === assignment.vendorId)
        );
      }
      await project.save();
    }

    return assignment;
  }
}

export default ProjectAssignmentService;
