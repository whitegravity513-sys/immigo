// Dedicated Refund Management Service Layer
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
  } catch (e) {
    console.error("Storage save failed:", e);
  }
};

const INITIAL_REFUNDS = [
  {
    id: "RFD-9001",
    applicationId: "APP-8001",
    candidateId: "CND-501",
    candidateName: "Rahul Kumar",
    vendorId: "VND-1001",
    vendorName: "ABC Manpower Consultants",
    projectId: "PRJ-101",
    projectName: "Dubai South Luxury Tower Phase 2",
    totalPaid: 40000,
    refundAmount: 30000,
    refundReason: "Candidate refused travel due to personal reasons",
    refundStatus: "Fully Refunded",
    refundDate: "2026-09-28",
    processedBy: "Admin",
    remarks: "₹30,000 refunded to vendor account via RTGS-991203",
  },
];

export const refundService = {
  // Get all refunds
  getAllRefunds: async () => {
    await delay(50);
    return loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
  },

  // Mark Candidate as "Did Not Join" and initiate refund request
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
      projectName: appIdx !== -1 ? apps[appIdx].projectName : "Project Requirement",
      totalPaid: appIdx !== -1 ? Number(apps[appIdx].paymentPlan?.totalAmount || 40000) : 40000,
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

  // Vendor requests refund
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
    
    // Check if refund already exists
    if (refunds.some(r => r.applicationId === applicationId)) {
      throw new Error("Refund request already exists for this application.");
    }

    const newRefund = {
      id: `RFD-${Date.now().toString().slice(-6)}`,
      applicationId,
      candidateId,
      candidateName,
      vendorId,
      vendorName,
      projectName,
      refundReason: reason,
      refundDocument: documentPath,
      refundStatus: "Pending Admin Approval",
      refundDate: new Date().toISOString().split("T")[0],
      requestedBy: "Vendor",
    };

    refunds.unshift(newRefund);
    saveData(REFUNDS_STORAGE_KEY, refunds);
    return newRefund;
  },

  // Process/Complete refund status
  updateRefundStatus: async (refundId, status, paymentRef = "") => {
    await delay(80);
    const refunds = loadData(REFUNDS_STORAGE_KEY, INITIAL_REFUNDS);
    const idx = refunds.findIndex((r) => r.id === refundId);
    if (idx === -1) throw new Error("Refund record not found");

    refunds[idx].refundStatus = status;
    if (paymentRef) refunds[idx].paymentRef = paymentRef;
    refunds[idx].updatedAt = new Date().toISOString();

    saveData(REFUNDS_STORAGE_KEY, refunds);
    return refunds[idx];
  },

  // Generic update for editing after completion
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
