import CrmOverseasClient from "../../models/CrmOverseasClient.js";
import Client from "../../models/Client.js";
import ClientPayment from "../../models/ClientPayment.js";
import ClientPaymentService from "../../services/clientPayment.service.js";
import ActivityService from "../../services/activity.service.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateNextClientId, generateNextProjectId } from "../../utils/idGenerator.js";

const getVendorAllowedSet = (req) =>
  new Set([req.vendorId, req.userId].filter(Boolean).map((v) => String(v).trim()));

const isProjectVisibleToVendor = (project, allowedVendorIds) => {
  if (!project) return false;
  const visType = project.vendorAssignmentType || project.vendorVisibility || "";
  if (visType !== "Specific Vendor" && visType !== "specific") return true;
  const assigned = project.assignedVendors || project.assignedVendorIds || [];
  return Array.isArray(assigned) && assigned.some((v) => allowedVendorIds.has(String(v).trim()));
};

export const getClients = asyncHandler(async (req, res) => {
  const clients = await CrmOverseasClient.find({}).sort({ createdAt: -1 }).lean();

  if (req.isVendor) {
    const allowedVendorIds = getVendorAllowedSet(req);
    const vendorClients = (clients || []).map((c) => {
      const visibleProjects = (Array.isArray(c.projects) ? c.projects : [])
        .filter((p) => isProjectVisibleToVendor(p, allowedVendorIds))
        .map((p) => {
          const clone = { ...p };
          delete clone.assignedVendors;
          delete clone.assignedVendorIds;
          delete clone.assignedVendorHRs;
          return clone;
        });
      return {
        _id: c._id,
        id: c.clientId || c._id.toString(),
        clientId: c.clientId || c._id.toString(),
        companyName: c.companyName,
        companyType: c.companyType,
        country: c.country,
        city: c.city,
        status: c.status,
        projects: visibleProjects,
      };
    });
    return res.status(200).json({ success: true, clients: vendorClients });
  }

  const formatted = (clients || []).map((c) => ({
    ...c,
    id: c.clientId || c._id.toString(),
  }));

  return res.status(200).json({ success: true, clients: formatted });
});

export const saveClient = asyncHandler(async (req, res) => {
  const clientData = { ...(req.body || {}) };
  if (!String(clientData.companyName || "").trim()) {
    return res.status(400).json({ success: false, message: "Client companyName is required." });
  }
  clientData.companyName = String(clientData.companyName).trim();
  let clientId = clientData.id || clientData.clientId;
  delete clientData._id;
  delete clientData.__v;
  delete clientData.id;
  delete clientData.createdAt;
  delete clientData.updatedAt;
  if (!clientId || String(clientId).startsWith("cli-")) {
    clientId = await generateNextClientId();
  }

  const queryConditions = [{ clientId: String(clientId) }];
  if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
    queryConditions.push({ _id: clientId });
  }

  let milestones = Array.isArray(clientData.paymentMilestones) ? [...clientData.paymentMilestones] : [];
  if (milestones.length === 0 && Number(clientData.totalAgreedAmount) > 0) {
    milestones = [
      {
        id: `mls-${Date.now()}-1`,
        name: "Milestone 1",
        amount: Number(clientData.totalAgreedAmount),
        condition: "Agreed Client Payment",
        status: "Pending",
      },
    ];
  }

  milestones = milestones.map((m, idx) => {
    const amount = Number(m.paymentAmount) || Number(m.amount) || 0;
    const paidAmount = Number(m.amountPaid) || Number(m.paidAmount) || 0;
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

  let doc = await CrmOverseasClient.findOne({ $or: queryConditions });
  const isNew = !doc;

  if (Array.isArray(clientData.projects)) {
    const existingProjIds = new Set(
      (doc?.projects || [])
        .flatMap((p) => [p?.id, p?.projectId, p?._id ? String(p._id) : ""])
        .filter(Boolean)
        .map(String)
    );
    const normalizedProjects = [];
    for (const p of clientData.projects) {
      if (!p) continue;
      const rawPid = String(p.id || p.projectId || "").trim();
      const shouldKeep =
        rawPid && (existingProjIds.has(rawPid) || !/^prj-/i.test(rawPid));
      const finalPid = shouldKeep ? rawPid : await generateNextProjectId();
      normalizedProjects.push({
        ...p,
        id: finalPid,
        projectId: finalPid,
      });
    }
    clientData.projects = normalizedProjects;
  }

  if (doc) {
    Object.assign(doc, clientData, {
      clientId: doc.clientId || clientId,
      paymentMilestones: milestones,
      totalAgreedAmount: totalAgreed,
      updatedAt: new Date(),
    });
    await doc.save();
  } else {
    doc = await CrmOverseasClient.create({
      ...clientData,
      clientId,
      paymentMilestones: milestones,
      totalAgreedAmount: totalAgreed,
      totalPaidAmount: 0,
      remainingAmount: totalAgreed,
    });
  }

  try {
    await ClientPaymentService.syncClientMilestonesToPayments(doc, req.user || {});
    const totals = await ClientPaymentService.recalculateClientTotals(doc.clientId || doc._id.toString());
    doc.totalAgreedAmount = totals.totalAgreed;
    doc.totalPaidAmount = totals.totalPaid;
    doc.remainingAmount = totals.remainingAmount;
  } catch (syncErr) {
    console.error("Milestone payment sync error:", syncErr.message);
  }

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

  emitRealtimeEvent({
    events: ["immigo:project-update", "immigo:dashboard-update", "immigo:vendor-hr-refresh"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    detail: { clientId: doc.clientId || doc._id.toString() },
  });

  return res.status(200).json({
    success: true,
    client: { ...doc.toObject(), id: doc.clientId || doc._id.toString() },
  });
});

export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: "Client ID required" });
  }

  const resolvedIds = Array.from(await ClientPaymentService.resolveClientIds(id));
  const query = [{ clientId: String(id) }, { id: String(id) }];
  if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
    query.push({ _id: id });
  }

  const deletedCrm = await CrmOverseasClient.findOneAndDelete({ $or: query });

  try {
    const clientDeleteQuery = [{ company: id }, { clientId: id }];
    if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
      clientDeleteQuery.push({ _id: id });
    }
    await Client.deleteMany({ $or: clientDeleteQuery });
  } catch {}

  try {
    await ClientPayment.deleteMany({ clientId: { $in: resolvedIds } });
  } catch {}

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

  emitRealtimeEvent({
    events: ["immigo:project-update", "immigo:dashboard-update", "immigo:vendor-hr-refresh"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    detail: { clientId: id, deleted: true },
  });

  return res.status(200).json({
    success: true,
    message: "Client organization deleted successfully.",
    id,
  });
});
