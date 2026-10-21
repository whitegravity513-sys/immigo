import CrmOverseasClient from "../../models/CrmOverseasClient.js";
import Project from "../../models/Project.js";
import CrmNotification from "../../models/CrmNotification.js";
import ActivityService from "../../services/activity.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateNextClientId } from "../../utils/idGenerator.js";

export const getAvailableProjects = asyncHandler(async (req, res) => {
  const clients = await CrmOverseasClient.find({}).lean();
  const directProjects = await Project.find({}).populate("clientId").lean().catch(() => []);

  const list = [];
  const seenIds = new Set();

  (clients || []).forEach((c) => {
    (c.projects || []).forEach((p) => {
      const status = (p.status || "Active").toLowerCase();
      if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
        const pId = String(p.id || p.projectId || p._id?.toString() || "");
        if (pId && !seenIds.has(pId)) {
          seenIds.add(pId);
          list.push({
            ...p,
            id: pId,
            projectName: p.projectName || p.name || p.title || "Overseas Project",
            clientId: c.clientId || c._id.toString(),
            clientName: c.companyName || c.name || p.clientName || "Overseas Client",
            country: p.country || c.country || "Overseas",
            status: p.status || "Active",
            manpowerRequirements: p.manpowerRequirements || [],
          });
        }
      }
    });
  });

  (directProjects || []).forEach((dp) => {
    const pId = String(dp.projectId || dp.id || dp._id?.toString() || "");
    if (pId && !seenIds.has(pId)) {
      const status = (dp.status || "Pending").toLowerCase();
      if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
        seenIds.add(pId);
        const cName = dp.clientId?.companyName || dp.clientId?.name || dp.clientName || "Direct Overseas Client";
        const cId = dp.clientId?.clientId || dp.clientId?._id?.toString() || dp.clientId || "cli-admin";
        list.push({
          ...dp,
          id: pId,
          projectName: dp.title || dp.projectName || "Overseas Project",
          clientName: cName,
          clientId: String(cId),
          country: dp.country || dp.clientId?.country || "Overseas",
          status: dp.status || "Active",
          manpowerRequirements: Array.isArray(dp.manpowerRequirements) && dp.manpowerRequirements.length > 0
            ? dp.manpowerRequirements
            : [
                {
                  id: `mpr-${pId}-1`,
                  position: dp.projectType || dp.industryName || dp.title || "General Trade Position",
                  positionTitle: dp.projectType || dp.industryName || dp.title || "General Trade Position",
                  quantity: dp.totalHeadcount || dp.manpower || 1,
                },
              ],
        });
      }
    }
  });

  return res.status(200).json({ success: true, projects: list.reverse() });
});

export const addOrUpdateProject = asyncHandler(async (req, res) => {
  let { clientId, project } = req.body;
  if (!project) {
    return res.status(400).json({ success: false, message: "project data is required" });
  }

  if (!clientId || String(clientId).trim() === "") {
    clientId = project.clientId || (await generateNextClientId());
  }

  const queryConditions = [{ clientId: String(clientId) }];
  if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
    queryConditions.push({ _id: clientId });
  }

  let doc = await CrmOverseasClient.findOne({ $or: queryConditions });

  if (!doc) {
    doc = await CrmOverseasClient.create({
      clientId: String(clientId),
      companyName: project.clientName || "Overseas Client",
      country: project.country || "Overseas",
      projects: [],
    });
  }

  const existingProjects = Array.isArray(doc.projects) ? [...doc.projects] : [];
  const projId = project.id || project.projectId || `prj-${Date.now().toString().slice(-6)}`;
  const fullProject = {
    ...project,
    id: projId,
    clientId: doc.clientId || String(clientId),
    clientName: doc.companyName || project.clientName || "Overseas Client",
    country: project.country || doc.country || "Overseas",
    status: project.status || "Active",
    manpowerRequirements: project.manpowerRequirements || [],
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = existingProjects.findIndex(
    (p) => String(p.id || p.projectId || p._id) === String(projId)
  );
  if (existingIdx !== -1) {
    existingProjects[existingIdx] = fullProject;
  } else {
    existingProjects.unshift(fullProject);
  }

  doc.projects = existingProjects;
  doc.markModified("projects");
  await doc.save();

  try {
    const isAll =
      (fullProject.vendorAssignmentType || fullProject.vendorVisibility) !== "Specific Vendor" &&
      (fullProject.vendorAssignmentType || fullProject.vendorVisibility) !== "specific";

    if (isAll) {
      await CrmNotification.create({
        notificationId: `notif-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: null,
        title: "New Overseas Project Available",
        message: `Project "${fullProject.projectName}" (${fullProject.country}) is open for candidate submissions.`,
        type: "info",
        link: `/vendor/candidates/assign?projectId=${fullProject.id}`,
      });
    } else {
      const assigned = fullProject.assignedVendors || fullProject.assignedVendorIds || [];
      for (const vId of assigned) {
        await CrmNotification.create({
          notificationId: `notif-${Date.now()}-${vId}`,
          recipientRole: "VENDOR",
          vendorId: String(vId),
          title: "Project Assigned Directly to You",
          message: `Admin has assigned project "${fullProject.projectName}" (${fullProject.country}) to your agency.`,
          type: "info",
          link: `/vendor/candidates/assign?projectId=${fullProject.id}`,
        });
      }
    }
  } catch {}

  return res.status(200).json({ success: true, project: fullProject });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { clientId, projectId, id } = req.params;
  const targetProjectId = projectId || id;

  if (!targetProjectId) {
    return res.status(400).json({ success: false, message: "Project ID required" });
  }

  const isHexId = typeof targetProjectId === "string" && /^[0-9a-fA-F]{24}$/.test(targetProjectId);
  const pullQuery = isHexId
    ? { $or: [{ id: String(targetProjectId) }, { projectId: String(targetProjectId) }, { _id: targetProjectId }] }
    : { $or: [{ id: String(targetProjectId) }, { projectId: String(targetProjectId) }] };

  if (clientId) {
    const clientQuery = [{ clientId: String(clientId) }, { id: String(clientId) }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      clientQuery.push({ _id: clientId });
    }
    await CrmOverseasClient.updateMany({ $or: clientQuery }, { $pull: { projects: pullQuery } });
  } else {
    await CrmOverseasClient.updateMany({}, { $pull: { projects: pullQuery } });
  }

  try {
    const projectDeleteQueries = [{ projectId: targetProjectId }, { id: targetProjectId }];
    if (isHexId) {
      projectDeleteQueries.push({ _id: targetProjectId });
    }
    await Project.deleteMany({ $or: projectDeleteQueries });
  } catch {}

  try {
    await ActivityService.recordActivity({
      action: "DELETE",
      module: "CRM",
      targetId: targetProjectId,
      description: `Project (${targetProjectId}) deleted from CRM.`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

  return res.status(200).json({
    success: true,
    message: "Project deleted successfully.",
    id: targetProjectId,
  });
});
