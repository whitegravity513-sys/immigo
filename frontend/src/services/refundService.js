
const REFUNDS_STORAGE_KEY = "immigo_crm_refunds_v3";
const APPLICATIONS_STORAGE_KEY = "immigo_crm_applications_v3";

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

const loadData = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("immigo:refund-update", { detail: data }));
      window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: data }));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {
    console.error("Storage save failed:", e);
  }
};

const INITIAL_REFUNDS = [];

export const refundService = {
  
  getAllRefunds: async () => {
    await delay(50);
    const refunds = loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, []);
    const candidates = loadData("immigo_crm_candidates_v3", []);
    const vendors = loadData("immigo_crm_vendors_v3", []);

    let needsSync = false;

    const enriched = refunds.map((r) => {
      const app = apps.find(
        (a) =>
          String(a.id) === String(r.applicationId) ||
          String(a.candidateId) === String(r.candidateId) ||
          (a.candidateName && r.candidateName && a.candidateName.trim().toLowerCase() === r.candidateName.trim().toLowerCase())
      );

      const cand = candidates.find(
        (c) =>
          String(c.id) === String(r.candidateId || app?.candidateId) ||
          (c.fullName && r.candidateName && c.fullName.trim().toLowerCase() === r.candidateName.trim().toLowerCase()) ||
          (c.name && r.candidateName && c.name.trim().toLowerCase() === r.candidateName.trim().toLowerCase())
      );

      let vendorName = r.vendorName;
      if (!vendorName || vendorName === "Vendor" || vendorName === "Vendor Partner" || vendorName.trim() === "") {
        vendorName =
          cand?.vendorName ||
          app?.vendorName ||
          vendors.find((v) => String(v.id) === String(r.vendorId || app?.vendorId || cand?.vendorId))?.companyName ||
          vendors.find((v) => String(v.id) === String(r.vendorId || app?.vendorId || cand?.vendorId))?.name ||
          "Skyline HR Solutions";
      }

      let calculatedTotalPaid = Number(r.totalPaid || 0);

      
      if (app) {
        const milestones = app.processMilestones || app.paymentPlan?.milestones || [];
        const paidSum = milestones.reduce((sum, m) => {
          if (
            m.paymentStatus === "Approved" ||
            m.paymentStatus === "Paid" ||
            m.status === "Paid" ||
            m.status === "Completed"
          ) {
            return sum + (Number(m.paymentAmount || m.amount) || 0);
          }
          return sum;
        }, 0);

        if (paidSum > 0) {
          calculatedTotalPaid = paidSum;
        } else if (Number(app.totalPaid || app.paidAmount) > 0) {
          calculatedTotalPaid = Number(app.totalPaid || app.paidAmount);
        }
      }

      
      if (calculatedTotalPaid === 0 && cand && Array.isArray(cand.applications)) {
        let candPaidSum = 0;
        cand.applications.forEach((ca) => {
          const cMilestones = ca.processMilestones || ca.paymentPlan?.milestones || [];
          cMilestones.forEach((cm) => {
            if (
              cm.paymentStatus === "Approved" ||
              cm.paymentStatus === "Paid" ||
              cm.status === "Paid" ||
              cm.status === "Completed"
            ) {
              candPaidSum += Number(cm.paymentAmount || cm.amount) || 0;
            }
          });
        });
        if (candPaidSum > 0) {
          calculatedTotalPaid = candPaidSum;
        }
      }

      
      if (calculatedTotalPaid === 0 && Number(r.totalPaid) > 0) {
        calculatedTotalPaid = Number(r.totalPaid);
      }

      
      let refundAmount = Number(r.refundAmount || 0);
      if (refundAmount === 0 && calculatedTotalPaid > 0 && r.refundStatus !== "Rejected" && r.refundStatus !== "No Refund") {
        refundAmount = calculatedTotalPaid;
      }

      const updated = {
        ...r,
        vendorName,
        totalPaid: calculatedTotalPaid,
        refundAmount,
      };

      if (
        r.vendorName !== updated.vendorName ||
        r.totalPaid !== updated.totalPaid ||
        r.refundAmount !== updated.refundAmount
      ) {
        needsSync = true;
      }

      return updated;
    });

    if (needsSync) {
      saveData(REFUNDS_STORAGE_KEY, enriched);
    }

    return enriched;
  },

  
  markCandidateDidNotJoin: async ({
    applicationId,
    reason,
    refundAmount,
    refundDate,
    remarks,
    processedBy = "Admin",
  }) => {
    await delay(100);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, []);
    const appIdx = apps.findIndex((a) => a.id === applicationId);

    if (appIdx !== -1) {
      apps[appIdx].status = "Did Not Join";
      apps[appIdx].didNotJoinReason = reason;
      apps[appIdx].refundDetails = {
        amount: Number(refundAmount) || 0,
        date: refundDate || new Date().toISOString().split("T")[0],
        status: Number(refundAmount) > 0 ? "Refund Pending" : "No Refund",
        remarks,
      };
      saveData(APPLICATIONS_STORAGE_KEY, apps);
    }

    const refunds = loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
    const newRefund = {
      id: `RFD-${Date.now().toString().slice(-6)}`,
      applicationId,
      candidateId: appIdx !== -1 ? apps[appIdx].candidateId : "CND-UNKNOWN",
      candidateName: appIdx !== -1 ? apps[appIdx].candidateName : "Candidate",
      vendorId: appIdx !== -1 ? apps[appIdx].vendorId : "VND-1001",
      vendorName: appIdx !== -1 ? apps[appIdx].vendorName : "Vendor Partner",
      projectName: appIdx !== -1 ? apps[appIdx].projectName : "Project Requirement",
      totalPaid: Number(refundAmount) || 0,
      refundAmount: Number(refundAmount) || 0,
      refundReason: reason,
      refundStatus: Number(refundAmount) > 0 ? "Refund Pending" : "No Refund",
      refundDate: refundDate || new Date().toISOString().split("T")[0],
      processedBy,
      remarks,
    };

    refunds.unshift(newRefund);
    saveData(REFUNDS_STORAGE_KEY, refunds);

    return newRefund;
  },

  
  requestRefund: async ({
    applicationId,
    candidateId,
    candidateName,
    vendorId,
    vendorName,
    projectName,
    reason,
    documentPath = "",
  }) => {
    await delay(100);
    const refunds = loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, []);

    
    if (refunds.some(r => r.applicationId === applicationId)) {
      throw new Error("Refund request already exists for this application.");
    }

    
    const appIdx = apps.findIndex(
      (a) =>
        String(a.id) === String(applicationId) ||
        String(a.candidateId) === String(candidateId) ||
        (a.candidateName && candidateName && a.candidateName.toLowerCase() === candidateName.toLowerCase())
    );
    const app = appIdx !== -1 ? apps[appIdx] : null;

    let calculatedTotalPaid = 0;
    if (app) {
      const milestones = app.processMilestones || app.paymentPlan?.milestones || [];
      calculatedTotalPaid = milestones.reduce((sum, m) => {
        if (m.paymentStatus === "Approved" || m.paymentStatus === "Paid" || m.status === "Paid" || m.status === "Completed") {
          return sum + (Number(m.paymentAmount || m.amount) || 0);
        }
        return sum;
      }, 0);
      if (calculatedTotalPaid === 0 && Number(app.paidAmount || app.totalPaid) > 0) {
        calculatedTotalPaid = Number(app.paidAmount || app.totalPaid);
      }
    }

    const newRefund = {
      id: `RFD-${Date.now().toString().slice(-6)}`,
      applicationId: app?.id || applicationId,
      candidateId: app?.candidateId || candidateId,
      candidateName: candidateName || app?.candidateName || "Candidate",
      vendorId: vendorId || app?.vendorId || "VND-1001",
      vendorName: vendorName || app?.vendorName || "Vendor Partner",
      projectName: projectName || app?.projectName || "Overseas Project",
      totalPaid: calculatedTotalPaid,
      refundAmount: calculatedTotalPaid,
      refundReason: reason,
      refundDocument: documentPath,
      refundStatus: "Pending Admin Approval",
      refundDate: new Date().toISOString().split("T")[0],
      requestedBy: "Vendor",
    };

    const existingIdx = refunds.findIndex(
      (r) =>
        String(r.applicationId) === String(newRefund.applicationId) ||
        String(r.candidateId) === String(newRefund.candidateId)
    );
    if (existingIdx !== -1) {
      refunds[existingIdx] = { ...refunds[existingIdx], ...newRefund };
    } else {
      refunds.unshift(newRefund);
    }
    saveData(REFUNDS_STORAGE_KEY, refunds);

    if (appIdx !== -1) {
      apps[appIdx].refundStatus = "Pending Admin Approval";
      apps[appIdx].refundDetails = {
        amount: calculatedTotalPaid,
        status: "Pending Admin Approval",
        reason: reason,
        date: new Date().toISOString().split("T")[0],
      };
      try {
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("immigo:application-update", { detail: apps }));
          window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: apps }));
        }
      } catch {}
    }

    try {
      const adminNotifs = loadData("immigo_crm_admin_notifications_v3", []);
      adminNotifs.unshift({
        id: `ntf_${Date.now()}`,
        title: "New Refund Request 💰",
        message: `${newRefund.vendorName} submitted refund request for candidate ${newRefund.candidateName} (₹${Number(calculatedTotalPaid).toLocaleString()}). Reason: ${reason}`,
        type: "warning",
        link: "/admin/vendor/refunds",
        read: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("immigo_crm_admin_notifications_v3", JSON.stringify(adminNotifs));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("immigo:notification-update", { detail: adminNotifs }));
      }
    } catch {}

    return newRefund;
  },

  
  updateRefundStatus: async (refundId, status, paymentRef = "", refundAmount = null, totalPaid = null) => {
    await delay(80);
    const refunds = loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
    const idx = refunds.findIndex((r) => r.id === refundId);
    if (idx === -1) throw new Error("Refund record not found");

    refunds[idx].refundStatus = status;
    if (paymentRef) refunds[idx].paymentRef = paymentRef;
    if (refundAmount !== null && refundAmount !== undefined && !isNaN(refundAmount)) {
      refunds[idx].refundAmount = Number(refundAmount);
    }
    if (totalPaid !== null && totalPaid !== undefined && !isNaN(totalPaid) && Number(totalPaid) >= 0) {
      refunds[idx].totalPaid = Number(totalPaid);
    }
    refunds[idx].refundDate = new Date().toISOString().split("T")[0];
    refunds[idx].updatedAt = new Date().toISOString();

    saveData(REFUNDS_STORAGE_KEY, refunds);
    return refunds[idx];
  },

  
  updateRefund: async (refundId, updates) => {
    await delay(80);
    const refunds = loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
    const idx = refunds.findIndex((r) => r.id === refundId);
    if (idx === -1) throw new Error("Refund record not found");

    refunds[idx] = { ...refunds[idx], ...updates, updatedAt: new Date().toISOString() };
    saveData(REFUNDS_STORAGE_KEY, refunds);
    return refunds[idx];
  },
};

export default refundService;
