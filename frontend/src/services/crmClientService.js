
import { initialClients } from "../data/mockClients.js";
import { apiClient } from "./apiClient.js";

const STORAGE_KEY = "crm_clients_data_v3";


const loadClientsFromStorage = () => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("crm_clients_data_v2") ||
      localStorage.getItem("crm_clients_data");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const realClients = parsed.filter(
          (c) =>
            !["cl-1", "cl-2", "cl-3", "cl-4", "cl-5", "cli-uae-101", "cli-ksa-102", "cli-qat-103"].includes(
              String(c.id)
            )
        );
        return realClients;
      }
    }
  } catch (err) {
    console.error("Error reading clients from storage:", err);
  }
  return [];
};


const saveClientsToStorage = (clients) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error("Error saving clients to storage:", err);
  }
};


export const calculateProjectManpower = (project) => {
  if (!project || !Array.isArray(project.manpowerRequirements)) return 0;
  return project.manpowerRequirements.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + qty;
  }, 0);
};


export const calculateClientManpower = (client) => {
  if (!client || !Array.isArray(client.projects)) return 0;
  return client.projects.reduce((sum, proj) => {
    return sum + calculateProjectManpower(proj);
  }, 0);
};


const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const crmClientService = {
  
  getClients: async ({
    search = "",
    country = "All",
    status = "All",
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = {}) => {
    try {
      const res = await apiClient.get("/crm-sync/clients");
      if (res.data?.success && Array.isArray(res.data.clients)) {
        saveClientsToStorage(res.data.clients);
      }
    } catch {}

    const all = loadClientsFromStorage();

    let filtered = all.filter((client) => {
      
      if (search.trim()) {
        const query = search.toLowerCase();
        const primaryContact = client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];
        const matchName = client.companyName?.toLowerCase().includes(query);
        const matchEmail = client.email?.toLowerCase().includes(query);
        const matchPhone = client.phone?.toLowerCase().includes(query);
        const matchCity = client.city?.toLowerCase().includes(query);
        const matchCountry = client.country?.toLowerCase().includes(query);
        const matchContact = primaryContact?.name?.toLowerCase().includes(query);

        if (!matchName && !matchEmail && !matchPhone && !matchCity && !matchCountry && !matchContact) {
          return false;
        }
      }

      
      if (country && country !== "All") {
        if (client.country?.toLowerCase() !== country.toLowerCase()) {
          return false;
        }
      }

      
      if (status && status !== "All") {
        if (client.status?.toLowerCase() !== status.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    
    filtered.sort((a, b) => {
      let valA = a[sortBy] || "";
      let valB = b[sortBy] || "";
      if (sortBy === "manpower") {
        valA = calculateClientManpower(a);
        valB = calculateClientManpower(b);
      } else if (sortBy === "projects") {
        valA = a.projects?.length || 0;
        valB = b.projects?.length || 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      clients: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  
  getClientById: async (id) => {
    await delay(60);
    const all = loadClientsFromStorage();
    const target = String(id).trim().toLowerCase();
    const found = all.find(
      (c) =>
        String(c.id || "").trim().toLowerCase() === target ||
        String(c.clientId || "").trim().toLowerCase() === target ||
        String(c._id || "").trim().toLowerCase() === target
    );
    return found || null;
  },

  
  createClient: async (payload) => {
    await delay(120);
    const all = loadClientsFromStorage();

    const yy = new Date().getFullYear().toString().slice(-2);
    const prefix = `IMCL-${yy}-`;
    let maxNum = 0;
    for (const c of all) {
      const cid = c.id || c.clientId;
      if (typeof cid === "string" && cid.startsWith(prefix)) {
        const num = parseInt(cid.slice(-4), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    const clientId =
      (payload.clientId && String(payload.clientId).startsWith("IMCL-"))
        ? payload.clientId
        : (payload.id && String(payload.id).startsWith("IMCL-"))
        ? payload.id
        : `${prefix}${String(nextNum).padStart(4, "0")}`;

    const now = new Date().toISOString();

    
    const projects = (payload.projects || []).map((proj, pIdx) => {
      const projectId = proj.id || `prj-${clientId}-${pIdx + 1}`;
      const manpowerRequirements = (proj.manpowerRequirements || []).map((req, rIdx) => ({
        ...req,
        id: req.id || `mpr-${projectId}-${rIdx + 1}`,
        projectId: projectId,
        quantity: Number(req.quantity) || 1,
        salary: Number(req.salary) || 0,
        minAge: Number(req.minAge) || 21,
        maxAge: Number(req.maxAge) || 45,
      }));

      return {
        ...proj,
        id: projectId,
        clientId: clientId,
        status: proj.status || "Active",
        manpowerRequirements,
      };
    });

    const paymentMilestones = (payload.paymentMilestones || []).map((m, idx) => {
      const amount = Number(m.amount) || 0;
      const paidAmount = Number(m.paidAmount) || 0;
      return {
        ...m,
        id: m.id || `mls-${Date.now()}-${idx + 1}`,
        name: (m.name || `Milestone ${idx + 1}`).trim(),
        amount,
        condition: (m.condition || "Candidate successfully selected").trim(),
        timeline: (m.timeline || "Within 7 days").trim(),
        description: m.description || "",
        status: m.status || (paidAmount >= amount && amount > 0 ? "Paid" : "Pending"),
        paidAmount,
        remainingBalance: Math.max(0, amount - paidAmount),
        remarks: m.remarks || "",
      };
    });

    const totalAgreedAmount = paymentMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    const newClient = {
      ...payload,
      id: clientId,
      status: payload.status || "Active",
      createdAt: now,
      updatedAt: now,
      projects,
      paymentMilestones,
      totalAgreedAmount,
      totalPaidAmount: 0,
      remainingAmount: totalAgreedAmount,
    };

    all.unshift(newClient);
    saveClientsToStorage(all);
    try {
      await apiClient.post("/crm-sync/clients", newClient);
    } catch {}
    return newClient;
  },

  
  updateClient: async (id, payload) => {
    await delay(100);
    const all = loadClientsFromStorage();
    const index = all.findIndex(
      (c) =>
        String(c.id) === String(id) ||
        String(c._id) === String(id) ||
        String(c.clientId) === String(id)
    );
    if (index === -1) {
      throw new Error(`Client with ID ${id} not found.`);
    }

    const existing = all[index];
    const now = new Date().toISOString();

    
    let updatedProjects = payload.projects ? [...payload.projects] : existing.projects || [];
    updatedProjects = updatedProjects.map((proj, pIdx) => {
      const projId = proj.id || `prj-${id}-${pIdx + 1}`;
      const manpowerRequirements = (proj.manpowerRequirements || []).map((req, rIdx) => ({
        ...req,
        id: req.id || `mpr-${projId}-${rIdx + 1}`,
        projectId: projId,
        quantity: Number(req.quantity) || 1,
        salary: Number(req.salary) || 0,
      }));
      return {
        ...proj,
        id: projId,
        clientId: id,
        manpowerRequirements,
      };
    });

    const updated = {
      ...existing,
      ...payload,
      id: existing.id || id,
      projects: updatedProjects,
      updatedAt: now,
    };

    all[index] = updated;
    saveClientsToStorage(all);

    try {
      await apiClient.post("/crm-sync/clients", updated);
    } catch {}

    return updated;
  },

  
  deleteClient: async (id) => {
    try {
      await apiClient.delete(`/crm-sync/clients/${id}`);
    } catch (err) {
      console.warn("Backend deleteClient failed:", err);
    }
    let all = loadClientsFromStorage();
    all = all.filter((c) => String(c.id) !== String(id) && String(c._id) !== String(id) && String(c.clientId) !== String(id));
    saveClientsToStorage(all);
    return { success: true, id };
  },

  
  addProject: async (clientId, projectData) => {
    await delay(100);
    let all = loadClientsFromStorage();
    let client = all.find(
      (c) =>
        String(c.id) === String(clientId) ||
        String(c.clientId) === String(clientId) ||
        String(c._id) === String(clientId)
    );

    if (!client) {
      try {
        const res = await apiClient.get("/crm-sync/clients");
        if (res.data?.success && Array.isArray(res.data.clients)) {
          all = res.data.clients.map((c) => ({
            ...c,
            id: c.clientId || c.id || c._id?.toString(),
          }));
          saveClientsToStorage(all);
          client = all.find(
            (c) =>
              String(c.id) === String(clientId) ||
              String(c.clientId) === String(clientId) ||
              String(c._id) === String(clientId)
          );
        }
      } catch {}
    }

    if (!client) {
      client = {
        id: clientId,
        clientId: clientId,
        companyName: projectData.clientName || "Direct Overseas Client",
        status: "Active",
        projects: [],
      };
      all.unshift(client);
    }

    const projectId = projectData.id || `prj-${Date.now().toString().slice(-6)}`;
    const manpowerRequirements = (projectData.manpowerRequirements || []).map((req, idx) => ({
      ...req,
      id: req.id || `mpr-${projectId}-${idx + 1}`,
      projectId,
      quantity: Number(req.quantity) || 1,
      salary: Number(req.salary) || 0,
    }));

    const newProject = {
      ...projectData,
      id: projectId,
      clientId,
      clientName: client.companyName || projectData.clientName || "Direct Overseas Client",
      status: projectData.status || "Active",
      manpowerRequirements,
    };

    if (!Array.isArray(client.projects)) {
      client.projects = [];
    }
    const existingProjectIdx = client.projects.findIndex(
      (p) => String(p.id) === String(projectId)
    );
    if (existingProjectIdx !== -1) {
      client.projects[existingProjectIdx] = newProject;
    } else {
      client.projects.unshift(newProject);
    }
    client.updatedAt = new Date().toISOString();

    saveClientsToStorage(all);

    try {
      await apiClient.post("/crm-sync/projects", { clientId, project: newProject });
    } catch (err) {
      console.warn("Failed to sync project to backend:", err);
    }

    
    try {
      import("./crmVendorService.js").then(({ default: vendorService }) => {
        const vendors =
          typeof vendorService?.getVendorsSync === "function"
            ? vendorService.getVendorsSync()
            : [];
        (vendors || []).forEach((v) => {
          vendorService.addNotification?.({
            vendorId: v.id,
            title: "New Project Available",
            message: `New overseas project "${newProject.projectName}" (${newProject.country || "Overseas"}) is open for candidate submissions.`,
            type: "info",
            link: `/vendor/candidates/assign?projectId=${newProject.id}`,
          });
        });
      }).catch(() => {});
    } catch {}

    return newProject;
  },

  
  getProjectById: async (clientId, projectId) => {
    await delay(60);
    const all = loadClientsFromStorage();
    const targetProjectId = projectId || clientId;
    let client = null;
    let project = null;

    if (clientId && projectId) {
      client = all.find(
        (c) =>
          String(c.id) === String(clientId) ||
          String(c.clientId) === String(clientId) ||
          String(c._id) === String(clientId)
      );
      if (client) {
        project = (client.projects || []).find(
          (p) => String(p.id || p.projectId || p._id) === String(projectId)
        );
      }
    }

    if (!project) {
      for (const c of all) {
        const found = (c.projects || []).find(
          (p) => String(p.id || p.projectId || p._id) === String(targetProjectId)
        );
        if (found) {
          project = found;
          client = c;
          break;
        }
      }
    }

    if (!project) {
      try {
        const res = await apiClient.get("/crm-sync/projects");
        if (res.data?.success && Array.isArray(res.data.projects)) {
          const found = res.data.projects.find(
            (p) => String(p.id || p.projectId || p._id) === String(targetProjectId)
          );
          if (found) {
            project = found;
          }
        }
      } catch {}
    }

    return project
      ? {
          ...project,
          client,
          clientId: client?.id || project.clientId,
          clientName: client?.companyName || project.clientName,
        }
      : null;
  },

  
  updateProject: async (clientId, projectId, projectData) => {
    await delay(100);
    const all = loadClientsFromStorage();
    const targetProjectId = projectId || clientId;
    let client = clientId
      ? all.find(
          (c) =>
            String(c.id) === String(clientId) ||
            String(c.clientId) === String(clientId) ||
            String(c._id) === String(clientId)
        )
      : null;

    if (!client) {
      client = all.find((c) =>
        (c.projects || []).some(
          (p) => String(p.id || p.projectId || p._id) === String(targetProjectId)
        )
      );
    }
    if (!client) throw new Error("Client not found");

    const pIdx = (client.projects || []).findIndex(
      (p) => String(p.id || p.projectId || p._id) === String(targetProjectId)
    );
    if (pIdx === -1) throw new Error("Project not found");

    client.projects[pIdx] = {
      ...client.projects[pIdx],
      ...projectData,
      id: targetProjectId,
      clientId: client.id,
    };
    client.updatedAt = new Date().toISOString();

    saveClientsToStorage(all);

    try {
      await apiClient.post("/crm-sync/projects", {
        clientId: client.id,
        project: client.projects[pIdx],
      });
    } catch {}

    return client.projects[pIdx];
  },

  
  toggleProjectStatus: async (clientId, projectId) => {
    await delay(80);
    const all = loadClientsFromStorage();
    const targetProjectId = projectId || clientId;
    let client = clientId
      ? all.find(
          (c) =>
            String(c.id) === String(clientId) ||
            String(c.clientId) === String(clientId) ||
            String(c._id) === String(clientId)
        )
      : null;

    if (!client) {
      client = all.find((c) =>
        (c.projects || []).some(
          (p) => String(p.id || p.projectId || p._id) === String(targetProjectId)
        )
      );
    }
    if (!client) throw new Error("Client not found");

    const pIdx = (client.projects || []).findIndex(
      (p) => String(p.id || p.projectId || p._id) === String(targetProjectId)
    );
    if (pIdx === -1) throw new Error("Project not found");

    const currentStatus = client.projects[pIdx].status || "Active";
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    client.projects[pIdx].status = nextStatus;
    client.updatedAt = new Date().toISOString();

    saveClientsToStorage(all);

    try {
      await apiClient.post("/crm-sync/projects", {
        clientId: client.id,
        project: client.projects[pIdx],
      });
    } catch {}

    return client.projects[pIdx];
  },

  
  deleteProject: async (clientId, projectId) => {
    try {
      if (clientId) {
        await apiClient.delete(`/crm-sync/clients/${clientId}/projects/${projectId}`);
      } else {
        await apiClient.delete(`/crm-sync/projects/${projectId}`);
      }
    } catch (err) {
      console.warn("Backend deleteProject failed:", err);
    }
    const all = loadClientsFromStorage();
    const client = all.find((c) => String(c.id) === String(clientId) || String(c.clientId) === String(clientId));
    if (client) {
      client.projects = (client.projects || []).filter(
        (p) => String(p.id) !== String(projectId) && String(p._id) !== String(projectId)
      );
      client.updatedAt = new Date().toISOString();
      saveClientsToStorage(all);
    } else {
      
      all.forEach((c) => {
        if (Array.isArray(c.projects)) {
          c.projects = c.projects.filter(
            (p) => String(p.id) !== String(projectId) && String(p._id) !== String(projectId)
          );
        }
      });
      saveClientsToStorage(all);
    }
    return { success: true, id: projectId };
  },

  
  addManpowerPosition: async (clientId, projectId, positionData) => {
    await delay(80);
    const all = loadClientsFromStorage();
    const client = all.find((c) => String(c.id) === String(clientId));
    if (!client) throw new Error("Client not found");

    const project = (client.projects || []).find((p) => String(p.id) === String(projectId));
    if (!project) throw new Error("Project not found");

    if (!Array.isArray(project.manpowerRequirements)) {
      project.manpowerRequirements = [];
    }

    const posId = `mpr-${Date.now().toString().slice(-6)}`;
    const newPosition = {
      ...positionData,
      id: posId,
      projectId,
      quantity: Number(positionData.quantity) || 1,
      salary: Number(positionData.salary) || 0,
      minAge: Number(positionData.minAge) || 21,
      maxAge: Number(positionData.maxAge) || 45,
    };

    project.manpowerRequirements.push(newPosition);
    client.updatedAt = new Date().toISOString();
    saveClientsToStorage(all);
    return newPosition;
  },

  
  deleteManpowerPosition: async (clientId, projectId, positionId) => {
    await delay(80);
    const all = loadClientsFromStorage();
    const client = all.find((c) => String(c.id) === String(clientId));
    if (!client) throw new Error("Client not found");

    const project = (client.projects || []).find((p) => String(p.id) === String(projectId));
    if (!project) throw new Error("Project not found");

    project.manpowerRequirements = (project.manpowerRequirements || []).filter(
      (m) => String(m.id) !== String(positionId)
    );
    client.updatedAt = new Date().toISOString();
    saveClientsToStorage(all);
    return { success: true };
  },

  
  updateManpowerPosition: async (clientId, projectId, positionId, positionData) => {
    await delay(80);
    const all = loadClientsFromStorage();
    const client = all.find((c) => String(c.id) === String(clientId));
    if (!client) throw new Error("Client not found");

    const project = (client.projects || []).find((p) => String(p.id) === String(projectId));
    if (!project) throw new Error("Project not found");

    const mIdx = (project.manpowerRequirements || []).findIndex(
      (m) => String(m.id) === String(positionId)
    );
    if (mIdx === -1) throw new Error("Position not found");

    project.manpowerRequirements[mIdx] = {
      ...project.manpowerRequirements[mIdx],
      ...positionData,
      id: positionId,
      projectId,
      quantity: Number(positionData.quantity) || 1,
      salary: Number(positionData.salary) || 0,
    };

    client.updatedAt = new Date().toISOString();
    saveClientsToStorage(all);
    return project.manpowerRequirements[mIdx];
  },

  
  getDashboardStats: async () => {
    await delay(80);
    const all = loadClientsFromStorage();

    const totalClients = all.length;
    const activeClients = all.filter((c) => c.status?.toLowerCase() === "active").length;

    let totalProjects = 0;
    let totalManpowerRequirements = 0;
    const allProjects = [];

    all.forEach((client) => {
      if (Array.isArray(client.projects)) {
        totalProjects += client.projects.length;
        client.projects.forEach((proj) => {
          const reqManpower = calculateProjectManpower(proj);
          totalManpowerRequirements += reqManpower;
          allProjects.push({
            ...proj,
            clientName: client.companyName,
            clientId: client.id,
            requiredManpower: reqManpower,
          });
        });
      }
    });

    
    const recentClients = [...all]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map((client) => ({
        id: client.id,
        companyName: client.companyName,
        country: client.country,
        city: client.city,
        projectsCount: client.projects?.length || 0,
        totalManpower: calculateClientManpower(client),
        status: client.status,
        createdAt: client.createdAt,
      }));

    
    const activeProjects = allProjects.filter(
      (p) => (p.status || "Active").toLowerCase() === "active"
    ).length;

    
    const recentProjects = allProjects
      .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
      .slice(0, 8);

    return {
      totalClients,
      activeClients,
      totalProjects,
      activeProjects,
      totalManpowerRequirements,
      recentClients,
      recentProjects,
    };
  },

  
  getAllProjects: async ({
    search = "",
    status = "All",
    country = "All",
    clientId = "All",
  } = {}) => {
    try {
      const res = await apiClient.get("/crm-sync/clients");
      if (res.data?.success && Array.isArray(res.data.clients) && res.data.clients.length > 0) {
        saveClientsToStorage(res.data.clients);
      }
    } catch {}

    const all = loadClientsFromStorage();
    let projectsList = [];

    all.forEach((client) => {
      if (Array.isArray(client.projects)) {
        client.projects.forEach((proj) => {
          const reqManpower = calculateProjectManpower(proj);
          projectsList.push({
            ...proj,
            clientName: client.companyName,
            clientCountry: client.country,
            clientEmail: client.email,
            clientPhone: client.phone,
            clientStatus: client.status,
            clientId: client.id,
            totalManpower: reqManpower,
          });
        });
      }
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      projectsList = projectsList.filter(
        (p) =>
          p.id?.toLowerCase().includes(q) ||
          p.projectName?.toLowerCase().includes(q) ||
          p.clientName?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.projectType?.toLowerCase().includes(q)
      );
    }

    if (status && status !== "All") {
      projectsList = projectsList.filter(
        (p) => p.status?.toLowerCase() === status.toLowerCase()
      );
    }

    if (country && country !== "All") {
      projectsList = projectsList.filter(
        (p) => p.country?.toLowerCase() === country.toLowerCase()
      );
    }

    if (clientId && clientId !== "All") {
      projectsList = projectsList.filter((p) => String(p.clientId) === String(clientId));
    }

    return {
      projects: projectsList,
      totalCount: projectsList.length,
    };
  },

  
  resetToMockData: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialClients));
    return initialClients;
  },

  
  
  
  getClientPayments: async (params = {}) => {
    try {
      const res = await apiClient.get("/admin/client-payments", { params });
      if (res.data?.success) {
        return res.data;
      }
    } catch (err) {
      console.warn("Backend getClientPayments failed, falling back to local storage:", err.message);
    }

    
    const localPaymentsRaw = localStorage.getItem("crm_client_payments_v1") || "[]";
    let list = JSON.parse(localPaymentsRaw);

    const { clientId, projectId, candidateId, paymentMethod, paymentStatus, gstTreatment, search } = params;
    if (clientId && clientId !== "ALL") list = list.filter((p) => String(p.clientId) === String(clientId));
    if (projectId && projectId !== "ALL") list = list.filter((p) => String(p.projectId) === String(projectId));
    if (candidateId && candidateId !== "ALL") list = list.filter((p) => String(p.candidateId) === String(candidateId));
    if (paymentMethod && paymentMethod !== "ALL") list = list.filter((p) => p.paymentMethod === paymentMethod);
    if (paymentStatus && paymentStatus !== "ALL") list = list.filter((p) => p.status === paymentStatus);
    if (gstTreatment && gstTreatment !== "ALL") list = list.filter((p) => p.gstTreatment === gstTreatment);
    if (search && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.paymentId?.toLowerCase().includes(q) ||
          p.clientName?.toLowerCase().includes(q) ||
          p.milestoneName?.toLowerCase().includes(q) ||
          p.transactionReference?.toLowerCase().includes(q)
      );
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 15;
    const startIndex = (page - 1) * limit;

    return {
      payments: list.slice(startIndex, startIndex + limit),
      total: list.length,
      page,
      limit,
      totalPages: Math.ceil(list.length / limit) || 1,
    };
  },

  recordClientPayment: async (paymentData) => {
    try {
      const res = await apiClient.post("/admin/client-payments", paymentData);
      if (res.data?.success) {
        return res.data.payment;
      }
    } catch (err) {
      console.warn("Backend recordClientPayment failed, saving to local storage:", err.message);
    }

    
    const localPaymentsRaw = localStorage.getItem("crm_client_payments_v1") || "[]";
    const list = JSON.parse(localPaymentsRaw);

    const paymentId = `PAY-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, "0")}`;
    const newTx = {
      ...paymentData,
      id: paymentId,
      paymentId,
      status: "Completed",
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    list.unshift(newTx);
    localStorage.setItem("crm_client_payments_v1", JSON.stringify(list));

    
    const clients = loadClientsFromStorage();
    const cIdx = clients.findIndex((c) => String(c.id) === String(paymentData.clientId));
    if (cIdx !== -1) {
      const cl = clients[cIdx];
      const milestones = cl.paymentMilestones || [];
      const mIdx = milestones.findIndex((m) => String(m.id) === String(paymentData.milestoneId));
      if (mIdx !== -1) {
        const ms = milestones[mIdx];
        const newPaid = (Number(ms.paidAmount) || 0) + Number(paymentData.amountPaid);
        ms.paidAmount = newPaid;
        ms.remainingBalance = Math.max(0, (Number(ms.amount) || 0) - newPaid);
        ms.status = ms.remainingBalance <= 0 ? "Paid" : "Partially Paid";
        milestones[mIdx] = ms;
      }
      cl.paymentMilestones = milestones;
      const totalAgreed = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const totalPaid = milestones.reduce((sum, m) => sum + (Number(m.paidAmount) || 0), 0);
      cl.totalAgreedAmount = totalAgreed;
      cl.totalPaidAmount = totalPaid;
      cl.remainingAmount = Math.max(0, totalAgreed - totalPaid);
      clients[cIdx] = cl;
      saveClientsToStorage(clients);
    }

    return newTx;
  },

  getLedgerStats: async (clientId = null) => {
    try {
      const res = await apiClient.get("/admin/client-payments/stats", {
        params: { clientId: clientId || undefined },
      });
      if (res.data?.success) {
        return res.data.stats;
      }
    } catch (err) {
      console.warn("Backend getLedgerStats failed, computing locally:", err.message);
    }

    
    const clients = loadClientsFromStorage();
    let relevantClients = clients;
    if (clientId && clientId !== "ALL") {
      relevantClients = clients.filter((c) => String(c.id) === String(clientId));
    }

    let totalAgreed = 0;
    let dueCount = 0;
    let overdueCount = 0;
    const now = new Date();

    relevantClients.forEach((c) => {
      (c.paymentMilestones || []).forEach((m) => {
        totalAgreed += Number(m.amount) || 0;
        if (m.status === "Due") dueCount++;
        if (m.status === "Overdue" || (m.dueDate && new Date(m.dueDate) < now && m.status !== "Paid")) {
          overdueCount++;
        }
      });
    });

    const localPaymentsRaw = localStorage.getItem("crm_client_payments_v1") || "[]";
    let list = JSON.parse(localPaymentsRaw).filter((p) => !p.isReversed);
    if (clientId && clientId !== "ALL") {
      list = list.filter((p) => String(p.clientId) === String(clientId));
    }

    const totalPaid = list.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const totalTransactionsAmount = list.reduce(
      (sum, p) => sum + (Number(p.totalTransactionAmount) || Number(p.amountPaid) || 0),
      0
    );

    return {
      totalAgreedPayments: totalAgreed,
      totalPaymentsMade: totalPaid,
      totalOutstandingAmount: Math.max(0, totalAgreed - totalPaid),
      paymentsDue: dueCount,
      overduePayments: overdueCount,
      totalTransactions: list.length,
      totalTransactionsAmount,
    };
  },

  reverseClientPayment: async (paymentId, reason) => {
    try {
      const res = await apiClient.post(`/admin/client-payments/${paymentId}/reverse`, { reason });
      if (res.data?.success) {
        return res.data.payment;
      }
    } catch (err) {
      console.warn("Backend reverseClientPayment failed, updating local:", err.message);
    }

    const localPaymentsRaw = localStorage.getItem("crm_client_payments_v1") || "[]";
    const list = JSON.parse(localPaymentsRaw);
    const pIdx = list.findIndex((p) => String(p.id) === String(paymentId) || String(p.paymentId) === String(paymentId));
    if (pIdx !== -1) {
      list[pIdx].isReversed = true;
      list[pIdx].status = "Reversed";
      list[pIdx].reversalReason = reason || "Reversed by admin";
      localStorage.setItem("crm_client_payments_v1", JSON.stringify(list));
      return list[pIdx];
    }
    throw new Error("Payment record not found");
  },

  updateClientPayment: async (paymentId, updateData) => {
    try {
      const res = await apiClient.put(`/admin/client-payments/${paymentId}`, updateData);
      if (res.data?.success) {
        return res.data.payment;
      }
    } catch (err) {
      console.warn("Backend updateClientPayment failed, updating local storage:", err.message);
    }

    const localPaymentsRaw = localStorage.getItem("crm_client_payments_v1") || "[]";
    const list = JSON.parse(localPaymentsRaw);
    const pIdx = list.findIndex((p) => String(p.id) === String(paymentId) || String(p.paymentId) === String(paymentId));
    if (pIdx !== -1) {
      list[pIdx] = { ...list[pIdx], ...updateData, updatedAt: new Date().toISOString() };
      localStorage.setItem("crm_client_payments_v1", JSON.stringify(list));
      return list[pIdx];
    }
    throw new Error("Payment record not found");
  },

  
  
  
  getClientExpenses: async (clientId) => {
    try {
      const res = await apiClient.get(`/admin/expenses/client/${clientId}`);
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn("Backend getClientExpenses failed, falling back to local:", err.message);
    }

    const localExpensesRaw = localStorage.getItem("crm_client_expenses_v1") || "[]";
    let list = JSON.parse(localExpensesRaw);
    if (clientId) {
      list = list.filter((e) => String(e.clientId) === String(clientId));
    }

    const totalExpensesRecorded = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalExpensesPaid = list
      .filter((e) => e.status === "Paid")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingExpenses = list
      .filter((e) => e.status === "Pending" || e.status === "Approved")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      clientId,
      totalCount: list.length,
      totalExpensesRecorded,
      totalExpensesPaid,
      pendingExpenses,
      approvedAmount: totalExpensesPaid,
      expenses: list,
    };
  },

  recordClientExpense: async (expenseData) => {
    try {
      const res = await apiClient.post("/admin/expenses", expenseData);
      if (res.data?.expense) {
        return res.data.expense;
      }
    } catch (err) {
      console.warn("Backend recordClientExpense failed, saving to local storage:", err.message);
    }

    const localExpensesRaw = localStorage.getItem("crm_client_expenses_v1") || "[]";
    const list = JSON.parse(localExpensesRaw);
    const expenseId = `EXP-${new Date().getFullYear()}-${String(list.length + 1).padStart(4, "0")}`;
    const newExp = {
      ...expenseData,
      id: expenseId,
      _id: expenseId,
      createdAt: new Date().toISOString(),
      date: expenseData.date || new Date().toISOString(),
      status: expenseData.status || "Pending",
    };
    list.unshift(newExp);
    localStorage.setItem("crm_client_expenses_v1", JSON.stringify(list));
    return newExp;
  },

  updateClientExpense: async (expenseId, updateData) => {
    try {
      const res = await apiClient.put(`/admin/expenses/${expenseId}`, updateData);
      if (res.data?.expense) {
        return res.data.expense;
      }
    } catch (err) {
      console.warn("Backend updateClientExpense failed, updating local storage:", err.message);
    }

    const localExpensesRaw = localStorage.getItem("crm_client_expenses_v1") || "[]";
    const list = JSON.parse(localExpensesRaw);
    const eIdx = list.findIndex((e) => String(e.id || e._id) === String(expenseId));
    if (eIdx !== -1) {
      list[eIdx] = { ...list[eIdx], ...updateData, updatedAt: new Date().toISOString() };
      localStorage.setItem("crm_client_expenses_v1", JSON.stringify(list));
      return list[eIdx];
    }
    throw new Error("Expense record not found");
  },

  deleteClientExpense: async (expenseId) => {
    try {
      await apiClient.delete(`/admin/expenses/${expenseId}`);
      return true;
    } catch (err) {
      console.warn("Backend deleteClientExpense failed, removing from local storage:", err.message);
    }

    const localExpensesRaw = localStorage.getItem("crm_client_expenses_v1") || "[]";
    let list = JSON.parse(localExpensesRaw);
    list = list.filter((e) => String(e.id || e._id) !== String(expenseId));
    localStorage.setItem("crm_client_expenses_v1", JSON.stringify(list));
    return true;
  },

  getAllExpenses: async (params = {}) => {
    try {
      const res = await apiClient.get("/admin/expenses", { params });
      if (res.data) {
        return Array.isArray(res.data) ? res.data : res.data.expenses || [];
      }
    } catch (err) {
      console.warn("Backend getAllExpenses failed, returning local storage:", err.message);
    }

    const localExpensesRaw = localStorage.getItem("crm_client_expenses_v1") || "[]";
    return JSON.parse(localExpensesRaw);
  },
};

export default crmClientService;

