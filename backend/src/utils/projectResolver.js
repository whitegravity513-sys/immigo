import mongoose from "mongoose";
import Project from "../models/Project.js";
import Client from "../models/Client.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

export const normalizeAssignedVendorsList = (assignedVendors = [], assignedVendorIds = []) => {
  const result = [];
  const seen = new Set();

  const pushEntry = (entry) => {
    if (!entry) return;
    if (typeof entry === "string") {
      const idStr = entry.trim();
      if (idStr && !seen.has(idStr)) {
        seen.add(idStr);
        result.push({ vendorId: idStr, vendorName: "" });
      }
      return;
    }
    if (typeof entry === "object") {
      const idStr = String(entry.vendorId || entry.id || entry._id || "").trim();
      const nameStr = String(entry.vendorName || entry.companyName || entry.name || "").trim();
      if (idStr && !seen.has(idStr)) {
        seen.add(idStr);
        result.push({
          ...entry,
          vendorId: idStr,
          vendorName: nameStr,
        });
      }
    }
  };

  if (Array.isArray(assignedVendors)) assignedVendors.forEach(pushEntry);
  if (Array.isArray(assignedVendorIds)) assignedVendorIds.forEach(pushEntry);
  return result;
};

export const findProjectAcrossSources = async (rawProjectId) => {
  if (!rawProjectId) return null;
  const idStr = String(rawProjectId).trim();
  if (!idStr) return null;

  const isHex = isValidObjectId(idStr);
  const projectOr = [{ projectId: idStr }, { id: idStr }];
  if (isHex) projectOr.push({ _id: new mongoose.Types.ObjectId(idStr) });

  const projectDoc = await Project.findOne({ $or: projectOr });
  if (projectDoc) {
    let clientDoc = null;
    if (projectDoc.clientId) {
      try {
        clientDoc = await Client.findById(projectDoc.clientId).lean();
      } catch {}
    }

    const normId = String(projectDoc.projectId || projectDoc._id.toString());
    const rawIdCandidates = Array.from(
      new Set(
        [normId, projectDoc._id.toString(), projectDoc.id]
          .filter(Boolean)
          .map((v) => String(v))
      )
    );

    const targetFromReqs = Array.isArray(projectDoc.manpowerRequirements)
      ? projectDoc.manpowerRequirements.reduce(
          (sum, r) => sum + Number(r.quantity || r.openings || 1),
          0
        )
      : 0;
    const targetFromPos = Array.isArray(projectDoc.jobPositions)
      ? projectDoc.jobPositions.reduce(
          (sum, p) => sum + Number(p.openings || p.quantity || 1),
          0
        )
      : 0;

    return {
      source: "PROJECT",
      projectDoc,
      crmClientDoc: null,
      crmProjectObj: null,
      projectId: normId,
      projectRef: projectDoc._id,
      title: projectDoc.title || projectDoc.projectName || "Overseas Project",
      projectName: projectDoc.title || projectDoc.projectName || "Overseas Project",
      clientId: projectDoc.clientId ? projectDoc.clientId.toString() : "",
      clientName:
        projectDoc.clientName ||
        clientDoc?.name ||
        clientDoc?.companyName ||
        clientDoc?.company ||
        "",
      destinationCountry:
        projectDoc.destinationCountry ||
        projectDoc.country ||
        clientDoc?.country ||
        "",
      country:
        projectDoc.destinationCountry ||
        projectDoc.country ||
        clientDoc?.country ||
        "",
      targetHiring:
        Number(
          projectDoc.totalHiringTarget > 0
            ? projectDoc.totalHiringTarget
            : projectDoc.targetHiring || projectDoc.totalHeadcount || projectDoc.manpower || 0
        ) ||
        targetFromPos ||
        targetFromReqs ||
        0,
      jobPositions: Array.isArray(projectDoc.jobPositions) ? projectDoc.jobPositions : [],
      manpowerRequirements: Array.isArray(projectDoc.manpowerRequirements)
        ? projectDoc.manpowerRequirements
        : [],
      salary: projectDoc.salary || "",
      currency: projectDoc.currency || "",
      paymentMilestones: Array.isArray(projectDoc.paymentMilestones)
        ? projectDoc.paymentMilestones
        : Array.isArray(projectDoc.recruitmentConfig?.paymentMilestones)
        ? projectDoc.recruitmentConfig.paymentMilestones
        : [],
      paymentMilestoneConfig: projectDoc.paymentMilestoneConfig || null,
      totalMilestoneAmount: Number(
        projectDoc.totalMilestoneAmount ??
          projectDoc.totalAgreedAmount ??
          projectDoc.paymentMilestoneConfig?.totalFeePerCandidate ??
          projectDoc.recruitmentConfig?.totalMilestoneAmount ??
          0
      ),
      totalAgreedAmount: Number(projectDoc.totalAgreedAmount ?? projectDoc.totalMilestoneAmount ?? 0),
      recruitmentConfig: projectDoc.recruitmentConfig || {},
      vendorAssignmentType: projectDoc.vendorAssignmentType || "",
      vendorVisibility: projectDoc.vendorVisibility || "",
      assignedVendors: normalizeAssignedVendorsList(
        projectDoc.assignedVendors,
        projectDoc.assignedVendorIds
      ),
      assignedVendorHRs: Array.isArray(projectDoc.assignedVendorHRs)
        ? projectDoc.assignedVendorHRs
        : [],
      description: projectDoc.description || projectDoc.remark || projectDoc.notes || "",
      status: projectDoc.status || "Active",
      createdAt: projectDoc.createdAt,
      rawIdCandidates,
    };
  }

  const crmOr = [{ "projects.id": idStr }, { "projects.projectId": idStr }];
  if (isHex) {
    crmOr.push({ "projects._id": idStr });
    crmOr.push({ "projects._id": new mongoose.Types.ObjectId(idStr) });
  }

  const crmClientDoc = await CrmOverseasClient.findOne({ $or: crmOr });
  if (crmClientDoc && Array.isArray(crmClientDoc.projects)) {
    const crmProj = crmClientDoc.projects.find((p) => {
      const candidates = [p?.id, p?.projectId, p?._id ? String(p._id) : ""]
        .filter(Boolean)
        .map(String);
      return candidates.includes(idStr);
    });

    if (crmProj) {
      const normId = String(crmProj.id || crmProj.projectId || crmProj._id || idStr);
      const rawIdCandidates = Array.from(
        new Set(
          [normId, crmProj.id, crmProj.projectId, crmProj._id ? String(crmProj._id) : ""]
            .filter(Boolean)
            .map((v) => String(v))
        )
      );

      const manpowerReqs = Array.isArray(crmProj.manpowerRequirements)
        ? crmProj.manpowerRequirements
        : [];
      const jobPositions = Array.isArray(crmProj.jobPositions) ? crmProj.jobPositions : [];
      const sumReq = manpowerReqs.reduce(
        (sum, r) => sum + Number(r.quantity || r.openings || 1),
        0
      );
      const sumPos = jobPositions.reduce(
        (sum, p) => sum + Number(p.openings || p.quantity || 1),
        0
      );

      return {
        source: "CRM",
        projectDoc: null,
        crmClientDoc,
        crmProjectObj: crmProj,
        projectId: normId,
        projectRef: null,
        title: crmProj.projectName || crmProj.name || crmProj.title || "Overseas Project",
        projectName: crmProj.projectName || crmProj.name || crmProj.title || "Overseas Project",
        clientId: crmClientDoc.clientId || crmClientDoc._id.toString(),
        clientName:
          crmClientDoc.companyName || crmClientDoc.name || crmProj.clientName || "",
        destinationCountry:
          crmProj.country || crmProj.destinationCountry || crmClientDoc.country || "",
        country: crmProj.country || crmProj.destinationCountry || crmClientDoc.country || "",
        targetHiring:
          Number(crmProj.targetHiring || crmProj.totalHeadcount || crmProj.manpower || 0) ||
          sumPos ||
          sumReq ||
          0,
        jobPositions,
        manpowerRequirements: manpowerReqs,
        salary: crmProj.salary || "",
        currency: crmProj.currency || "",
        paymentMilestones: Array.isArray(crmProj.paymentMilestones)
          ? crmProj.paymentMilestones
          : Array.isArray(crmProj.recruitmentConfig?.paymentMilestones)
          ? crmProj.recruitmentConfig.paymentMilestones
          : [],
        paymentMilestoneConfig: crmProj.paymentMilestoneConfig || null,
        totalMilestoneAmount: Number(
          crmProj.totalMilestoneAmount ??
            crmProj.totalAgreedAmount ??
            crmProj.paymentMilestoneConfig?.totalFeePerCandidate ??
            crmProj.recruitmentConfig?.totalMilestoneAmount ??
            0
        ),
        totalAgreedAmount: Number(crmProj.totalAgreedAmount ?? crmProj.totalMilestoneAmount ?? 0),
        recruitmentConfig: crmProj.recruitmentConfig || {},
        vendorAssignmentType: crmProj.vendorAssignmentType || "",
        vendorVisibility: crmProj.vendorVisibility || "",
        assignedVendors: normalizeAssignedVendorsList(
          crmProj.assignedVendors,
          crmProj.assignedVendorIds
        ),
        assignedVendorHRs: Array.isArray(crmProj.assignedVendorHRs)
          ? crmProj.assignedVendorHRs
          : [],
        description: crmProj.description || crmProj.notes || crmProj.remark || "",
        status: crmProj.status || "Active",
        createdAt: crmProj.updatedAt || crmProj.createdAt || crmClientDoc.createdAt,
        rawIdCandidates,
      };
    }
  }

  return null;
};

export const fetchAllMergedProjects = async () => {
  const [projectDocs, clientDocs, crmClients] = await Promise.all([
    Project.find({ status: { $ne: "Deleted" } }).lean().catch(() => []),
    Client.find().lean().catch(() => []),
    CrmOverseasClient.find({}).lean().catch(() => []),
  ]);

  const clientMap = new Map(clientDocs.map((c) => [c._id.toString(), c]));
  const merged = [];
  const seenIds = new Set();

  (crmClients || []).forEach((c) => {
    (c.projects || []).forEach((p) => {
      const statusLower = String(p?.status || "Active").toLowerCase();
      if (statusLower === "deleted" || statusLower === "cancelled") return;
      const normId = String(p?.id || p?.projectId || p?._id || "").trim();
      if (!normId || seenIds.has(normId)) return;

      const rawIdCandidates = Array.from(
        new Set(
          [normId, p?.id, p?.projectId, p?._id ? String(p._id) : ""]
            .filter(Boolean)
            .map(String)
        )
      );
      rawIdCandidates.forEach((cid) => seenIds.add(cid));

      const manpowerReqs = Array.isArray(p.manpowerRequirements) ? p.manpowerRequirements : [];
      const jobPositions = Array.isArray(p.jobPositions) ? p.jobPositions : [];
      const sumReq = manpowerReqs.reduce(
        (sum, r) => sum + Number(r.quantity || r.openings || 1),
        0
      );
      const sumPos = jobPositions.reduce(
        (sum, pos) => sum + Number(pos.openings || pos.quantity || 1),
        0
      );

      merged.push({
        source: "CRM",
        id: normId,
        projectId: normId,
        projectRef: null,
        title: p.projectName || p.name || p.title || "Overseas Project",
        projectName: p.projectName || p.name || p.title || "Overseas Project",
        clientId: c.clientId || c._id.toString(),
        clientName: c.companyName || c.name || p.clientName || "",
        destinationCountry: p.country || p.destinationCountry || c.country || "",
        country: p.country || p.destinationCountry || c.country || "",
        targetHiring:
          Number(p.targetHiring || p.totalHeadcount || p.manpower || 0) ||
          sumPos ||
          sumReq ||
          0,
        jobPositions,
        manpowerRequirements: manpowerReqs,
        salary: p.salary || "",
        currency: p.currency || "",
        paymentMilestones: Array.isArray(p.paymentMilestones)
          ? p.paymentMilestones
          : Array.isArray(p.recruitmentConfig?.paymentMilestones)
          ? p.recruitmentConfig.paymentMilestones
          : [],
        paymentMilestoneConfig: p.paymentMilestoneConfig || null,
        totalMilestoneAmount: Number(
          p.totalMilestoneAmount ??
            p.totalAgreedAmount ??
            p.paymentMilestoneConfig?.totalFeePerCandidate ??
            p.recruitmentConfig?.totalMilestoneAmount ??
            0
        ),
        totalAgreedAmount: Number(p.totalAgreedAmount ?? p.totalMilestoneAmount ?? 0),
        recruitmentConfig: p.recruitmentConfig || {},
        vendorAssignmentType: p.vendorAssignmentType || "",
        vendorVisibility: p.vendorVisibility || "",
        assignedVendors: normalizeAssignedVendorsList(p.assignedVendors, p.assignedVendorIds),
        assignedVendorHRs: Array.isArray(p.assignedVendorHRs) ? p.assignedVendorHRs : [],
        description: p.description || p.notes || p.remark || "",
        status: p.status || "Active",
        createdAt: p.updatedAt || p.createdAt || c.createdAt,
        rawIdCandidates,
      });
    });
  });

  (projectDocs || []).forEach((dp) => {
    const normId = String(dp.projectId || dp.id || dp._id?.toString() || "").trim();
    if (!normId || seenIds.has(normId)) return;

    const rawIdCandidates = Array.from(
      new Set(
        [normId, dp._id ? dp._id.toString() : "", dp.id]
          .filter(Boolean)
          .map(String)
      )
    );
    rawIdCandidates.forEach((cid) => seenIds.add(cid));

    const clientObj = dp.clientId ? clientMap.get(dp.clientId.toString()) : null;
    const jobPositions = Array.isArray(dp.jobPositions) ? dp.jobPositions : [];
    const manpowerReqs = Array.isArray(dp.manpowerRequirements) ? dp.manpowerRequirements : [];
    const sumPos = jobPositions.reduce(
      (sum, pos) => sum + Number(pos.openings || pos.quantity || 1),
      0
    );
    const sumReq = manpowerReqs.reduce(
      (sum, r) => sum + Number(r.quantity || r.openings || 1),
      0
    );

    merged.push({
      source: "PROJECT",
      id: dp._id.toString(),
      projectId: normId,
      projectRef: dp._id,
      title: dp.title || dp.projectName || "Overseas Project",
      projectName: dp.title || dp.projectName || "Overseas Project",
      clientId: dp.clientId ? dp.clientId.toString() : "",
      clientName:
        dp.clientName || clientObj?.name || clientObj?.companyName || clientObj?.company || "",
      destinationCountry: dp.destinationCountry || dp.country || clientObj?.country || "",
      country: dp.destinationCountry || dp.country || clientObj?.country || "",
      targetHiring:
        Number(
          dp.totalHiringTarget > 0
            ? dp.totalHiringTarget
            : dp.targetHiring || dp.totalHeadcount || dp.manpower || 0
        ) ||
        sumPos ||
        sumReq ||
        0,
      jobPositions,
      manpowerRequirements: manpowerReqs,
      salary: dp.salary || "",
      currency: dp.currency || "",
      paymentMilestones: Array.isArray(dp.paymentMilestones)
        ? dp.paymentMilestones
        : Array.isArray(dp.recruitmentConfig?.paymentMilestones)
        ? dp.recruitmentConfig.paymentMilestones
        : [],
      paymentMilestoneConfig: dp.paymentMilestoneConfig || null,
      totalMilestoneAmount: Number(
        dp.totalMilestoneAmount ??
          dp.totalAgreedAmount ??
          dp.paymentMilestoneConfig?.totalFeePerCandidate ??
          dp.recruitmentConfig?.totalMilestoneAmount ??
          0
      ),
      totalAgreedAmount: Number(dp.totalAgreedAmount ?? dp.totalMilestoneAmount ?? 0),
      recruitmentConfig: dp.recruitmentConfig || {},
      vendorAssignmentType: dp.vendorAssignmentType || "",
      vendorVisibility: dp.vendorVisibility || "",
      assignedVendors: normalizeAssignedVendorsList(dp.assignedVendors, dp.assignedVendorIds),
      assignedVendorHRs: Array.isArray(dp.assignedVendorHRs) ? dp.assignedVendorHRs : [],
      description: dp.description || dp.remark || dp.notes || "",
      status: dp.status || "Active",
      createdAt: dp.createdAt,
      rawIdCandidates,
    });
  });

  return merged;
};

export const normalizeMilestoneStages = (milestones = []) => {
  if (!Array.isArray(milestones)) return [];
  const normalized = milestones.map((m, mIdx) => {
    const amt = Number(m?.paymentAmount ?? m?.amount ?? 0);
    const stages = (Array.isArray(m?.stages) ? m.stages : []).map((s, sIdx) => ({
      ...s,
      id: String(s?.id || `s${mIdx}_${sIdx + 1}`),
      name: s?.name || `Stage ${sIdx + 1}`,
      status: s?.status || "Pending",
      completedAt: s?.completedAt || null,
      remark: s?.remark || "",
      document: s?.document || null,
    }));

    return {
      ...m,
      id: String(m?.id || `m${mIdx}`),
      name: m?.name || `Milestone ${mIdx + 1}`,
      amount: amt,
      paymentAmount: amt,
      paymentStatus:
        m?.paymentStatus === "Approved"
          ? "Approved"
          : m?.paymentStatus === "Pending Verification" || m?.paymentStatus === "Rejected"
          ? m.paymentStatus
          : amt === 0
          ? "Not Required"
          : m?.paymentStatus || (mIdx === 0 ? "Payment Required" : "Locked"),
      status: m?.status || (mIdx === 0 ? (amt > 0 ? "Payment Required" : "Active") : "Locked"),
      stages,
    };
  });

  for (let i = 0; i < normalized.length; i++) {
    const cur = normalized[i];
    const amt = Number(cur.paymentAmount ?? cur.amount ?? 0);
    const prevDone =
      i === 0 ||
      (normalized[i - 1].stages.length > 0
        ? normalized[i - 1].stages.every((s) => s.status === "Completed")
        : normalized[i - 1].status === "Completed");

    if (prevDone && cur.status === "Locked") {
      cur.status = amt === 0 || cur.paymentStatus === "Approved" ? "Active" : "Payment Required";
      if (amt > 0 && cur.paymentStatus === "Locked") {
        cur.paymentStatus = "Payment Required";
      } else if (amt === 0) {
        cur.paymentStatus = "Not Required";
      }
    }

    const canWorkStages =
      cur.status !== "Locked" &&
      (amt === 0 ||
        cur.paymentStatus === "Approved" ||
        cur.status === "Paid" ||
        cur.status === "Completed");

    if (canWorkStages && cur.stages.length > 0) {
      cur.stages.forEach((s) => {
        if (s.status === "Locked") {
          s.status = "Pending";
        }
      });
      const hasCompletedAll = cur.stages.every((s) => s.status === "Completed");
      if (hasCompletedAll) {
        cur.status = "Completed";
      } else {
        const hasInProgress = cur.stages.some((s) => s.status === "In Progress");
        if (!hasInProgress) {
          const firstPending = cur.stages.find((s) => s.status !== "Completed");
          if (firstPending) firstPending.status = "In Progress";
        }
        if (cur.status === "Completed" || cur.status === "Payment Required") {
          cur.status = "Active";
        }
      }
    } else if (cur.stages.length > 0 && cur.status === "Locked") {
      cur.stages.forEach((s) => {
        if (s.status !== "Completed") {
          s.status = "Locked";
        }
      });
    }
  }

  return normalized;
};

export const resolveProjectMilestonesData = (
  projectObj,
  existingMilestones = [],
  milestonesOverridden = false
) => {
  if (milestonesOverridden && Array.isArray(existingMilestones) && existingMilestones.length > 0) {
    const normalized = normalizeMilestoneStages(existingMilestones);
    const totalAmount = normalized.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    return { processMilestones: normalized, totalAmount };
  }

  let rawList = [];
  if (Array.isArray(projectObj?.paymentMilestones) && projectObj.paymentMilestones.length > 0) {
    rawList = projectObj.paymentMilestones;
  } else if (
    Array.isArray(projectObj?.paymentMilestoneConfig?.milestones) &&
    projectObj.paymentMilestoneConfig.milestones.length > 0
  ) {
    rawList = projectObj.paymentMilestoneConfig.milestones;
  } else if (
    Array.isArray(projectObj?.recruitmentConfig?.paymentMilestones) &&
    projectObj.recruitmentConfig.paymentMilestones.length > 0
  ) {
    rawList = projectObj.recruitmentConfig.paymentMilestones;
  }

  const projTotal = Number(
    projectObj?.totalMilestoneAmount ??
      projectObj?.totalAgreedAmount ??
      projectObj?.paymentMilestoneConfig?.totalFeePerCandidate ??
      projectObj?.recruitmentConfig?.totalMilestoneAmount ??
      0
  );

  if (rawList.length === 0 && projTotal > 0) {
    rawList = [
      {
        id: "m0",
        name: "Milestone 1: Processing & Deployment",
        amount: projTotal,
        paymentAmount: projTotal,
        stages: [{ id: "s0_1", name: "Selection & Processing" }],
      },
    ];
  }

  if (rawList.length === 0) {
    if (Array.isArray(existingMilestones) && existingMilestones.length > 0) {
      const normalized = normalizeMilestoneStages(existingMilestones);
      const totalAmount = normalized.reduce(
        (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
        0
      );
      return { processMilestones: normalized, totalAmount };
    }
    return { processMilestones: [], totalAmount: 0 };
  }

  const rawSum = rawList.reduce((sum, m) => sum + Number(m?.paymentAmount ?? m?.amount ?? 0), 0);
  const existingArr = Array.isArray(existingMilestones) ? existingMilestones : [];

  const merged = rawList.map((pm, mIdx) => {
    let pmAmt = Number(pm?.paymentAmount ?? pm?.amount ?? 0);
    if (rawSum <= 0 && projTotal > 0) {
      const base = Math.floor(projTotal / rawList.length);
      const remainder = projTotal - base * rawList.length;
      pmAmt = mIdx === rawList.length - 1 ? base + remainder : base;
    }

    const pmId = String(pm?.id || `m${mIdx}`);
    const pmNameLower = String(pm?.name || "").trim().toLowerCase();
    const existingM =
      existingArr.find((em) => String(em?.id || "") === pmId) ||
      (pmNameLower
        ? existingArr.find((em) => String(em?.name || "").trim().toLowerCase() === pmNameLower)
        : null) ||
      existingArr[mIdx] ||
      null;

    const isExistingPaid =
      existingM &&
      (existingM.paymentStatus === "Approved" ||
        existingM.status === "Paid" ||
        existingM.status === "Completed");

    const finalAmt = pmAmt;

    const rawStages =
      Array.isArray(pm?.stages) && pm.stages.length > 0
        ? pm.stages
        : Array.isArray(existingM?.stages) && existingM.stages.length > 0
        ? existingM.stages
        : [{ id: `s${mIdx}_1`, name: `${pm?.name || `Milestone ${mIdx + 1}`} Verification` }];

    const existingStages = Array.isArray(existingM?.stages) ? existingM.stages : [];
    const mergedStages = rawStages.map((stg, sIdx) => {
      const stgId = String(stg?.id || `s${mIdx}_${sIdx + 1}`);
      const stgNameLower = String(stg?.name || "").trim().toLowerCase();
      const matchedStage =
        existingStages.find((es) => String(es?.id || "") === stgId) ||
        (stgNameLower
          ? existingStages.find((es) => String(es?.name || "").trim().toLowerCase() === stgNameLower)
          : null) ||
        existingStages[sIdx] ||
        null;

      return {
        id: stgId,
        name: stg?.name || matchedStage?.name || `Stage ${sIdx + 1}`,
        status: matchedStage?.status || (mIdx === 0 && finalAmt === 0 && sIdx === 0 ? "In Progress" : "Pending"),
        completedAt: matchedStage?.completedAt || null,
        remark: matchedStage?.remark || "",
        document: matchedStage?.document || null,
      };
    });

    return {
      ...(existingM || {}),
      id: pmId,
      name: pm?.name || `Milestone ${mIdx + 1}`,
      description: pm?.description || existingM?.description || "",
      amount: finalAmt,
      paymentAmount: finalAmt,
      paymentStatus: isExistingPaid
        ? "Approved"
        : existingM?.paymentStatus === "Pending Verification" || existingM?.paymentStatus === "Rejected"
        ? existingM.paymentStatus
        : finalAmt === 0
        ? "Not Required"
        : mIdx === 0
        ? "Payment Required"
        : existingM?.status && existingM.status !== "Locked"
        ? "Payment Required"
        : "Locked",
      status: isExistingPaid
        ? existingM.status
        : mIdx === 0
        ? finalAmt > 0
          ? existingM?.paymentStatus === "Pending Verification"
            ? "Active"
            : "Payment Required"
          : "Active"
        : existingM?.status || "Locked",
      paymentDate: existingM?.paymentDate || null,
      paymentRef: existingM?.paymentRef || null,
      paymentMode: existingM?.paymentMode || null,
      paymentRemark: existingM?.paymentRemark || "",
      approvedBy: existingM?.approvedBy || null,
      paidBy: existingM?.paidBy || null,
      receiptNumber: existingM?.receiptNumber || null,
      clearanceDocuments: Array.isArray(existingM?.clearanceDocuments) ? existingM.clearanceDocuments : [],
      stages: mergedStages,
    };
  });

  const normalized = normalizeMilestoneStages(merged);
  const totalAmount = normalized.reduce(
    (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
    0
  );
  return { processMilestones: normalized, totalAmount };
};

export default {
  findProjectAcrossSources,
  fetchAllMergedProjects,
  normalizeAssignedVendorsList,
  normalizeMilestoneStages,
  resolveProjectMilestonesData,
};

