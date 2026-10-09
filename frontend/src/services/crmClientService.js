// Service layer for Foreign Manpower Supply Client Management CRM
import { initialClients } from "../data/mockClients.js";
import { apiClient } from "./apiClient.js";

const STORAGE_KEY = "crm_clients_data_v3";

// Internal helper to get all clients from localStorage or initialize with empty list
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
          (c) => !["cl-1", "cl-2", "cl-3", "cl-4", "cl-5"].includes(String(c.id))
        );
        if (realClients.length > 0) {
          const existingIds = new Set(realClients.map((c) => String(c.id)));
          const missing = (initialClients || []).filter((c) => !existingIds.has(String(c.id)));
          if (missing.length > 0) {
            const merged = [...realClients, ...missing];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          }
          return realClients;
        }
      }
    }
  } catch (err) {
    console.error("Error reading clients from storage:", err);
  }
  const fallback = Array.isArray(initialClients) && initialClients.length > 0 ? initialClients : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
};

// Internal helper to save clients
const saveClientsToStorage = (clients) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error("Error saving clients to storage:", err);
  }
};

// Helper to compute total manpower for a project
export const calculateProjectManpower = (project) => {
  if (!project || !Array.isArray(project.manpowerRequirements)) return 0;
  return project.manpowerRequirements.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + qty;
  }, 0);
};

// Helper to compute total manpower across all projects of a client
export const calculateClientManpower = (client) => {
  if (!client || !Array.isArray(client.projects)) return 0;
  return client.projects.reduce((sum, proj) => {
    return sum + calculateProjectManpower(proj);
  }, 0);
};

// Helper to simulate slight async latency (for realistic skeleton and loading indicators)
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const crmClientService = {
  // Get all clients with filtering, search, and pagination
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
      if (res.data?.success && Array.isArray(res.data.clients) && res.data.clients.length > 0) {
        saveClientsToStorage(res.data.clients);
      }
    } catch {}

    const all = loadClientsFromStorage();

    let filtered = all.filter((client) => {
      // Search filter: company name, email, phone, city, primary contact name
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

      // Country filter
      if (country && country !== "All") {
        if (client.country?.toLowerCase() !== country.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (status && status !== "All") {
        if (client.status?.toLowerCase() !== status.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    // Sorting
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

  // Get a single client by ID
  getClientById: async (id) => {
    await delay(60);
    const all = loadClientsFromStorage();
    const found = all.find((c) => String(c.id) === String(id));
    return found || null;
  },

  // Create a new client (with projects & manpower requirements)
  createClient: async (payload) => {
    await delay(120);
    const all = loadClientsFromStorage();

    const clientId = `cli-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    // Standardize projects and their manpower requirements
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

    const newClient = {
      ...payload,
      id: clientId,
      status: payload.status || "Active",
      createdAt: now,
      updatedAt: now,
      projects,
    };

    all.unshift(newClient);
    saveClientsToStorage(all);
    try {
      await apiClient.post("/crm-sync/clients", newClient);
    } catch {}
    return newClient;
  },

  // Update existing client
  updateClient: async (id, payload) => {
    await delay(100);
    const all = loadClientsFromStorage();
    const index = all.findIndex((c) => String(c.id) === String(id));
    if (index === -1) {
      throw new Error(`Client with ID ${id} not found.`);
    }

    const existing = all[index];
    const now = new Date().toISOString();

    // Preserve or merge projects
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
      id: existing.id,
      projects: updatedProjects,
      updatedAt: now,
    };

    all[index] = updated;
    saveClientsToStorage(all);
    return updated;
  },

  // Delete client
  deleteClient: async (id) => {
    await delay(80);
    let all = loadClientsFromStorage();
    all = all.filter((c) => String(c.id) !== String(id));
    saveClientsToStorage(all);
    return { success: true };
  },

  // Add project to an existing client
  addProject: async (clientId, projectData) => {
    await delay(100);
    const all = loadClientsFromStorage();
    const client = all.find((c) => String(c.id) === String(clientId));
    if (!client) throw new Error("Client not found");

    const projectId = `prj-${Date.now().toString().slice(-6)}`;
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
      status: projectData.status || "Active",
      manpowerRequirements,
    };

    if (!Array.isArray(client.projects)) {
      client.projects = [];
    }
    client.projects.unshift(newProject);
    client.updatedAt = new Date().toISOString();

    saveClientsToStorage(all);
    try {
      await apiClient.post("/crm-sync/projects", { clientId, project: newProject });
    } catch {}

    // Dispatch real-time notification to assigned vendors or all vendors
    try {
      const assignedVendors = newProject.assignedVendors || newProject.assignedVendorIds || [];
      const isAll =
        (newProject.vendorAssignmentType || newProject.vendorVisibility) !== "Specific Vendor" &&
        (newProject.vendorAssignmentType || newProject.vendorVisibility) !== "specific";

      import("./crmVendorService.js").then(({ default: vendorService }) => {
        if (isAll) {
          const vendors = typeof vendorService.getVendorsSync === "function" ? vendorService.getVendorsSync() : [];
          (vendors || []).forEach((v) => {
            vendorService.addNotification({
              vendorId: v.id,
              title: "New Project Assigned",
              message: `New overseas project "${newProject.projectName}" (${newProject.country || "Overseas"}) is open for candidate submissions.`,
              type: "info",
              link: "/vendor/dashboard",
            });
          });
        } else {
          assignedVendors.forEach((vId) => {
            vendorService.addNotification({
              vendorId: vId,
              title: "Project Assigned Directly to You",
              message: `Admin has assigned project "${newProject.projectName}" (${newProject.country || "Overseas"}) to your agency.`,
              type: "info",
              link: "/vendor/dashboard",
            });
          });
        }
      }).catch(() => {});
    } catch {}

    return newProject;
  },

  // Get a single project
  getProjectById: async (clientId, projectId) => {
    await delay(60);
    const all = loadClientsFromStorage();
    const targetProjectId = projectId || clientId;
    let client = null;
    let project = null;

    if (clientId && projectId) {
      client = all.find((c) => String(c.id) === String(clientId));
      if (client) {
        project = (client.projects || []).find((p) => String(p.id) === String(projectId));
      }
    }

    if (!project) {
      for (const c of all) {
        const found = (c.projects || []).find((p) => String(p.id) === String(targetProjectId));
        if (found) {
          project = found;
          client = c;
          break;
        }
      }
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

  // Update a single project
  updateProject: async (clientId, projectId, projectData) => {
    await delay(100);
    const all = loadClientsFromStorage();
    const targetProjectId = projectId || clientId;
    let client = clientId ? all.find((c) => String(c.id) === String(clientId)) : null;

    if (!client) {
      client = all.find((c) =>
        (c.projects || []).some((p) => String(p.id) === String(targetProjectId))
      );
    }
    if (!client) throw new Error("Client not found");

    const pIdx = (client.projects || []).findIndex(
      (p) => String(p.id) === String(targetProjectId)
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
    return client.projects[pIdx];
  },

  // Toggle project status between Active and Inactive
  toggleProjectStatus: async (clientId, projectId) => {
    await delay(80);
    const all = loadClientsFromStorage();
    const targetProjectId = projectId || clientId;
    let client = clientId ? all.find((c) => String(c.id) === String(clientId)) : null;

    if (!client) {
      client = all.find((c) =>
        (c.projects || []).some((p) => String(p.id) === String(targetProjectId))
      );
    }
    if (!client) throw new Error("Client not found");

    const pIdx = (client.projects || []).findIndex(
      (p) => String(p.id) === String(targetProjectId)
    );
    if (pIdx === -1) throw new Error("Project not found");

    const currentStatus = client.projects[pIdx].status || "Active";
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    client.projects[pIdx].status = nextStatus;
    client.updatedAt = new Date().toISOString();

    saveClientsToStorage(all);
    return client.projects[pIdx];
  },

  // Delete a project
  deleteProject: async (clientId, projectId) => {
    await delay(80);
    const all = loadClientsFromStorage();
    const client = all.find((c) => String(c.id) === String(clientId));
    if (!client) throw new Error("Client not found");

    client.projects = (client.projects || []).filter((p) => String(p.id) !== String(projectId));
    client.updatedAt = new Date().toISOString();
    saveClientsToStorage(all);
    return { success: true };
  },

  // Add a manpower position to a project
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

  // Delete a manpower position
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

  // Update a manpower position
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

  // Get aggregated stats for Admin Dashboard
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

    // Recent 5 clients
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

    // Active projects count
    const activeProjects = allProjects.filter(
      (p) => (p.status || "Active").toLowerCase() === "active"
    ).length;

    // Recent projects (up to 8 for dashboard overview)
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

  // Get all projects across all clients with rich client details, search, and filters
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

  // Reset local storage back to default initial mock data
  resetToMockData: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialClients));
    return initialClients;
  },
};

export default crmClientService;
