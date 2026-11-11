import crypto from "crypto";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import Candidate from "../models/Candidate.js";

const TICKET_TTL_MS = 45 * 1000;
const MAX_TICKETS = 5000;
const tickets = new Map();
const clients = new Set();

const normalizeRole = (role = "", hrType = "", isSuperAdmin = false) => {
  if (isSuperAdmin) return "SUPERADMIN";
  const r = String(role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  if (r === "SUPERADMIN") return "SUPERADMIN";
  if (r === "HR") {
    return String(hrType || "").toUpperCase() === "VENDOR_HR" ? "VENDORHR" : "EMPLOYEEHR";
  }
  return r;
};

const cleanupExpiredTickets = () => {
  const now = Date.now();
  for (const [key, entry] of tickets.entries()) {
    if (!entry || entry.expiresAt <= now) {
      tickets.delete(key);
    }
  }
};

export const issueRealtimeTicket = async (reqUser) => {
  cleanupExpiredTickets();
  if (tickets.size >= MAX_TICKETS) {
    const firstKey = tickets.keys().next().value;
    if (firstKey) tickets.delete(firstKey);
  }

  const rawId = String(reqUser?.id || reqUser?._id || reqUser?.sub || "").trim();
  let roleNorm = normalizeRole(reqUser?.role, reqUser?.hrType, Boolean(reqUser?.isSuperAdmin));
  let vendorId = reqUser?.vendorId ? String(reqUser.vendorId).trim() : "";
  let candidateId = reqUser?.candidateId ? String(reqUser.candidateId).trim() : "";
  let assignedVendors = Array.isArray(reqUser?.assignedVendors)
    ? reqUser.assignedVendors.map((v) => String(v).trim()).filter(Boolean)
    : [];

  if (rawId && /^[0-9a-fA-F]{24}$/.test(rawId)) {
    if (["ADMIN", "SUPERADMIN", "HR", "VENDORHR", "EMPLOYEEHR"].includes(roleNorm)) {
      const userDoc = await User.findById(rawId)
        .select("role hrType assignedVendors isActive")
        .lean()
        .catch(() => null);
      if (userDoc) {
        if (userDoc.isActive === false) return null;
        roleNorm = normalizeRole(userDoc.role, userDoc.hrType, roleNorm === "SUPERADMIN");
        assignedVendors = Array.isArray(userDoc.assignedVendors)
          ? userDoc.assignedVendors.map((v) => String(v).trim()).filter(Boolean)
          : assignedVendors;
      }
    } else if (roleNorm === "VENDOR" && !vendorId) {
      const vDoc = await Vendor.findById(rawId).select("vendorId").lean().catch(() => null);
      if (vDoc?.vendorId) vendorId = String(vDoc.vendorId);
    } else if (roleNorm === "CANDIDATE" && !candidateId) {
      const cDoc = await Candidate.findById(rawId).select("candidateId").lean().catch(() => null);
      if (cDoc?.candidateId) candidateId = String(cDoc.candidateId);
    }
  }

  const ticket = crypto.randomBytes(24).toString("hex");
  tickets.set(ticket, {
    userId: rawId,
    roleNorm,
    vendorId: vendorId || (roleNorm === "VENDOR" ? rawId : ""),
    candidateId: candidateId || (roleNorm === "CANDIDATE" ? rawId : ""),
    assignedVendors,
    expiresAt: Date.now() + TICKET_TTL_MS,
  });

  return ticket;
};

export const consumeRealtimeTicket = (ticket) => {
  const key = String(ticket || "").trim();
  if (!key) return null;
  const entry = tickets.get(key);
  tickets.delete(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    return null;
  }
  return entry;
};

export const addRealtimeClient = (client) => {
  clients.add(client);
  return () => {
    clients.delete(client);
  };
};

export const getRealtimeClientCount = () => clients.size;

export const emitRealtimeEvent = ({
  events = [],
  event = "",
  roles = null,
  vendorId = null,
  candidateId = null,
  userIds = null,
  detail = {},
} = {}) => {
  const eventList = Array.from(
    new Set([...(Array.isArray(events) ? events : []), ...(event ? [event] : [])].filter(Boolean))
  );
  if (eventList.length === 0 || clients.size === 0) return;

  const allowedRoles = Array.isArray(roles)
    ? new Set(roles.map((r) => normalizeRole(r)))
    : null;
  const allowedUserIds = Array.isArray(userIds)
    ? new Set(userIds.map((id) => String(id).trim()).filter(Boolean))
    : null;
  const targetVendor = vendorId ? String(vendorId).trim() : "";
  const targetCandidate = candidateId ? String(candidateId).trim() : "";

  const frame = `event: sync\ndata: ${JSON.stringify({
    events: eventList,
    detail: { ...detail, ts: Date.now() },
  })}\n\n`;

  for (const client of clients) {
    try {
      if (allowedRoles && !allowedRoles.has(client.roleNorm)) {
        continue;
      }

      if (allowedUserIds && !allowedUserIds.has(client.userId)) {
        const isTopStaff =
          (client.roleNorm === "SUPERADMIN" && allowedRoles?.has("SUPERADMIN")) ||
          (client.roleNorm === "ADMIN" && allowedRoles?.has("ADMIN"));
        if (!isTopStaff) continue;
      }

      if (client.roleNorm === "VENDOR" && targetVendor) {
        if (client.vendorId !== targetVendor && client.userId !== targetVendor) {
          continue;
        }
      }

      if (client.roleNorm === "VENDORHR" && targetVendor && client.assignedVendors.length > 0) {
        if (!client.assignedVendors.includes(targetVendor)) {
          continue;
        }
      }

      if (client.roleNorm === "CANDIDATE") {
        if (targetCandidate) {
          if (client.candidateId !== targetCandidate && client.userId !== targetCandidate) {
            continue;
          }
        } else if (!allowedRoles?.has("CANDIDATE")) {
          continue;
        }
      }

      client.res.write(frame);
    } catch {
      clients.delete(client);
    }
  }
};

const keepAliveTimer = setInterval(() => {
  if (clients.size === 0) return;
  for (const client of clients) {
    try {
      client.res.write(": keepalive\n\n");
    } catch {
      clients.delete(client);
    }
  }
}, 25000);

if (typeof keepAliveTimer.unref === "function") {
  keepAliveTimer.unref();
}

