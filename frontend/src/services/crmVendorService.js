// crmVendorService.js
// Dedicated storage and service layer for Vendor Portal and Admin Vendor Management
import crmClientService from "./crmClientService.js";
import { apiClient } from "./apiClient.js";
import { initialClients } from "../data/mockClients.js";

const VENDORS_STORAGE_KEY = "immigo_crm_vendors_v3";
const CANDIDATES_STORAGE_KEY = "immigo_crm_candidates_v3";
const APPLICATIONS_STORAGE_KEY = "immigo_crm_applications_v3";
const MILESTONE_TEMPLATES_KEY = "immigo_crm_milestone_templates_v3";
const VENDOR_NOTIFICATIONS_KEY = "immigo_crm_vendor_notifications_v3";
const ADMIN_NOTIFICATIONS_KEY = "immigo_crm_admin_notifications_v3";

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

// INITIAL SEED DATA
const INITIAL_VENDORS = [];

const INITIAL_CANDIDATES = [];

// CANDIDATE APPLICATIONS / SUBMISSIONS (PER-PROJECT INDEPENDENT STATUS)
const INITIAL_APPLICATIONS = [];

const INITIAL_ADMIN_NOTIFICATIONS = [];
const INITIAL_NOTIFICATIONS = [];

// Automatic cleanup to clear any old mock candidates or test data
if (typeof window !== "undefined") {
  try {
    const cleanKey = "immigo_cleaned_candidates_v5";
    if (!localStorage.getItem(cleanKey)) {
      localStorage.removeItem("immigo_crm_candidates_v3");
      localStorage.removeItem("immigo_crm_applications_v3");
      localStorage.removeItem("immigo_crm_refunds_v3");
      localStorage.setItem("immigo_crm_candidates_v3", JSON.stringify([]));
      localStorage.setItem("immigo_crm_applications_v3", JSON.stringify([]));
      localStorage.setItem("immigo_crm_refunds_v3", JSON.stringify([]));
      localStorage.setItem(cleanKey, "true");
    }
  } catch {}
}

// Helper to load/save
const loadData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return fallback;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
};

export const crmVendorService = {
  apiClient,

  // ----------------------------------------------------
  // VENDOR AUTH & PROFILE SYNC
  // ----------------------------------------------------
  getVendorMe: async () => {
    try {
      const response = await apiClient.get("/auth/vendor/me");
      if (response.data?.vendor) {
        const vendor = {
          ...response.data.vendor,
          id: response.data.vendor.vendorId || response.data.vendor._id,
        };
        try {
          const stored = localStorage.getItem("user");
          const u = stored ? JSON.parse(stored) : {};
          localStorage.setItem("user", JSON.stringify({ ...u, ...vendor }));
          localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...vendor }));
        } catch {}

        const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
        const idx = vendors.findIndex(
          (v) =>
            (v.id && vendor.id && v.id === vendor.id) ||
            (v.email && vendor.email && v.email.toLowerCase() === vendor.email.toLowerCase())
        );
        if (idx !== -1) {
          vendors[idx] = { ...vendors[idx], ...vendor };
        } else {
          vendors.unshift(vendor);
        }
        saveData(VENDORS_STORAGE_KEY, vendors);

        return vendor;
      }
    } catch {}
    return crmVendorService.getCurrentVendor();
  },

  registerVendor: async (vendorData) => {
    try {
      const response = await apiClient.post("/auth/vendor/register", vendorData);
      
      const newVendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId, // map vendorId to id for frontend usage
      };
      
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      vendors.unshift(newVendor);
      saveData(VENDORS_STORAGE_KEY, vendors);
      
      return newVendor;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to register vendor");
    }
  },

  loginVendor: async (emailOrId, password) => {
    try {
      const response = await apiClient.post("/auth/vendor/login", { emailOrId, password });
      
      const vendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId, // map vendorId to id for frontend usage
      };

      // Also update local storage so other functions can work normally if they rely on it
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const existingIdx = vendors.findIndex(v => v.email === vendor.email);
      if (existingIdx !== -1) {
        vendors[existingIdx] = vendor;
      } else {
        vendors.unshift(vendor);
      }
      saveData(VENDORS_STORAGE_KEY, vendors);

      return {
        token: response.data.token,
        vendor: vendor,
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Invalid Vendor ID/Email or Password.");
    }
  },

  uploadVendorDocuments: async (documents, bankDetails) => {
    try {
      const response = await apiClient.post("/auth/vendor/upload-documents", { documents, bankDetails });
      const updatedVendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId,
      };

      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === updatedVendor.id || v.email === updatedVendor.email);
      if (idx !== -1) vendors[idx] = updatedVendor;
      else vendors.unshift(updatedVendor);
      saveData(VENDORS_STORAGE_KEY, vendors);

      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...u, ...updatedVendor }));
          localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...updatedVendor }));
        }
      } catch {}

      // Add Notification for Admin
      crmVendorService.addAdminNotification({
        title: "Vendor Documents Submitted",
        message: `${updatedVendor.companyName || "Vendor"} (${updatedVendor.vendorId || updatedVendor.id}) submitted statutory documents for Admin verification.`,
        type: "warning",
        vendorId: updatedVendor.id,
        link: "/admin/vendor/vendors?tab=pending",
      });

      return updatedVendor;
    } catch (err) {
      // Local fallback
      const cur = crmVendorService.getCurrentVendor();
      if (!cur) throw new Error(err.response?.data?.message || err.message);
      const updated = {
        ...cur,
        documents: documents || cur.documents || [],
        bankDetails: bankDetails || cur.bankDetails || {},
        documentsUploaded: true,
        status: "Under Review",
        onboardingStage: "DOCS_SUBMITTED",
      };
      await crmVendorService.updateVendorProfile(cur.id, updated);
      crmVendorService.addAdminNotification({
        title: "Vendor Documents Submitted",
        message: `${cur.companyName || "Vendor"} submitted statutory documents for review.`,
        type: "warning",
        vendorId: cur.id,
        link: "/admin/vendor/vendors?tab=pending",
      });
      return updated;
    }
  },

  signVendorMou: async ({ signatoryName, designation, signatureData, signedFileUrl } = {}) => {
    try {
      const response = await apiClient.post("/auth/vendor/sign-mou", {
        signatoryName,
        designation,
        signatureData,
        signedFileUrl,
      });
      const updatedVendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId,
      };

      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === updatedVendor.id || v.email === updatedVendor.email);
      if (idx !== -1) vendors[idx] = updatedVendor;
      else vendors.unshift(updatedVendor);
      saveData(VENDORS_STORAGE_KEY, vendors);

      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...u, ...updatedVendor }));
          localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...updatedVendor }));
        }
      } catch {}

      // Add notification for Admin
      crmVendorService.addAdminNotification({
        title: "MOU Signed by Vendor",
        message: `${updatedVendor.companyName || "Vendor"} (${updatedVendor.vendorId}) digitally signed and executed their MOU agreement!`,
        type: "success",
        vendorId: updatedVendor.id,
        link: "/admin/vendor/vendors",
      });

      return updatedVendor;
    } catch (err) {
      // Local fallback
      const cur = crmVendorService.getCurrentVendor();
      if (!cur) throw new Error(err.response?.data?.message || err.message);
      const updated = {
        ...cur,
        mouSigned: true,
        mouStatus: "Signed",
        status: "Pending MOU Approval",
        onboardingStage: "MOU_SIGNED",
        signedMou: {
          signatoryName,
          designation,
          signatureData,
          signedFileUrl,
          signedAt: new Date().toISOString(),
        },
      };
      await crmVendorService.updateVendorProfile(cur.id, updated);
      crmVendorService.addAdminNotification({
        title: "MOU Signed by Vendor",
        message: `${cur.companyName || "Vendor"} digitally signed and executed the MOU agreement.`,
        type: "success",
        vendorId: cur.id,
        link: "/admin/vendor/vendors",
      });
      return updated;
    }
  },

  getCurrentVendor: () => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("immigo_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed?.role === "vendor" || parsed?.companyName) {
        // Also ensure we read latest updated state from storage
        const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
        const fresh = vendors.find(
          (v) =>
            (v.id && parsed.id && v.id === parsed.id) ||
            (v.email && parsed.email && v.email.toLowerCase() === parsed.email.toLowerCase())
        );
        return fresh || parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  updateVendorProfile: async (vendorId, profileData) => {
    let updatedVendor = null;
    try {
      const response = await apiClient.put("/auth/vendor/profile", profileData);
      if (response.data?.vendor) {
        updatedVendor = {
          ...response.data.vendor,
          id: response.data.vendor.vendorId || response.data.vendor._id,
        };
      }
    } catch (apiErr) {
      console.warn("Backend updateVendorProfile API fallback:", apiErr);
    }

    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId || (updatedVendor && v.id === updatedVendor.id));
    const finalVendor = updatedVendor
      ? { ...(vendors[idx] || {}), ...updatedVendor }
      : { ...(vendors[idx] || {}), ...profileData, id: vendorId };

    if (idx !== -1) {
      vendors[idx] = finalVendor;
    } else {
      vendors.push(finalVendor);
    }
    saveData(VENDORS_STORAGE_KEY, vendors);

    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.id === vendorId || (finalVendor.email && u.email?.toLowerCase() === finalVendor.email?.toLowerCase())) {
          const updatedUser = { ...u, ...finalVendor };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          localStorage.setItem("immigo_user", JSON.stringify(updatedUser));
        }
      }
    } catch {}

    // Add Notification for Admin in frontend store
    crmVendorService.addAdminNotification({
      title: "Vendor Profile Updated",
      message: `${finalVendor.companyName || "Vendor"} updated their profile or compliance details.`,
      type: "info",
      vendorId: finalVendor.id,
      link: "/admin/vendor/vendors",
    });

    return finalVendor;
  },

  changeVendorPassword: async (vendorId, oldPassword, newPassword) => {
    await delay(100);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    if (vendors[idx].password !== oldPassword) {
      throw new Error("Current password entered is incorrect.");
    }

    vendors[idx].password = newPassword;
    saveData(VENDORS_STORAGE_KEY, vendors);
    return true;
  },

  updateVendorDocuments: async (vendorId, status = true) => {
    await delay(100);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex(v => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].documentsUploaded = status;
    saveData(VENDORS_STORAGE_KEY, vendors);
    return vendors[idx];
  },

  // ----------------------------------------------------
  // CANDIDATES CREATION & MANAGEMENT
  // ----------------------------------------------------
  createCandidate: async (vendorId, candidateData) => {
    await delay(120);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const newCandidate = {
      ...candidateData,
      id: `CND-${Math.floor(550 + Math.random() * 450)}`,
      vendorId: vendorId || "VND-1001",
      status: candidateData.status || "Available",
      createdAt: new Date().toISOString(),
      dob: candidateData.dob || "1995-05-10",
      registeredDate: candidateData.registeredDate || new Date().toISOString().split("T")[0],
      passportIssueDate: candidateData.passportIssueDate || "2020-01-15",
      passportExpiryDate: candidateData.passportExpiryDate || "2030-01-14",
      documents: candidateData.documents || [
        { name: "Resume / CV", fileName: `${(candidateData.fullName || "Candidate").replace(/\s+/g, "_")}_Resume.pdf`, size: "1.2 MB", type: "Resume" },
        { name: "Passport Copy", fileName: `${(candidateData.fullName || "Candidate").replace(/\s+/g, "_")}_Passport.pdf`, size: "1.8 MB", type: "Passport" },
      ],
    };

    candidates.unshift(newCandidate);
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return newCandidate;
  },

  updateCandidatePhoto: async (candidateId, photoBase64) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found.");

    candidates[idx].photo = photoBase64;
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  updateCandidate: async (candidateId, updateData) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found.");

    candidates[idx] = {
      ...candidates[idx],
      ...updateData,
    };
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  // ----------------------------------------------------
  // ----------------------------------------------------
  // ADMIN VENDOR MANAGEMENT
  // ----------------------------------------------------
  getVendorsSync: () => {
    return loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
  },

  getVendors: async ({ search = "", status = "All", country = "All" } = {}) => {
    let vendors = [];
    try {
      const response = await apiClient.get("/admin/vendors");
      if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        vendors = response.data.vendors.map((v) => ({
          ...v,
          id: v.vendorId || v._id,
        }));
        saveData(VENDORS_STORAGE_KEY, vendors);
      } else {
        vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      }
    } catch {
      vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    }

    if (status !== "All") {
      vendors = vendors.filter((v) => {
        if (status === "Pending Verification") return v.status === "Pending" || v.status === "Under Review";
        if (status === "MOU Pending") return v.status === "MOU Pending" || (v.status === "Approved" && !v.mouSigned);
        return v.status === status;
      });
    }
    if (country !== "All") {
      vendors = vendors.filter((v) => v.country === country);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      vendors = vendors.filter(
        (v) =>
          v.companyName?.toLowerCase().includes(q) ||
          v.id?.toLowerCase().includes(q) ||
          v.contactPersonName?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.specialization?.toLowerCase().includes(q)
      );
    }

    return vendors;
  },

  getVendorById: async (vendorId) => {
    try {
      const response = await apiClient.get(`/admin/vendors/${vendorId}`);
      if (response.data?.vendor) {
        return { ...response.data.vendor, id: response.data.vendor.vendorId || response.data.vendor._id };
      }
    } catch {}
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    return vendors.find((v) => v.id === vendorId) || null;
  },

  approveDocsAndSendMou: async (vendorId, mouPayload = {}) => {
    try {
      const response = await apiClient.post(`/admin/vendors/${vendorId}/send-mou`, mouPayload);
      const updated = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
      };
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId || v.id === updated.id);
      if (idx !== -1) vendors[idx] = updated;
      saveData(VENDORS_STORAGE_KEY, vendors);

      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.id === vendorId || u.vendorId === vendorId || u.email?.toLowerCase() === updated.email?.toLowerCase()) {
            localStorage.setItem("user", JSON.stringify({ ...u, ...updated }));
            localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...updated }));
          }
        }
      } catch {}

      crmVendorService.addNotification({
        vendorId: updated.id,
        title: "Official Partnership MOU Issued",
        message: `Your statutory documents are approved! Official MOU agreement has been issued by Admin. Please review and digitally sign.`,
        type: "success",
        link: "/vendor/dashboard",
      });

      return updated;
    } catch (err) {
      // Local fallback
      return crmVendorService.signOrVerifyMOU(vendorId, "Sent");
    }
  },

  approveVendor: async (vendorId) => {
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/approve`);
      const updated = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
      };
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx !== -1) vendors[idx] = updated;
      saveData(VENDORS_STORAGE_KEY, vendors);

      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.id === vendorId || u.vendorId === vendorId || u.email?.toLowerCase() === updated.email?.toLowerCase()) {
            localStorage.setItem("user", JSON.stringify({ ...u, ...updated }));
            localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...updated }));
          }
        }
      } catch {}
      return updated;
    } catch {
      await delay(80);
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx === -1) throw new Error("Vendor not found");

      vendors[idx].status = "Approved";
      vendors[idx].verifiedAt = new Date().toISOString();
      vendors[idx].rejectionReason = "";
      saveData(VENDORS_STORAGE_KEY, vendors);

      crmVendorService.addNotification({
        vendorId,
        title: "Vendor Account Approved",
        message: `Your account for ${vendors[idx].companyName} has been verified and approved by Admin. You now have full access to submit candidates.`,
        type: "success",
        link: "/vendor/dashboard",
      });

      return vendors[idx];
    }
  },

  signOrVerifyMOU: async (vendorId, status = "Approved") => {
    await delay(80);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    if (status === "Sent") {
      vendors[idx].mouStatus = "Sent";
      vendors[idx].status = "MOU Pending";
      vendors[idx].onboardingStage = "MOU_SENT";
      vendors[idx].mouDocument = {
        title: "Memorandum of Understanding (MOU) for Recruitment Services",
        sentAt: new Date().toISOString(),
        termsVersion: "v1.0",
      };
    } else {
      vendors[idx].mouSigned = status === "Approved" || status === "Signed";
      vendors[idx].mouStatus = status;
      vendors[idx].status = "Approved";
      vendors[idx].mouVerifiedAt = new Date().toISOString();
    }
    saveData(VENDORS_STORAGE_KEY, vendors);

    crmVendorService.addNotification({
      vendorId,
      title: status === "Sent" ? "MOU Agreement Sent" : "MOU Agreement Completed",
      message: status === "Sent" 
        ? "Your compliance documents have been approved! The official MOU has been issued for your signature."
        : "Your Memorandum of Understanding (MOU) has been verified and approved.",
      type: "success",
      link: "/vendor/dashboard",
    });

    return vendors[idx];
  },

  rejectVendor: async (vendorId, reason = "") => {
    try {
      await apiClient.put(`/admin/vendors/${vendorId}/reject`, { reason });
    } catch {}

    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].status = "Rejected";
    vendors[idx].rejectionReason = reason;
    saveData(VENDORS_STORAGE_KEY, vendors);

    crmVendorService.addNotification({
      vendorId: vendorId,
      title: "Vendor Account Rejected",
      message: `Your account for ${vendors[idx].companyName} has been rejected by Admin. Reason: ${reason}`,
      type: "error",
      link: "/vendor/dashboard",
    });

    return vendors[idx];
  },

  suspendVendor: async (vendorId) => {
    try {
      await apiClient.put(`/admin/vendors/${vendorId}/suspend`);
    } catch {}

    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].status = vendors[idx].status === "Suspended" ? "Approved" : "Suspended";
    saveData(VENDORS_STORAGE_KEY, vendors);
    return vendors[idx];
  },

  // ----------------------------------------------------
  // VENDOR CANDIDATES (POOL)
  // ----------------------------------------------------
  getCandidates: async (vendorId, { search = "", position = "All", country = "All", experience = "All" } = {}) => {
    try {
      const res = await apiClient.get(`/crm-sync/candidates${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.candidates) && res.data.candidates.length > 0) {
        const local = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
        const map = new Map();
        local.forEach((c) => map.set(c.id, c));
        res.data.candidates.forEach((c) => {
          const existing = map.get(c.id);
          if (existing) {
            const existingDocs = existing.documents || [];
            const serverDocs = c.documents || [];
            const mergedDocs = (serverDocs.length > 0 ? serverDocs : existingDocs).map((sDoc, i) => {
              const exDoc = existingDocs.find((d) => d.name === sDoc.name || d.fileName === sDoc.fileName) || existingDocs[i];
              if (exDoc && (exDoc.status === "Verified" || exDoc.status === "Rejected")) {
                return { ...sDoc, ...exDoc };
              }
              return sDoc;
            });
            map.set(c.id, {
              ...c,
              ...existing,
              documents: mergedDocs,
              verificationStatus:
                existing.verificationStatus === "Verified" || existing.verificationStatus === "Rejected"
                  ? existing.verificationStatus
                  : c.verificationStatus,
            });
          } else {
            map.set(c.id, c);
          }
        });
        const merged = Array.from(map.values());
        saveData(CANDIDATES_STORAGE_KEY, merged);
      }
    } catch {}

    let candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);

    if (vendorId) {
      candidates = candidates.filter((c) => c.vendorId === vendorId);
    }

    if (position !== "All") {
      candidates = candidates.filter((c) => c.currentPosition === position);
    }

    if (country !== "All") {
      candidates = candidates.filter((c) => c.preferredCountry === country);
    }

    if (experience !== "All") {
      candidates = candidates.filter((c) => c.experienceYears === experience);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.currentPosition?.toLowerCase().includes(q) ||
          (c.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          c.qualification?.toLowerCase().includes(q) ||
          c.preferredCountry?.toLowerCase().includes(q)
      );
    }

    return candidates;
  },

  getCandidateById: async (candidateId) => {
    await delay(40);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return null;

    // Attach submission history
    const applications = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const history = applications.filter((a) => a.candidateId === candidateId);

    return {
      ...candidate,
      applications: history,
    };
  },

  createCandidate: async (vendorId, candidateData) => {
    await delay(100);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);

    const newCandidate = {
      ...candidateData,
      id: `CND-${Math.floor(500 + Math.random() * 5000)}`,
      vendorId: vendorId || "VND-1001",
      createdAt: new Date().toISOString(),
      skills: Array.isArray(candidateData.skills)
        ? candidateData.skills
        : (candidateData.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      tags: Array.isArray(candidateData.tags)
        ? candidateData.tags
        : (candidateData.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      documents: candidateData.documents || [],
    };

    candidates.unshift(newCandidate);
    saveData(CANDIDATES_STORAGE_KEY, candidates);

    try {
      apiClient.post("/crm-sync/candidates", newCandidate).catch(() => {});
    } catch {}

    crmVendorService.addAdminNotification({
      title: "New Candidate Registered",
      message: `${newCandidate.vendorName || "Vendor"} registered candidate ${newCandidate.fullName} (${newCandidate.currentPosition || "General"}).`,
      type: "info",
      link: "/admin/vendor/candidates",
    });

    return newCandidate;
  },

  updateCandidate: async (candidateId, updatedData) => {
    await delay(80);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    candidates[idx] = {
      ...candidates[idx],
      ...updatedData,
    };
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    try {
      apiClient.post("/crm-sync/candidates", candidates[idx]).catch(() => {});
    } catch {}
    return candidates[idx];
  },

  addCandidateDocument: async (candidateId, documentData) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    if (!candidates[idx].documents) candidates[idx].documents = [];
    const newDoc = {
      ...documentData,
      status: "Verified",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Admin",
    };
    candidates[idx].documents.push(newDoc);
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    try {
      await apiClient.post("/crm-sync/candidates", candidates[idx]);
    } catch {}
    return candidates[idx];
  },

  deleteCandidate: async (candidateId) => {
    await delay(80);
    let candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    candidates = candidates.filter((c) => c.id !== candidateId);
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return true;
  },

  verifyCandidateDocument: async (candidateId, docIndex, status, remarks = "") => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    if (!candidates[idx].documents) candidates[idx].documents = [];
    if (candidates[idx].documents[docIndex]) {
      candidates[idx].documents[docIndex].status = status;
      candidates[idx].documents[docIndex].remarks = remarks;
      candidates[idx].documents[docIndex].verifiedAt = new Date().toISOString();
    }

    // Update overall candidate verification state
    const allDocs = candidates[idx].documents;
    if (allDocs.some((d) => d.status === "Rejected")) {
      candidates[idx].verificationStatus = "Rejected";
    } else if (allDocs.every((d) => d.status === "Verified")) {
      candidates[idx].verificationStatus = "Verified";
    } else {
      candidates[idx].verificationStatus = "Pending";
    }

    saveData(CANDIDATES_STORAGE_KEY, candidates);

    try {
      await apiClient.post("/crm-sync/candidates", candidates[idx]);
    } catch {}

    return candidates[idx];
  },

  verifyAllCandidateDocuments: async (candidateId, status, remarks = "") => {
    await delay(80);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    if (candidates[idx].documents) {
      candidates[idx].documents = candidates[idx].documents.map((doc) => ({
        ...doc,
        status: status,
        remarks: status === "Rejected" ? remarks : doc.remarks || "",
        verifiedAt: new Date().toISOString(),
      }));
    }
    candidates[idx].verificationStatus = status;
    candidates[idx].verificationRemarks = remarks;

    saveData(CANDIDATES_STORAGE_KEY, candidates);

    try {
      await apiClient.post("/crm-sync/candidates", candidates[idx]);
    } catch {}

    return candidates[idx];
  },

  addCandidateDocument: async (candidateId, docData) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => String(c.id) === String(candidateId));
    if (idx === -1) {
      console.warn("Candidate not found for document attachment:", candidateId);
      return null;
    }

    if (!Array.isArray(candidates[idx].documents)) {
      candidates[idx].documents = [];
    }

    const newDoc = {
      id: docData.id || `doc_${Date.now()}`,
      name: docData.name || "Processing Document",
      fileName: docData.fileName || docData.name || "document.pdf",
      fileUrl: docData.fileUrl || "",
      size: docData.size || "150 KB",
      uploadedAt: docData.uploadedAt || new Date().toISOString(),
      status: "Verified",
      stageId: docData.stageId || null,
      milestoneName: docData.milestoneName || "",
      type: "Stage Document",
    };

    const existingDocIdx = candidates[idx].documents.findIndex(
      (d) => (d.stageId && docData.stageId && d.stageId === docData.stageId) || (d.fileName === newDoc.fileName)
    );
    if (existingDocIdx !== -1) {
      candidates[idx].documents[existingDocIdx] = { ...candidates[idx].documents[existingDocIdx], ...newDoc };
    } else {
      candidates[idx].documents.push(newDoc);
    }

    saveData(CANDIDATES_STORAGE_KEY, candidates);

    try {
      await apiClient.post("/crm-sync/candidates", candidates[idx]);
    } catch {}

    return candidates[idx];
  },


  // ----------------------------------------------------
  // CANDIDATE SUBMISSION / APPLICATIONS (PER-PROJECT)
  // ----------------------------------------------------
  getApplications: async (vendorId, { status = "All", projectId = "All", search = "" } = {}) => {
    try {
      const res = await apiClient.get(`/crm-sync/applications${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.applications) && res.data.applications.length > 0) {
        const local = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
        const map = new Map();
        local.forEach((a) => map.set(a.id, a));
        res.data.applications.forEach((a) => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
        const merged = Array.from(map.values());
        saveData(APPLICATIONS_STORAGE_KEY, merged);
      }
    } catch {}

    let apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);

    if (vendorId) {
      apps = apps.filter((a) => a.vendorId === vendorId);
    }

    if (status !== "All") {
      apps = apps.filter((a) => a.status === status);
    }

    if (projectId !== "All") {
      apps = apps.filter((a) => a.projectId === projectId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.candidateName?.toLowerCase().includes(q) ||
          a.projectName?.toLowerCase().includes(q) ||
          a.clientName?.toLowerCase().includes(q) ||
          a.position?.toLowerCase().includes(q) ||
          a.country?.toLowerCase().includes(q)
      );
    }

    let dataChanged = false;

    // Auto-fix and initialize milestones for Selected / Completed candidates
    apps = apps.map(app => {
      // If candidate is Selected or Completed, ensure processMilestones are initialized with stages
      if (["Selected", "Completed"].includes(app.status)) {
        if (!Array.isArray(app.processMilestones) || app.processMilestones.length === 0) {
          app.processMilestones = [
            {
              id: "m0",
              name: "Milestone 1: Selection & Document Clearance",
              paymentAmount: 10000,
              paymentStatus: "Payment Required",
              status: "Payment Required",
              paymentDate: null,
              paymentRemark: "",
              approvedBy: null,
              stages: [
                { id: "s0_1", name: "Trade Skill Verification & Acceptance", status: "In Progress", completedAt: null, remark: "" },
                { id: "s0_2", name: "Passport & Identity Clearance", status: "Locked", completedAt: null, remark: "" }
              ]
            },
            {
              id: "m1",
              name: "Milestone 2: Medical & Visa Processing",
              paymentAmount: 15000,
              paymentStatus: "Not Required",
              status: "Locked",
              paymentDate: null,
              paymentRemark: "",
              approvedBy: null,
              stages: [
                { id: "s1_1", name: "GAMCA / Medical Fitness Test", status: "Locked", completedAt: null, remark: "" },
                { id: "s1_2", name: "Visa Stamping & Work Permit Approval", status: "Locked", completedAt: null, remark: "" }
              ]
            },
            {
              id: "m2",
              name: "Milestone 3: Emigration Clearance & Flight Deployment",
              paymentAmount: 15000,
              paymentStatus: "Not Required",
              status: "Locked",
              paymentDate: null,
              paymentRemark: "",
              approvedBy: null,
              stages: [
                { id: "s2_1", name: "Emigration (PCC / Protector) Clearance", status: "Locked", completedAt: null, remark: "" },
                { id: "s2_2", name: "Flight Ticket Booking & Mobilization", status: "Locked", completedAt: null, remark: "" }
              ]
            }
          ];
          dataChanged = true;
        }

        // Ensure sequential milestone status consistency
        if (Array.isArray(app.processMilestones) && app.processMilestones.length > 0) {
          app.processMilestones.forEach((m, mIdx) => {
            const amt = Number(m.paymentAmount) || 0;
            const allStagesDone = Array.isArray(m.stages) && m.stages.length > 0 && m.stages.every(s => s.status === "Completed");

            if (allStagesDone) {
              m.status = "Completed";
            } else if (mIdx === 0) {
              if (amt > 0 && m.paymentStatus !== "Approved") {
                m.status = "Payment Required";
                if (m.paymentStatus !== "Submitted") m.paymentStatus = "Payment Required";
              } else {
                m.status = "Active";
                if (amt === 0 && (!m.paymentStatus || m.paymentStatus === "Locked")) {
                  m.paymentStatus = "Not Required";
                }
              }
            } else {
              // Milestone index > 0
              const prevM = app.processMilestones[mIdx - 1];
              const prevComplete = prevM.status === "Completed" || (Array.isArray(prevM.stages) && prevM.stages.length > 0 && prevM.stages.every(s => s.status === "Completed"));

              if (!prevComplete) {
                // Previous milestone is NOT complete -> strictly lock this milestone!
                m.status = "Locked";
                if (m.paymentStatus !== "Approved") {
                  m.paymentStatus = "Locked";
                }
                // Lock uncompleted stages
                if (Array.isArray(m.stages)) {
                  m.stages.forEach(s => {
                    if (s.status !== "Completed") s.status = "Locked";
                  });
                }
              } else {
                // Previous milestone IS complete! Now this milestone can open
                if (m.status === "Locked") {
                  if (m.paymentStatus === "Approved" || amt === 0) {
                    m.status = "Active";
                    if (amt === 0) m.paymentStatus = "Not Required";
                    if (m.stages?.length > 0 && m.stages[0].status === "Locked") {
                      m.stages[0].status = "In Progress";
                    }
                  } else {
                    m.status = "Payment Required";
                    if (m.paymentStatus === "Locked" || !m.paymentStatus) {
                      m.paymentStatus = "Payment Required";
                    }
                  }
                }
              }
            }
          });
          dataChanged = true;
        }

        // Keep paymentPlan synchronized with processMilestones
        const totalAmt = app.processMilestones.reduce((acc, m) => acc + (Number(m.paymentAmount) || 0), 0) || 40000;
        app.paymentPlan = {
          totalAmount: totalAmt,
          milestones: app.processMilestones.map((m, idx) => ({
            id: m.id || `m${idx}`,
            name: m.name,
            amount: m.paymentAmount,
            status: m.paymentStatus === "Approved" ? "Paid" : (m.paymentStatus === "Submitted" ? "Submitted" : (m.paymentStatus === "Payment Required" ? "Due" : "Pending")),
            paidDate: m.paymentDate,
            paymentRef: m.paymentRef,
            stages: m.stages
          }))
        };

        // Synchronize app.processing and currentStageIndex
        const allMStages = (app.processMilestones || []).flatMap((m) => m.stages || []);
        const compMStages = allMStages.filter((s) => s.status === "Completed" || s.completed).length;
        const allDone = (allMStages.length > 0 && compMStages === allMStages.length) ||
          (app.processMilestones.length > 0 && app.processMilestones.every((m) => m.status === "Completed"));

        if (!app.processing) {
          app.processing = { currentStageIndex: 0, stages: [] };
        }

        if (allDone || app.status === "Completed") {
          if (app.status !== "Completed") {
            app.status = "Completed";
            dataChanged = true;
          }
          if (app.processing.currentStageIndex !== 7 || app.processing.status !== "Completed") {
            app.processing.currentStageIndex = 7;
            app.processing.status = "Completed";
            if (Array.isArray(app.processing.stages)) {
              app.processing.stages.forEach((s) => { s.status = "Completed"; });
            }
            dataChanged = true;
          }
        } else if (allMStages.length > 0 && compMStages > 0) {
          const ratio = compMStages / allMStages.length;
          const mappedIdx = Math.min(7, Math.max(0, Math.floor(ratio * 8)));
          if (app.processing.currentStageIndex !== mappedIdx) {
            app.processing.currentStageIndex = mappedIdx;
            dataChanged = true;
          }
        }
      }

      return app;
    });

    if (dataChanged) {
      saveData(APPLICATIONS_STORAGE_KEY, apps);
    }

    return apps;
  },

  submitCandidateToProject: async ({
    vendorId,
    candidateId,
    clientId,
    projectId,
    requirementCode = "REQ-001",
    position,
  }) => {
    await delay(120);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) throw new Error("Candidate not found.");

    // Retrieve real Client & Project details from crmClientService
    let clientName = "Client Partner";
    let projectName = "Deployment Project";
    let country = "UAE";

    try {
      const proj = await crmClientService.getProjectById(clientId, projectId);
      if (proj) {
        projectName = proj.projectName || projectName;
        country = proj.country || country;
        clientName = proj.client?.companyName || proj.clientName || clientName;

        // Check if vendor has permission to submit to this project
        if (proj.vendorVisibility === "specific") {
          const isAssigned = (proj.assignedVendorIds || []).includes(vendorId);
          if (!isAssigned) {
            throw new Error(`You do not have permission to submit candidates to project ${projectName}.`);
          }
        }

        // Validate that the position being submitted is actually required by the project
        const validPosition = (proj.manpowerRequirements || []).some(
          req => req.position === position || req.positionTitle === position
        );
        if (proj.manpowerRequirements && proj.manpowerRequirements.length > 0 && !validPosition) {
           throw new Error(`The position "${position}" is not a valid requirement for this project.`);
        }
      }
    } catch (err) {
      if (err.message.includes("permission") || err.message.includes("not a valid requirement")) {
        throw err;
      }
      // fallback to sensible defaults
    }

    // Check if this candidate is already submitted to this EXACT project
    const alreadySubmitted = apps.find(
      (a) =>
        a.candidateId === candidateId &&
        String(a.projectId) === String(projectId) &&
        a.status !== "Rejected"
    );
    if (alreadySubmitted) {
      throw new Error(
        `Candidate ${candidate.fullName} has already been submitted to this project (Status: ${alreadySubmitted.status}).`
      );
    }

    const newApp = {
      id: `APP-${Math.floor(8000 + Math.random() * 2000)}`,
      vendorId: vendorId || "VND-1001",
      candidateId,
      candidateName: candidate.fullName,
      clientId,
      clientName,
      projectId,
      projectName,
      requirementCode,
      position: position || candidate.currentPosition,
      country,
      submittedAt: new Date().toISOString(),
      status: "Submitted", // Submitted, Under Review, Shortlisted, Selected, Rejected, Completed
      rejectionReason: "",
      selectionDate: null,
    };

    apps.unshift(newApp);
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    try {
      apiClient.post("/crm-sync/applications", {
        ...newApp,
        vendorName: candidate.vendorName || "Agency Partner",
      }).catch(() => {});
    } catch {}

    // Notify vendor
    crmVendorService.addNotification({
      vendorId: newApp.vendorId,
      title: "Candidate Submitted",
      message: `Candidate ${newApp.candidateName} submitted for ${newApp.projectName} (${newApp.position}).`,
      type: "info",
      link: "/vendor/applications",
    });

    // Notify admin
    crmVendorService.addAdminNotification({
      title: "New Candidate Submission 📄",
      message: `Vendor submitted ${candidate.fullName} for ${newApp.position} on project ${projectName}.`,
      type: "info",
      link: "/admin/vendors/submissions"
    });

    return newApp;
  },

  updateApplicationStatus: async (applicationId, status, rejectionReason = "", interviewDetails = null) => {
    await delay(100);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    let finalRejectionReason = "";
    let finalInterviewDetails = interviewDetails;
    let extraData = {};

    if (typeof rejectionReason === "object" && rejectionReason !== null) {
      extraData = rejectionReason;
      finalRejectionReason = extraData.rejectionReason || extraData.reason || "";
      if (
        extraData.interviewDate ||
        extraData.dateTime ||
        extraData.meetingUrl ||
        extraData.interviewTime ||
        extraData.interviewLocation ||
        extraData.interviewRemarks
      ) {
        finalInterviewDetails = finalInterviewDetails || {
          dateTime:
            extraData.dateTime ||
            (extraData.interviewDate
              ? `${extraData.interviewDate}${extraData.interviewTime ? ` ${extraData.interviewTime}` : ""}`
              : ""),
          meetingUrl: extraData.meetingUrl || "",
          location: extraData.interviewLocation || "",
          notes: extraData.interviewRemarks || extraData.notes || extraData.remark || "",
        };
      }
    } else if (typeof rejectionReason === "string") {
      finalRejectionReason = rejectionReason;
    }

    apps[idx].status = status;

    if (extraData.remark) {
      apps[idx].adminRemark = extraData.remark;
    }

    if (finalInterviewDetails || status === "Interview" || status === "Interview Scheduled") {
      apps[idx].interviewDetails = finalInterviewDetails || apps[idx].interviewDetails || {};
    }

    if (status === "Interview" || status === "Interview Scheduled") {
      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Interview Scheduled 🎥",
        message: `Interview scheduled for ${apps[idx].candidateName} (${apps[idx].projectName}). Date: ${apps[idx].interviewDetails?.dateTime || "TBD"}. Details available in portal.`,
        type: "info",
        link: "/vendor/applications",
      });
    }

    if (status === "On Hold") {
      apps[idx].holdReason = finalRejectionReason || extraData.remark || "Application put on hold by client/admin.";
      apps[idx].holdDate = new Date().toISOString();
      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Put On Hold ⏸️",
        message: `${apps[idx].candidateName} was put On Hold for ${apps[idx].projectName}. Candidate is reusable for other projects.`,
        type: "warning",
        link: "/vendor/candidates",
      });
    }

    if (status === "Shortlisted") {
      apps[idx].shortlistRemark = extraData.remark || "Candidate shortlisted for client review.";
      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Shortlisted ⭐",
        message: `${apps[idx].candidateName} has been shortlisted for ${apps[idx].projectName}.`,
        type: "info",
        link: "/vendor/applications",
      });
    }

    if (status === "Rejected") {
      apps[idx].rejectionReason = finalRejectionReason || "Did not meet specific client criteria.";
      apps[idx].rejectionDate = new Date().toISOString();
      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Application Rejected",
        message: `${apps[idx].candidateName} was not selected for ${apps[idx].projectName}. Reason: ${apps[idx].rejectionReason}. Candidate returned to pool for other project submissions.`,
        type: "error",
        link: "/vendor/rejected",
      });
    }

    if (status === "Selected") {
      apps[idx].selectionDate = new Date().toISOString();
      apps[idx].rejectionReason = "";

      // Initialize candidate milestone progress from project paymentMilestones if present
      if (!apps[idx].processMilestones) {
        let milestonePlan = null;
        try {
          const clientsData = JSON.parse(localStorage.getItem("crm_clients_data_v2") || "[]");
          for (const c of clientsData) {
            const prj = (c.projects || []).find(
              (p) => String(p.id) === String(apps[idx].projectId) || p.projectName === apps[idx].projectName
            );
            if (prj && Array.isArray(prj.paymentMilestones) && prj.paymentMilestones.length > 0) {
              milestonePlan = prj.paymentMilestones.map((pm, mIdx) => {
                const amt = Number(pm.paymentAmount) || 0;
                let initialMilestoneStatus = "Locked";
                let initialPaymentStatus = "Not Required";

                if (mIdx === 0) {
                  if (amt > 0) {
                    initialMilestoneStatus = "Payment Required";
                    initialPaymentStatus = "Payment Required";
                  } else {
                    initialMilestoneStatus = "Active";
                  }
                } else {
                  if (amt > 0) {
                    initialPaymentStatus = "Payment Required";
                  }
                }

                return {
                  id: pm.id || `m${mIdx}`,
                  name: pm.name || `Milestone ${mIdx + 1}`,
                  paymentAmount: amt,
                  paymentStatus: initialPaymentStatus,
                  status: initialMilestoneStatus,
                  paymentDate: null,
                  paymentRemark: "",
                  approvedBy: null,
                  stages: (pm.stages || []).map((stg, sIdx) => ({
                    id: stg.id || `s${sIdx}`,
                    name: stg.name || `Stage ${sIdx + 1}`,
                    status: mIdx === 0 && amt === 0 && sIdx === 0 ? "In Progress" : "Locked",
                    completedAt: null,
                    completedBy: null,
                    remark: "",
                  })),
                };
              });
              break;
            }
          }
        } catch (e) {
          console.warn("Could not fetch project milestone config:", e);
        }

        apps[idx].processMilestones = milestonePlan || [];
      }

      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Selected! 🎉",
        message: `${apps[idx].candidateName} has been selected for ${apps[idx].projectName}. Processing timeline initialized.`,
        type: "success",
        link: "/vendor/selected",
      });
    }

    if (status === "Submitted") {
      apps[idx].rejectionReason = "";
      apps[idx].rejectionDate = null;
    }

    // Sync with backend API
    try {
      const res = await apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]);
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch (apiErr) {
      console.warn("Backend updateApplicationStatus failed:", apiErr.message || apiErr);
    }

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  addApplicationMilestone: async (applicationId, { name, percentage = 0, amount = 0, dueDate = "" }) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].paymentPlan) {
      apps[idx].paymentPlan = { totalAmount: 40000, currency: "INR", milestones: [] };
    }

    const mId = `M${(apps[idx].paymentPlan.milestones.length || 0) + 1}`;
    const newMilestone = {
      id: mId,
      name: name || `Milestone ${mId}`,
      percentage: Number(percentage) || 0,
      amount: Number(amount) || 0,
      dueDate: dueDate || "",
      status: "Pending",
      paidDate: "",
      paymentRef: "",
    };

    apps[idx].paymentPlan.milestones.push(newMilestone);
    apps[idx].paymentPlan.totalAmount += Number(amount) || 0;

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  updateApplicationProject: async (applicationId, { clientId, clientName, projectId, projectName, requirementCode, position, country }) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    apps[idx] = {
      ...apps[idx],
      clientId: clientId || apps[idx].clientId,
      clientName: clientName || apps[idx].clientName,
      projectId: projectId || apps[idx].projectId,
      projectName: projectName || apps[idx].projectName,
      requirementCode: requirementCode || apps[idx].requirementCode,
      position: position || apps[idx].position,
      country: country || apps[idx].country,
    };

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  // Advance / Update Processing Stage
  completeStage: async (applicationId, milestoneId, stageId, remark = "", completedBy = "Admin") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].processMilestones) {
      throw new Error("Candidate is not in processing.");
    }

    const today = new Date().toISOString().split("T")[0];
    
    let allStagesComplete = true;
    let nextStageUnlocked = false;

    apps[idx].processMilestones = apps[idx].processMilestones.map((milestone) => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          stages: milestone.stages.map((stg, i) => {
            if (stg.id === stageId) {
              if (stg.status === "Completed") throw new Error("Stage is already completed.");
              if (stg.status === "Locked") throw new Error("Previous stage is not completed yet.");
              
              nextStageUnlocked = true;
              return { ...stg, status: "Completed", completedAt: today, completedBy, remark };
            }
            if (nextStageUnlocked && stg.status === "Locked") {
              nextStageUnlocked = false; // Only unlock the immediate next stage
              return { ...stg, status: "In Progress" };
            }
            return stg;
          })
        };
      }
      return milestone;
    });

    // Check if milestone stages are all complete
    const mIdx = apps[idx].processMilestones.findIndex(m => m.id === milestoneId);
    if (mIdx !== -1) {
      const allDone = apps[idx].processMilestones[mIdx].stages.every(s => s.status === "Completed");
      if (allDone) {
        apps[idx].processMilestones[mIdx].status = "Completed";
        if (apps[idx].processMilestones[mIdx].paymentAmount === 0) {
           apps[idx].processMilestones[mIdx].paymentStatus = "Not Required";
        }

        if (mIdx + 1 < apps[idx].processMilestones.length) {
          const nextM = apps[idx].processMilestones[mIdx + 1];
          const nextAmt = Number(nextM.paymentAmount) || 0;
          if (nextAmt > 0 && nextM.paymentStatus !== "Approved") {
            nextM.status = "Payment Required";
            nextM.paymentStatus = "Payment Required";
          } else {
            nextM.status = "Active";
            if (nextAmt === 0) nextM.paymentStatus = "Not Required";
            if (nextM.stages?.length > 0) {
              nextM.stages[0].status = "In Progress";
            }
          }

          // Notify vendor that next milestone payment is unlocked
          crmVendorService.addNotification({
            vendorId: apps[idx].vendorId,
            title: `Milestone ${mIdx + 1} Completed - Milestone ${mIdx + 2} Open 💳`,
            message: `All stages of Milestone ${mIdx + 1} are complete for candidate ${apps[idx].candidateName}. Milestone ${mIdx + 2} (${nextM.name}) payment is now open.`,
            type: "info",
            link: `/vendor/processing/${apps[idx].id}`,
          });
        } else {
          apps[idx].status = "Completed";
          if (!apps[idx].processing) apps[idx].processing = { currentStageIndex: 7, stages: [] };
          apps[idx].processing.currentStageIndex = 7;
          apps[idx].processing.status = "Completed";
          if (Array.isArray(apps[idx].processing.stages)) {
            apps[idx].processing.stages.forEach((s) => { s.status = "Completed"; });
          }
        }
      }
    }

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify vendor
    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Candidate Milestone Updated",
      message: `Candidate ${apps[idx].candidateName} milestone updated for project ${apps[idx].projectName}.`,
      type: "success",
      link: `/vendor/processing/${apps[idx].id}`,
    });

    return apps[idx];
  },

  submitMilestonePayment: async (applicationId, milestoneId, paymentRef = "") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    const mIdx = apps[idx].processMilestones.findIndex(m => m.id === milestoneId);
    if (mIdx === -1) throw new Error("Milestone not found");

    const isRazorpay = paymentRef.includes("[Razorpay]");

    apps[idx].processMilestones[mIdx].paymentRef = paymentRef;

    if (isRazorpay) {
      apps[idx].processMilestones[mIdx].paymentStatus = "Approved";
      apps[idx].processMilestones[mIdx].paymentDate = new Date().toISOString().split("T")[0];
      apps[idx].processMilestones[mIdx].approvedBy = "Razorpay Auto-Verify";
      apps[idx].processMilestones[mIdx].paymentRemark = "Paid Online via Razorpay";
      apps[idx].processMilestones[mIdx].status = "Active";

      // Unlock first stage if locked
      if (apps[idx].processMilestones[mIdx].stages?.length > 0) {
        if (apps[idx].processMilestones[mIdx].stages[0].status === "Locked") {
          apps[idx].processMilestones[mIdx].stages[0].status = "In Progress";
        }
      }
    } else {
      apps[idx].processMilestones[mIdx].paymentStatus = "Submitted";
    }

    // Keep paymentPlan synced
    if (apps[idx].paymentPlan?.milestones?.[mIdx]) {
      apps[idx].paymentPlan.milestones[mIdx].status = isRazorpay ? "Paid" : "Submitted";
      apps[idx].paymentPlan.milestones[mIdx].paidDate = isRazorpay ? new Date().toISOString().split("T")[0] : null;
      apps[idx].paymentPlan.milestones[mIdx].paymentRef = paymentRef;
    }

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify admin
    crmVendorService.addAdminNotification({
      title: "Milestone Payment Submitted 💳",
      message: `Payment submitted for candidate ${apps[idx].candidateName} on project ${apps[idx].projectName}.`,
      type: "info",
      link: "/admin/vendor/payments",
    });

    return apps[idx];
  },

  approveMilestonePayment: async (applicationId, milestoneId, approvedBy = "Admin", remark = "") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    const mIdx = apps[idx].processMilestones.findIndex(m => m.id === milestoneId);
    if (mIdx === -1) throw new Error("Milestone not found");

    apps[idx].processMilestones[mIdx].paymentStatus = "Approved";
    apps[idx].processMilestones[mIdx].paymentDate = new Date().toISOString().split("T")[0];
    apps[idx].processMilestones[mIdx].approvedBy = approvedBy;
    apps[idx].processMilestones[mIdx].paymentRemark = remark;
    apps[idx].processMilestones[mIdx].status = "Active";

    // Unlock first stage
    if (apps[idx].processMilestones[mIdx].stages.length > 0) {
      apps[idx].processMilestones[mIdx].stages[0].status = "In Progress";
    }

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify vendor
    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Payment Approved ✅",
      message: `Payment approved for candidate ${apps[idx].candidateName} on project ${apps[idx].projectName}.`,
      type: "success",
      link: `/vendor/payments/${apps[idx].id}`,
    });

    return apps[idx];
  },

  rejectMilestonePayment: async (applicationId, milestoneId, remark = "") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    const mIdx = apps[idx].processMilestones.findIndex(m => m.id === milestoneId);
    if (mIdx === -1) throw new Error("Milestone not found");

    apps[idx].processMilestones[mIdx].paymentStatus = "Rejected";
    apps[idx].processMilestones[mIdx].paymentRemark = remark;

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  quickUpdateMilestoneStatus: async (applicationId, milestoneId, newStatus) => {
    await delay(60);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => String(a.id) === String(applicationId));
    if (idx === -1) throw new Error("Application not found");

    const isPaid = newStatus === "Paid";

    // 1. Sync in paymentPlan.milestones
    if (apps[idx].paymentPlan?.milestones) {
      const pmIdx = apps[idx].paymentPlan.milestones.findIndex(
        (m) => String(m.id) === String(milestoneId)
      );
      if (pmIdx !== -1) {
        apps[idx].paymentPlan.milestones[pmIdx].status = isPaid ? "Paid" : "Pending";
        apps[idx].paymentPlan.milestones[pmIdx].paidDate = isPaid
          ? new Date().toISOString().split("T")[0]
          : null;
        if (isPaid && !apps[idx].paymentPlan.milestones[pmIdx].paymentRef) {
          apps[idx].paymentPlan.milestones[pmIdx].paymentRef = `Admin Verified • TXN_${Date.now()}`;
        }
      }
    }

    // 2. Sync in processMilestones
    if (apps[idx].processMilestones) {
      const mIdx = apps[idx].processMilestones.findIndex(
        (m) => String(m.id) === String(milestoneId)
      );
      if (mIdx !== -1) {
        apps[idx].processMilestones[mIdx].paymentStatus = isPaid ? "Approved" : "Pending";
        apps[idx].processMilestones[mIdx].status = isPaid ? "Active" : "Pending";
        apps[idx].processMilestones[mIdx].paymentDate = isPaid
          ? new Date().toISOString().split("T")[0]
          : null;
        apps[idx].processMilestones[mIdx].approvedBy = isPaid ? "Admin" : null;
        if (isPaid && apps[idx].processMilestones[mIdx].stages?.length > 0) {
          if (apps[idx].processMilestones[mIdx].stages[0].status === "Locked") {
            apps[idx].processMilestones[mIdx].stages[0].status = "In Progress";
          }
        }
      }
    }

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify vendor
    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: isPaid ? "Milestone Payment Marked Paid ✅" : "Milestone Payment Reset to Pending ⏳",
      message: `Milestone payment for candidate ${apps[idx].candidateName} is now ${newStatus}.`,
      type: isPaid ? "success" : "info",
      link: `/vendor/payments/${apps[idx].id}`,
    });

    return apps[idx];
  },

  // Upload Official Visa document to a stage
  uploadStageVisa: async (applicationId, milestoneId, stageId, visaUrl, fileName = "Visa_Document.pdf") => {
    await delay(60);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (apps[idx].processMilestones) {
      apps[idx].processMilestones = apps[idx].processMilestones.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            stages: (m.stages || []).map((s) => {
              if (s.id === stageId) {
                return {
                  ...s,
                  visaDocumentUrl: visaUrl,
                  visaFileName: fileName,
                  visaUploadedAt: new Date().toISOString().split("T")[0],
                };
              }
              return s;
            }),
          };
        }
        return m;
      });
    }

    apps[idx].visaDocument = {
      url: visaUrl,
      fileName,
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify vendor in real-time
    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Visa Document Issued! ✈️",
      message: `Official Visa document uploaded for candidate ${apps[idx].candidateName} on project ${apps[idx].projectName}. Ready for download.`,
      type: "success",
      link: `/vendor/processing/${apps[idx].id}`,
    });

    return apps[idx];
  },

  // Admin Override of Milestone amounts for an individual candidate
  overrideMilestones: async (applicationId, totalAmount, milestones) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].paymentPlan) apps[idx].paymentPlan = {};
    apps[idx].paymentPlan.totalAmount = totalAmount;
    apps[idx].paymentPlan.milestones = milestones;

    // Map to processMilestones format so VendorTimeline can read it properly
    apps[idx].processMilestones = milestones.map((m, mIdx) => {
      const isPaid = m.status === "Paid";
      const isFirst = mIdx === 0;
      const amt = Number(m.amount || m.paymentAmount || 0);

      let processStatus = isPaid ? "Active" : isFirst ? (amt > 0 ? "Payment Required" : "Active") : "Locked";
      let mappedPaymentStatus = isPaid ? "Approved" : isFirst ? (amt > 0 ? "Payment Required" : "Not Required") : "Locked";

      const stages = (m.stages || []).map((s, sIdx) => {
        let sStatus = s.status || "Locked";
        if (!isPaid && amt > 0) {
          sStatus = "Locked"; // Locked until milestone payment is verified
        } else if (isPaid && sStatus === "Locked" && sIdx === 0) {
          sStatus = "In Progress";
        }
        return {
          ...s,
          status: sStatus,
        };
      });

      return {
        id: m.id || `m${mIdx}`,
        name: m.name,
        paymentAmount: amt,
        paymentStatus: mappedPaymentStatus,
        status: processStatus,
        paymentDate: m.paidDate || (isPaid ? new Date().toISOString().split("T")[0] : null),
        paymentRef: m.paymentRef || null,
        approvedBy: isPaid ? "Admin" : null,
        stages,
      };
    });

    apps[idx].status = "Selected";

    apiClient.put(`/crm-sync/applications/${applicationId}`, apps[idx]).catch(() => {});
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify vendor
    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Milestone Plan Configured 📋",
      message: `Total placement fee ₹${Number(totalAmount).toLocaleString()} divided into ${milestones.length} milestones for ${apps[idx].candidateName} on ${apps[idx].projectName}. Milestone 1 payment is now due.`,
      type: "info",
      link: `/vendor/processing/${apps[idx].id}`,
    });

    // Notify admin
    crmVendorService.addAdminNotification({
      title: "Candidate Milestones Set 🎯",
      message: `Milestone plan configured for ${apps[idx].candidateName} on ${apps[idx].projectName} (Total ₹${Number(totalAmount).toLocaleString()}).`,
      type: "info",
      link: `/admin/vendor/milestones-manage?appId=${apps[idx].id}`,
    });

    return apps[idx];
  },

  // ----------------------------------------------------
  // VENDOR DASHBOARD STATS
  // ----------------------------------------------------
  getVendorDashboardStats: async (vendorId) => {
    await delay(50);
    try {
      const res = await apiClient.get(`/crm-sync/applications${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.applications)) {
        const local = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
        const map = new Map();
        local.forEach((a) => map.set(a.id, a));
        res.data.applications.forEach((a) => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
        saveData(APPLICATIONS_STORAGE_KEY, Array.from(map.values()));
      }
    } catch {}

    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES).filter(
      (c) => !vendorId || c.vendorId === vendorId
    );
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS).filter(
      (a) => !vendorId || a.vendorId === vendorId
    );

    const totalCandidates = candidates.length;
    const submitted = apps.length;
    const underReview = apps.filter((a) => a.status === "Under Review" || a.status === "Shortlisted").length;
    const interview = apps.filter((a) => a.status === "Interview" || a.status === "Interview Scheduled").length;
    const selected = apps.filter((a) => a.status === "Selected").length;
    const onHold = apps.filter((a) => a.status === "On Hold").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    const inProcessing = apps.filter(
      (a) => a.status === "Selected" && a.processing && a.processing.currentStageIndex < 7
    ).length;
    const completed = apps.filter((a) => a.status === "Completed" || a.processing?.currentStageIndex === 7).length;

    // Financials
    let totalPayment = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let dueAmount = 0;
    let overdueAmount = 0;

    apps.forEach((app) => {
      if (app.paymentPlan?.milestones) {
        app.paymentPlan.milestones.forEach((m) => {
          totalPayment += Number(m.amount) || 0;
          if (m.status === "Paid") paidAmount += Number(m.amount) || 0;
          else if (m.status === "Due") dueAmount += Number(m.amount) || 0;
          else if (m.status === "Overdue") overdueAmount += Number(m.amount) || 0;
          else pendingAmount += Number(m.amount) || 0;
        });
      }
    });

    const recentActivity = apps.slice(0, 7);

    // Fetch Available Projects based on visibility
    let availableProjects = [];
    try {
      availableProjects = await crmVendorService.getAvailableProjects(vendorId);
    } catch (e) {
      console.warn("Could not fetch available projects:", e);
    }

    return {
      totalCandidates,
      submitted,
      underReview,
      selected,
      rejected,
      inProcessing,
      completed,
      financials: {
        totalPayment,
        paidAmount,
        pendingAmount,
        dueAmount,
        overdueAmount,
      },
      recentActivity,
      availableProjects,
    };
  },

  getAvailableProjects: async (vendorId) => {
    const DUMMY_PROJECT_IDS = ["prj-dxb-101", "prj-ksa-201", "prj-qat-301", "PRJ-101", "PRJ-102", "PRJ-103", "PRJ-104", "PRJ-105"];
    let backendProjects = [];
    try {
      const res = await apiClient.get(`/crm-sync/projects${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.projects)) {
        backendProjects = res.data.projects
          .map((p) => ({
            ...p,
            id: p.id || p.projectId || p._id?.toString(),
            projectName: p.projectName || p.name || p.title || "Overseas Project",
            clientName: p.clientName || "Overseas Client",
            country: p.country || "Overseas",
            totalHeadcount: p.totalHeadcount || (p.manpowerRequirements || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0) || 0,
            manpowerRequirements: p.manpowerRequirements || [],
          }))
          .filter((p) => p.id && !DUMMY_PROJECT_IDS.includes(String(p.id)));
      }
    } catch {}

    const list = [...backendProjects];
    const seenIds = new Set(list.map((p) => String(p.id)));

    try {
      const clientRes = await crmClientService.getClients({ limit: 100 });
      let clientsData = clientRes?.clients || [];
      if (!clientsData.length) {
        try {
          const raw =
            localStorage.getItem("crm_clients_data_v3") ||
            localStorage.getItem("crm_clients_data_v2") ||
            "[]";
          clientsData = JSON.parse(raw);
        } catch {}
      }

      clientsData.forEach((client) => {
        if (client.projects && Array.isArray(client.projects)) {
          client.projects.forEach((proj) => {
            const pId = String(proj.id || proj.projectId || proj._id || "");
            if (!pId || DUMMY_PROJECT_IDS.includes(pId) || seenIds.has(pId)) return;
            const status = (proj.status || "Active").toLowerCase();
            if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
              seenIds.add(pId);
              list.push({
                ...proj,
                id: pId,
                projectName: proj.projectName || proj.name || proj.title || "Overseas Project",
                clientName: client.companyName || client.name || proj.clientName || "Overseas Client",
                clientId: client.id || client._id,
                country: proj.country || client.country || "Overseas",
                status: proj.status || "Active",
                totalHeadcount: proj.totalHeadcount || (proj.manpowerRequirements || []).reduce((s, r) => s + (Number(r.quantity) || 0), 0) || 0,
                manpowerRequirements: proj.manpowerRequirements || [],
              });
            }
          });
        }
      });
    } catch {}

    return list;
  },

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------
  getNotifications: (vendorId) => {
    try {
      apiClient
        .get(`/crm-sync/notifications?role=VENDOR${vendorId ? `&vendorId=${vendorId}` : ""}`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.notifications) && res.data.notifications.length > 0) {
            const current = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
            const map = new Map();
            current.forEach((n) => map.set(n.id || n._id, n));
            res.data.notifications.forEach((n) => {
              const key = n.id || n._id;
              const prev = map.get(key) || {};
              // Keep read: true if it was marked read locally
              const isRead = Boolean(prev.read || n.read);
              map.set(key, { ...prev, ...n, read: isRead });
            });
            saveData(VENDOR_NOTIFICATIONS_KEY, Array.from(map.values()));
          }
        })
        .catch(() => {});
    } catch {}
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => !vendorId || !n.vendorId || n.vendorId === vendorId);
  },

  getNotificationsAsync: async (vendorId) => {
    try {
      const res = await apiClient.get(`/crm-sync/notifications?role=VENDOR${vendorId ? `&vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        const current = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
        const map = new Map();
        current.forEach((n) => map.set(n.id || n._id, n));
        res.data.notifications.forEach((n) => {
          const key = n.id || n._id;
          const prev = map.get(key) || {};
          const isRead = Boolean(prev.read || n.read);
          map.set(key, { ...prev, ...n, read: isRead });
        });
        const list = Array.from(map.values());
        saveData(VENDOR_NOTIFICATIONS_KEY, list);
        return list.filter((n) => !vendorId || !n.vendorId || n.vendorId === vendorId);
      }
    } catch {}
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => !vendorId || !n.vendorId || n.vendorId === vendorId);
  },

  addNotification: (notif) => {
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    notifs.unshift(newNotif);
    saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    try {
      apiClient.post("/crm-sync/notifications", {
        ...newNotif,
        recipientRole: "VENDOR",
      }).catch(() => {});
    } catch {}
    return newNotif;
  },

  markNotificationRead: (id) => {
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const idx = notifs.findIndex((n) => n.id === id || n._id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    }
    try {
      apiClient.put(`/crm-sync/notifications/${id}/read`).catch(() => {});
    } catch {}
  },

  markAllNotificationsRead: (vendorId) => {
    let notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    notifs = notifs.map((n) => (!vendorId || !n.vendorId || n.vendorId === vendorId ? { ...n, read: true } : n));
    saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    try {
      apiClient.put(`/crm-sync/notifications/read-all?role=VENDOR${vendorId ? `&vendorId=${vendorId}` : ""}`).catch(() => {});
    } catch {}
  },

  deleteNotification: (id, vendorId) => {
    let notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    notifs = notifs.filter((n) => n.id !== id && n._id !== id);
    saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    try {
      apiClient.delete(`/crm-sync/notifications/${id}`).catch(() => {});
    } catch {}
  },

  clearAllNotifications: (vendorId) => {
    let notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    if (vendorId) {
      notifs = notifs.filter((n) => n.vendorId && n.vendorId !== vendorId);
    } else {
      notifs = [];
    }
    saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    try {
      apiClient.delete(`/crm-sync/notifications?role=VENDOR${vendorId ? `&vendorId=${vendorId}` : ""}`).catch(() => {});
    } catch {}
  },

  // ----------------------------------------------------
  // ADMIN NOTIFICATIONS
  // ----------------------------------------------------
  getAdminNotifications: () => {
    try {
      apiClient.get("/crm-sync/notifications?role=ADMIN")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.notifications) && res.data.notifications.length > 0) {
            const current = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
            const map = new Map();
            current.forEach((n) => map.set(n.id || n._id, n));
            res.data.notifications.forEach((n) => {
              const key = n.id || n._id;
              const prev = map.get(key) || {};
              const isRead = Boolean(prev.read || n.read);
              map.set(key, { ...prev, ...n, read: isRead });
            });
            saveData(ADMIN_NOTIFICATIONS_KEY, Array.from(map.values()));
          }
        }).catch(() => {});
    } catch {}
    return loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
  },

  addAdminNotification: (notif) => {
    const notifs = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
    const newNotif = {
      id: `admin-notif-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    notifs.unshift(newNotif);
    saveData(ADMIN_NOTIFICATIONS_KEY, notifs);
    try {
      apiClient.post("/crm-sync/notifications", {
        ...newNotif,
        recipientRole: "ADMIN",
      }).catch(() => {});
    } catch {}
    return newNotif;
  },

  markAdminNotificationRead: (id) => {
    const notifs = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
    const idx = notifs.findIndex((n) => n.id === id || n._id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      saveData(ADMIN_NOTIFICATIONS_KEY, notifs);
    }
  },

  markAllAdminNotificationsRead: () => {
    let notifs = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
    notifs = notifs.map((n) => ({ ...n, read: true }));
    saveData(ADMIN_NOTIFICATIONS_KEY, notifs);
  },

  deleteAdminNotification: (id) => {
    let notifs = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
    notifs = notifs.filter((n) => n.id !== id && n._id !== id);
    saveData(ADMIN_NOTIFICATIONS_KEY, notifs);
  },

  clearAllAdminNotifications: () => {
    saveData(ADMIN_NOTIFICATIONS_KEY, []);
  },

  // ----------------------------------------------------
  // ADMIN ENTERPRISE OVERVIEW STATS (MATCHING CRM SPEC)
  // ----------------------------------------------------
  getAdminVendorOverviewStats: async () => {
    await delay(30);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);

    const totalVendors = vendors.length;
    const pendingVendors = vendors.filter((v) => v.status === "Pending").length;
    const approvedVendors = vendors.filter((v) => v.status === "Approved").length;
    const suspendedVendors = vendors.filter((v) => v.status === "Suspended").length;

    const totalCandidates = candidates.length;
    const pendingCandidates = apps.filter((a) => a.status === "Submitted" || a.status === "Under Review").length;
    const selectedCandidates = apps.filter((a) => a.status === "Selected").length;
    const inProcessing = apps.filter((a) => a.status === "Selected" && a.processing?.currentStageIndex < 7).length;
    const deployedCandidates = apps.filter((a) => a.status === "Completed" || a.status === "Deployed" || a.status === "Joined").length;

    const notifs = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
    
    // Map notifications to activity format
    const recentActivity = notifs.slice(0, 5).map((n) => ({
      id: n.id,
      type: n.title.toLowerCase().includes("submission") ? "submission" : n.title.toLowerCase().includes("payment") ? "payment" : "vendor",
      title: n.title,
      description: n.message,
      time: new Date(n.timestamp).toLocaleDateString(),
    }));

    let pendingPayments = 0;
    let overduePayments = 0;

    apps.forEach((app) => {
      if (app.processMilestones) {
        app.processMilestones.forEach(m => {
          if (m.paymentStatus === "Pending") pendingPayments += Number(m.paymentAmount) || 0;
          if (m.paymentStatus === "Overdue") overduePayments += Number(m.paymentAmount) || 0;
        });
      }
    });

    let totalClients = 0;
    let totalProjects = 0;
    try {
      const clientsData = JSON.parse(localStorage.getItem("crm_clients_data_v3") || "[]");
      totalClients = clientsData.length;
      clientsData.forEach(c => {
        if (c.projects) totalProjects += c.projects.length;
      });
    } catch(e) {}

    return {
      totalClients,
      totalProjects,
      totalVendors,
      pendingVendors,
      approvedVendors,
      suspendedVendors,
      totalCandidates,
      pendingCandidates,
      selectedCandidates,
      inProcessing,
      deployedCandidates,
      pendingPayments,
      overduePayments,
      recentActivity,
    };
  },

  // Get full submissions history for a specific candidate across all projects
  getCandidateSubmissionsHistory: async (candidateId) => {
    await delay(30);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    return apps.filter((a) => a.candidateId === candidateId);
  },

  // Get all documents across vendors and candidates
  getAllDocuments: async ({ vendorId = "All", candidateId = "All", type = "All", status = "All", search = "" } = {}) => {
    await delay(50);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);

    const docs = [];

    // Vendor statutory documents
    vendors.forEach((v) => {
      (v.documents || []).forEach((d, idx) => {
        docs.push({
          id: `DOC-VND-${v.id}-${idx}`,
          title: d.name,
          fileName: d.fileName,
          type: d.type || "License",
          entityType: "Vendor",
          ownerName: v.companyName,
          ownerId: v.id,
          vendorId: v.id,
          vendorName: v.companyName,
          project: "Organization Statutory",
          size: d.size || "1.2 MB",
          status: v.status === "Approved" ? "Verified" : v.status === "Rejected" ? "Rejected" : "Pending Verification",
          uploadedAt: v.registeredAt ? v.registeredAt.split("T")[0] : "2026-08-15",
        });
      });
    });

    // Candidate dossiers
    candidates.forEach((c) => {
      const v = vendors.find((vend) => vend.id === c.vendorId);
      const candApps = apps.filter((a) => a.candidateId === c.id);
      const projName = candApps.length > 0 ? candApps[0].projectName : "General Pool";

      (c.documents || []).forEach((d, idx) => {
        docs.push({
          id: `DOC-CND-${c.id}-${idx}`,
          title: d.name,
          fileName: d.fileName,
          type: d.type || "Certificate",
          entityType: "Candidate",
          ownerName: c.fullName,
          ownerId: c.id,
          vendorId: c.vendorId,
          vendorName: v?.companyName || c.vendorId,
          project: projName,
          size: d.size || "950 KB",
          status: "Verified",
          uploadedAt: c.createdAt ? c.createdAt.split("T")[0] : "2026-08-20",
        });
      });
    });

    let filtered = docs;
    if (vendorId !== "All") filtered = filtered.filter((d) => d.vendorId === vendorId);
    if (candidateId !== "All") filtered = filtered.filter((d) => d.ownerId === candidateId);
    if (type !== "All") filtered = filtered.filter((d) => d.type === type);
    if (status !== "All") filtered = filtered.filter((d) => d.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.ownerName.toLowerCase().includes(q) ||
          d.vendorName.toLowerCase().includes(q)
      );
    }

    return filtered;
  },

  reassignApplicationToProject: async (applicationId, projectId, projectName, position, requirementCode) => {
    await delay(100);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");
    
    apps[idx].projectId = projectId;
    apps[idx].projectName = projectName;
    apps[idx].position = position;
    apps[idx].requirementCode = requirementCode || "REQ-0000";
    apps[idx].status = "Submitted";
    apps[idx].rejectionReason = "";
    apps[idx].rejectionDate = null;
    apps[idx].processing = {
      currentStageIndex: 0,
      stages: [
        { name: "Medical", status: "Pending", date: "" },
        { name: "GAMCA", status: "Pending", date: "" },
        { name: "Document Verification", status: "Pending", date: "" },
        { name: "Visa Processing", status: "Pending", date: "" },
        { name: "Visa Stamping", status: "Pending", date: "" },
        { name: "Emigration", status: "Pending", date: "" },
        { name: "Ticketing", status: "Pending", date: "" },
        { name: "Deployment", status: "Pending", date: "" }
      ]
    };
    
    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },
};

export default crmVendorService;
