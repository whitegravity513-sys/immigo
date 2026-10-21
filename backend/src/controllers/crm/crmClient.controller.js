import CrmOverseasClient from "../../models/CrmOverseasClient.js";
import Client from "../../models/Client.js";
import ClientPayment from "../../models/ClientPayment.js";
import ActivityService from "../../services/activity.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateNextClientId } from "../../utils/idGenerator.js";

export const getClients = asyncHandler(async (req, res) => {
  const clients = await CrmOverseasClient.find({}).sort({ createdAt: -1 }).lean();

  const formatted = (clients || []).map((c) => ({
    ...c,
    id: c.clientId || c._id.toString(),
  }));

  return res.status(200).json({ success: true, clients: formatted });
});

export const saveClient = asyncHandler(async (req, res) => {
  const clientData = req.body;
  let clientId = clientData.id || clientData.clientId;
  if (!clientId || String(clientId).startsWith("cli-")) {
    clientId = await generateNextClientId();
  }

  const queryConditions = [{ clientId: String(clientId) }];
  if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
    queryConditions.push({ _id: clientId });
  }

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

export const deleteClient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: "Client ID required" });
  }

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
    await ClientPayment.deleteMany({ clientId: String(id) });
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

  return res.status(200).json({
    success: true,
    message: "Client organization deleted successfully.",
    id,
  });
});
