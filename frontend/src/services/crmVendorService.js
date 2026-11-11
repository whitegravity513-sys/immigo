

import crmClientService from "./crmClientService.js";
import { apiClient } from "./apiClient.js";
import { initialClients } from "../data/mockClients.js";

const VENDORS_STORAGE_KEY = "immigo_crm_vendors_v3";
const CANDIDATES_STORAGE_KEY = "immigo_crm_candidates_v3";
const APPLICATIONS_STORAGE_KEY = "immigo_crm_applications_v3";
const PROJECTS_CACHE_KEY = "immigo_crm_projects_cache_v1";
const MILESTONE_TEMPLATES_KEY = "immigo_crm_milestone_templates_v3";
const VENDOR_NOTIFICATIONS_KEY = "immigo_crm_vendor_notifications_v3";
const ADMIN_NOTIFICATIONS_KEY = "immigo_crm_admin_notifications_v3";

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));


const INITIAL_VENDORS = [];

const INITIAL_CANDIDATES = [];
const INITIAL_APPLICATIONS = [];
const INITIAL_ADMIN_NOTIFICATIONS = [];
const INITIAL_NOTIFICATIONS = [];

const compactCachePayload = (value) => {
  if (Array.isArray(value)) {
    return value.map(compactCachePayload);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (
        typeof v === "string" &&
        v.startsWith("data:") &&
        v.length > 16384 &&
        ["fileUrl", "photo", "visaDocumentUrl", "url", "avatar", "signatureUrl"].includes(k)
      ) {
        out[k] = "";
      } else {
        out[k] = compactCachePayload(v);
      }
    }
    return out;
  }
  return value;
};

const loadData = (key, fallback = []) => {
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

const saveData = (key, data, { silent = false } = {}) => {
  try {
    const serialized = JSON.stringify(data);
    if (localStorage.getItem(key) !== serialized) {
      try {
        localStorage.setItem(key, serialized);
      } catch (storageErr) {
        if (
          storageErr?.name === "QuotaExceededError" ||
          storageErr?.code === 22 ||
          String(storageErr?.message || "").toLowerCase().includes("quota")
        ) {
          const compacted = JSON.stringify(compactCachePayload(data));
          localStorage.setItem(key, compacted);
        } else {
          throw storageErr;
        }
      }
    }
    if (!silent && typeof window !== "undefined") {
      if (key === APPLICATIONS_STORAGE_KEY) {
        window.dispatchEvent(new CustomEvent("immigo:application-update", { detail: data }));
        window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: data }));
        window.dispatchEvent(new CustomEvent("immigo:vendor-hr-refresh", { detail: data }));
      } else if (key === CANDIDATES_STORAGE_KEY) {
        window.dispatchEvent(new CustomEvent("immigo:candidate-update", { detail: data }));
        window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: data }));
      } else if (key === VENDORS_STORAGE_KEY) {
        window.dispatchEvent(new CustomEvent("immigo:vendor-update", { detail: data }));
        window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: data }));
      }
    }
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
};

const emitAppRefreshEvents = (detail) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("immigo:vendor-hr-refresh", { detail }));
    window.dispatchEvent(new CustomEvent("immigo:application-update", { detail }));
    window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail }));
  }
};

export const crmVendorService = {
  apiClient,

  
  
  
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
        saveData(VENDORS_STORAGE_KEY, vendors, { silent: true });

        return vendor;
      }
    } catch {}
    return crmVendorService.getCurrentVendor();
  },

  register: async function (vendorData) {
    return this.registerVendor(vendorData);
  },

  registerVendor: async (vendorData) => {
    try {
      const payload = {
        ...vendorData,
        phone: vendorData.phone || vendorData.mobile,
      };
      const response = await apiClient.post("/auth/vendor/register", payload);
      
      const newVendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId, 
      };
      
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      vendors.unshift(newVendor);
      saveData(VENDORS_STORAGE_KEY, vendors);

      return { success: true, vendor: newVendor, ...newVendor };
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to register vendor", { cause: error });
    }
  },

  loginVendor: async (emailOrId, password) => {
    try {
      const response = await apiClient.post("/auth/vendor/login", { emailOrId, password });
      
      const vendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId, 
      };

      
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
      throw new Error(error.response?.data?.message || "Invalid Vendor ID/Email or Password.", { cause: error });
    }
  },

  uploadVendorDocuments: async (documents, bankDetails) => {
    try {
      const response = await apiClient.post("/auth/vendor/upload-documents", { documents, bankDetails });
      const updatedVendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
        documentsUploaded: true,
      };

      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === updatedVendor.id || v.email === updatedVendor.email);
      if (idx !== -1) vendors[idx] = updatedVendor;
      else vendors.unshift(updatedVendor);
      saveData(VENDORS_STORAGE_KEY, vendors);

      try {
        const stored = localStorage.getItem("user") || localStorage.getItem("immigo_user");
        const u = stored ? JSON.parse(stored) : {};
        const mergedUser = { ...u, ...updatedVendor, role: u?.role || "vendor" };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        localStorage.setItem("immigo_user", JSON.stringify(mergedUser));
      } catch {}

      
      crmVendorService.addAdminNotification({
        title: "Vendor Documents Submitted",
        message: `${updatedVendor.companyName || "Vendor"} (${updatedVendor.vendorId || updatedVendor.id}) submitted statutory documents for Admin verification.`,
        type: "warning",
        vendorId: updatedVendor.id,
        link: `/admin/vendor/vendors?vendorId=${updatedVendor.vendorId || updatedVendor.id}&view=docs`,
      });

      return updatedVendor;
    } catch (err) {
      const cur = crmVendorService.getCurrentVendor();
      if (!cur) throw new Error(err.response?.data?.message || err.message, { cause: err });
      const docPayload = {
        documents: documents || cur.documents || [],
        bankDetails: bankDetails || cur.bankDetails || {},
        documentsUploaded: true,
        documentVerified: false,
        status: "Documents Under Review",
        onboardingStage: "DOCS_SUBMITTED",
      };
      const saved = await crmVendorService.updateVendorProfile(cur.id || cur.vendorId, docPayload);
      crmVendorService.addAdminNotification({
        title: "Vendor Documents Submitted",
        message: `${cur.companyName || "Vendor"} submitted statutory documents for review.`,
        type: "warning",
        vendorId: cur.id || cur.vendorId,
        link: `/admin/vendor/vendors?vendorId=${cur.vendorId || cur.id}&view=docs`,
      });
      return saved || { ...cur, ...docPayload };
    }
  },

  signVendorMou: async ({ signatoryName, designation, signatureData, signedFileUrl, signedFileName = "", signMethod = "digital" } = {}) => {
    const normalizedMethod = signMethod === "upload" ? "upload" : "digital";
    try {
      const response = await apiClient.post("/auth/vendor/sign-mou", {
        signatoryName,
        designation,
        signatureData,
        signedFileUrl,
        signedFileName,
        signMethod: normalizedMethod,
      });
      const updatedVendor = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
        status: response.data.vendor.status || "Pending MOU Approval",
        mouStatus: response.data.vendor.mouStatus || "Under Review",
        mouSigned: true,
        mouSignMethod: response.data.vendor.mouSignMethod || normalizedMethod,
        signedMouDocUrl: response.data.vendor.signedMouDocUrl || signedFileUrl || "",
        onboardingStage: response.data.vendor.onboardingStage || "MOU_UNDER_REVIEW",
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

      crmVendorService.addAdminNotification({
        title: "Signed MOU Submitted",
        message: `${updatedVendor.companyName || "Vendor"} (${updatedVendor.vendorId || updatedVendor.id}) submitted their signed MOU (${normalizedMethod === "upload" ? "Uploaded Copy" : "Digital Sign"}). Pending Admin approval.`,
        type: "warning",
        vendorId: updatedVendor.id,
        link: `/admin/vendor/vendors?vendorId=${updatedVendor.vendorId || updatedVendor.id}&view=mou`,
      });

      return updatedVendor;
    } catch (err) {
      if (err.response?.status && err.response.status < 500) {
        throw new Error(err.response?.data?.message || err.message || "Failed to submit signed MOU.", { cause: err });
      }
      const cur = crmVendorService.getCurrentVendor();
      if (!cur) throw new Error(err.response?.data?.message || err.message, { cause: err });
      const mouPayload = {
        mouSigned: true,
        mouStatus: "Under Review",
        status: "Pending MOU Approval",
        onboardingStage: "MOU_UNDER_REVIEW",
        mouSignMethod: normalizedMethod,
        signedMouDocUrl: signedFileUrl || "",
        signedMou: {
          signatoryName,
          designation,
          signatureData: normalizedMethod === "upload" ? signedFileName || "Uploaded Signed MOU Copy" : signatureData,
          signedFileUrl: signedFileUrl || "",
          signedAt: new Date().toISOString(),
        },
      };
      const saved = await crmVendorService.updateVendorProfile(cur.id || cur.vendorId, mouPayload);
      crmVendorService.addAdminNotification({
        title: "Signed MOU Submitted",
        message: `${cur.companyName || "Vendor"} submitted their signed MOU for Admin verification and approval.`,
        type: "warning",
        vendorId: cur.id || cur.vendorId,
        link: `/admin/vendor/vendors?vendorId=${cur.vendorId || cur.id}&view=mou`,
      });
      return saved || { ...cur, ...mouPayload };
    }
  },

  getCurrentVendor: () => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("immigo_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed?.role === "vendor" || parsed?.companyName) {
        
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

    
    const targetLink = Array.isArray(profileData?.documents)
      ? `/admin/vendor/vendors?vendorId=${finalVendor.vendorId || finalVendor.id}&view=docs`
      : `/admin/vendor/vendors?vendorId=${finalVendor.vendorId || finalVendor.id}`;

    crmVendorService.addAdminNotification({
      title: Array.isArray(profileData?.documents) ? "Vendor Document Uploaded" : "Vendor Profile Updated",
      message: Array.isArray(profileData?.documents)
        ? `${finalVendor.companyName || "Vendor"} (${finalVendor.vendorId || finalVendor.id}) uploaded statutory document(s) for review.`
        : `${finalVendor.companyName || "Vendor"} updated their profile or compliance details.`,
      type: "info",
      vendorId: finalVendor.id,
      link: targetLink,
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

  updateCandidatePhoto: async (candidateId, photoBase64) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found.");

    candidates[idx].photo = photoBase64;
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  
  
  
  
  getVendorsSync: () => {
    return loadData(VENDORS_STORAGE_KEY, []);
  },

  getVendors: async ({ search = "", status = "All", country = "All" } = {}) => {
    let vendors;
    try {
      const response = await apiClient.get("/admin/vendors");
      if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        vendors = response.data.vendors.map((v) => ({
          ...v,
          id: v.vendorId || v._id,
        }));
        saveData(VENDORS_STORAGE_KEY, vendors, { silent: true });
      } else {
        vendors = loadData(VENDORS_STORAGE_KEY, []);
      }
    } catch {
      vendors = loadData(VENDORS_STORAGE_KEY, []);
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
        const fetched = {
          ...response.data.vendor,
          id: response.data.vendor.vendorId || response.data.vendor._id,
        };
        const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
        const idx = vendors.findIndex(
          (v) => v.id === fetched.id || v.vendorId === fetched.vendorId || v._id === fetched._id
        );
        if (idx !== -1) vendors[idx] = { ...vendors[idx], ...fetched };
        else vendors.unshift(fetched);
        saveData(VENDORS_STORAGE_KEY, vendors, { silent: true });
        return fetched;
      }
    } catch {}
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    return vendors.find((v) => v.id === vendorId || v.vendorId === vendorId || v._id === vendorId) || null;
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
        message: `Your statutory documents are approved! Official MOU agreement has been issued by Admin. Please review and submit signed MOU.`,
        type: "success",
        link: "/vendor/documents?openMou=1",
      });

      return updated;
    } catch (err) {
      
      return crmVendorService.signOrVerifyMOU(vendorId, "Sent");
    }
  },

  updateVendor: async (vendorId, updateData) => {
    let updatedVendor = null;
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}`, updateData);
      if (response.data?.vendor) {
        updatedVendor = {
          ...response.data.vendor,
          id: response.data.vendor.vendorId || response.data.vendor._id,
        };
      }
    } catch (e) {
      console.warn("Backend update vendor fallback:", e);
    }

    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId || v.vendorId === vendorId);
    const finalVendor = updatedVendor
      ? { ...(vendors[idx] || {}), ...updatedVendor }
      : { ...(vendors[idx] || {}), ...updateData, id: vendorId };

    if (idx !== -1) {
      vendors[idx] = finalVendor;
    } else {
      vendors.unshift(finalVendor);
    }
    saveData(VENDORS_STORAGE_KEY, vendors);
    return finalVendor;
  },

  deleteVendor: async (vendorId) => {
    try {
      await apiClient.delete(`/admin/vendors/${vendorId}`);
    } catch (e) {
      console.warn("Backend delete vendor fallback:", e);
    }

    const vendors = loadData(VENDORS_STORAGE_KEY, []);
    const filtered = vendors.filter(
      (v) =>
        String(v.id) !== String(vendorId) &&
        String(v.vendorId) !== String(vendorId) &&
        String(v._id) !== String(vendorId)
    );
    saveData(VENDORS_STORAGE_KEY, filtered);
    return { success: true, id: vendorId };
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

  approveRegistration: async (vendorId, remarks = "") => {
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/approve-registration`, { remarks });
      const updated = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
      };
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId || v.id === updated.id);
      if (idx !== -1) vendors[idx] = updated;
      saveData(VENDORS_STORAGE_KEY, vendors);
      return updated;
    } catch (err) {
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx === -1) throw new Error("Vendor not found", { cause: err });
      vendors[idx].status = "Documents Pending";
      vendors[idx].approvedAt = new Date().toISOString();
      vendors[idx].adminRemarks = remarks;
      saveData(VENDORS_STORAGE_KEY, vendors);
      return vendors[idx];
    }
  },

  holdRegistration: async (vendorId, remarks = "") => {
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/hold-registration`, { remarks });
      const updated = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
      };
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId || v.id === updated.id);
      if (idx !== -1) vendors[idx] = updated;
      saveData(VENDORS_STORAGE_KEY, vendors);
      return updated;
    } catch (err) {
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx === -1) throw new Error("Vendor not found", { cause: err });
      vendors[idx].status = "Registration On Hold";
      vendors[idx].adminRemarks = remarks;
      saveData(VENDORS_STORAGE_KEY, vendors);
      return vendors[idx];
    }
  },

  requestDocCorrection: async (vendorId, remarks = "") => {
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/request-doc-correction`, { remarks });
      const updated = {
        ...response.data.vendor,
        id: response.data.vendor.vendorId || response.data.vendor._id,
      };
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId || v.id === updated.id);
      if (idx !== -1) vendors[idx] = updated;
      saveData(VENDORS_STORAGE_KEY, vendors);
      return updated;
    } catch (err) {
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx === -1) throw new Error("Vendor not found", { cause: err });
      vendors[idx].status = "Documents Correction Required";
      vendors[idx].adminRemarks = remarks;
      saveData(VENDORS_STORAGE_KEY, vendors);
      return vendors[idx];
    }
  },

  approveMouAndActivate: async (vendorId) => {
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/approve-mou`);
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
          if (u.id === vendorId || u.vendorId === vendorId || (updated.email && u.email?.toLowerCase() === updated.email?.toLowerCase())) {
            localStorage.setItem("user", JSON.stringify({ ...u, ...updated }));
            localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...updated }));
          }
        }
      } catch {}
      return updated;
    } catch (err) {
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx === -1) throw new Error("Vendor not found", { cause: err });
      vendors[idx].status = "Active";
      vendors[idx].mouSigned = true;
      vendors[idx].mouStatus = "Approved";
      vendors[idx].onboardingStage = "COMPLETED";
      vendors[idx].documentVerified = true;
      vendors[idx].adminRemarks = "";
      vendors[idx].activationDate = new Date().toISOString();
      saveData(VENDORS_STORAGE_KEY, vendors);
      return vendors[idx];
    }
  },

  requestMouCorrection: async (vendorId, remarks = "") => {
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/request-mou-correction`, { remarks });
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
          if (u.id === vendorId || u.vendorId === vendorId || (updated.email && u.email?.toLowerCase() === updated.email?.toLowerCase())) {
            localStorage.setItem("user", JSON.stringify({ ...u, ...updated }));
            localStorage.setItem("immigo_user", JSON.stringify({ ...u, ...updated }));
          }
        }
      } catch {}
      return updated;
    } catch (err) {
      const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
      const idx = vendors.findIndex((v) => v.id === vendorId);
      if (idx === -1) throw new Error("Vendor not found", { cause: err });
      vendors[idx].status = "MOU Correction Required";
      vendors[idx].mouStatus = "Correction Required";
      vendors[idx].mouSigned = false;
      vendors[idx].onboardingStage = "MOU_SENT";
      vendors[idx].adminRemarks = remarks;
      saveData(VENDORS_STORAGE_KEY, vendors);
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
      link: status === "Sent" ? "/vendor/documents?openMou=1" : "/vendor/documents",
    });

    return vendors[idx];
  },

  rejectVendor: async (vendorId, reason = "") => {
    let apiVendor = null;
    try {
      const response = await apiClient.put(`/admin/vendors/${vendorId}/reject`, { reason });
      if (response.data?.vendor) {
        apiVendor = {
          ...response.data.vendor,
          id: response.data.vendor.vendorId || response.data.vendor._id,
        };
      }
    } catch {}

    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex(
      (v) => v.id === vendorId || v.vendorId === vendorId || v._id === vendorId
    );
    if (idx !== -1) {
      if (apiVendor) {
        vendors[idx] = { ...vendors[idx], ...apiVendor };
      } else {
        const wasMouStage =
          vendors[idx].mouSigned ||
          ["MOU Pending", "Pending MOU Approval", "MOU Under Review", "MOU Correction Required"].includes(
            vendors[idx].status
          ) ||
          ["Sent", "Signed", "Under Review", "Correction Required"].includes(vendors[idx].mouStatus);
        vendors[idx].status = "Rejected";
        if (wasMouStage) {
          vendors[idx].mouStatus = "Rejected";
          vendors[idx].mouSigned = false;
        }
        vendors[idx].rejectionReason = reason;
      }
      saveData(VENDORS_STORAGE_KEY, vendors);
    }

    crmVendorService.addNotification({
      vendorId: vendorId,
      title: "Vendor Account Rejected",
      message: `Your account for ${(apiVendor || vendors[idx])?.companyName || "Vendor"} has been rejected by Admin. Reason: ${reason}`,
      type: "error",
      link: "/vendor/dashboard",
    });

    return apiVendor || vendors[idx] || { id: vendorId, status: "Rejected", rejectionReason: reason };
  },

  suspendVendor: async (vendorId) => {
    try {
      await apiClient.put(`/admin/vendors/${vendorId}/suspend`);
    } catch {}

    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].status = vendors[idx].status === "Suspended" ? "Active" : "Suspended";
    saveData(VENDORS_STORAGE_KEY, vendors);
    return vendors[idx];
  },

  
  
  
  getCandidates: async (vendorId, { search = "", position = "All", country = "All", experience = "All" } = {}) => {
    try {
      const res = await apiClient.get(`/crm-sync/candidates${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.candidates)) {
        const local = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
        const prevMap = new Map();
        const nextMap = new Map();
        local.forEach((c) => {
          const key = String(c.id || c.candidateId || c._id || "");
          if (!key) return;
          prevMap.set(key, c);
          if (vendorId && c.vendorId && String(c.vendorId) !== String(vendorId)) {
            nextMap.set(key, c);
          }
        });
        res.data.candidates.forEach((c) => {
          const key = String(c.id || c.candidateId || c._id || "");
          if (!key) return;
          const existing = prevMap.get(key);
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
            nextMap.set(key, {
              ...existing,
              ...c,
              id: key,
              documents: mergedDocs,
              verificationStatus:
                existing.verificationStatus === "Verified" || existing.verificationStatus === "Rejected"
                  ? existing.verificationStatus
                  : c.verificationStatus,
            });
          } else {
            nextMap.set(key, { ...c, id: key });
          }
        });
        const synced = Array.from(nextMap.values());
        saveData(CANDIDATES_STORAGE_KEY, synced, { silent: true });
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
    let candidates;
    try {
      candidates = await crmVendorService.getCandidates();
    } catch {
      candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    }
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return null;

    let applications;
    try {
      applications = await crmVendorService.getApplications();
    } catch {
      applications = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    }
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
      await apiClient.post("/crm-sync/candidates", newCandidate);
    } catch {}

    crmVendorService.addAdminNotification({
      title: "New Candidate Registered",
      message: `${newCandidate.vendorName || "Vendor"} registered candidate ${newCandidate.fullName} (${newCandidate.currentPosition || "General"}).`,
      type: "info",
      link: `/admin/vendor/candidates?candidateId=${newCandidate.id}`,
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


  
  
  
  findAppIndex: (apps, applicationId) => {
    const target = String(applicationId || "").trim();
    if (!target || !Array.isArray(apps)) return -1;
    return apps.findIndex(
      (a) =>
        String(a?.id || "") === target ||
        String(a?.applicationId || "") === target ||
        String(a?._id || "") === target
    );
  },

  normalizeStageActivation: (milestones = []) => {
    if (!Array.isArray(milestones)) return [];
    const normalized = milestones.map((m, mIdx) => {
      const amt = Number(m?.paymentAmount ?? m?.amount ?? 0);
      const stages = (Array.isArray(m?.stages) ? m.stages : []).map((s, sIdx) => ({
        ...s,
        id: String(s?.id || `s${mIdx}_${sIdx + 1}`),
        name: s?.name || `Stage ${sIdx + 1}`,
        status: s?.status || "Pending",
        completedAt: s?.completedAt || null,
        completedBy: s?.completedBy || null,
        remark: s?.remark || "",
        visaDocumentUrl: s?.visaDocumentUrl || null,
        visaFileName: s?.visaFileName || null,
        document: s?.document || null,
      }));
      return {
        ...m,
        id: String(m?.id || `m${mIdx}`),
        name: m?.name || `Milestone ${mIdx + 1}`,
        paymentAmount: amt,
        amount: amt,
        paymentStatus:
          m?.paymentStatus === "Approved"
            ? "Approved"
            : m?.paymentStatus === "Submitted" ||
              m?.paymentStatus === "Pending Verification" ||
              m?.paymentStatus === "Rejected"
            ? m.paymentStatus
            : amt === 0
            ? "Not Required"
            : m?.paymentStatus || (mIdx === 0 ? "Payment Required" : "Locked"),
        status: m?.status || (mIdx === 0 ? (amt > 0 ? "Payment Required" : "Active") : "Locked"),
        stages,
      };
    });

    for (let i = 0; i < normalized.length; i += 1) {
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
        const allDone = cur.stages.every((s) => s.status === "Completed");
        if (allDone) {
          cur.status = "Completed";
        } else {
          const hasActive = cur.stages.some((s) => s.status === "In Progress");
          if (!hasActive) {
            const firstIncomplete = cur.stages.find((s) => s.status !== "Completed");
            if (firstIncomplete) firstIncomplete.status = "In Progress";
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
  },

  resolveProjectFromCaches: (app, projectListOverride = null) => {
    if (!app) return null;
    const candidatesList = [];
    if (Array.isArray(projectListOverride) && projectListOverride.length > 0) {
      candidatesList.push(...projectListOverride);
    }
    try {
      const cachedProjects = JSON.parse(localStorage.getItem(PROJECTS_CACHE_KEY) || "[]");
      if (Array.isArray(cachedProjects)) {
        candidatesList.push(...cachedProjects);
      }
    } catch {}
    try {
      const rawClients =
        localStorage.getItem("crm_clients_data_v3") ||
        localStorage.getItem("crm_clients_data_v2") ||
        localStorage.getItem("crm_clients_data") ||
        "[]";
      const clientsData = JSON.parse(rawClients);
      if (Array.isArray(clientsData)) {
        clientsData.forEach((client) => {
          if (Array.isArray(client?.projects)) {
            candidatesList.push(...client.projects);
          }
        });
      }
    } catch {}

    const targetProjId = String(app.projectId || "").trim();
    const targetProjName = String(app.projectName || "").trim().toLowerCase();

    return (
      candidatesList.find((p) => {
        if (!p) return false;
        const pIds = [
          p.id,
          p.projectId,
          p._id,
          ...(Array.isArray(p.rawIdCandidates) ? p.rawIdCandidates : []),
        ]
          .filter(Boolean)
          .map((v) => String(v).trim());
        if (targetProjId && pIds.includes(targetProjId)) return true;
        const pName = String(p.projectName || p.name || p.title || "").trim().toLowerCase();
        if (targetProjName && pName && pName === targetProjName) return true;
        return false;
      }) || null
    );
  },

  getProjectMilestonesForApp: (app, projectListOverride = null) => {
    if (!app) return null;
    const matchedProj = crmVendorService.resolveProjectFromCaches(app, projectListOverride);
    if (!matchedProj) return null;

    let rawList = [];
    if (Array.isArray(matchedProj.paymentMilestones) && matchedProj.paymentMilestones.length > 0) {
      rawList = matchedProj.paymentMilestones;
    } else if (
      Array.isArray(matchedProj.paymentMilestoneConfig?.milestones) &&
      matchedProj.paymentMilestoneConfig.milestones.length > 0
    ) {
      rawList = matchedProj.paymentMilestoneConfig.milestones;
    } else if (
      Array.isArray(matchedProj.recruitmentConfig?.paymentMilestones) &&
      matchedProj.recruitmentConfig.paymentMilestones.length > 0
    ) {
      rawList = matchedProj.recruitmentConfig.paymentMilestones;
    }

    const projTotal = Number(
      matchedProj.totalMilestoneAmount ??
        matchedProj.totalAgreedAmount ??
        matchedProj.paymentMilestoneConfig?.totalFeePerCandidate ??
        matchedProj.recruitmentConfig?.totalMilestoneAmount ??
        0
    );

    if (rawList.length === 0 && projTotal > 0) {
      return [
        {
          id: "m0",
          name: "Milestone 1: Processing & Deployment",
          paymentAmount: projTotal,
          amount: projTotal,
          stages: [{ id: "s0_1", name: "Selection & Processing" }],
        },
      ];
    }

    if (rawList.length === 0) return null;

    const rawSum = rawList.reduce(
      (sum, m) => sum + Number(m?.paymentAmount ?? m?.amount ?? 0),
      0
    );
    if (rawSum <= 0 && projTotal > 0) {
      const base = Math.floor(projTotal / rawList.length);
      const remainder = projTotal - base * rawList.length;
      return rawList.map((m, idx) => {
        const distributed = idx === rawList.length - 1 ? base + remainder : base;
        return {
          ...m,
          paymentAmount: distributed,
          amount: distributed,
        };
      });
    }

    return rawList;
  },

  syncAppMilestonesWithProject: (app, projectListOverride = null) => {
    if (!app) return [];
    const existingMs = Array.isArray(app.processMilestones) ? app.processMilestones : [];
    if (app.milestonesOverridden && existingMs.length > 0) {
      return crmVendorService.normalizeStageActivation(existingMs);
    }

    const projMilestones = crmVendorService.getProjectMilestonesForApp(app, projectListOverride);
    if (!projMilestones || projMilestones.length === 0) {
      return existingMs.length > 0 ? crmVendorService.normalizeStageActivation(existingMs) : [];
    }

    const mapped = projMilestones.map((pm, mIdx) => {
      const pmId = String(pm.id || `m${mIdx}`);
      const pmNameLower = String(pm.name || "").trim().toLowerCase();
      const existingM =
        existingMs.find((em) => String(em?.id || "") === pmId) ||
        (pmNameLower
          ? existingMs.find((em) => String(em?.name || "").trim().toLowerCase() === pmNameLower)
          : null) ||
        existingMs[mIdx];

      const isExistingPaid =
        existingM &&
        (existingM.paymentStatus === "Approved" ||
          existingM.status === "Paid" ||
          existingM.status === "Completed");

      const pmAmt = Number(pm.paymentAmount ?? pm.amount ?? 0);
      const amt = pmAmt;

      const rawStages =
        Array.isArray(pm.stages) && pm.stages.length > 0
          ? pm.stages
          : Array.isArray(existingM?.stages) && existingM.stages.length > 0
          ? existingM.stages
          : [{ id: `s${mIdx}_1`, name: `${pm.name || `Milestone ${mIdx + 1}`} Verification` }];

      const stages = rawStages.map((stg, sIdx) => {
        const stgId = String(stg?.id || `s${mIdx}_${sIdx + 1}`);
        const stgNameLower = String(stg?.name || "").trim().toLowerCase();
        const existingStage =
          existingM?.stages?.find((es) => String(es?.id || "") === stgId) ||
          (stgNameLower
            ? existingM?.stages?.find(
                (es) => String(es?.name || "").trim().toLowerCase() === stgNameLower
              )
            : null) ||
          existingM?.stages?.[sIdx];

        const stageStatus =
          existingStage?.status ||
          (mIdx === 0 && sIdx === 0 && amt === 0 ? "In Progress" : "Pending");

        return {
          id: stgId,
          name: stg.name || `Stage ${sIdx + 1}`,
          status: stageStatus,
          completedAt: existingStage?.completedAt || null,
          completedBy: existingStage?.completedBy || null,
          remark: existingStage?.remark || "",
          visaDocumentUrl: existingStage?.visaDocumentUrl || null,
          visaFileName: existingStage?.visaFileName || null,
          document: existingStage?.document || null,
        };
      });

      const allStagesDone = stages.length > 0 && stages.every((s) => s.status === "Completed");
      let mStatus = "Locked";
      let pStatus = amt > 0 ? "Locked" : "Not Required";

      if (isExistingPaid) {
        mStatus = allStagesDone ? "Completed" : existingM.status || "Active";
        pStatus = "Approved";
      } else if (existingM) {
        mStatus = existingM.status || (allStagesDone ? "Completed" : mIdx === 0 ? (amt > 0 ? "Payment Required" : "Active") : "Locked");
        pStatus =
          existingM.paymentStatus &&
          ["Submitted", "Pending Verification", "Rejected"].includes(existingM.paymentStatus)
            ? existingM.paymentStatus
            : amt > 0
            ? mStatus === "Locked"
              ? "Locked"
              : "Payment Required"
            : "Not Required";
      } else if (mIdx === 0) {
        if (amt > 0) {
          mStatus = "Payment Required";
          pStatus = "Payment Required";
        } else {
          mStatus = "Active";
          pStatus = "Not Required";
        }
      }

      if (allStagesDone) {
        mStatus = "Completed";
      }

      return {
        ...(existingM || {}),
        id: pmId,
        name: pm.name || `Milestone ${mIdx + 1}`,
        description: pm.description || existingM?.description || "",
        paymentAmount: amt,
        amount: amt,
        paymentStatus: pStatus,
        status: mStatus,
        paymentDate: existingM?.paymentDate || null,
        paymentMode: existingM?.paymentMode || null,
        paymentRemark: existingM?.paymentRemark || "",
        approvedBy: existingM?.approvedBy || null,
        paidBy: existingM?.paidBy || null,
        paymentRef: existingM?.paymentRef || "",
        receiptNumber: existingM?.receiptNumber || "",
        clearanceDocuments: Array.isArray(existingM?.clearanceDocuments)
          ? existingM.clearanceDocuments
          : [],
        stages,
      };
    });

    return crmVendorService.normalizeStageActivation(mapped);
  },

  getApplications: async (vendorId, { status = "All", projectId = "All", search = "" } = {}) => {
    await crmVendorService.getAvailableProjects(vendorId).catch(() => []);

    try {
      const res = await apiClient.get(`/crm-sync/applications${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.applications)) {
        const local = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
        const prevMap = new Map();
        const nextMap = new Map();
        local.forEach((a) => {
          const key = String(a.id || a.applicationId || a._id || "");
          if (!key) return;
          const normalized = { ...a, id: key };
          prevMap.set(key, normalized);
          if (vendorId && a.vendorId && String(a.vendorId) !== String(vendorId)) {
            nextMap.set(key, normalized);
          }
        });
        res.data.applications.forEach((a) => {
          const key = String(a.id || a.applicationId || a._id || "");
          if (!key) return;
          const prev = prevMap.get(key) || {};
          nextMap.set(key, {
            ...prev,
            ...a,
            id: key,
            applicationId: a.applicationId || prev.applicationId || key,
          });
        });
        const synced = Array.from(nextMap.values());
        saveData(APPLICATIONS_STORAGE_KEY, synced, { silent: true });
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
    const postSelectionStatuses = new Set([
      "Selected",
      "Processing",
      "Completed",
      "Offer Released",
      "Offer Accepted",
      "Visa Processing",
      "Visa Issued",
      "Visa Allotted",
      "Joined",
      "Deployed",
    ]);

    apps = apps.map((app) => {
      const matchedProj = crmVendorService.resolveProjectFromCaches(app);
      if (matchedProj) {
        const nextProjName = matchedProj.projectName || matchedProj.title || matchedProj.name;
        const nextCountry = matchedProj.country || matchedProj.destinationCountry;
        const nextSalary = matchedProj.salary;
        const nextCurrency = matchedProj.currency;
        if (nextProjName && app.projectName !== nextProjName) {
          app.projectName = nextProjName;
          dataChanged = true;
        }
        if (nextCountry && app.country !== nextCountry) {
          app.country = nextCountry;
          app.destinationCountry = nextCountry;
          dataChanged = true;
        }
        if (nextSalary !== undefined && nextSalary !== "" && app.salary !== nextSalary) {
          app.salary = nextSalary;
          dataChanged = true;
        }
        if (nextCurrency !== undefined && nextCurrency !== "" && app.currency !== nextCurrency) {
          app.currency = nextCurrency;
          dataChanged = true;
        }
      }

      if (postSelectionStatuses.has(app.status) || postSelectionStatuses.has(app.recruitmentStage)) {
        const hasMilestones = Array.isArray(app.processMilestones) && app.processMilestones.length > 0;
        if (!app.milestonesOverridden) {
          const synced = crmVendorService.syncAppMilestonesWithProject(app);
          if (synced && synced.length > 0) {
            const beforeSig = JSON.stringify(app.processMilestones || []);
            const afterSig = JSON.stringify(synced);
            if (beforeSig !== afterSig) {
              app.processMilestones = synced;
              dataChanged = true;
            }
          } else if (hasMilestones) {
            app.processMilestones = crmVendorService.normalizeStageActivation(app.processMilestones);
          }
        } else if (hasMilestones) {
          const normalized = crmVendorService.normalizeStageActivation(app.processMilestones);
          if (JSON.stringify(normalized) !== JSON.stringify(app.processMilestones)) {
            app.processMilestones = normalized;
            dataChanged = true;
          }
        }

        const finalMs = Array.isArray(app.processMilestones) ? app.processMilestones : [];
        const totalAmt = finalMs.reduce(
          (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
          0
        );
        app.paymentPlan = {
          ...(app.paymentPlan || { currency: "INR" }),
          totalAmount: totalAmt,
          milestones: finalMs.map((m, idx) => ({
            id: m.id || `m${idx}`,
            name: m.name,
            amount: Number(m.paymentAmount ?? m.amount ?? 0),
            paymentAmount: Number(m.paymentAmount ?? m.amount ?? 0),
            status:
              m.paymentStatus === "Approved"
                ? "Paid"
                : m.paymentStatus === "Submitted" || m.paymentStatus === "Pending Verification"
                ? "Submitted"
                : m.paymentStatus === "Payment Required"
                ? "Due"
                : "Pending",
            paidDate: m.paymentDate,
            paymentRef: m.paymentRef,
            stages: m.stages,
          })),
        };

        const allMStages = finalMs.flatMap((m) => m.stages || []);
        const compMStages = allMStages.filter((s) => s.status === "Completed" || s.completed).length;
        const allDone =
          (allMStages.length > 0 && compMStages === allMStages.length) ||
          (finalMs.length > 0 && finalMs.every((m) => m.status === "Completed"));

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
              app.processing.stages.forEach((s) => {
                s.status = "Completed";
              });
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
      saveData(APPLICATIONS_STORAGE_KEY, apps, { silent: true });
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

    
    let clientName = "Client Partner";
    let projectName = "Deployment Project";
    let country = "UAE";

    try {
      const proj = await crmClientService.getProjectById(clientId, projectId);
      if (proj) {
        projectName = proj.projectName || projectName;
        country = proj.country || country;
        clientName = proj.client?.companyName || proj.clientName || clientName;

        
        if (proj.vendorVisibility === "specific") {
          const isAssigned = (proj.assignedVendorIds || []).includes(vendorId);
          if (!isAssigned) {
            throw new Error(`You do not have permission to submit candidates to project ${projectName}.`);
          }
        }

        
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
      
    }

    
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
      candidatePhone: candidate.phone || candidate.phoneNumber || "",
      candidateEmail: candidate.email || "",
      passportNumber: candidate.passportNumber || "",
      documents: Array.isArray(candidate.documents) ? candidate.documents : [],
      clientId,
      clientName,
      projectId,
      projectName,
      requirementCode,
      position: position || candidate.currentPosition,
      country,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      rejectionReason: "",
      selectionDate: null,
    };

    apps.unshift(newApp);
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    try {
      await apiClient.post("/crm-sync/applications", {
        ...newApp,
        vendorName: candidate.vendorName || "Agency Partner",
      });
    } catch {}

    crmVendorService.addNotification({
      vendorId: newApp.vendorId,
      title: "Candidate Submitted",
      message: `Candidate ${newApp.candidateName} submitted for ${newApp.projectName} (${newApp.position}).`,
      type: "info",
      link: "/vendor/applications",
    });

    crmVendorService.addAdminNotification({
      title: "New Candidate Submission 📄",
      message: `Vendor submitted ${candidate.fullName} for ${newApp.position} on project ${projectName}.`,
      type: "info",
      link: "/admin/vendor/submissions",
    });

    return newApp;
  },

  submitBatchCandidates: async (submissions = []) => {
    if (!Array.isArray(submissions) || submissions.length === 0) {
      throw new Error("Please select at least one candidate to submit.");
    }
    await delay(100);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    if (!Array.isArray(candidates) || candidates.length === 0) {
      try {
        candidates = await crmVendorService.getCandidates();
      } catch {
        candidates = [];
      }
    }

    const createdApps = [];
    for (let i = 0; i < submissions.length; i += 1) {
      const sub = submissions[i] || {};
      const cand =
        candidates.find(
          (c) =>
            c.id === sub.candidateId ||
            c.candidateId === sub.candidateId ||
            c._id === sub.candidateId
        ) || {};
      const candidateName = sub.candidateName || cand.fullName || "Candidate";

      const alreadySubmitted = [...apps, ...createdApps].find(
        (a) =>
          a.candidateId === sub.candidateId &&
          String(a.projectId) === String(sub.projectId) &&
          a.status !== "Rejected"
      );
      if (alreadySubmitted) {
        throw new Error(
          `Candidate ${candidateName} has already been submitted to this project (Status: ${alreadySubmitted.status}).`
        );
      }

      const generatedId = `APP-${Math.floor(8000 + Math.random() * 2000)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const newApp = {
        ...sub,
        id: generatedId,
        applicationId: generatedId,
        vendorId: sub.vendorId || cand.vendorId || "VND-1001",
        vendorName: sub.vendorName || cand.vendorName || "Partner Agency",
        candidateId: sub.candidateId,
        candidateName,
        candidatePhone: sub.candidatePhone || cand.phone || cand.phoneNumber || "",
        candidateEmail: sub.candidateEmail || cand.email || "",
        passportNumber: sub.passportNumber || cand.passportNumber || "",
        documents: Array.isArray(sub.documents)
          ? sub.documents
          : Array.isArray(cand.documents)
          ? cand.documents
          : [],
        clientId: sub.clientId || "",
        clientName: sub.clientName || "Direct Client",
        projectId: sub.projectId,
        projectName: sub.projectName || "Overseas Project",
        position: sub.position || cand.currentPosition || "",
        country: sub.country || sub.destinationCountry || "Overseas",
        submittedAt: sub.submittedAt || new Date().toISOString(),
        status: sub.status || "Under Review",
        recruitmentStage: sub.recruitmentStage || "Screening",
        rejectionReason: "",
        selectionDate: null,
      };
      createdApps.push(newApp);
    }

    const updatedApps = [...createdApps, ...apps];
    saveData(APPLICATIONS_STORAGE_KEY, updatedApps);

    try {
      const results = await Promise.allSettled(
        createdApps.map((app) => apiClient.post("/crm-sync/applications", app))
      );
      const anySucceeded = results.some((r) => r.status === "fulfilled" && r.value?.data?.success);
      if (anySucceeded) {
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value?.data?.application) {
            createdApps[idx] = {
              ...createdApps[idx],
              ...r.value.data.application,
              id:
                r.value.data.application.applicationId ||
                r.value.data.application.id ||
                createdApps[idx].id,
            };
          }
        });
        saveData(APPLICATIONS_STORAGE_KEY, [...createdApps, ...apps]);
      } else {
        console.warn("One or more batch submission sync calls failed.");
      }
    } catch {}

    if (typeof window !== "undefined") {
      emitAppRefreshEvents(createdApps);
    }

    const firstApp = createdApps[0];
    crmVendorService.addNotification({
      vendorId: firstApp.vendorId,
      title: createdApps.length === 1 ? "Candidate Submitted" : `${createdApps.length} Candidates Submitted`,
      message: `${createdApps.length} candidate(s) submitted for ${firstApp.projectName} (${firstApp.position}).`,
      type: "info",
      link: "/vendor/applications",
    });

    crmVendorService.addAdminNotification({
      title: "New Candidate Submissions",
      message: `${firstApp.vendorName || "Vendor"} submitted ${createdApps.length} candidate(s) for ${firstApp.position} on ${firstApp.projectName}.`,
      type: "info",
      link: "/admin/vendor/submissions",
    });

    return createdApps;
  },

  updateApplicationStatus: async (applicationId, status, rejectionReason = "", interviewDetails = null) => {
    await delay(100);
    let apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1) {
      try {
        await crmVendorService.getApplications();
        apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
        idx = crmVendorService.findAppIndex(apps, applicationId);
      } catch {}
    }
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
    apps[idx].recruitmentStage =
      status === "Interview"
        ? "Interview Scheduled"
        : status === "Visa Allotted"
        ? "Visa Issued"
        : status;

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
        link: "/vendor/on-hold",
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

    if (status === "Selected" || status === "Processing") {
      apps[idx].selectionDate = new Date().toISOString();
      apps[idx].rejectionReason = "";

      if (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) {
        apps[idx].processMilestones = crmVendorService.syncAppMilestonesWithProject(apps[idx]);
      } else {
        apps[idx].processMilestones = crmVendorService.normalizeStageActivation(
          apps[idx].processMilestones
        );
      }

      const selTotal = (apps[idx].processMilestones || []).reduce(
        (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
        0
      );
      apps[idx].paymentPlan = {
        ...(apps[idx].paymentPlan || { currency: "INR" }),
        totalAmount: selTotal,
        milestones: apps[idx].processMilestones,
      };

      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Selected",
        message: `${apps[idx].candidateName} has been selected for ${apps[idx].projectName}. Processing timeline initialized.`,
        type: "success",
        link: "/vendor/selected",
      });
    }

    if (status === "Submitted") {
      apps[idx].rejectionReason = "";
      apps[idx].rejectionDate = null;
    }

    const targetUrlId = apps[idx].applicationId || apps[idx].id || applicationId;
    const payloadToSync = { ...apps[idx] };
    delete payloadToSync._id;
    delete payloadToSync.__v;
    delete payloadToSync._primarySource;
    delete payloadToSync.createdAt;
    delete payloadToSync.updatedAt;

    try {
      const res = await apiClient.put(`/crm-sync/applications/${targetUrlId}`, payloadToSync);
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch (apiErr) {
      console.warn("Backend updateApplicationStatus failed:", apiErr.message || apiErr);
      if (apiErr?.response?.status >= 400) {
        throw new Error(
          apiErr.response?.data?.message || "Failed to update application status on server.",
          { cause: apiErr }
        );
      }
    }

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    emitAppRefreshEvents(apps);
    return apps[idx];
  },

  addApplicationMilestone: async (applicationId, { name, percentage = 0, amount = 0, dueDate = "" }) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].paymentPlan) {
      apps[idx].paymentPlan = { totalAmount: 0, currency: "INR", milestones: [] };
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
    emitAppRefreshEvents(apps);
    return apps[idx];
  },

  updateApplicationProject: async (applicationId, { clientId, clientName, projectId, projectName, requirementCode, position, country }) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = crmVendorService.findAppIndex(apps, applicationId);
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
    emitAppRefreshEvents(apps);
    return apps[idx];
  },

  completeStage: async (
    applicationId,
    milestoneId,
    stageId,
    remark = "",
    completedBy = "Admin",
    fallbackApp = null
  ) => {
    return crmVendorService.updateStageStatus(
      applicationId,
      milestoneId,
      stageId,
      "Completed",
      remark,
      completedBy,
      fallbackApp
    );
  },

  updateStageStatus: async (
    applicationId,
    milestoneId,
    stageId,
    newStatus = "Completed",
    remark = "",
    updatedBy = "Admin",
    fallbackApp = null
  ) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1 && fallbackApp) {
      apps.unshift({
        ...fallbackApp,
        id: String(fallbackApp.id || fallbackApp.applicationId || applicationId),
        applicationId: String(fallbackApp.applicationId || fallbackApp.id || applicationId),
      });
      idx = 0;
    }
    if (idx === -1) throw new Error("Application not found");

    if (
      (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) &&
      Array.isArray(fallbackApp?.processMilestones) &&
      fallbackApp.processMilestones.length > 0
    ) {
      apps[idx].processMilestones = fallbackApp.processMilestones;
    }
    if (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) {
      apps[idx].processMilestones = crmVendorService.syncAppMilestonesWithProject(apps[idx]);
    }
    if (!apps[idx].processMilestones || apps[idx].processMilestones.length === 0) {
      throw new Error("No milestones configured for this candidate application.");
    }

    const today = new Date().toISOString().split("T")[0];
    let stageTitle = "";

    apps[idx].processMilestones = apps[idx].processMilestones.map((milestone) => {
      if (String(milestone.id) === String(milestoneId)) {
        const amt = Number(milestone.paymentAmount ?? milestone.amount ?? 0);
        const isPaid =
          milestone.paymentStatus === "Approved" ||
          milestone.status === "Paid" ||
          milestone.status === "Completed";
        if (milestone.status === "Locked" || (amt > 0 && !isPaid)) {
          throw new Error("Please complete payment for this milestone before updating its stages.");
        }

        const rawStages = Array.isArray(milestone.stages) ? milestone.stages : [];
        let foundStage = false;
        const updatedStages = rawStages.map((stg) => {
          if (String(stg.id) === String(stageId)) {
            foundStage = true;
            stageTitle = stg.name || "Stage";
            return {
              ...stg,
              status: newStatus,
              completedAt: newStatus === "Completed" ? today : null,
              completedBy: newStatus === "Completed" ? updatedBy : stg.completedBy || null,
              updatedBy,
              updatedAt: new Date().toISOString(),
              remark: remark !== undefined && remark !== "" ? remark : stg.remark || "",
            };
          }
          return stg;
        });

        if (!foundStage) {
          throw new Error("Stage not found in milestone.");
        }

        return {
          ...milestone,
          stages: updatedStages,
        };
      }
      return milestone;
    });

    apps[idx].processMilestones = crmVendorService.normalizeStageActivation(
      apps[idx].processMilestones
    );

    const mIdx = apps[idx].processMilestones.findIndex(
      (m) => String(m.id) === String(milestoneId)
    );
    if (mIdx !== -1) {
      const m = apps[idx].processMilestones[mIdx];
      const allDone =
        Array.isArray(m.stages) &&
        m.stages.length > 0 &&
        m.stages.every((s) => s.status === "Completed");
      if (allDone) {
        if (mIdx + 1 < apps[idx].processMilestones.length) {
          const nextM = apps[idx].processMilestones[mIdx + 1];
          crmVendorService.addNotification({
            vendorId: apps[idx].vendorId,
            title: `Milestone ${mIdx + 1} Completed - Milestone ${mIdx + 2} Open`,
            message: `All stages of Milestone ${mIdx + 1} are complete for ${apps[idx].candidateName}. Milestone ${mIdx + 2} (${nextM.name}) is now open.`,
            type: "info",
            link: `/vendor/processing/${apps[idx].id}`,
          });
        } else {
          apps[idx].status = "Completed";
          if (!apps[idx].processing) apps[idx].processing = { currentStageIndex: 7, stages: [] };
          apps[idx].processing.currentStageIndex = 7;
          apps[idx].processing.status = "Completed";
          if (Array.isArray(apps[idx].processing.stages)) {
            apps[idx].processing.stages.forEach((s) => {
              s.status = "Completed";
            });
          }
        }
      }
    }

    const totalAmt = apps[idx].processMilestones.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    apps[idx].paymentPlan = {
      ...(apps[idx].paymentPlan || { currency: "INR" }),
      totalAmount: totalAmt,
      milestones: apps[idx].processMilestones,
    };

    try {
      const res = await apiClient.put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
        status: apps[idx].status,
        processing: apps[idx].processing,
      });
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch {}

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: `Processing Stage ${newStatus}`,
      message: `${stageTitle || "Stage"} for candidate ${apps[idx].candidateName} (${apps[idx].projectName}) updated to ${newStatus} by ${updatedBy}.`,
      type: "success",
      link: `/vendor/processing/${apps[idx].id}`,
    });

    crmVendorService.addAdminNotification({
      title: `Candidate Stage ${newStatus}`,
      message: `${stageTitle || "Stage"} for ${apps[idx].candidateName} updated to ${newStatus} by ${updatedBy}.`,
      type: "info",
      vendorId: apps[idx].vendorId,
      link: `/admin/vendor/milestones-manage?appId=${apps[idx].id}`,
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  submitMilestonePayment: async (applicationId, milestoneId, paymentRef = "", fallbackApp = null) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1 && fallbackApp) {
      apps.unshift({
        ...fallbackApp,
        id: String(fallbackApp.id || fallbackApp.applicationId || applicationId),
        applicationId: String(fallbackApp.applicationId || fallbackApp.id || applicationId),
      });
      idx = 0;
    }
    if (idx === -1) throw new Error("Application not found");

    if (
      (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) &&
      Array.isArray(fallbackApp?.processMilestones) &&
      fallbackApp.processMilestones.length > 0
    ) {
      apps[idx].processMilestones = fallbackApp.processMilestones;
    }
    if (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) {
      apps[idx].processMilestones = crmVendorService.syncAppMilestonesWithProject(apps[idx]);
    }

    const mIdx = (apps[idx].processMilestones || []).findIndex(
      (m) => String(m.id) === String(milestoneId)
    );
    if (mIdx === -1) throw new Error("Milestone not found");

    const isRazorpay = String(paymentRef || "").includes("[Razorpay]");
    const payDate = new Date().toISOString().split("T")[0];
    const receiptNum = `INV-${apps[idx].id}-${milestoneId}`;

    apps[idx].processMilestones[mIdx].paymentRef = paymentRef;

    if (isRazorpay) {
      apps[idx].processMilestones[mIdx].paymentStatus = "Approved";
      apps[idx].processMilestones[mIdx].paymentDate = payDate;
      apps[idx].processMilestones[mIdx].approvedBy = "Razorpay Auto-Verify";
      apps[idx].processMilestones[mIdx].paymentMode = "Razorpay Online";
      apps[idx].processMilestones[mIdx].receiptNumber = receiptNum;
      apps[idx].processMilestones[mIdx].paymentRemark = "Paid Online via Razorpay";
      apps[idx].processMilestones[mIdx].status = "Active";
      apps[idx].processMilestones = crmVendorService.normalizeStageActivation(
        apps[idx].processMilestones
      );
    } else {
      apps[idx].processMilestones[mIdx].paymentStatus = "Submitted";
    }

    const totalAmt = apps[idx].processMilestones.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    apps[idx].paymentPlan = {
      ...(apps[idx].paymentPlan || { currency: "INR" }),
      totalAmount: totalAmt,
      milestones: apps[idx].processMilestones,
    };

    try {
      const res = await apiClient.put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
      });
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch {}

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addAdminNotification({
      title: isRazorpay ? "Milestone Payment Paid Online" : "Milestone Payment Submitted",
      message: `Payment ${isRazorpay ? "completed via Razorpay" : "submitted"} for candidate ${apps[idx].candidateName} on project ${apps[idx].projectName}.`,
      type: "info",
      vendorId: apps[idx].vendorId,
      link: "/admin/vendor/payments",
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  approveMilestonePayment: async (applicationId, milestoneId, approvedBy = "Admin", remark = "", fallbackApp = null) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1 && fallbackApp) {
      apps.unshift({
        ...fallbackApp,
        id: String(fallbackApp.id || fallbackApp.applicationId || applicationId),
        applicationId: String(fallbackApp.applicationId || fallbackApp.id || applicationId),
      });
      idx = 0;
    }
    if (idx === -1) throw new Error("Application not found");

    if (
      (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) &&
      Array.isArray(fallbackApp?.processMilestones) &&
      fallbackApp.processMilestones.length > 0
    ) {
      apps[idx].processMilestones = fallbackApp.processMilestones;
    }
    if (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) {
      apps[idx].processMilestones = crmVendorService.syncAppMilestonesWithProject(apps[idx]);
    }

    const mIdx = (apps[idx].processMilestones || []).findIndex(
      (m) => String(m.id) === String(milestoneId)
    );
    if (mIdx === -1) throw new Error("Milestone not found");

    apps[idx].processMilestones[mIdx].paymentStatus = "Approved";
    apps[idx].processMilestones[mIdx].paymentDate = new Date().toISOString().split("T")[0];
    apps[idx].processMilestones[mIdx].approvedBy = approvedBy;
    apps[idx].processMilestones[mIdx].paymentRemark = remark;
    apps[idx].processMilestones[mIdx].status = "Active";
    apps[idx].processMilestones = crmVendorService.normalizeStageActivation(
      apps[idx].processMilestones
    );

    const totalAmt = apps[idx].processMilestones.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    apps[idx].paymentPlan = {
      ...(apps[idx].paymentPlan || { currency: "INR" }),
      totalAmount: totalAmt,
      milestones: apps[idx].processMilestones,
    };

    try {
      const res = await apiClient.put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
      });
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch {}

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Payment Approved",
      message: `Payment approved for candidate ${apps[idx].candidateName} on project ${apps[idx].projectName}.`,
      type: "success",
      link: `/vendor/payments/${apps[idx].id}`,
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  rejectMilestonePayment: async (applicationId, milestoneId, remark = "") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1) throw new Error("Application not found");

    const mIdx = (apps[idx].processMilestones || []).findIndex(
      (m) => String(m.id) === String(milestoneId)
    );
    if (mIdx === -1) throw new Error("Milestone not found");

    apps[idx].processMilestones[mIdx].paymentStatus = "Rejected";
    apps[idx].processMilestones[mIdx].paymentRemark = remark;

    apiClient
      .put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
      })
      .catch(() => {});

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    emitAppRefreshEvents(apps);
    return apps[idx];
  },

  quickUpdateMilestoneStatus: async (applicationId, milestoneId, newStatus) => {
    await delay(60);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1) throw new Error("Application not found");

    const isPaid = newStatus === "Paid";

    if (apps[idx].processMilestones) {
      const mIdx = apps[idx].processMilestones.findIndex(
        (m) => String(m.id) === String(milestoneId)
      );
      if (mIdx !== -1) {
        const amt = Number(
          apps[idx].processMilestones[mIdx].paymentAmount ??
            apps[idx].processMilestones[mIdx].amount ??
            0
        );
        apps[idx].processMilestones[mIdx].paymentStatus = isPaid
          ? "Approved"
          : amt > 0
          ? "Payment Required"
          : "Not Required";
        apps[idx].processMilestones[mIdx].status = isPaid
          ? "Active"
          : amt > 0
          ? "Payment Required"
          : "Active";
        apps[idx].processMilestones[mIdx].paymentDate = isPaid
          ? new Date().toISOString().split("T")[0]
          : null;
        apps[idx].processMilestones[mIdx].approvedBy = isPaid ? "Admin" : null;
        if (isPaid && !apps[idx].processMilestones[mIdx].paymentRef) {
          apps[idx].processMilestones[mIdx].paymentRef = `Admin Verified • TXN_${Date.now()}`;
        }
      }
      apps[idx].processMilestones = crmVendorService.normalizeStageActivation(
        apps[idx].processMilestones
      );
    }

    const totalAmt = (apps[idx].processMilestones || []).reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    apps[idx].paymentPlan = {
      ...(apps[idx].paymentPlan || { currency: "INR" }),
      totalAmount: totalAmt,
      milestones: apps[idx].processMilestones || [],
    };

    apiClient
      .put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
      })
      .catch(() => {});
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: isPaid ? "Milestone Payment Marked Paid" : "Milestone Payment Reset to Pending",
      message: `Milestone payment for candidate ${apps[idx].candidateName} is now ${newStatus}.`,
      type: isPaid ? "success" : "info",
      link: `/vendor/payments/${apps[idx].id}`,
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  uploadStageVisa: async (applicationId, milestoneId, stageId, visaUrl, fileName = "Visa_Document.pdf") => {
    await delay(60);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (apps[idx].processMilestones) {
      apps[idx].processMilestones = apps[idx].processMilestones.map((m) => {
        if (String(m.id) === String(milestoneId)) {
          return {
            ...m,
            stages: (m.stages || []).map((s) => {
              if (String(s.id) === String(stageId)) {
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

    apiClient
      .put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, apps[idx])
      .catch(() => {});
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Visa Document Issued",
      message: `Official Visa document uploaded for candidate ${apps[idx].candidateName} on project ${apps[idx].projectName}. Ready for download.`,
      type: "success",
      link: `/vendor/processing/${apps[idx].id}`,
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  overrideMilestones: async (applicationId, totalAmount, milestones, fallbackApp = null, options = {}) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1 && fallbackApp) {
      apps.unshift({
        ...fallbackApp,
        id: String(fallbackApp.id || fallbackApp.applicationId || applicationId),
        applicationId: String(fallbackApp.applicationId || fallbackApp.id || applicationId),
      });
      idx = 0;
    }
    if (idx === -1) throw new Error("Application not found");

    const mapped = milestones.map((m, mIdx) => {
      const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
      const isFirst = mIdx === 0;
      const amt = Number(m.paymentAmount ?? m.amount ?? 0);

      const stages = (m.stages || []).map((s, sIdx) => {
        const sStatus = s.status || "Pending";
        return {
          ...s,
          id: s.id || `s${mIdx}_${sIdx}`,
          name: s.name || `Stage ${sIdx + 1}`,
          status: sStatus,
          completedAt:
            sStatus === "Completed"
              ? s.completedAt || new Date().toISOString().split("T")[0]
              : null,
          completedBy: sStatus === "Completed" ? s.completedBy || "Admin" : null,
          remark: s.remark || "",
          document: s.document || null,
        };
      });

      const allStagesDone = stages.length > 0 && stages.every((s) => s.status === "Completed");
      const processStatus = allStagesDone
        ? "Completed"
        : isPaid
        ? "Active"
        : isFirst
        ? amt > 0
          ? "Payment Required"
          : "Active"
        : "Locked";

      const mappedPaymentStatus = isPaid
        ? "Approved"
        : amt === 0
        ? "Not Required"
        : m.paymentStatus || (isFirst ? "Payment Required" : "Locked");

      return {
        id: m.id || `m${mIdx}`,
        name: m.name,
        paymentAmount: amt,
        amount: amt,
        paymentStatus: mappedPaymentStatus,
        status: processStatus,
        paymentDate:
          m.paymentDate ||
          m.paidDate ||
          (isPaid ? new Date().toISOString().split("T")[0] : null),
        paymentRef: m.paymentRef || (isPaid ? "Admin Authorized / Paid" : null),
        approvedBy: isPaid ? m.approvedBy || "Admin" : null,
        clearanceDocuments: Array.isArray(m.clearanceDocuments) ? m.clearanceDocuments : [],
        stages,
      };
    });

    apps[idx].processMilestones = crmVendorService.normalizeStageActivation(mapped);
    const preserveProjectSync = Boolean(options?.preserveProjectSync);
    const nextOverridden = preserveProjectSync ? Boolean(apps[idx].milestonesOverridden) : true;
    apps[idx].milestonesOverridden = nextOverridden;

    const sumFromMilestones = apps[idx].processMilestones.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    const hasExplicitTotal =
      totalAmount !== undefined &&
      totalAmount !== null &&
      totalAmount !== "" &&
      !Number.isNaN(Number(totalAmount));
    const computedTotal = hasExplicitTotal ? Number(totalAmount) : sumFromMilestones;

    if (!apps[idx].paymentPlan) apps[idx].paymentPlan = { currency: "INR" };
    apps[idx].paymentPlan.totalAmount = computedTotal;
    apps[idx].paymentPlan.milestones = apps[idx].processMilestones;

    const allMilestonesCompleted =
      apps[idx].processMilestones.length > 0 &&
      apps[idx].processMilestones.every((m) => m.status === "Completed");
    const keepPostSelectionStatus = [
      "Processing",
      "Offer Released",
      "Offer Accepted",
      "Visa Processing",
      "Visa Issued",
      "Visa Allotted",
      "Joined",
      "Deployed",
    ].includes(apps[idx].status);
    apps[idx].status = allMilestonesCompleted
      ? "Completed"
      : keepPostSelectionStatus
      ? apps[idx].status
      : "Selected";

    try {
      const res = await apiClient.put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
        milestonesOverridden: nextOverridden,
        status: apps[idx].status,
      });
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch {}
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Candidate Processing Updated",
      message: `Admin updated processing milestones and stages for ${apps[idx].candidateName} on project ${apps[idx].projectName}. Status: ${allMilestonesCompleted ? "Completed" : "Active"}.`,
      type: "success",
      link: `/vendor/processing/${apps[idx].id}`,
    });

    crmVendorService.addAdminNotification({
      title: "Candidate Milestones Updated",
      message: `Milestone plan configured for ${apps[idx].candidateName} on ${apps[idx].projectName} (Total ₹${Number(computedTotal).toLocaleString()}).`,
      type: "info",
      vendorId: apps[idx].vendorId,
      link: `/admin/vendor/milestones-manage?appId=${apps[idx].id}`,
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  updateCandidateMilestones: async (
    applicationId,
    milestones = [],
    totalAmount,
    fallbackApp = null,
    options = {}
  ) => {
    return crmVendorService.overrideMilestones(
      applicationId,
      totalAmount,
      Array.isArray(milestones) ? milestones : [],
      fallbackApp,
      options
    );
  },

  recordMilestonePayment: async (
    applicationId,
    milestoneId,
    amount,
    paymentMethod = "Bank Transfer",
    paymentRef = "",
    remarks = "",
    recordedBy = "Admin",
    fallbackApp = null
  ) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    let idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1 && fallbackApp) {
      apps.unshift({
        ...fallbackApp,
        id: String(fallbackApp.id || fallbackApp.applicationId || applicationId),
        applicationId: String(fallbackApp.applicationId || fallbackApp.id || applicationId),
      });
      idx = 0;
    }
    if (idx === -1) throw new Error("Application not found");

    if (
      (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) &&
      Array.isArray(fallbackApp?.processMilestones) &&
      fallbackApp.processMilestones.length > 0
    ) {
      apps[idx].processMilestones = fallbackApp.processMilestones;
    }
    if (!Array.isArray(apps[idx].processMilestones) || apps[idx].processMilestones.length === 0) {
      apps[idx].processMilestones = crmVendorService.syncAppMilestonesWithProject(apps[idx]);
    }

    const mIdx = (apps[idx].processMilestones || []).findIndex(
      (m) => String(m.id) === String(milestoneId)
    );
    if (mIdx === -1) throw new Error("Milestone not found");

    const amt =
      amount !== undefined && amount !== null && !Number.isNaN(Number(amount))
        ? Number(amount)
        : Number(
            apps[idx].processMilestones[mIdx].paymentAmount ??
              apps[idx].processMilestones[mIdx].amount ??
              0
          );
    const payDate = new Date().toISOString().split("T")[0];
    const refStr = paymentRef || `TXN-${Date.now().toString().slice(-6)}`;

    apps[idx].processMilestones[mIdx] = {
      ...apps[idx].processMilestones[mIdx],
      amount: amt,
      paymentAmount: amt,
      paidAmount: amt,
      status: apps[idx].processMilestones[mIdx].status === "Completed" ? "Completed" : "Paid",
      paymentStatus: "Approved",
      paymentMethod,
      paymentMode: paymentMethod,
      paymentRef: refStr,
      paymentRemark: remarks || "Payment recorded by Administrator",
      paymentDate: payDate,
      approvedBy: recordedBy,
      paidBy: recordedBy,
      receiptNumber:
        apps[idx].processMilestones[mIdx].receiptNumber ||
        `INV-${apps[idx].id}-${milestoneId}`,
    };

    apps[idx].processMilestones = crmVendorService.normalizeStageActivation(
      apps[idx].processMilestones
    );

    const totalAmt = apps[idx].processMilestones.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    apps[idx].paymentPlan = {
      ...(apps[idx].paymentPlan || { currency: "INR" }),
      totalAmount: totalAmt,
      milestones: apps[idx].processMilestones,
    };

    try {
      const res = await apiClient.put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, {
        processMilestones: apps[idx].processMilestones,
        paymentPlan: apps[idx].paymentPlan,
      });
      if (res.data?.success && res.data.application) {
        apps[idx] = { ...apps[idx], ...res.data.application };
      }
    } catch {}

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Milestone Payment Recorded",
      message: `Payment of ₹${amt.toLocaleString()} verified for candidate ${apps[idx].candidateName} (${apps[idx].projectName}).`,
      type: "success",
      link: `/vendor/payments/${apps[idx].id}`,
    });

    emitAppRefreshEvents(apps);

    return apps[idx];
  },

  
  
  
  getVendorDashboardStats: async (vendorId) => {
    await delay(50);
    try {
      const res = await apiClient.get(`/crm-sync/applications${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.applications)) {
        const local = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
        const map = new Map();
        local.forEach((a) => map.set(a.id, a));
        res.data.applications.forEach((a) => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
        saveData(APPLICATIONS_STORAGE_KEY, Array.from(map.values()), { silent: true });
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
    const selected = apps.filter((a) => a.status === "Selected").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    const inProcessing = apps.filter(
      (a) =>
        (a.status === "Selected" || a.status === "Processing") &&
        ((a.processMilestones && a.processMilestones.length > 0 && !a.processMilestones.every((m) => m.status === "Completed")) ||
          (a.processing && a.processing.currentStageIndex < 7))
    ).length;
    const completed = apps.filter(
      (a) =>
        a.status === "Completed" ||
        (a.processMilestones && a.processMilestones.length > 0 && a.processMilestones.every((m) => m.status === "Completed")) ||
        a.processing?.currentStageIndex === 7
    ).length;

    let totalPayment = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let dueAmount = 0;
    let overdueAmount = 0;

    apps.forEach((app) => {
      const milestones = app.processMilestones || app.paymentPlan?.milestones || [];
      milestones.forEach((m) => {
        const amt = Number(m.paymentAmount || m.amount) || 0;
        totalPayment += amt;
        const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
        if (isPaid) {
          paidAmount += amt;
        } else if (m.status === "Due" || m.status === "Payment Required" || m.paymentStatus === "Payment Required") {
          dueAmount += amt;
        } else if (m.status === "Overdue") {
          overdueAmount += amt;
        } else {
          pendingAmount += amt;
        }
      });
    });

    const recentActivity = apps.slice(0, 7);

    
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
    let backendSucceeded = false;
    try {
      const res = await apiClient.get(`/crm-sync/projects${vendorId ? `?vendorId=${vendorId}` : ""}`);
      if (res.data?.success && Array.isArray(res.data.projects)) {
        backendSucceeded = true;
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

    if (list.length > 0 || backendSucceeded) {
      saveData(PROJECTS_CACHE_KEY, list, { silent: true });
      return list;
    }
    try {
      const cached = JSON.parse(localStorage.getItem(PROJECTS_CACHE_KEY) || "[]");
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return list;
  },

  
  
  
  getNotifications: (vendorId) => {
    try {
      apiClient
        .get(`/crm-sync/notifications?role=VENDOR${vendorId ? `&vendorId=${vendorId}` : ""}`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.notifications)) {
            const current = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
            const prevMap = new Map();
            current.forEach((n) => prevMap.set(n.id || n._id, n));
            const nextList = res.data.notifications.map((n) => {
              const key = n.id || n._id;
              const prev = prevMap.get(key) || {};
              const isRead = Boolean(prev.read || n.read);
              return { ...prev, ...n, read: isRead };
            });
            saveData(VENDOR_NOTIFICATIONS_KEY, nextList, { silent: true });
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
        const prevMap = new Map();
        current.forEach((n) => prevMap.set(n.id || n._id, n));
        const list = res.data.notifications.map((n) => {
          const key = n.id || n._id;
          const prev = prevMap.get(key) || {};
          const isRead = Boolean(prev.read || n.read);
          return { ...prev, ...n, read: isRead };
        });
        saveData(VENDOR_NOTIFICATIONS_KEY, list, { silent: true });
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

  deleteNotification: (id) => {
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

  
  
  
  getAdminNotifications: ({ sync = true } = {}) => {
    let staffRole = "ADMIN";
    let currentUserId = "";
    let assignedVendors = [];
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || localStorage.getItem("adminUser") || "null");
      if (storedUser) {
        currentUserId = String(storedUser.id || storedUser._id || "");
        const rUpper = String(storedUser.role || "").toUpperCase();
        if (storedUser.isSuperAdmin || rUpper === "SUPER_ADMIN") {
          staffRole = "SUPER_ADMIN";
        } else if (rUpper === "HR") {
          staffRole = String(storedUser.hrType || "").toUpperCase() === "VENDOR_HR" ? "VENDOR_HR" : "EMPLOYEE_HR";
        } else if (rUpper) {
          staffRole = rUpper;
        }
        assignedVendors = Array.isArray(storedUser.assignedVendors) ? storedUser.assignedVendors : [];
      }
    } catch {}

    if (staffRole === "EMPLOYEE_HR") {
      return [];
    }

    if (sync) {
      try {
        const params = new URLSearchParams({ role: staffRole });
        if (currentUserId) params.set("userId", currentUserId);
        if (assignedVendors.length > 0) params.set("assignedVendors", assignedVendors.join(","));

        apiClient.get(`/crm-sync/notifications?${params.toString()}`)
          .then((res) => {
            if (res.data?.success && Array.isArray(res.data.notifications)) {
              const current = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
              const prevMap = new Map();
              current.forEach((n) => prevMap.set(n.id || n._id, n));
              const nextList = res.data.notifications.map((n) => {
                const key = n.id || n._id;
                const prev = prevMap.get(key) || {};
                const isRead = Boolean(prev.read || n.read);
                return { ...prev, ...n, read: isRead };
              });
              saveData(ADMIN_NOTIFICATIONS_KEY, nextList, { silent: true });
            }
          }).catch(() => {});
      } catch {}
    }
    return loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
  },

  addAdminNotification: (notif) => {
    let actorId = "";
    let actorRole = "";
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || localStorage.getItem("adminUser") || "null");
      if (storedUser) {
        actorId = String(storedUser.id || storedUser._id || "");
        const rUpper = String(storedUser.role || "").toUpperCase();
        if (storedUser.isSuperAdmin || rUpper === "SUPER_ADMIN") {
          actorRole = "SUPER_ADMIN";
        } else if (rUpper === "HR") {
          actorRole = String(storedUser.hrType || "").toUpperCase() === "VENDOR_HR" ? "VENDOR_HR" : "EMPLOYEE_HR";
        } else {
          actorRole = rUpper;
        }
      }
    } catch {}

    const targetRecipientRole =
      notif.recipientRole || (actorRole === "ADMIN" ? "SUPER_ADMIN" : "ADMIN");

    const notifs = loadData(ADMIN_NOTIFICATIONS_KEY, INITIAL_ADMIN_NOTIFICATIONS);
    const newNotif = {
      id: `admin-notif-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      read: false,
      actorId: actorId || null,
      actorRole: actorRole || null,
      recipientRole: targetRecipientRole,
      ...notif,
    };
    notifs.unshift(newNotif);
    saveData(ADMIN_NOTIFICATIONS_KEY, notifs);
    try {
      apiClient.post("/crm-sync/notifications", newNotif).catch(() => {});
    } catch {}
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("immigo:admin-notification", { detail: newNotif }));
      } catch {}
    }
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
        app.processMilestones.forEach((m) => {
          const amt = Number(m.paymentAmount ?? m.amount ?? 0);
          if (m.paymentStatus === "Pending" || m.paymentStatus === "Payment Required") {
            pendingPayments += amt;
          }
          if (m.paymentStatus === "Overdue") overduePayments += amt;
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
    } catch {}

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

  
  getCandidateSubmissionsHistory: async (candidateId) => {
    await delay(30);
    let apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    if (!Array.isArray(apps) || apps.length === 0) {
      try {
        apps = await crmVendorService.getApplications();
      } catch {
        apps = [];
      }
    }
    const targetId = String(candidateId || "").trim();
    if (!targetId) return [];
    return apps.filter((a) => String(a.candidateId || "").trim() === targetId);
  },

  
  getAllDocuments: async ({ vendorId = "All", candidateId = "All", type = "All", status = "All", search = "" } = {}) => {
    const vendors = await crmVendorService.getVendors();
    let candidates;
    try {
      candidates = await crmVendorService.getCandidates();
    } catch {
      candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    }
    let apps;
    try {
      apps = await crmVendorService.getApplications();
    } catch {
      apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    }

    const docs = [];

    vendors.forEach((v) => {
      const vid = v.id || v.vendorId || v._id;
      const isVendorVerified = Boolean(
        v.documentVerified ||
          v.status === "Active" ||
          v.status === "Approved" ||
          v.status === "MOU Pending" ||
          v.status === "Pending MOU Approval" ||
          v.mouStatus === "Sent" ||
          v.mouStatus === "Under Review" ||
          v.mouStatus === "Approved"
      );

      (v.documents || []).forEach((d, idx) => {
        const resolvedStatus =
          d.status && d.status !== "Pending" && d.status !== "Submitted"
            ? d.status
            : isVendorVerified
            ? "Verified"
            : v.status === "Rejected"
            ? "Rejected"
            : "Pending Verification";

        docs.push({
          id: d.id || `DOC-VND-${vid}-${idx}`,
          name: d.name,
          title: d.name,
          fileName: d.fileName,
          fileUrl: d.fileUrl || "",
          mimeType: d.mimeType || "",
          type: d.type || "License",
          entityType: "Vendor Agency",
          ownerName: v.companyName,
          ownerId: vid,
          vendorId: vid,
          vendorName: v.companyName,
          project: "Organization Statutory",
          size: d.size || "—",
          status: resolvedStatus,
          uploadedAt: d.uploadedAt ? String(d.uploadedAt).split("T")[0] : v.createdAt ? String(v.createdAt).split("T")[0] : "",
        });
      });
    });

    candidates.forEach((c) => {
      const v = vendors.find((vend) => vend.id === c.vendorId || vend.vendorId === c.vendorId);
      const candApps = apps.filter((a) => a.candidateId === c.id);
      const projName = candApps.length > 0 ? candApps[0].projectName : "General Pool";

      (c.documents || []).forEach((d, idx) => {
        docs.push({
          id: d.id || `DOC-CND-${c.id}-${idx}`,
          name: d.name,
          title: d.name,
          fileName: d.fileName,
          fileUrl: d.fileUrl || "",
          mimeType: d.mimeType || "",
          type: d.type || "Certificate",
          entityType: "Candidate Person",
          ownerName: c.fullName,
          ownerId: c.id,
          vendorId: c.vendorId,
          vendorName: v?.companyName || c.vendorId,
          project: projName,
          size: d.size || "—",
          status: d.status || c.verificationStatus || "Pending Verification",
          uploadedAt: d.uploadedAt ? String(d.uploadedAt).split("T")[0] : c.createdAt ? String(c.createdAt).split("T")[0] : "",
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
          (d.title || "").toLowerCase().includes(q) ||
          (d.fileName || "").toLowerCase().includes(q) ||
          (d.ownerName || "").toLowerCase().includes(q) ||
          (d.vendorName || "").toLowerCase().includes(q)
      );
    }

    return filtered;
  },

  reassignApplicationToProject: async (applicationId, projectId, projectName, position, requirementCode) => {
    await delay(100);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = crmVendorService.findAppIndex(apps, applicationId);
    if (idx === -1) throw new Error("Application not found");

    apps[idx].projectId = projectId;
    apps[idx].projectName = projectName;
    apps[idx].position = position;
    apps[idx].requirementCode = requirementCode || "REQ-0000";
    apps[idx].status = "Submitted";
    apps[idx].recruitmentStage = "Screening";
    apps[idx].rejectionReason = "";
    apps[idx].rejectionDate = null;
    apps[idx].processMilestones = [];
    apps[idx].paymentPlan = { totalAmount: 0, currency: "INR", milestones: [] };
    apps[idx].milestonesOverridden = false;

    apiClient
      .put(`/crm-sync/applications/${apps[idx].applicationId || applicationId}`, apps[idx])
      .catch(() => {});
    saveData(APPLICATIONS_STORAGE_KEY, apps);
    emitAppRefreshEvents(apps);
    return apps[idx];
  },
};

export default crmVendorService;
