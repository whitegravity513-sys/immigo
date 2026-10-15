import CrmOverseasClient from "../models/CrmOverseasClient.js";
import Client from "../models/Client.js";
import Project from "../models/Project.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import CrmCandidate from "../models/CrmCandidate.js";
import CrmNotification from "../models/CrmNotification.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/crm-sync/clients
export const getClients = asyncHandler(async (req, res) => {
  const clients = await CrmOverseasClient.find({}).sort({ createdAt: -1 }).lean();

  // Ensure format has id
  const formatted = (clients || []).map((c) => ({
    ...c,
    id: c.clientId || c._id.toString(),
  }));

  return res.status(200).json({ success: true, clients: formatted });
});

import ActivityService from "../services/activity.service.js";
import ClientPayment from "../models/ClientPayment.js";

// POST /api/crm-sync/clients
export const saveClient = asyncHandler(async (req, res) => {
  const clientData = req.body;
  const clientId = clientData.id || clientData.clientId || `cli-${Date.now().toString().slice(-6)}`;

  const queryConditions = [{ clientId: String(clientId) }];
  if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
    queryConditions.push({ _id: clientId });
  }

  // Format and validate paymentMilestones if present
  let milestones = Array.isArray(clientData.paymentMilestones) ? [...clientData.paymentMilestones] : [];
  milestones = milestones.map((m, idx) => {
    const amount = Number(m.amount) || 0;
    const paidAmount = Number(m.paidAmount) || 0;
    const remainingBalance = Math.max(0, amount - paidAmount);
    return {
      ...m,
      id: m.id || `mls-${Date.now()}-${idx + 1}`,
      name: (m.name || `Milestone ${idx + 1}`).trim(),
      amount,
      condition: (m.condition || "Candidate successfully selected").trim(),
      timeline: (m.timeline || "Within 7 days").trim(),
      description: m.description || "",
      status: m.status || (remainingBalance <= 0 && amount > 0 ? "Paid" : "Pending"),
      paidAmount,
      remainingBalance,
      paidDate: m.paidDate || null,
      dueDate: m.dueDate || null,
      remarks: m.remarks || "",
    };
  });

  const totalAgreed = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  
  // Calculate totalPaidAmount from actual records if available
  const existingPayments = await ClientPayment.find({
    clientId: String(clientId),
    status: "Completed",
    isReversed: false,
  }).lean();
  const totalPaid = existingPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  const remainingAmount = Math.max(0, totalAgreed - totalPaid);

  let doc = await CrmOverseasClient.findOne({ $or: queryConditions });
  const isNew = !doc;

  if (doc) {
    Object.assign(doc, clientData, {
      clientId: doc.clientId || clientId,
      paymentMilestones: milestones,
      totalAgreedAmount: totalAgreed,
      totalPaidAmount: totalPaid,
      remainingAmount,
      updatedAt: new Date(),
    });
    await doc.save();
  } else {
    doc = await CrmOverseasClient.create({
      ...clientData,
      clientId,
      paymentMilestones: milestones,
      totalAgreedAmount: totalAgreed,
      totalPaidAmount: totalPaid,
      remainingAmount,
    });
  }

  // Activity Log
  try {
    await ActivityService.log({
      userType: "ADMIN",
      action: isNew ? "CLIENT_CREATED" : "CLIENT_UPDATED",
      title: isNew ? `New Client Created: ${doc.companyName}` : `Client Updated: ${doc.companyName}`,
      description: `${doc.companyName} (${doc.clientId}) saved with ${milestones.length} payment milestone(s) totalling ₹${totalAgreed.toLocaleString()}.`,
      entityType: "Client",
      entityId: doc.clientId || doc._id.toString(),
      entityName: doc.companyName,
      status: doc.status || "Active",
      visibility: "ADMIN",
      metadata: { totalAgreed, milestonesCount: milestones.length },
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }

  return res.status(200).json({
    success: true,
    client: { ...doc.toObject(), id: doc.clientId || doc._id.toString() },
  });
});

// POST /api/crm-sync/projects
export const addOrUpdateProject = asyncHandler(async (req, res) => {
  let { clientId, project } = req.body;
  if (!project) {
    return res.status(400).json({ success: false, message: "project data is required" });
  }

  if (!clientId || String(clientId).trim() === "") {
    clientId = project.clientId || `cli-${Date.now().toString().slice(-6)}`;
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

  // Create notifications for vendors
  try {
    const isAll =
      (fullProject.vendorAssignmentType || fullProject.vendorVisibility) !== "Specific Vendor" &&
      (fullProject.vendorAssignmentType || fullProject.vendorVisibility) !== "specific";

    if (isAll) {
      await CrmNotification.create({
        notificationId: `notif-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: null, // for all vendors
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

// GET /api/crm-sync/projects
export const getAvailableProjects = asyncHandler(async (req, res) => {
  const clients = await CrmOverseasClient.find({}).lean();
  const directProjects = await Project.find({}).populate("clientId").lean().catch(() => []);

  const list = [];
  const seenIds = new Set();

  // 1. Projects under CrmOverseasClient
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

  // 2. Direct Projects from Project collection (Admin Master Dashboard)
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

// GET /api/crm-sync/applications
export const getApplications = asyncHandler(async (req, res) => {
  const { vendorId, projectId } = req.query;
  const filter = {};
  if (vendorId) filter.vendorId = String(vendorId);
  if (projectId) filter.projectId = String(projectId);

  const applications = await CrmCandidateApplication.find(filter).sort({ createdAt: -1 }).lean();
  const formatted = (applications || []).map((a) => ({
    ...a,
    id: a.applicationId || a._id.toString(),
  }));

  return res.status(200).json({ success: true, applications: formatted });
});

// POST /api/crm-sync/applications
export const submitApplication = asyncHandler(async (req, res) => {
  const appData = req.body;
  const appId = appData.id || appData.applicationId || `app-${Date.now().toString().slice(-6)}`;

  const created = await CrmCandidateApplication.create({
    ...appData,
    applicationId: appId,
    status: appData.status || "Submitted",
  });

  // Automatically create Notification for Admin
  try {
    const adminMsg = `Vendor ${appData.vendorName || appData.vendorId || "Partner"} submitted ${appData.candidateName} for "${appData.projectName}" (${appData.position || "Role"}).`;

    // 1. In CrmNotification
    await CrmNotification.create({
      notificationId: `notif-adm-${Date.now()}`,
      recipientRole: "ADMIN",
      title: "New Candidate Assigned to Project",
      message: adminMsg,
      type: "info",
      link: "/admin/vendor-candidates",
    });

    // 2. In Admin Notification model for the Bell
    await Notification.create({
      type: "DOCUMENT_UPLOAD",
      title: "New Candidate Assigned to Project",
      message: adminMsg,
      targetRole: "ADMIN",
      targetType: "ALL",
    });
  } catch {}

  return res.status(201).json({
    success: true,
    application: { ...created.toObject(), id: created.applicationId || created._id.toString() },
  });
});

// PUT /api/crm-sync/applications/:id
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const queryConditions = [
    { applicationId: id },
    { id: id },
  ];
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    queryConditions.push({ _id: id });
  }

  let app = await CrmCandidateApplication.findOne({ $or: queryConditions });

  if (!app && updateData.candidateId && updateData.projectId) {
    app = await CrmCandidateApplication.findOne({
      candidateId: updateData.candidateId,
      projectId: updateData.projectId,
    });
  }

  if (!app) {
    app = await CrmCandidateApplication.create({
      ...updateData,
      applicationId: id,
      status: updateData.status || "Submitted",
    });
  } else {
    Object.assign(app, updateData);
    await app.save();
  }

  // Create notification for vendor if status updated
  if (updateData.status) {
    try {
      const statusTitle =
        updateData.status === "Selected"
          ? `Candidate Selected! 🎉`
          : updateData.status === "Rejected"
          ? `Candidate Application Rejected`
          : updateData.status === "Interview" || updateData.status === "Interview Scheduled"
          ? `Interview Scheduled 🎥`
          : updateData.status === "On Hold"
          ? `Candidate Put On Hold ⏸️`
          : `Candidate Status Updated: ${updateData.status}`;

      const statusMsg =
        updateData.status === "Selected"
          ? `${app.candidateName} has been selected for ${app.projectName} (${app.position || "Role"}). Processing timeline initiated.`
          : updateData.status === "Rejected"
          ? `${app.candidateName} was not selected for ${app.projectName}. Reason: ${app.rejectionReason || "Criteria not met"}. Candidate returned to pool for reuse.`
          : updateData.status === "Interview" || updateData.status === "Interview Scheduled"
          ? `Interview scheduled for ${app.candidateName} on ${app.projectName}. Date: ${app.interviewDetails?.dateTime || "TBD"}.`
          : updateData.status === "On Hold"
          ? `${app.candidateName} was put On Hold for ${app.projectName}. Candidate is reusable for other projects.`
          : `Candidate ${app.candidateName} status changed to "${updateData.status}" on project ${app.projectName}.`;

      await CrmNotification.create({
        notificationId: `notif-ven-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: app.vendorId,
        title: statusTitle,
        message: statusMsg,
        type: updateData.status === "Selected" ? "success" : updateData.status === "Rejected" ? "warning" : "info",
        link: updateData.status === "Selected" ? "/vendor/selected" : updateData.status === "Rejected" ? "/vendor/rejected" : "/vendor/applications",
      });

      // If candidate was Selected: trigger the client payment milestone for candidate selection
      if (updateData.status === "Selected") {
        try {
          const clientId = app.clientId;
          let clientDoc = null;
          if (clientId) {
            clientDoc = await CrmOverseasClient.findOne({
              $or: [{ clientId: String(clientId) }, { _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }],
            });
          }
          if (!clientDoc && app.projectId) {
            clientDoc = await CrmOverseasClient.findOne({ "projects.id": app.projectId });
          }

          if (clientDoc && Array.isArray(clientDoc.paymentMilestones)) {
            const msIdx = clientDoc.paymentMilestones.findIndex(
              (m) =>
                m.status === "Pending" &&
                (m.condition?.toLowerCase().includes("select") ||
                  m.name?.toLowerCase().includes("select") ||
                  m.condition?.toLowerCase().includes("candidate"))
            );

            if (msIdx !== -1) {
              const ms = clientDoc.paymentMilestones[msIdx];
              ms.status = "Due";
              ms.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              ms.relatedCandidateId = app.candidateId || "";
              ms.relatedCandidateName = app.candidateName || "";
              ms.relatedProjectId = app.projectId || "";
              ms.relatedProjectName = app.projectName || "";
              clientDoc.paymentMilestones[msIdx] = ms;
              clientDoc.markModified("paymentMilestones");
              await clientDoc.save();

              await ActivityService.log({
                userType: "SYSTEM",
                action: "CLIENT_MILESTONE_DUE",
                title: `Client Milestone Due: ${ms.name}`,
                description: `Milestone "${ms.name}" (₹${Number(ms.amount).toLocaleString()}) became DUE for ${clientDoc.companyName} upon selection of candidate ${app.candidateName}.`,
                entityType: "Client",
                entityId: clientDoc.clientId || clientDoc._id.toString(),
                entityName: clientDoc.companyName,
                status: "Due",
                visibility: "ADMIN",
                metadata: { candidateName: app.candidateName, milestoneId: ms.id },
              });
            }
          }

          await ActivityService.log({
            userType: "ADMIN",
            action: "CANDIDATE_SELECTED",
            title: `Candidate Selected: ${app.candidateName}`,
            description: `${app.candidateName} selected for ${app.projectName} (${app.position || "Role"}).`,
            entityType: "Candidate",
            entityId: app.candidateId || app._id.toString(),
            entityName: app.candidateName,
            status: "Selected",
            visibility: "ADMIN",
          });
        } catch (selErr) {
          console.error("Failed to trigger milestone on candidate selection:", selErr.message);
        }
      }
    } catch (notifErr) {
      console.error("Failed to create vendor notification:", notifErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    application: { ...app.toObject(), id: app.applicationId || app._id.toString() },
  });
});

// GET /api/crm-sync/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { role, vendorId } = req.query;
  const filter = {};

  if (role) {
    if (role.toUpperCase() === "ADMIN") {
      filter.$or = [
        { recipientRole: { $in: ["ADMIN", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
    } else if (role.toUpperCase() === "VENDOR") {
      const roleConditions = [
        { recipientRole: { $in: ["VENDOR", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
      if (vendorId) {
        filter.$and = [
          { $or: roleConditions },
          {
            $or: [
              { vendorId: String(vendorId) },
              { vendorId: null },
              { vendorId: { $exists: false } },
              { recipientRole: "ALL" },
            ],
          },
        ];
      } else {
        filter.$or = roleConditions;
      }
    }
  }

  const notifs = await CrmNotification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const formatted = (notifs || []).map((n) => ({
    ...n,
    id: n.notificationId || (n._id ? n._id.toString() : ""),
    _id: n._id ? n._id.toString() : "",
    timestamp: n.createdAt || new Date().toISOString(),
    createdAt: n.createdAt || new Date().toISOString(),
    read: Boolean(n.read),
  }));

  return res.status(200).json({ success: true, notifications: formatted });
});

// POST /api/crm-sync/notifications
export const createNotification = asyncHandler(async (req, res) => {
  const notifData = req.body;
  const notifId = notifData.id || notifData.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 100)}`;

  const created = await CrmNotification.create({
    ...notifData,
    notificationId: notifId,
  });

  if (notifData.recipientRole === "ADMIN" || notifData.recipientRole === "ALL") {
    try {
      await Notification.create({
        type: notifData.type || "SYSTEM",
        title: notifData.title || "Vendor Update",
        message: notifData.message,
        targetRole: "ADMIN",
        targetType: "ALL",
        read: false,
      });
    } catch {}
  }

  return res.status(201).json({
    success: true,
    notification: { ...created.toObject(), id: created.notificationId || created._id.toString() },
  });
});

// PUT /api/crm-sync/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
  const conds = [{ notificationId: id }, { id: id }];
  if (isMongoId) conds.push({ _id: id });
  await CrmNotification.updateMany({ $or: conds }, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

// PUT /api/crm-sync/notifications/read-all
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { role, vendorId } = req.query;
  const filter = {};
  if (role) {
    if (role.toUpperCase() === "ADMIN") {
      filter.$or = [
        { recipientRole: { $in: ["ADMIN", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
    } else if (role.toUpperCase() === "VENDOR") {
      if (vendorId) {
        filter.$or = [
          { vendorId: String(vendorId) },
          { vendorId: null },
          { vendorId: { $exists: false } },
          { recipientRole: "ALL" },
        ];
      } else {
        filter.$or = [
          { recipientRole: { $in: ["VENDOR", "ALL"] } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ];
      }
    }
  }
  await CrmNotification.updateMany(filter, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

// DELETE /api/crm-sync/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
  const conds = [{ notificationId: id }, { id: id }];
  if (isMongoId) conds.push({ _id: id });
  await CrmNotification.deleteMany({ $or: conds });
  return res.status(200).json({ success: true, message: "Notification deleted successfully" });
});

// DELETE /api/crm-sync/notifications
export const clearAllNotifications = asyncHandler(async (req, res) => {
  const { role, vendorId } = req.query;
  const filter = {};
  if (role) {
    if (role.toUpperCase() === "ADMIN") {
      filter.$or = [
        { recipientRole: { $in: ["ADMIN", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
    } else if (role.toUpperCase() === "VENDOR") {
      if (vendorId) {
        filter.$or = [
          { vendorId: String(vendorId) },
          { recipientRole: "VENDOR" },
          { vendorId: null },
          { vendorId: { $exists: false } },
        ];
      } else {
        filter.$or = [
          { recipientRole: { $in: ["VENDOR", "ALL"] } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ];
      }
    }
  }
  await CrmNotification.deleteMany(filter);
  return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
});

// GET /api/crm-sync/candidates
export const getCandidates = asyncHandler(async (req, res) => {
  const { vendorId } = req.query;
  const filter = {};
  if (vendorId) filter.vendorId = String(vendorId);

  const candidates = await CrmCandidate.find(filter).sort({ createdAt: -1 }).lean();
  const formatted = (candidates || []).map((c) => ({
    ...c,
    id: c.candidateId || c._id.toString(),
  }));
  return res.status(200).json({ success: true, candidates: formatted });
});

// POST /api/crm-sync/candidates
export const saveCandidate = asyncHandler(async (req, res) => {
  const candData = req.body;
  const candidateId = candData.id || candData.candidateId || `CND-${Date.now().toString().slice(-5)}`;

  let doc = await CrmCandidate.findOne({
    $or: [{ candidateId }, { _id: candidateId.match(/^[0-9a-fA-F]{24}$/) ? candidateId : null }],
  });

  if (doc) {
    Object.assign(doc, candData, { candidateId, updatedAt: new Date() });
    await doc.save();
  } else {
    doc = await CrmCandidate.create({
      ...candData,
      candidateId,
    });
  }

  return res.status(200).json({
    success: true,
    candidate: { ...doc.toObject(), id: doc.candidateId || doc._id.toString() },
  });
});

// DELETE /api/crm-sync/clients/:id
export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: "Client ID required" });
  }

  const query = [{ clientId: String(id) }, { id: String(id) }];
  if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
    query.push({ _id: id });
  }

  // Delete from CrmOverseasClient
  const deletedCrm = await CrmOverseasClient.findOneAndDelete({ $or: query });

  // Also delete from Client model if present
  try {
    await Client.deleteMany({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { company: id }, { clientId: id }],
    });
  } catch {}

  // Also delete any client payments recorded for this client
  try {
    await ClientPayment.deleteMany({ clientId: String(id) });
  } catch {}

  // Record audit activity
  try {
    await ActivityService.recordActivity({
      action: "DELETE",
      module: "CRM",
      targetId: id,
      description: `Client organization ${deletedCrm?.companyName || id} was deleted from CRM.`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

  return res.status(200).json({
    success: true,
    message: "Client organization deleted successfully.",
    id,
  });
});

// DELETE /api/crm-sync/clients/:clientId/projects/:projectId OR /api/crm-sync/projects/:projectId
export const deleteProject = asyncHandler(async (req, res) => {
  const { clientId, projectId, id } = req.params;
  const targetProjectId = projectId || id;

  if (!targetProjectId) {
    return res.status(400).json({ success: false, message: "Project ID required" });
  }

  // Remove project from CrmOverseasClient
  if (clientId) {
    const clientQuery = [{ clientId: String(clientId) }, { id: String(clientId) }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      clientQuery.push({ _id: clientId });
    }
    await CrmOverseasClient.updateMany(
      { $or: clientQuery },
      {
        $pull: {
          projects: {
            $or: [{ id: String(targetProjectId) }, { _id: targetProjectId }],
          },
        },
      }
    );
  } else {
    // If no clientId specified, pull from all clients that contain this project
    await CrmOverseasClient.updateMany(
      {},
      {
        $pull: {
          projects: {
            $or: [{ id: String(targetProjectId) }, { _id: targetProjectId }],
          },
        },
      }
    );
  }

  // Also delete from Project collection if it exists there
  try {
    await Project.deleteMany({
      $or: [
        { _id: targetProjectId.match(/^[0-9a-fA-F]{24}$/) ? targetProjectId : null },
        { projectId: targetProjectId },
        { id: targetProjectId },
      ],
    });
  } catch {}

  // Record activity
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

export default {
  getClients,
  saveClient,
  deleteClient,
  addOrUpdateProject,
  deleteProject,
  getAvailableProjects,
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getNotifications,
  createNotification,
  getCandidates,
  saveCandidate,
};
