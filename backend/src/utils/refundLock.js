import CrmRefund from "../models/CrmRefund.js";

export const ACTIVE_REFUND_LOCK_STATUSES = new Set([
  "Pending Admin Approval",
  "Refund Pending",
  "Partially Refunded",
  "Fully Refunded",
]);

export const REASSIGN_ELIGIBLE_REFUND_STATUSES = new Set([
  "Refund Pending",
  "Partially Refunded",
  "Fully Refunded",
  "No Refund",
]);

export const isRecordRefundLocked = (record) => {
  if (!record) return false;
  const refundStatus = String(
    record.refundStatus || record.refundDetails?.status || ""
  ).trim();
  if (!refundStatus || refundStatus === "Rejected") return false;
  if (ACTIVE_REFUND_LOCK_STATUSES.has(refundStatus)) return true;
  if (refundStatus === "No Refund" && String(record.status || "").trim() === "Did Not Join") {
    return true;
  }
  return false;
};

export const isRefundReassignEligible = (record) => {
  if (!record || record.reassigned) return false;
  const refundStatus = String(
    record.refundStatus || record.refundDetails?.status || ""
  ).trim();
  return REASSIGN_ELIGIBLE_REFUND_STATUSES.has(refundStatus);
};

export const getActiveRefundForApplication = async ({
  applicationId,
  candidateId,
  projectId,
  projectName,
} = {}) => {
  const orConds = [];
  if (applicationId) {
    orConds.push({ applicationId: String(applicationId).trim() });
  }
  if (candidateId) {
    const candCond = { candidateId: String(candidateId).trim() };
    if (projectId) candCond.projectId = String(projectId).trim();
    else if (projectName) candCond.projectName = String(projectName).trim();
    orConds.push(candCond);
  }
  if (orConds.length === 0) return null;

  const candidates = await CrmRefund.find({
    $or: orConds,
    reassigned: { $ne: true },
    refundStatus: { $ne: "Rejected" },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!candidates || candidates.length === 0) return null;

  const targetProjId = String(projectId || "").trim();
  const targetProjName = String(projectName || "").trim().toLowerCase();

  return (
    candidates.find((r) => {
      if (r.reassigned) return false;
      const rProjId = String(r.projectId || "").trim();
      const rProjName = String(r.projectName || "").trim().toLowerCase();
      if (rProjId && targetProjId && rProjId !== targetProjId) return false;
      if (!rProjId && rProjName && targetProjName && rProjName !== targetProjName) {
        return false;
      }
      return true;
    }) || null
  );
};

export const checkApplicationRefundLock = async (app) => {
  if (!app) return { locked: false, refundStatus: "", refund: null };
  const directStatus = String(
    app.refundStatus || app.refundDetails?.status || ""
  ).trim();
  const activeRefund = await getActiveRefundForApplication({
    applicationId: app.applicationId || app.id || app._id?.toString(),
    candidateId: app.candidateId,
    projectId: app.projectId,
    projectName: app.projectName,
  });

  if (directStatus === "Rejected" && !activeRefund) {
    return { locked: false, refundStatus: "Rejected", refund: null };
  }

  if (isRecordRefundLocked(app)) {
    return {
      locked: true,
      refundStatus: directStatus,
      refund: activeRefund,
    };
  }

  if (activeRefund) {
    const rStatus = String(activeRefund.refundStatus || "").trim();
    if (
      ACTIVE_REFUND_LOCK_STATUSES.has(rStatus) ||
      (rStatus === "No Refund" && !activeRefund.reassigned)
    ) {
      return {
        locked: true,
        refundStatus: rStatus,
        refund: activeRefund,
      };
    }
  }

  return { locked: false, refundStatus: directStatus, refund: activeRefund };
};

export const markApplicationRefundsReassigned = async ({
  applicationId,
  candidateId,
  oldProjectId,
  oldProjectName,
  targetProjectId,
  targetProjectName,
  targetPosition,
}) => {
  const orConds = [];
  if (applicationId) {
    orConds.push({ applicationId: String(applicationId).trim() });
  }
  if (candidateId) {
    const candFilter = { candidateId: String(candidateId).trim() };
    if (oldProjectId) candFilter.projectId = String(oldProjectId).trim();
    else if (oldProjectName) candFilter.projectName = String(oldProjectName).trim();
    orConds.push(candFilter);
  }
  if (orConds.length === 0) return;

  await CrmRefund.updateMany(
    {
      $or: orConds,
      reassigned: { $ne: true },
      refundStatus: {
        $in: ["Refund Pending", "Partially Refunded", "Fully Refunded", "No Refund"],
      },
    },
    {
      $set: {
        reassigned: true,
        reassignedProjectId: String(targetProjectId || ""),
        reassignedProjectName: String(targetProjectName || ""),
        reassignedPosition: String(targetPosition || ""),
        reassignedAt: new Date(),
      },
    }
  );
};

