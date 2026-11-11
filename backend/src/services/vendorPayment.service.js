import VendorPaymentMilestone from "../models/VendorPaymentMilestone.js";
import Vendor from "../models/Vendor.js";
import Project from "../models/Project.js";
import ActivityLog from "../models/ActivityLog.js";
import NotificationService from "./notification.service.js";
import { ApiError } from "../utils/apiError.js";

export class VendorPaymentService {
  static async createMilestone({
    milestoneName,
    vendorId,
    projectId,
    amount,
    percentage = 0,
    conditions = "",
    dueDate = null,
    status = "Pending",
    remarks = "",
    actorUser,
  }) {
    if (!milestoneName || !vendorId || !projectId || amount === undefined) {
      throw new ApiError(400, "Milestone name, vendor, project, and amount are required.");
    }

    const [vendor, project] = await Promise.all([
      Vendor.findOne({
        $or: [
          { vendorId },
          { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null },
        ],
      }),
      Project.findOne({
        $or: [
          { projectId },
          { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null },
        ],
      }),
    ]);

    if (!vendor) throw new ApiError(404, "Vendor not found.");
    if (!project) throw new ApiError(404, "Project not found.");

    const milestoneId = `MIL-${Date.now().toString().slice(-6)}`;
    const parsedAmount = Number(amount);

    const milestone = await VendorPaymentMilestone.create({
      milestoneId,
      milestoneName: milestoneName.trim(),
      vendorId: vendor.vendorId || vendor._id.toString(),
      vendorRef: vendor._id,
      vendorName: vendor.companyName,
      projectId: project.projectId || project._id.toString(),
      projectRef: project._id,
      projectName: project.title,
      amount: parsedAmount,
      percentage: Number(percentage) || 0,
      conditions: conditions || "",
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || "Pending",
      remarks: remarks || "",
      createdBy: actorUser?._id?.toString() || actorUser?.id || "System",
      createdByName: actorUser?.name || "Administrator",
      history: [
        {
          status: status || "Pending",
          amount: parsedAmount,
          paidAmount: 0,
          actorId: actorUser?._id?.toString() || actorUser?.id || "System",
          actorName: actorUser?.name || "Administrator",
          actorRole: actorUser?.role || "ADMIN",
          timestamp: new Date(),
          remarks: "Milestone created",
        },
      ],
    });

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Administrator",
      action: "PAYMENT_MILESTONE_CREATED",
      title: `Created Milestone [${milestone.milestoneName}]`,
      description: `Payment milestone of ₹${parsedAmount} created for ${vendor.companyName} on project ${project.title}.`,
      entityType: "VendorPayment",
      entityId: milestone.milestoneId,
      entityName: milestone.milestoneName,
      vendorId: vendor.vendorId || vendor._id.toString(),
      vendorName: vendor.companyName,
      status: milestone.status,
      visibility: "ALL",
      remarks: `Amount: ₹${parsedAmount} | Due: ${dueDate || "N/A"}`,
    });

    try {
      await NotificationService.notifyStaffAction({
        actor: actorUser,
        type: "PAYMENT",
        title: "New Payment Milestone Created",
        message: `Milestone "${milestone.milestoneName}" for ₹${parsedAmount} was created for project ${project.title}.`,
        moduleScope: "VENDOR",
        targetVendorId: vendor.vendorId || vendor._id.toString(),
        metadata: {
          milestoneId: milestone.milestoneId,
          vendorId: vendor.vendorId || vendor._id.toString(),
          amount: parsedAmount,
          link: "/admin/vendor/payments",
        },
      });
    } catch {
    }

    return milestone;
  }

  static async updateMilestone(milestoneId, updateData, actorUser) {
    const milestone = await VendorPaymentMilestone.findOne({
      $or: [
        { milestoneId },
        { _id: milestoneId.match(/^[0-9a-fA-F]{24}$/) ? milestoneId : null },
      ],
    });

    if (!milestone) {
      throw new ApiError(404, "Payment milestone not found.");
    }

    const previousStatus = milestone.status;

    if (updateData.milestoneName) milestone.milestoneName = updateData.milestoneName.trim();
    if (updateData.amount !== undefined) milestone.amount = Number(updateData.amount);
    if (updateData.percentage !== undefined) milestone.percentage = Number(updateData.percentage);
    if (updateData.conditions !== undefined) milestone.conditions = updateData.conditions;
    if (updateData.dueDate) milestone.dueDate = new Date(updateData.dueDate);
    if (updateData.remarks !== undefined) milestone.remarks = updateData.remarks;

    if (updateData.status && updateData.status !== previousStatus) {
      milestone.status = updateData.status;

      if (updateData.status === "Approved") {
        milestone.approvedAt = new Date();
        milestone.approvedBy = actorUser?._id?.toString() || actorUser?.id;
        milestone.approvedByName = actorUser?.name || "Administrator";
      }

      if (updateData.status === "Paid") {
        milestone.paidAmount = milestone.amount;
        milestone.paidAt = new Date();
        milestone.paidBy = actorUser?._id?.toString() || actorUser?.id;
        milestone.paidByName = actorUser?.name || "Administrator";
        if (updateData.paymentReference) milestone.paymentReference = updateData.paymentReference;
        if (updateData.paymentMethod) milestone.paymentMethod = updateData.paymentMethod;
        if (updateData.paymentProofUrl) milestone.paymentProofUrl = updateData.paymentProofUrl;
      }
    }

    if (updateData.paidAmount !== undefined) {
      milestone.paidAmount = Number(updateData.paidAmount);
      if (milestone.paidAmount >= milestone.amount) {
        milestone.status = "Paid";
        milestone.paidAt = new Date();
      } else if (milestone.paidAmount > 0) {
        milestone.status = "Partially Paid";
      }
    }

    if (updateData.paymentReference) milestone.paymentReference = updateData.paymentReference;
    if (updateData.paymentMethod) milestone.paymentMethod = updateData.paymentMethod;
    if (updateData.paymentProofUrl) milestone.paymentProofUrl = updateData.paymentProofUrl;

    milestone.history = milestone.history || [];
    milestone.history.push({
      status: milestone.status,
      amount: milestone.amount,
      paidAmount: milestone.paidAmount,
      actorId: actorUser?._id?.toString() || actorUser?.id || "System",
      actorName: actorUser?.name || "Administrator",
      actorRole: actorUser?.role || "ADMIN",
      timestamp: new Date(),
      remarks: updateData.remarks || `Status updated from ${previousStatus} to ${milestone.status}`,
    });

    await milestone.save();

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Administrator",
      action: "PAYMENT_MILESTONE_UPDATED",
      title: `Updated Milestone [${milestone.milestoneName}] -> ${milestone.status}`,
      description: `Payment milestone ${milestone.milestoneId} updated from ${previousStatus} to ${milestone.status}.`,
      entityType: "VendorPayment",
      entityId: milestone.milestoneId,
      entityName: milestone.milestoneName,
      vendorId: milestone.vendorId,
      vendorName: milestone.vendorName,
      status: milestone.status,
      previousStatus,
      newStatus: milestone.status,
      visibility: "ALL",
      remarks: updateData.remarks || `Direct update by ${actorUser?.name}`,
    });

    return milestone;
  }

  static async markPaymentAsPaid({
    milestoneId,
    paidAmount,
    paymentReference,
    paymentMethod = "Bank Transfer",
    paymentProofUrl = "",
    remarks = "",
    actorUser,
  }) {
    const milestone = await VendorPaymentMilestone.findOne({
      $or: [
        { milestoneId },
        { _id: milestoneId.match(/^[0-9a-fA-F]{24}$/) ? milestoneId : null },
      ],
    });

    if (!milestone) {
      throw new ApiError(404, "Milestone not found.");
    }

    const amountToCredit = paidAmount !== undefined ? Number(paidAmount) : milestone.amount;
    milestone.paidAmount = amountToCredit;
    milestone.status = amountToCredit >= milestone.amount ? "Paid" : "Partially Paid";
    milestone.paymentReference = paymentReference || `TXN-${Date.now().toString().slice(-6)}`;
    milestone.paymentMethod = paymentMethod;
    milestone.paymentProofUrl = paymentProofUrl;
    milestone.paidAt = new Date();
    milestone.paidBy = actorUser?._id?.toString() || actorUser?.id;
    milestone.paidByName = actorUser?.name || "Administrator";
    milestone.remarks = remarks || milestone.remarks;

    milestone.history = milestone.history || [];
    milestone.history.push({
      status: milestone.status,
      amount: milestone.amount,
      paidAmount: amountToCredit,
      actorId: actorUser?._id?.toString() || actorUser?.id || "System",
      actorName: actorUser?.name || "Administrator",
      actorRole: actorUser?.role || "ADMIN",
      timestamp: new Date(),
      remarks: remarks || `Marked as paid: Ref ${milestone.paymentReference}`,
    });

    await milestone.save();

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Administrator",
      action: "PAYMENT_COMPLETED",
      title: `Payment Recorded: ₹${amountToCredit} [${milestone.milestoneName}]`,
      description: `Payment of ₹${amountToCredit} marked as ${milestone.status} for ${milestone.vendorName}. Ref: ${milestone.paymentReference}`,
      entityType: "VendorPayment",
      entityId: milestone.milestoneId,
      entityName: milestone.milestoneName,
      vendorId: milestone.vendorId,
      vendorName: milestone.vendorName,
      status: milestone.status,
      visibility: "ALL",
      remarks: `Paid amount: ₹${amountToCredit} via ${paymentMethod}`,
    });

    return milestone;
  }

  static async getMilestones({ vendorId, projectId, status }) {
    const filter = {};
    if (vendorId) filter.vendorId = vendorId;
    if (projectId) filter.projectId = projectId;
    if (status && status !== "ALL") filter.status = status;

    const milestones = await VendorPaymentMilestone.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const paidAmount = milestones.reduce(
      (sum, m) => sum + (m.paidAmount || (m.status === "Paid" ? m.amount : 0)),
      0
    );
    const pendingAmount = Math.max(0, totalAmount - paidAmount);

    return {
      count: milestones.length,
      stats: {
        totalAmount,
        paidAmount,
        pendingAmount,
      },
      milestones,
    };
  }
}

export default VendorPaymentService;
