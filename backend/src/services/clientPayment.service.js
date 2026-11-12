import ClientPayment from "../models/ClientPayment.js";
import Client from "../models/Client.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import ActivityService from "./activity.service.js";
import { ApiError } from "../utils/apiError.js";
import { escapeRegex } from "../utils/regex.js";

export class ClientPaymentService {
  static async resolveClientIds(clientId) {
    const idStr = String(clientId || "").trim();
    const ids = new Set(idStr ? [idStr] : []);
    if (!idStr) return ids;

    const clientQuery = [{ clientId: idStr }];
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
      clientQuery.push({ _id: idStr });
    }
    const crmClient = await CrmOverseasClient.findOne({ $or: clientQuery }).lean();
    if (crmClient) {
      if (crmClient._id) ids.add(String(crmClient._id));
      if (crmClient.clientId) ids.add(String(crmClient.clientId));
      if (crmClient.id) ids.add(String(crmClient.id));
    }

    const adminQueries = [{ company: idStr }, { clientId: idStr }];
    if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
      adminQueries.push({ _id: idStr });
    }
    const adminClient = await Client.findOne({ $or: adminQueries }).lean();
    if (adminClient) {
      if (adminClient._id) ids.add(String(adminClient._id));
      if (adminClient.clientId) ids.add(String(adminClient.clientId));
      if (adminClient.company) ids.add(String(adminClient.company));
    }

    return ids;
  }

  static async generatePaymentId(offset = 0) {
    const year = new Date().getFullYear();
    const count = await ClientPayment.countDocuments();
    let seq = count + offset + 1;
    let candidate = `PAY-${year}-${String(seq).padStart(4, "0")}`;
    while (await ClientPayment.exists({ paymentId: candidate })) {
      seq += 1;
      candidate = `PAY-${year}-${String(seq).padStart(4, "0")}`;
    }
    return candidate;
  }

  static async syncClientMilestonesToPayments(clientDoc, user = {}) {
    if (!clientDoc) return [];

    const canonicalClientId = String(clientDoc.clientId || clientDoc._id);
    const clientName = clientDoc.companyName || clientDoc.name || "Client";
    const clientIds = Array.from(await ClientPaymentService.resolveClientIds(canonicalClientId));
    const milestones = Array.isArray(clientDoc.paymentMilestones) ? clientDoc.paymentMilestones : [];
    const activeMilestoneIds = new Set();

    const recordedByName =
      user.name || user.email || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Admin");

    for (let idx = 0; idx < milestones.length; idx += 1) {
      const m = milestones[idx];
      const milestoneId = String(m.id || m._id || `mls-${idx + 1}`);
      activeMilestoneIds.add(milestoneId);

      const amount = Number(m.paymentAmount) || Number(m.amount) || 0;
      const milestoneName = (m.name || m.milestoneName || `Milestone ${idx + 1}`).trim();
      const noteText = (m.condition || m.description || m.remarks || "").trim();
      const dueDate = m.dueDate ? new Date(m.dueDate) : null;

      const actualPayments = await ClientPayment.find({
        clientId: { $in: clientIds },
        milestoneId,
        isMilestoneSchedule: { $ne: true },
        isReversed: false,
      }).lean();

      const actualPaid = actualPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
      const effectivePaid = actualPayments.length > 0 ? actualPaid : (Number(m.amountPaid) || Number(m.paidAmount) || 0);
      const remaining = Math.max(0, amount - effectivePaid);

      const existingSchedule = await ClientPayment.findOne({
        clientId: { $in: clientIds },
        milestoneId,
        isMilestoneSchedule: true,
        isReversed: false,
      });

      if (amount <= 0 || (remaining <= 0 && actualPayments.length > 0)) {
        if (existingSchedule) {
          await ClientPayment.deleteOne({ _id: existingSchedule._id });
        }
        continue;
      }

      const scheduleStatus = effectivePaid > 0 ? "Partially Paid" : "Pending";

      if (existingSchedule) {
        existingSchedule.clientId = canonicalClientId;
        existingSchedule.clientName = clientName;
        existingSchedule.milestoneName = milestoneName;
        existingSchedule.agreedMilestoneAmount = amount;
        existingSchedule.totalMilestoneAmount = amount;
        existingSchedule.previouslyReceivedAmount = effectivePaid;
        existingSchedule.amountPaid = effectivePaid;
        existingSchedule.remainingMilestoneBalance = remaining;
        existingSchedule.remainingMilestoneAmount = remaining;
        existingSchedule.dueDate = dueDate;
        existingSchedule.status = scheduleStatus;
        existingSchedule.paymentStatus = scheduleStatus;
        existingSchedule.remarks = noteText;
        await existingSchedule.save();
      } else {
        const paymentId = await ClientPaymentService.generatePaymentId(idx);
        await ClientPayment.create({
          paymentId,
          clientId: canonicalClientId,
          clientName,
          milestoneId,
          milestoneName,
          isMilestoneSchedule: true,
          dueDate,
          agreedMilestoneAmount: amount,
          totalMilestoneAmount: amount,
          previouslyReceivedAmount: effectivePaid,
          amountPaid: effectivePaid,
          remainingMilestoneBalance: remaining,
          remainingMilestoneAmount: remaining,
          paymentDate: dueDate || clientDoc.createdAt || new Date(),
          paymentMethod: "Bank Transfer",
          transactionReference: "",
          receivedBy: "Payable to Client",
          totalTransactionAmount: amount,
          status: scheduleStatus,
          paymentStatus: scheduleStatus,
          recordedBy: recordedByName,
          recordedById: String(user.id || user._id || ""),
          remarks: noteText,
          auditTrail: [
            {
              action: "MILESTONE_PAYABLE_CREATED",
              performedBy: recordedByName,
              timestamp: new Date(),
              note: `Client payable milestone "${milestoneName}" of ₹${amount.toLocaleString("en-IN")} scheduled`,
            },
          ],
        });
      }
    }

    await ClientPayment.deleteMany({
      clientId: { $in: clientIds },
      isMilestoneSchedule: true,
      isReversed: false,
      milestoneId: { $nin: Array.from(activeMilestoneIds) },
    });

    return ClientPayment.find({ clientId: { $in: clientIds }, isReversed: false }).lean();
  }

  static async recalculateClientTotals(clientId) {
    const clientQuery = [{ clientId: String(clientId) }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      clientQuery.push({ _id: clientId });
    }

    const crmClient = await CrmOverseasClient.findOne({ $or: clientQuery });
    const adminQueries = [{ company: clientId }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      adminQueries.push({ _id: clientId });
    }
    const adminClient = await Client.findOne({ $or: adminQueries });

    const clientIds = await ClientPaymentService.resolveClientIds(clientId);

    const successfulPayments = await ClientPayment.find({
      clientId: { $in: Array.from(clientIds) },
      isMilestoneSchedule: { $ne: true },
      $or: [
        { status: "Verified" },
        { status: "Completed" },
        { status: "Paid" },
        { status: "Received" },
        { paymentStatus: "Verified" },
        { paymentStatus: "Completed" },
        { paymentStatus: "Paid" },
        { paymentStatus: "Received" },
      ],
      isReversed: false,
    }).lean();

    const totalPaid = successfulPayments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);

    let totalAgreed = 0;
    if (crmClient && Array.isArray(crmClient.paymentMilestones)) {
      totalAgreed = crmClient.paymentMilestones.reduce(
        (acc, m) => acc + (Number(m.paymentAmount) || Number(m.amount) || 0),
        0
      );
      crmClient.totalAgreedAmount = totalAgreed;
      crmClient.totalPaidAmount = totalPaid;
      crmClient.remainingAmount = Math.max(0, totalAgreed - totalPaid);
      await crmClient.save();
    }

    if (adminClient && Array.isArray(adminClient.paymentMilestones)) {
      totalAgreed = adminClient.paymentMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
      adminClient.totalAgreedAmount = totalAgreed;
      adminClient.totalPaidAmount = totalPaid;
      adminClient.remainingAmount = Math.max(0, totalAgreed - totalPaid);
      await adminClient.save();
    }

    return { totalAgreed, totalPaid, remainingAmount: Math.max(0, totalAgreed - totalPaid) };
  }

  static async recordPayment(paymentData, user = {}) {
    const {
      clientId,
      clientName,
      projectId = "",
      projectName = "",
      candidateId = "",
      candidateName = "",
      milestoneId,
      milestoneName,
      amountPaid,
      paymentDate = new Date(),
      paymentMethod = "Bank Transfer",
      transactionReference,
      gstApplicable = false,
      gstTreatment = "Not Applicable",
      gstRate = 0,
      gstAmount = 0,
      totalTransactionAmount,
      paymentProofUrl = "",
      remarks = "",
    } = paymentData;

    if (!clientId) throw new ApiError(400, "Client selection is required.");
    if (!milestoneId) throw new ApiError(400, "Payment milestone is required.");
    if (!amountPaid || Number(amountPaid) <= 0) {
      throw new ApiError(400, "Payment amount must be greater than zero.");
    }
    if (!transactionReference || !String(transactionReference).trim()) {
      throw new ApiError(400, "Transaction Reference / UTR is required.");
    }

    const trimmedRef = String(transactionReference).trim();
    const clientIds = await ClientPaymentService.resolveClientIds(clientId);
    const existingTx = await ClientPayment.findOne({
      clientId: { $in: Array.from(clientIds) },
      transactionReference: trimmedRef,
      isMilestoneSchedule: { $ne: true },
      isReversed: false,
    });
    if (existingTx) {
      throw new ApiError(
        400,
        `A payment with Transaction Reference '${transactionReference}' already exists for this client.`
      );
    }

    const clientQuery = [{ clientId: String(clientId) }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      clientQuery.push({ _id: clientId });
    }
    const clientDoc = await CrmOverseasClient.findOne({ $or: clientQuery });
    let adminClientDoc = null;
    if (!clientDoc) {
      const adminQueries = [{ company: clientId }, { clientId: String(clientId) }];
      if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
        adminQueries.push({ _id: clientId });
      }
      adminClientDoc = await Client.findOne({ $or: adminQueries });
    }

    const effectiveClient = clientDoc || adminClientDoc;
    if (!effectiveClient) {
      throw new ApiError(404, "Client not found in database.");
    }

    const canonicalClientId = effectiveClient.clientId || String(clientId);

    const milestones = effectiveClient.paymentMilestones || [];
    const milestoneIdx = milestones.findIndex(
      (m) => String(m.id || m._id) === String(milestoneId)
    );

    let agreedMilestoneAmount = Number(amountPaid);
    let newPaidAmount = Number(amountPaid);
    let remainingMilestoneBalance = 0;

    if (milestoneIdx !== -1) {
      const ms = milestones[milestoneIdx];
      agreedMilestoneAmount = Number(ms.paymentAmount) || Number(ms.amount) || 0;
      const currentPaid = Number(ms.amountPaid) || Number(ms.paidAmount) || 0;
      newPaidAmount = currentPaid + Number(amountPaid);
      remainingMilestoneBalance = Math.max(0, agreedMilestoneAmount - newPaidAmount);

      ms.paidAmount = newPaidAmount;
      ms.amountPaid = newPaidAmount;
      ms.remainingBalance = remainingMilestoneBalance;
      ms.paidDate = new Date(paymentDate);
      ms.actualPaymentDate = new Date(paymentDate);
      const computedStatus = remainingMilestoneBalance <= 0 ? "Paid" : "Partially Paid";
      ms.status = computedStatus;
      ms.paymentStatus = computedStatus;
      if (remarks) ms.remarks = remarks;

      effectiveClient.paymentMilestones[milestoneIdx] = ms;
      if (clientDoc) clientDoc.markModified("paymentMilestones");
      await effectiveClient.save();
    }

    const paymentId = await ClientPaymentService.generatePaymentId(0);

    const numericAmount = Number(amountPaid);
    let calculatedGstAmount = Number(gstAmount) || 0;
    let finalTotalTransaction = Number(totalTransactionAmount) || numericAmount;

    if (gstApplicable) {
      const rate = Number(gstRate) || 18;
      if (gstTreatment === "Added Separately") {
        calculatedGstAmount = Math.round((numericAmount * (rate / 100)) * 100) / 100;
        finalTotalTransaction = numericAmount + calculatedGstAmount;
      } else if (gstTreatment === "Included in Amount") {
        calculatedGstAmount = Math.round((numericAmount - numericAmount / (1 + rate / 100)) * 100) / 100;
        finalTotalTransaction = numericAmount;
      }
    }

    const recordedByName =
      user.name || user.email || (user.firstName ? `${user.firstName} ${user.lastName || ""}` : "System Admin");

    const paymentStatusToSet = paymentData.status || paymentData.paymentStatus || "Verified";
    const finalReceivedBy = paymentData.receivedBy || recordedByName;
    const prevReceived = Number(paymentData.previouslyReceivedAmount) || (agreedMilestoneAmount - remainingMilestoneBalance - numericAmount);

    const newPayment = await ClientPayment.create({
      paymentId,
      clientId: canonicalClientId,
      clientName: clientName || effectiveClient.companyName || effectiveClient.name || "Client",
      projectId: String(projectId || ""),
      projectName: projectName || "",
      candidateId: String(candidateId || ""),
      candidateName: candidateName || "",
      milestoneId: String(milestoneId),
      milestoneName: milestoneName || (milestoneIdx !== -1 ? milestones[milestoneIdx].name : "Milestone Payment"),
      isMilestoneSchedule: false,
      agreedMilestoneAmount,
      totalMilestoneAmount: Number(paymentData.totalMilestoneAmount) || agreedMilestoneAmount,
      previouslyReceivedAmount: Math.max(0, prevReceived),
      amountPaid: numericAmount,
      remainingMilestoneBalance,
      remainingMilestoneAmount: Number(paymentData.remainingMilestoneAmount) !== undefined ? Number(paymentData.remainingMilestoneAmount) : remainingMilestoneBalance,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionReference: trimmedRef,
      receivedBy: finalReceivedBy,
      gstApplicable: Boolean(gstApplicable),
      gstTreatment,
      gstRate: Number(gstRate) || 0,
      gstAmount: calculatedGstAmount,
      totalTransactionAmount: finalTotalTransaction,
      paymentProofUrl,
      status: paymentStatusToSet,
      paymentStatus: paymentStatusToSet,
      recordedBy: recordedByName,
      recordedById: String(user.id || user._id || ""),
      remarks,
      auditTrail: [
        {
          action: "PAYMENT_RECORDED",
          performedBy: recordedByName,
          timestamp: new Date(),
          note: `Payment of ₹${numericAmount.toLocaleString()} recorded via ${paymentMethod} with status ${paymentStatusToSet} (Ref: ${trimmedRef})`,
        },
      ],
    });

    if (clientDoc) {
      await ClientPaymentService.syncClientMilestonesToPayments(clientDoc, user);
    }
    await ClientPaymentService.recalculateClientTotals(canonicalClientId);

    await ActivityService.log({
      userType: "ADMIN",
      userId: user.id || user._id,
      userName: recordedByName,
      action: "CLIENT_PAYMENT_RECORDED",
      title: `Client Payment Recorded: ₹${numericAmount.toLocaleString()}`,
      description: `Payment recorded for ${newPayment.clientName} against milestone "${newPayment.milestoneName}" via ${paymentMethod}.`,
      entityType: "Payment",
      entityId: newPayment.paymentId,
      entityName: newPayment.clientName,
      status: "Completed",
      visibility: "ADMIN",
      metadata: {
        paymentId: newPayment.paymentId,
        clientId: canonicalClientId,
        milestoneId,
        amount: numericAmount,
        transactionReference: trimmedRef,
      },
    });

    return newPayment;
  }

  static async reversePayment(paymentId, reason, user = {}) {
    const idStr = String(paymentId);
    const isHex = /^[0-9a-fA-F]{24}$/.test(idStr);
    const paymentQuery = [{ paymentId: idStr }];
    if (isHex) paymentQuery.push({ _id: paymentId });
    const payment = await ClientPayment.findOne({ $or: paymentQuery });

    if (!payment) throw new ApiError(404, "Payment record not found.");
    if (payment.isReversed) throw new ApiError(400, "This payment transaction is already reversed.");

    const reversedByName =
      user.name || user.email || (user.firstName ? `${user.firstName} ${user.lastName || ""}` : "System Admin");

    payment.isReversed = true;
    payment.status = "Reversed";
    payment.paymentStatus = "Reversed";
    payment.reversalReason = reason || "Administrative Reversal";
    payment.reversedBy = reversedByName;
    payment.reversedAt = new Date();
    payment.auditTrail.push({
      action: "PAYMENT_REVERSED",
      performedBy: reversedByName,
      timestamp: new Date(),
      note: `Reversed: ${reason || "No reason specified"}`,
    });

    await payment.save();

    const clientQuery = [{ clientId: String(payment.clientId) }];
    if (typeof payment.clientId === "string" && /^[0-9a-fA-F]{24}$/.test(payment.clientId)) {
      clientQuery.push({ _id: payment.clientId });
    }
    const adminQueries = [{ company: payment.clientId }, { clientId: String(payment.clientId) }];
    if (typeof payment.clientId === "string" && /^[0-9a-fA-F]{24}$/.test(payment.clientId)) {
      adminQueries.push({ _id: payment.clientId });
    }
    const crmClientDoc = await CrmOverseasClient.findOne({ $or: clientQuery });
    const clientDoc = crmClientDoc || (await Client.findOne({ $or: adminQueries }));

    if (clientDoc && Array.isArray(clientDoc.paymentMilestones)) {
      const msIdx = clientDoc.paymentMilestones.findIndex(
        (m) => String(m.id || m._id) === String(payment.milestoneId)
      );
      if (msIdx !== -1) {
        const ms = clientDoc.paymentMilestones[msIdx];
        const newPaid = Math.max(0, (Number(ms.paidAmount) || 0) - Number(payment.amountPaid));
        ms.paidAmount = newPaid;
        ms.amountPaid = newPaid;
        ms.remainingBalance = Math.max(0, (Number(ms.amount) || 0) - newPaid);
        ms.status = newPaid <= 0 ? "Pending" : "Partially Paid";
        ms.paymentStatus = ms.status;
        clientDoc.paymentMilestones[msIdx] = ms;
        if (clientDoc.markModified) clientDoc.markModified("paymentMilestones");
        await clientDoc.save();
      }
    }

    if (crmClientDoc) {
      await ClientPaymentService.syncClientMilestonesToPayments(crmClientDoc, user);
    }
    await ClientPaymentService.recalculateClientTotals(payment.clientId);

    await ActivityService.log({
      userType: "ADMIN",
      userId: user.id || user._id,
      userName: reversedByName,
      action: "CLIENT_PAYMENT_REVERSED",
      title: `Payment Reversed: ${payment.paymentId}`,
      description: `Payment of ₹${payment.amountPaid.toLocaleString()} for ${payment.clientName} was reversed. Reason: ${reason || "N/A"}`,
      entityType: "Payment",
      entityId: payment.paymentId,
      entityName: payment.clientName,
      status: "Reversed",
      visibility: "ADMIN",
      metadata: { paymentId: payment.paymentId, reason },
    });

    return payment;
  }

  static async updatePayment(paymentId, updateData, user = {}) {
    const idStr = String(paymentId);
    const isHex = /^[0-9a-fA-F]{24}$/.test(idStr);
    const paymentQuery = [{ paymentId: idStr }];
    if (isHex) paymentQuery.push({ _id: paymentId });
    const payment = await ClientPayment.findOne({ $or: paymentQuery });
    if (!payment) throw new ApiError(404, "Payment record not found.");

    const editorName =
      user.name || user.email || (user.firstName ? `${user.firstName} ${user.lastName || ""}` : "System Admin");
    const prevStatus = payment.status;
    const prevAmount = payment.amountPaid;

    if (updateData.amountPaid !== undefined) payment.amountPaid = Number(updateData.amountPaid);
    if (updateData.paymentDate) payment.paymentDate = new Date(updateData.paymentDate);
    if (updateData.paymentMethod) payment.paymentMethod = updateData.paymentMethod;
    if (updateData.transactionReference !== undefined) payment.transactionReference = String(updateData.transactionReference).trim();
    if (updateData.receivedBy) payment.receivedBy = updateData.receivedBy;
    if (updateData.remarks !== undefined) payment.remarks = updateData.remarks;
    if (updateData.paymentProofUrl !== undefined) payment.paymentProofUrl = updateData.paymentProofUrl;
    if (updateData.status) {
      payment.status = updateData.status;
      payment.paymentStatus = updateData.status;
      if (["Completed", "Verified", "Paid", "Received"].includes(updateData.status)) {
        payment.isMilestoneSchedule = false;
      }
    }

    payment.auditTrail.push({
      action: "PAYMENT_UPDATED",
      performedBy: editorName,
      timestamp: new Date(),
      note: `Updated payment. Status: ${prevStatus} -> ${payment.status}, Amount: ₹${prevAmount} -> ₹${payment.amountPaid}`,
    });

    await payment.save();
    await ClientPaymentService.recalculateClientTotals(payment.clientId);

    return payment;
  }

  static async getPayments({
    search = "",
    clientId,
    projectId,
    candidateId,
    paymentMethod,
    paymentStatus,
    gstTreatment,
    startDate,
    endDate,
    page = 1,
    limit = 15,
    sortBy = "paymentDate",
    sortOrder = "desc",
  } = {}) {
    const query = {};
    const andConditions = [];

    if (clientId && clientId !== "ALL") {
      const clientIds = Array.from(await ClientPaymentService.resolveClientIds(clientId));
      query.clientId = { $in: clientIds };
    }
    if (projectId && projectId !== "ALL") {
      query.projectId = String(projectId);
    }
    if (candidateId && candidateId !== "ALL") {
      query.candidateId = String(candidateId);
    }
    if (paymentMethod && paymentMethod !== "ALL") {
      query.paymentMethod = paymentMethod;
    }
    if (paymentStatus && paymentStatus !== "ALL") {
      if (paymentStatus === "Completed") {
        andConditions.push({
          $or: [
            { status: { $in: ["Completed", "Verified", "Paid", "Received"] } },
            { paymentStatus: { $in: ["Completed", "Verified", "Paid", "Received"] } },
          ],
        });
      } else if (paymentStatus === "Pending") {
        andConditions.push({
          $or: [
            { status: { $in: ["Pending", "Partially Paid", "Pending Verification"] } },
            { paymentStatus: { $in: ["Pending", "Partially Paid", "Pending Verification"] } },
          ],
        });
      } else {
        andConditions.push({
          $or: [{ status: paymentStatus }, { paymentStatus }],
        });
      }
    }
    if (gstTreatment && gstTreatment !== "ALL") {
      query.gstTreatment = gstTreatment;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      andConditions.push({
        $or: [
          { paymentId: regex },
          { clientName: regex },
          { projectName: regex },
          { candidateName: regex },
          { milestoneName: regex },
          { transactionReference: regex },
          { recordedBy: regex },
        ],
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
    sortObj.createdAt = -1;

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await ClientPayment.countDocuments(query);
    const payments = await ClientPayment.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      payments: payments.map((p) => ({
        ...p,
        id: p._id.toString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  static async getLedgerStats(clientId = null) {
    let crmQuery = {};
    let resolvedIds = null;
    if (clientId && clientId !== "ALL") {
      resolvedIds = Array.from(await ClientPaymentService.resolveClientIds(clientId));
      const crmQueries = [{ clientId: { $in: resolvedIds } }];
      const hexIds = resolvedIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
      if (hexIds.length > 0) {
        crmQueries.push({ _id: { $in: hexIds } });
      }
      crmQuery = { $or: crmQueries };
    }
    const crmClients = await CrmOverseasClient.find(crmQuery).lean();

    let totalAgreed = 0;
    let dueCount = 0;
    let overdueCount = 0;
    const now = new Date();

    crmClients.forEach((client) => {
      const milestones = client.paymentMilestones || [];
      milestones.forEach((m) => {
        const amt = Number(m.paymentAmount) || Number(m.amount) || 0;
        const paid = Number(m.amountPaid) || Number(m.paidAmount) || 0;
        const st = m.paymentStatus || m.status || "Pending";
        totalAgreed += amt;
        if (st !== "Paid" && Math.max(0, amt - paid) > 0) dueCount++;
        if (
          st === "Overdue" ||
          (m.dueDate && new Date(m.dueDate) < now && st !== "Paid")
        ) {
          overdueCount++;
        }
      });
    });

    const paymentQuery = {
      isMilestoneSchedule: { $ne: true },
      isReversed: false,
      $or: [
        { status: { $in: ["Completed", "Verified", "Paid", "Received"] } },
        { paymentStatus: { $in: ["Completed", "Verified", "Paid", "Received"] } },
      ],
    };
    if (resolvedIds && resolvedIds.length > 0) {
      paymentQuery.clientId = { $in: resolvedIds };
    }
    const payments = await ClientPayment.find(paymentQuery).lean();
    const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
    const totalTransactionsAmount = payments.reduce(
      (acc, p) => acc + (Number(p.totalTransactionAmount) || Number(p.amountPaid) || 0),
      0
    );

    const outstanding = Math.max(0, totalAgreed - totalPaid);

    return {
      totalAgreedPayments: totalAgreed,
      totalPaymentsMade: totalPaid,
      totalOutstandingAmount: outstanding,
      paymentsDueCount: dueCount,
      overduePaymentsCount: overdueCount,
      paymentsDue: dueCount,
      overduePayments: overdueCount,
      totalTransactions: payments.length,
      totalTransactionsAmount,
      totalReceived: totalPaid,
      totalReceivable: outstanding,
      totalInvoiced: totalAgreed,
    };
  }
}

export default ClientPaymentService;
