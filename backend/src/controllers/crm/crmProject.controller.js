import CrmOverseasClient from "../../models/CrmOverseasClient.js";
import Project from "../../models/Project.js";
import CrmCandidateApplication from "../../models/CrmCandidateApplication.js";
import CandidateApplication from "../../models/CandidateApplication.js";
import CrmNotification from "../../models/CrmNotification.js";
import NotificationService, { resolveActorInfo } from "../../services/notification.service.js";
import ActivityService from "../../services/activity.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateNextClientId } from "../../utils/idGenerator.js";
import { resolveProjectMilestonesData } from "../../utils/projectResolver.js";

const POST_SELECTION_STATUSES = new Set([
  "Selected",
  "Processing",
  "Completed",
  "Offer Released",
  "Offer Accepted",
  "Visa Processing",
  "Visa Issued",
  "Visa Allotted",
  "Joined",
  "Deployed",
]);

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
                  salary: dp.salary || "",
                  currency: dp.currency || "",
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
    const projIdCandidates = Array.from(
      new Set(
        [projId, project.id, project.projectId, project._id ? String(project._id) : ""]
          .filter(Boolean)
          .map(String)
      )
    );
    const hexIdCandidates = projIdCandidates.filter((v) => /^[0-9a-fA-F]{24}$/.test(v));

    const projectDocs = await Project.find({
      $or: [
        { projectId: { $in: projIdCandidates } },
        ...(hexIdCandidates.length > 0 ? [{ _id: { $in: hexIdCandidates } }] : []),
      ],
    });
    for (const pDoc of projectDocs) {
      if (fullProject.projectName) pDoc.title = fullProject.projectName;
      if (fullProject.salary !== undefined) pDoc.salary = String(fullProject.salary || "");
      if (fullProject.currency !== undefined) pDoc.currency = String(fullProject.currency || "");
      pDoc.recruitmentConfig = {
        ...(pDoc.recruitmentConfig || {}),
        paymentMilestones: Array.isArray(fullProject.paymentMilestones) ? fullProject.paymentMilestones : [],
        totalMilestoneAmount: Number(
          fullProject.totalMilestoneAmount ?? fullProject.totalAgreedAmount ?? 0
        ),
      };
      pDoc.markModified("recruitmentConfig");
      await pDoc.save();
    }

    const propagateToApps = async (Model) => {
      const matchedApps = await Model.find({ projectId: { $in: projIdCandidates } });
      for (const appDoc of matchedApps) {
        let changed = false;
        if (fullProject.salary !== undefined && appDoc.salary !== fullProject.salary) {
          appDoc.salary = String(fullProject.salary || "");
          changed = true;
        }
        if (fullProject.currency !== undefined && appDoc.currency !== fullProject.currency) {
          appDoc.currency = String(fullProject.currency || "");
          changed = true;
        }
        if (fullProject.projectName && appDoc.projectName !== fullProject.projectName) {
          appDoc.projectName = fullProject.projectName;
          changed = true;
        }
        if (fullProject.country && appDoc.country !== fullProject.country) {
          appDoc.country = fullProject.country;
          changed = true;
        }

        const isOverridden = Boolean(appDoc.get?.("milestonesOverridden") ?? appDoc.milestonesOverridden);
        const effStatus = appDoc.status || "";
        const effStage = appDoc.recruitmentStage || "";
        const hasMilestones = Array.isArray(appDoc.processMilestones) && appDoc.processMilestones.length > 0;
        if (
          !isOverridden &&
          (POST_SELECTION_STATUSES.has(effStatus) || POST_SELECTION_STATUSES.has(effStage) || hasMilestones)
        ) {
          const resolved = resolveProjectMilestonesData(fullProject, appDoc.processMilestones || [], false);
          if (resolved.processMilestones.length > 0 || hasMilestones) {
            appDoc.processMilestones = resolved.processMilestones;
            appDoc.paymentPlan = {
              ...(appDoc.paymentPlan?.toObject?.() || appDoc.paymentPlan || { currency: "INR" }),
              totalAmount: resolved.totalAmount,
              milestones: resolved.processMilestones,
            };
            appDoc.markModified("processMilestones");
            appDoc.markModified("paymentPlan");
            changed = true;
          }
        }
        if (changed) {
          await appDoc.save();
        }
      }
    };

    await Promise.all([
      propagateToApps(CrmCandidateApplication),
      propagateToApps(CandidateApplication),
    ]);
  } catch (syncErr) {
    console.warn("Project update propagation warning:", syncErr?.message);
  }

  try {
    const actorMeta = resolveActorInfo(req.user);
    const isAll =
      (fullProject.vendorAssignmentType || fullProject.vendorVisibility) !== "Specific Vendor" &&
      (fullProject.vendorAssignmentType || fullProject.vendorVisibility) !== "specific";

    if (isAll) {
      await CrmNotification.create({
        notificationId: `notif-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: null,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
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
          actorId: actorMeta.actorId,
          actorRole: actorMeta.actorRole,
          title: "Project Assigned Directly to You",
          message: `Admin has assigned project "${fullProject.projectName}" (${fullProject.country}) to your agency.`,
          type: "info",
          link: `/vendor/candidates/assign?projectId=${fullProject.id}`,
        });
      }
    }

    await NotificationService.notifyStaffAction({
      actor: req.user,
      type: "UPDATE",
      title: "Overseas Project Configured",
      message: `Project "${fullProject.projectName}" (${fullProject.country}) saved.`,
      moduleScope: "VENDOR",
      metadata: { projectId: fullProject.id, link: "/projects" },
    });
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
