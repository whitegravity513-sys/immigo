import Vendor from "../models/Vendor.js";
import User from "../models/User.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import CandidateApplication from "../models/CandidateApplication.js";
import VendorPaymentMilestone from "../models/VendorPaymentMilestone.js";
import ActivityLog from "../models/ActivityLog.js";
import NotificationService from "./notification.service.js";
import { ApiError } from "../utils/apiError.js";
import { generateNextVendorId } from "../utils/idGenerator.js";
import bcrypt from "bcryptjs";

export class VendorManagementService {
  static async createVendor({
    companyName,
    vendorCode,
    contactPersonName,
    email,
    phone,
    address,
    gstin,
    pan,
    bankDetails,
    status = "Active",
    contractDetails,
    paymentTerms = "Milestone Based",
    vendorNotes = "",
    actorUser,
  }) {
    if (!companyName || !email) {
      throw new ApiError(400, "Company name and email are required.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Vendor.findOne({
      $or: [{ email: cleanEmail }, { vendorId: vendorCode }],
    });
    if (existing) {
      throw new ApiError(409, "A vendor with this email or vendor code already exists.");
    }

    const generatedCode =
      vendorCode?.trim() || (await generateNextVendorId());
    const randomPassword = await bcrypt.hash(`Vendor@${Date.now().toString().slice(-4)}`, 10);

    const vendor = await Vendor.create({
      vendorId: generatedCode,
      companyName: companyName.trim(),
      email: cleanEmail,
      phone: phone || "",
      address: address || "",
      contactPersonName: contactPersonName || "",
      contactPersonEmail: cleanEmail,
      contactPersonPhone: phone || "",
      gstin: gstin || "",
      pan: pan || "",
      status: status || "Active",
      paymentTerms: paymentTerms || "Milestone Based",
      contractDetails: contractDetails || {},
      vendorNotes: vendorNotes || "",
      bankDetails: bankDetails || {},
      password: randomPassword,
      onboardingStage: "ACTIVE",
    });

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Administrator",
      action: "VENDOR_CREATED",
      title: `Created Vendor [${vendor.companyName}]`,
      description: `New vendor account created with code ${vendor.vendorId}.`,
      entityType: "Vendor",
      entityId: vendor.vendorId,
      entityName: vendor.companyName,
      status: vendor.status,
      visibility: "ALL",
      vendorId: vendor.vendorId,
      vendorName: vendor.companyName,
      remarks: vendorNotes || "Vendor created successfully",
    });

    try {
      const regMetadata = {
        vendorId: vendor._id,
        vendorCode: vendor.vendorId,
        link: "/admin/vendor/vendors?tab=registered",
      };
      if (actorUser) {
        await NotificationService.notifyStaffAction({
          actor: actorUser,
          type: "VENDOR_REGISTERED",
          title: `New Vendor Added: ${vendor.companyName}`,
          message: `${vendor.companyName} (${vendor.vendorId}) has been added to the partner network.`,
          moduleScope: "VENDOR",
          targetVendorId: vendor.vendorId,
          metadata: regMetadata,
        });
      } else {
        const base = {
          type: "VENDOR_REGISTERED",
          title: `New Vendor Registered: ${vendor.companyName}`,
          message: `${vendor.companyName} (${vendor.vendorId}) has registered as a recruitment partner. Review and approval required.`,
          targetType: "ALL",
          targetVendorId: vendor.vendorId,
          actorId: vendor.vendorId,
          actorRole: "VENDOR",
          moduleScope: "VENDOR",
          metadata: regMetadata,
        };
        await Promise.all([
          NotificationService.createNotification({
            ...base,
            targetRole: "SUPER_ADMIN",
            targetRoles: ["SUPER_ADMIN"],
          }),
          NotificationService.createNotification({
            ...base,
            targetRole: "ADMIN",
            targetRoles: ["ADMIN"],
          }),
        ]);
      }
    } catch {}

    return vendor;
  }

  static async getVendorsList({ search, status }) {
    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { companyName: { $regex: s, $options: "i" } },
        { vendorId: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { contactPersonName: { $regex: s, $options: "i" } },
      ];
    }

    const vendors = await Vendor.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const vendorIds = vendors.map((v) => v.vendorId || v._id.toString());

    const [assignments, vendorHRs, applications, milestones] = await Promise.all([
      ProjectAssignment.find({
        assignmentType: "VENDOR_PROJECT",
        vendorId: { $in: vendorIds },
        status: "Active",
      }).lean(),
      User.find({
        role: "HR",
        hrType: "VENDOR_HR",
        assignedVendors: { $in: vendorIds },
        isActive: true,
      }).lean(),
      CandidateApplication.find({
        vendorId: { $in: vendorIds },
      }).lean(),
      VendorPaymentMilestone.find({
        vendorId: { $in: vendorIds },
      }).lean(),
    ]);

    const enrichedVendors = vendors.map((v) => {
      const vId = v.vendorId || v._id.toString();
      const vAssignments = assignments.filter((a) => a.vendorId === vId);
      const vHRCount = vendorHRs.filter((hr) =>
        Array.isArray(hr.assignedVendors) && hr.assignedVendors.includes(vId)
      ).length;
      const vApps = applications.filter((app) => app.vendorId === vId);
      const vMilestones = milestones.filter((m) => m.vendorId === vId);

      const totalPayment = vMilestones.reduce((acc, m) => acc + (m.amount || 0), 0);
      const paidAmount = vMilestones.reduce((acc, m) => acc + (m.paidAmount || (m.status === "Paid" ? m.amount : 0)), 0);
      const pendingPayment = Math.max(0, totalPayment - paidAmount);

      return {
        id: v._id.toString(),
        _id: v._id.toString(),
        vendorId: v.vendorId || v._id.toString(),
        vendorCode: v.vendorId || v._id.toString(),
        companyName: v.companyName,
        vendorName: v.companyName,
        email: v.email,
        phone: v.phone || v.mobile || "",
        contactPersonName: v.contactPersonName || "",
        status: v.status || "Active",
        paymentTerms: v.paymentTerms || "Milestone Based",
        assignedProjectsCount: vAssignments.length,
        assignedProjects: vAssignments.map((a) => ({
          projectId: a.projectId,
          projectName: a.projectName,
        })),
        vendorHRCount: vHRCount,
        candidatesSubmitted: vApps.length,
        candidatesSelected: vApps.filter((a) => a.status === "Selected").length,
        candidatesJoined: vApps.filter((a) => a.status === "Joined").length,
        totalPayment,
        paidAmount,
        pendingPayment,
        createdAt: v.createdAt,
      };
    });

    return {
      count: enrichedVendors.length,
      vendors: enrichedVendors,
    };
  }

  static async getVendorDetails(vendorId) {
    const vendor = await Vendor.findOne({
      $or: [
        { vendorId },
        { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null },
      ],
    }).lean();

    if (!vendor) {
      throw new ApiError(404, "Vendor not found.");
    }

    const [assignments, vendorHRs, applications, milestones, activityLogs] = await Promise.all([
      ProjectAssignment.find({
        assignmentType: "VENDOR_PROJECT",
        vendorId: { $in: [vendor.vendorId, vendor._id.toString()].filter(Boolean) },
      }).sort({ createdAt: -1 }).lean(),
      User.find({
        role: "HR",
        hrType: "VENDOR_HR",
        assignedVendors: { $in: [vendor.vendorId, vendor._id.toString()].filter(Boolean) },
      }).lean(),
      CandidateApplication.find({
        vendorId: { $in: [vendor.vendorId, vendor._id.toString()].filter(Boolean) },
      }).sort({ createdAt: -1 }).lean(),
      VendorPaymentMilestone.find({
        vendorId: { $in: [vendor.vendorId, vendor._id.toString()].filter(Boolean) },
      }).sort({ createdAt: -1 }).lean(),
      ActivityLog.find({
        vendorId: { $in: [vendor.vendorId, vendor._id.toString()].filter(Boolean) },
      }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const totalPayment = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const paidAmount = milestones.reduce(
      (sum, m) => sum + (m.paidAmount || (m.status === "Paid" ? m.amount : 0)),
      0
    );
    const pendingPayment = Math.max(0, totalPayment - paidAmount);

    return {
      vendor: {
        id: vendor._id.toString(),
        _id: vendor._id.toString(),
        vendorId: vendor.vendorId || vendor._id.toString(),
        vendorCode: vendor.vendorId || vendor._id.toString(),
        companyName: vendor.companyName,
        vendorName: vendor.companyName,
        email: vendor.email,
        phone: vendor.phone || vendor.mobile || "",
        contactPersonName: vendor.contactPersonName || "",
        contactPersonEmail: vendor.contactPersonEmail || vendor.email,
        contactPersonPhone: vendor.contactPersonPhone || vendor.phone || "",
        address: vendor.address || "",
        gstin: vendor.gstin || "",
        pan: vendor.pan || "",
        bankDetails: vendor.bankDetails || {},
        status: vendor.status || "Active",
        paymentTerms: vendor.paymentTerms || "Milestone Based",
        contractDetails: vendor.contractDetails || {},
        vendorNotes: vendor.vendorNotes || "",
        createdAt: vendor.createdAt,
      },
      stats: {
        totalProjects: assignments.filter((a) => a.status === "Active").length,
        totalHRs: vendorHRs.length,
        totalCandidates: applications.length,
        totalInterviews: applications.filter((a) =>
          ["Interview Scheduled", "Interview Completed", "L1 Interview", "L2 Interview"].includes(a.status)
        ).length,
        selectedCandidates: applications.filter((a) => a.status === "Selected").length,
        joinedCandidates: applications.filter((a) => a.status === "Joined").length,
        totalPayment,
        paidPayment: paidAmount,
        pendingPayment,
      },
      projects: assignments.map((a) => ({
        id: a._id.toString(),
        projectId: a.projectId,
        projectName: a.projectName,
        assignedAt: a.assignedAt,
        status: a.status,
        notes: a.notes,
      })),
      vendorHRs: vendorHRs.map((hr) => ({
        id: hr._id.toString(),
        name: hr.name,
        email: hr.email,
        phone: hr.phone || "",
        isActive: hr.isActive,
        createdAt: hr.createdAt,
      })),
      candidates: applications.slice(0, 50).map((app) => ({
        id: app._id.toString(),
        applicationId: app.applicationId,
        candidateName: app.candidateName,
        candidateEmail: app.candidateEmail,
        position: app.position || app.jobTitle || "",
        projectName: app.projectName,
        status: app.status,
        recruitmentStage: app.recruitmentStage || app.status,
        appliedAt: app.appliedAt || app.createdAt,
      })),
      milestones,
      activityLogs,
    };
  }

  static async updateVendor(vendorId, updateData, actorUser) {
    const vendor = await Vendor.findOne({
      $or: [
        { vendorId },
        { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null },
      ],
    });

    if (!vendor) {
      throw new ApiError(404, "Vendor not found.");
    }

    const previousStatus = vendor.status;

    if (updateData.companyName) vendor.companyName = updateData.companyName.trim();
    if (updateData.contactPersonName) vendor.contactPersonName = updateData.contactPersonName.trim();
    if (updateData.phone) vendor.phone = updateData.phone.trim();
    if (updateData.address) vendor.address = updateData.address.trim();
    if (updateData.gstin) vendor.gstin = updateData.gstin.trim();
    if (updateData.pan) vendor.pan = updateData.pan.trim();
    if (updateData.paymentTerms) vendor.paymentTerms = updateData.paymentTerms.trim();
    if (updateData.vendorNotes !== undefined) vendor.vendorNotes = updateData.vendorNotes;
    if (updateData.status) vendor.status = updateData.status;
    if (updateData.bankDetails) vendor.bankDetails = { ...vendor.bankDetails, ...updateData.bankDetails };
    if (updateData.contractDetails) vendor.contractDetails = { ...vendor.contractDetails, ...updateData.contractDetails };

    await vendor.save();

    await ActivityLog.create({
      userType: actorUser?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Administrator",
      action: "VENDOR_UPDATED",
      title: `Updated Vendor [${vendor.companyName}]`,
      description: `Vendor profile and settings updated.`,
      entityType: "Vendor",
      entityId: vendor.vendorId,
      entityName: vendor.companyName,
      status: vendor.status,
      previousStatus,
      newStatus: vendor.status,
      visibility: "ALL",
      vendorId: vendor.vendorId,
      vendorName: vendor.companyName,
      remarks: updateData.vendorNotes || "Updated vendor profile",
    });

    return vendor;
  }
}

export default VendorManagementService;
