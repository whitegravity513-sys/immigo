import appConfig from "../config/appConfig.js";
import apiClient from "./apiClient.js";

let eventSource = null;
let reconnectTimer = null;
let backoffMs = 1500;
let activeSessionKey = "";
let isStopped = true;
let connectionSeq = 0;
let broadcastChannel = null;

const MAX_BACKOFF_MS = 25000;
const PROJECTS_CACHE_KEY = "immigo_crm_projects_cache_v1";

const getStoredAuth = () => {
  if (typeof window === "undefined") return { token: "", role: "" };
  const token =
    localStorage.getItem(appConfig.STORAGE_KEYS.TOKEN) ||
    localStorage.getItem("immigo_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("vista_auth_token") ||
    "";
  const role =
    localStorage.getItem(appConfig.STORAGE_KEYS.ROLE) ||
    localStorage.getItem("immigo_user_role") ||
    localStorage.getItem("vista_user_role") ||
    "";
  return { token, role };
};

const clearStaleProjectCache = (events = []) => {
  try {
    if (
      events.some((evt) =>
        [
          "immigo:project-update",
          "immigo:application-update",
          "immigo:dashboard-update",
          "immigo:vendor-hr-refresh",
        ].includes(evt)
      )
    ) {
      localStorage.removeItem(PROJECTS_CACHE_KEY);
    }
  } catch {}
};

const dispatchSyncEvents = (events = [], detail = {}) => {
  if (typeof window === "undefined" || !Array.isArray(events) || events.length === 0) return;
  clearStaleProjectCache(events);
  const enrichedDetail = { ...(detail || {}), remote: true };
  for (const evtName of events) {
    if (typeof evtName === "string" && evtName.trim()) {
      window.dispatchEvent(new CustomEvent(evtName.trim(), { detail: enrichedDetail }));
    }
  }
};

const ensureBroadcastChannel = () => {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel("immigo_sync");
    broadcastChannel.onmessage = (msgEvent) => {
      const payload = msgEvent?.data;
      if (payload && Array.isArray(payload.events)) {
        dispatchSyncEvents(payload.events, { ...(payload.detail || {}), fromBroadcast: true });
      }
    };
  }
  return broadcastChannel;
};

export const broadcastSyncEvents = (events = [], detail = {}) => {
  const ch = ensureBroadcastChannel();
  if (ch && Array.isArray(events) && events.length > 0) {
    try {
      ch.postMessage({ events, detail });
    } catch {}
  }
};

const closeEventSource = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    try {
      eventSource.close();
    } catch {}
    eventSource = null;
  }
};

const scheduleReconnect = (seq) => {
  if (isStopped || seq !== connectionSeq) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delayMs = backoffMs;
  backoffMs = Math.min(MAX_BACKOFF_MS, Math.round(backoffMs * 1.8));
  reconnectTimer = setTimeout(() => {
    if (!isStopped && seq === connectionSeq) {
      connectStream(seq);
    }
  }, delayMs);
};

const connectStream = async (seq) => {
  if (isStopped || seq !== connectionSeq) return;
  const { token, role } = getStoredAuth();
  if (!token || !role) return;

  try {
    const res = await apiClient.post("/events/ticket");
    if (isStopped || seq !== connectionSeq) return;
    const ticket = res?.data?.ticket;
    if (!ticket) {
      scheduleReconnect(seq);
      return;
    }

    closeEventSource();
    const streamUrl = `${appConfig.API_BASE_URL}/events/stream?ticket=${encodeURIComponent(ticket)}`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    eventSource = es;

    es.onopen = () => {
      backoffMs = 1500;
    };

    es.addEventListener("ready", () => {
      backoffMs = 1500;
    });

    es.addEventListener("sync", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        if (Array.isArray(payload.events)) {
          dispatchSyncEvents(payload.events, { ...(payload.detail || {}), source: "sse" });
        }
      } catch {}
    });

    es.onerror = () => {
      closeEventSource();
      scheduleReconnect(seq);
    };
  } catch {
    scheduleReconnect(seq);
  }
};

const handleVisibilityOrOnline = () => {
  if (isStopped) return;
  if (typeof document !== "undefined" && document.hidden) return;
  if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
    backoffMs = 1500;
    connectStream(connectionSeq);
  }
};

export const startRealtimeSync = (authOverrides = {}) => {
  const stored = getStoredAuth();
  const token = authOverrides.token || stored.token;
  const role = authOverrides.role || stored.role;

  if (!token || !role) {
    stopRealtimeSync();
    return;
  }

  const nextKey = `${role}:${token.slice(-16)}`;
  if (!isStopped && activeSessionKey === nextKey && eventSource && eventSource.readyState !== EventSource.CLOSED) {
    return;
  }

  stopRealtimeSync();
  isStopped = false;
  activeSessionKey = nextKey;
  backoffMs = 1500;
  connectionSeq += 1;
  const seq = connectionSeq;

  ensureBroadcastChannel();

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleVisibilityOrOnline);
    document.addEventListener("visibilitychange", handleVisibilityOrOnline);
  }

  connectStream(seq);
};

export const stopRealtimeSync = () => {
  isStopped = true;
  activeSessionKey = "";
  connectionSeq += 1;
  closeEventSource();

  if (typeof window !== "undefined") {
    window.removeEventListener("online", handleVisibilityOrOnline);
    document.removeEventListener("visibilitychange", handleVisibilityOrOnline);
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch {}
    broadcastChannel = null;
  }
};

export default {
  startRealtimeSync,
  stopRealtimeSync,
  broadcastSyncEvents,
};

