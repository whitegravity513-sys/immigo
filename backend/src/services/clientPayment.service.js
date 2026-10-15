import ClientPayment from "../models/ClientPayment.js";
import Client from "../models/Client.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import ActivityService from "./activity.service.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export class ClientPaymentService {
  
  static async recalculateClientTotals(clientId) {

    const clientQuery = [{ clientId: String(clientId) }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      clientQuery.push({ _id: clientId });
    }

    let crmClient = await CrmOverseasClient.findOne({ $or: clientQuery });
    let adminClient = await Client.findOne({
      $or: [{ _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }, { company: clientId }],
    });

    const clientIds = new Set([String(clientId)]);
    if (crmClient?._id) clientIds.add(String(crmClient._id));
    if (crmClient?.id) clientIds.add(String(crmClient.id));
    if (crmClient?.clientId) clientIds.add(String(crmClient.clientId));
    if (adminClient?._id) clientIds.add(String(adminClient._id));
    if (adminClient?.company) clientIds.add(String(adminClient.company));

    const successfulPayments = await ClientPayment.find({
      clientId: { $in: Array.from(clientIds) },
      $or: [
        { status: "Verified" },
        { status: "Completed" },
        { paymentStatus: "Verified" },
        { paymentStatus: "Completed" },
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

    const existingTx = await ClientPayment.findOne({
      clientId: String(clientId),
      transactionReference: String(transactionReference).trim(),
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
    let clientDoc = await CrmOverseasClient.findOne({ $or: clientQuery });
    let adminClientDoc = null;
    if (!clientDoc) {
      adminClientDoc = await Client.findOne({
        $or: [{ _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }],
      });
    }

    const effectiveClient = clientDoc || adminClientDoc;
    if (!effectiveClient) {
      throw new ApiError(404, "Client not found in database.");
    }

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

    const count = await ClientPayment.countDocuments();
    const paymentId = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

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
      clientId: String(clientId),
      clientName: clientName || effectiveClient.companyName || effectiveClient.name || "Client",
      projectId: String(projectId || ""),
      projectName: projectName || "",
      candidateId: String(candidateId || ""),
      candidateName: candidateName || "",
      milestoneId: String(milestoneId),
      milestoneName: milestoneName || (milestoneIdx !== -1 ? milestones[milestoneIdx].name : "Milestone Payment"),
      agreedMilestoneAmount,
      totalMilestoneAmount: Number(paymentData.totalMilestoneAmount) || agreedMilestoneAmount,
      previouslyReceivedAmount: Math.max(0, prevReceived),
      amountPaid: numericAmount,
      remainingMilestoneBalance,
      remainingMilestoneAmount: Number(paymentData.remainingMilestoneAmount) !== undefined ? Number(paymentData.remainingMilestoneAmount) : remainingMilestoneBalance,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionReference: String(transactionReference).trim(),
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
          note: `Payment of ₹${numericAmount.toLocaleString()} recorded via ${paymentMethod} with status ${paymentStatusToSet} (Ref: ${transactionReference})`,
        },
      ],
    });

    await ClientPaymentService.recalculateClientTotals(clientId);

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
        clientId,
        milestoneId,
        amount: numericAmount,
        transactionReference,
      },
    });

    return newPayment;
  }

  static async reversePayment(paymentId, reason, user = {}) {
    const idStr = String(paymentId);
    const isHex = /^[0-9a-fA-F]{24}$/.test(idStr);
    const payment = await ClientPayment.findOne({
      $or: [{ paymentId: idStr }, { _id: isHex ? paymentId : null }],
    });

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
    const clientDoc =
      (await CrmOverseasClient.findOne({ $or: clientQuery })) ||
      (await Client.findOne({
        $or: [{ _id: payment.clientId.match(/^[0-9a-fA-F]{24}$/) ? payment.clientId : null }],
      }));

    if (clientDoc && Array.isArray(clientDoc.paymentMilestones)) {
      const msIdx = clientDoc.paymentMilestones.findIndex(
        (m) => String(m.id || m._id) === String(payment.milestoneId)
      );
      if (msIdx !== -1) {
        const ms = clientDoc.paymentMilestones[msIdx];
        const newPaid = Math.max(0, (Number(ms.paidAmount) || 0) - Number(payment.amountPaid));
        ms.paidAmount = newPaid;
        ms.remainingBalance = Math.max(0, (Number(ms.amount) || 0) - newPaid);
        ms.status = newPaid <= 0 ? "Pending" : "Partially Paid";
        clientDoc.paymentMilestones[msIdx] = ms;
        if (clientDoc.markModified) clientDoc.markModified("paymentMilestones");
        await clientDoc.save();
      }
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
    const payment = await ClientPayment.findOne({
      $or: [{ paymentId: idStr }, { _id: isHex ? paymentId : null }],
    });
    if (!payment) throw new ApiError(404, "Payment record not found.");

    const editorName =
      user.name || user.email || (user.firstName ? `${user.firstName} ${user.lastName || ""}` : "System Admin");
    const prevStatus = payment.status;
    const prevAmount = payment.amountPaid;

    if (updateData.amountPaid !== undefined) payment.amountPaid = Number(updateData.amountPaid);
    if (updateData.paymentDate) payment.paymentDate = new Date(updateData.paymentDate);
    if (updateData.paymentMethod) payment.paymentMethod = updateData.paymentMethod;
    if (updateData.transactionReference) payment.transactionReference = String(updateData.transactionReference).trim();
    if (updateData.receivedBy) payment.receivedBy = updateData.receivedBy;
    if (updateData.remarks !== undefined) payment.remarks = updateData.remarks;
    if (updateData.paymentProofUrl !== undefined) payment.paymentProofUrl = updateData.paymentProofUrl;
    if (updateData.status) {
      payment.status = updateData.status;
      payment.paymentStatus = updateData.status;
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

    if (clientId && clientId !== "ALL") {
      query.clientId = String(clientId);
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
      query.status = paymentStatus;
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
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { paymentId: regex },
        { clientName: regex },
        { projectName: regex },
        { candidateName: regex },
        { milestoneName: regex },
        { transactionReference: regex },
        { recordedBy: regex },
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

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
    if (clientId && clientId !== "ALL") {
      crmQuery = {
        $or: [
          { clientId: String(clientId) },
          { _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null },
        ],
      };
    }
    const crmClients = await CrmOverseasClient.find(crmQuery).lean();

    let totalAgreed = 0;
    let dueCount = 0;
    let overdueCount = 0;
    const now = new Date();

    crmClients.forEach((client) => {
      const milestones = client.paymentMilestones || [];
      milestones.forEach((m) => {
        totalAgreed += Number(m.paymentAmount) || Number(m.amount) || 0;
        if (m.paymentStatus === "Due" || m.status === "Due") dueCount++;
        if (
          m.paymentStatus === "Overdue" ||
          m.status === "Overdue" ||
          (m.dueDate && new Date(m.dueDate) < now && m.paymentStatus !== "Paid" && m.status !== "Paid")
        ) {
          overdueCount++;
        }
      });
    });

    const paymentQuery = { paymentStatus: "Completed", isReversed: false };
    if (clientId && clientId !== "ALL") {
      paymentQuery.clientId = String(clientId);
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
      paymentsDue: dueCount,
      overduePayments: overdueCount,
      totalTransactions: payments.length,
      totalTransactionsAmount,
    };
  }
}

export default ClientPaymentService;
