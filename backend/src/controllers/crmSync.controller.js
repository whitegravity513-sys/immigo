import CrmOverseasClient from "../models/CrmOverseasClient.js";
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

// POST /api/crm-sync/clients
export const saveClient = asyncHandler(async (req, res) => {
  const clientData = req.body;
  const clientId = clientData.id || clientData.clientId || `cli-${Date.now().toString().slice(-6)}`;

  const queryConditions = [{ clientId: String(clientId) }];
  if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
    queryConditions.push({ _id: clientId });
  }

  let doc = await CrmOverseasClient.findOne({ $or: queryConditions });

  if (doc) {
    Object.assign(doc, clientData, { clientId: doc.clientId || clientId, updatedAt: new Date() });
    await doc.save();
  } else {
    doc = await CrmOverseasClient.create({
      ...clientData,
      clientId,
    });
  }

  return res.status(200).json({
    success: true,
    client: { ...doc.toObject(), id: doc.clientId || doc._id.toString() },
  });
});

// POST /api/crm-sync/projects
export const addOrUpdateProject = asyncHandler(async (req, res) => {
  const { clientId, project } = req.body;
  if (!clientId || !project) {
    return res.status(400).json({ success: false, message: "clientId and project are required" });
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

  const list = [];
  (clients || []).forEach((c) => {
    (c.projects || []).forEach((p) => {
      const status = (p.status || "Active").toLowerCase();
      if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
        list.push({
          ...p,
          id: p.id || p.projectId || p._id?.toString() || `prj-${Date.now().toString().slice(-6)}`,
          projectName: p.projectName || p.name || p.title || "Overseas Project",
          clientId: c.clientId || c._id.toString(),
          clientName: c.companyName || c.name || p.clientName || "Overseas Client",
          country: p.country || c.country || "Overseas",
          status: p.status || "Active",
          manpowerRequirements: p.manpowerRequirements || [],
        });
      }
    });
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

  const app = await CrmCandidateApplication.findOne({
    $or: [{ applicationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
  });

  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  Object.assign(app, updateData);
  await app.save();

  // Create notification for vendor if status updated
  if (updateData.status) {
    try {
      await CrmNotification.create({
        notificationId: `notif-ven-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: app.vendorId,
        title: `Candidate ${app.candidateName}: Status ${updateData.status}`,
        message: `Candidate ${app.candidateName} status changed to "${updateData.status}" on project ${app.projectName}.`,
        type: updateData.status === "Selected" ? "success" : updateData.status === "Rejected" ? "warning" : "info",
        link: "/vendor/candidates",
      });
    } catch {}
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
      filter.recipientRole = { $in: ["ADMIN", "ALL"] };
    } else if (role.toUpperCase() === "VENDOR") {
      filter.recipientRole = { $in: ["VENDOR", "ALL"] };
      if (vendorId) {
        filter.$or = [{ vendorId: String(vendorId) }, { vendorId: null }];
      }
    }
  }

  const notifs = await CrmNotification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  const formatted = (notifs || []).map((n) => ({
    ...n,
    id: n.notificationId || n._id.toString(),
    timestamp: n.createdAt,
  }));

  return res.status(200).json({ success: true, notifications: formatted });
});

// POST /api/crm-sync/notifications
export const createNotification = asyncHandler(async (req, res) => {
  const notifData = req.body;
  const notifId = notifData.id || `notif-${Date.now()}-${Math.floor(Math.random() * 100)}`;

  const created = await CrmNotification.create({
    ...notifData,
    notificationId: notifId,
  });

  if (notifData.recipientRole === "ADMIN") {
    try {
      await Notification.create({
        type: "SYSTEM",
        title: notifData.title || "Vendor Update",
        message: notifData.message,
        targetRole: "ADMIN",
        targetType: "ALL",
      });
    } catch {}
  }

  return res.status(201).json({
    success: true,
    notification: { ...created.toObject(), id: created.notificationId || created._id.toString() },
  });
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

export default {
  getClients,
  saveClient,
  addOrUpdateProject,
  getAvailableProjects,
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getNotifications,
  createNotification,
  getCandidates,
  saveCandidate,
};
