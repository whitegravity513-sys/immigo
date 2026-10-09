import CrmOverseasClient from "../models/CrmOverseasClient.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import CrmCandidate from "../models/CrmCandidate.js";
import CrmNotification from "../models/CrmNotification.js";
import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Default overseas clients & projects to seed if collection is empty
const SEED_CLIENTS = [
  {
    clientId: "cli-uae-101",
    companyName: "Al-Bahar Construction LLC",
    companyType: "Construction",
    country: "UAE",
    city: "Dubai",
    status: "Active",
    projects: [
      {
        id: "prj-dxb-101",
        clientId: "cli-uae-101",
        projectName: "Dubai Metro Extension & Commercial Towers",
        projectType: "Construction",
        country: "UAE",
        location: "Business Bay / Downtown Dubai",
        startDate: "2026-10-15",
        duration: "24 Months",
        status: "Active",
        vendorVisibility: "all",
        vendorAssignmentType: "All Vendors",
        assignedVendors: [],
        assignedVendorIds: [],
        totalHeadcount: 130,
        totalManpower: 130,
        benefits: ["Accommodation", "Transportation", "Medical Insurance", "Visa", "Overtime"],
        manpowerRequirements: [
          { id: "mpr-dxb-1", position: "Electrician", quantity: 25, salary: 1800, currency: "AED" },
          { id: "mpr-dxb-2", position: "Shuttering Carpenter", quantity: 35, salary: 1600, currency: "AED" },
          { id: "mpr-dxb-3", position: "Mason (Tiles & Plaster)", quantity: 40, salary: 1550, currency: "AED" },
          { id: "mpr-dxb-4", position: "Steel Fixer", quantity: 30, salary: 1650, currency: "AED" },
        ],
      },
    ],
  },
  {
    clientId: "cli-ksa-102",
    companyName: "Saudi Aramco Energy & MEP Contracting",
    companyType: "Energy / MEP",
    country: "Saudi Arabia",
    city: "Riyadh",
    status: "Active",
    projects: [
      {
        id: "prj-ksa-201",
        clientId: "cli-ksa-102",
        projectName: "Riyadh Pipeline & Industrial Facility Phase 2",
        projectType: "Oil & Gas / Infrastructure",
        country: "Saudi Arabia",
        location: "Industrial City 2, Riyadh",
        startDate: "2026-11-01",
        duration: "36 Months",
        status: "Active",
        vendorVisibility: "all",
        vendorAssignmentType: "All Vendors",
        assignedVendors: [],
        assignedVendorIds: [],
        totalHeadcount: 155,
        totalManpower: 155,
        benefits: ["Single Room Camp", "Food Allowance", "Medical Insurance", "Annual Flight Ticket"],
        manpowerRequirements: [
          { id: "mpr-ksa-1", position: "6G Pipe Welder (TIG & ARC)", quantity: 30, salary: 2800, currency: "SAR" },
          { id: "mpr-ksa-2", position: "Pipe Fitter", quantity: 45, salary: 1900, currency: "SAR" },
          { id: "mpr-ksa-3", position: "Industrial Electrician", quantity: 40, salary: 2200, currency: "SAR" },
          { id: "mpr-ksa-4", position: "Certified Scaffolder", quantity: 40, salary: 1750, currency: "SAR" },
        ],
      },
    ],
  },
  {
    clientId: "cli-qat-103",
    companyName: "Qatar Coastal Infrastructure & Logistics WLL",
    companyType: "Logistics & Ports",
    country: "Qatar",
    city: "Doha",
    status: "Active",
    projects: [
      {
        id: "prj-qat-301",
        clientId: "cli-qat-103",
        projectName: "Hamad Port Modern Logistics & Cold Storage Hub",
        projectType: "Logistics & Cold Storage",
        country: "Qatar",
        location: "Mesaieed / Hamad Port Free Zone",
        startDate: "2026-10-20",
        duration: "18 Months",
        status: "Active",
        vendorVisibility: "all",
        vendorAssignmentType: "All Vendors",
        assignedVendors: [],
        assignedVendorIds: [],
        totalHeadcount: 95,
        totalManpower: 95,
        benefits: ["Air Conditioned Camp", "Duty Meals", "Medical Insurance", "Employment Visa"],
        manpowerRequirements: [
          { id: "mpr-qat-1", position: "Heavy Duty Trailer Driver (GCC License)", quantity: 35, salary: 2400, currency: "QAR" },
          { id: "mpr-qat-2", position: "Forklift & Reach Truck Operator", quantity: 20, salary: 2000, currency: "QAR" },
          { id: "mpr-qat-3", position: "HVAC Maintenance Technician", quantity: 20, salary: 2500, currency: "QAR" },
          { id: "mpr-qat-4", position: "Warehouse Loading Foreman", quantity: 20, salary: 2200, currency: "QAR" },
        ],
      },
    ],
  },
];

// GET /api/crm-sync/clients
export const getClients = asyncHandler(async (req, res) => {
  let clients = await CrmOverseasClient.find({}).sort({ createdAt: -1 }).lean();

  if (!clients || clients.length === 0) {
    try {
      await CrmOverseasClient.insertMany(SEED_CLIENTS);
      clients = await CrmOverseasClient.find({}).sort({ createdAt: -1 }).lean();
    } catch {}
  }

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

  let doc = await CrmOverseasClient.findOne({
    $or: [{ clientId }, { _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }],
  });

  if (doc) {
    Object.assign(doc, clientData, { clientId, updatedAt: new Date() });
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

  let doc = await CrmOverseasClient.findOne({
    $or: [{ clientId }, { _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }],
  });

  if (!doc) {
    doc = await CrmOverseasClient.create({
      clientId,
      companyName: project.clientName || "Overseas Client",
      country: project.country || "Overseas",
      projects: [],
    });
  }

  const existingProjects = Array.isArray(doc.projects) ? [...doc.projects] : [];
  const projId = project.id || `prj-${Date.now().toString().slice(-6)}`;
  const fullProject = {
    ...project,
    id: projId,
    clientId: doc.clientId || clientId,
    clientName: doc.companyName,
    country: project.country || doc.country || "Overseas",
    status: project.status || "Active",
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = existingProjects.findIndex((p) => String(p.id) === String(projId));
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
        link: `/vendor/submit-candidate?project=${fullProject.id}`,
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
          link: `/vendor/submit-candidate?project=${fullProject.id}`,
        });
      }
    }
  } catch {}

  return res.status(200).json({ success: true, project: fullProject });
});

// GET /api/crm-sync/projects
export const getAvailableProjects = asyncHandler(async (req, res) => {
  const { vendorId } = req.query;

  let clients = await CrmOverseasClient.find({}).lean();
  if (!clients || clients.length === 0) {
    try {
      await CrmOverseasClient.insertMany(SEED_CLIENTS);
      clients = await CrmOverseasClient.find({}).lean();
    } catch {}
  }

  const list = [];
  (clients || []).forEach((c) => {
    (c.projects || []).forEach((p) => {
      const status = (p.status || "Active").toLowerCase();
      if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
        const visibility = (p.vendorVisibility || "").toLowerCase();
        const assignmentType = (p.vendorAssignmentType || "All Vendors").toLowerCase();
        const assignedList = p.assignedVendors || p.assignedVendorIds || [];
        const isSpecific = visibility === "specific" || assignmentType.includes("specific");
        const isAssigned =
          vendorId &&
          assignedList.some(
            (id) =>
              String(id).toLowerCase() === String(vendorId).toLowerCase() ||
              String(id).includes(String(vendorId)) ||
              String(vendorId).includes(String(id))
          );

        if (!isSpecific || isAssigned || assignedList.length === 0) {
          list.push({
            ...p,
            clientId: c.clientId || c._id.toString(),
            clientName: c.companyName || c.name,
          });
        }
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
