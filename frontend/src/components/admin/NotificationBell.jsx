import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiClient } from "../../services/apiClient.js";
import crmVendorService from "../../services/crmVendorService.js";
import { Bell } from "lucide-react";
import UnifiedNotificationPopover from "../common/UnifiedNotificationPopover.jsx";
import { isMeetingExpired } from "../../utils/formatters.js";

const ADMIN_NOTIF_STORAGE_KEYS = new Set([
  "immigo_crm_admin_notifications_v3",
  "immigo_deleted_admin_notifications_v1",
  "immigo_admin_notifs_cleared_ts",
]);

export default function NotificationBell({ className }) {
  const { user, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const lastAdminReadAllTsRef = useRef(0);
  const isFetchingRef = useRef(false);
  const lastNotifSigRef = useRef("");

  const currentUserId = String(user?.id || user?._id || "");
  const rawRole = String(user?.role || "").toUpperCase();
  const hrType = String(user?.hrType || "").toUpperCase();
  const assignedVendors = Array.isArray(user?.assignedVendors) ? user.assignedVendors.map(String) : [];

  const effectiveStaffRole = isSuperAdmin || rawRole === "SUPER_ADMIN"
    ? "SUPER_ADMIN"
    : rawRole === "HR"
    ? hrType === "VENDOR_HR"
      ? "VENDOR_HR"
      : "EMPLOYEE_HR"
    : rawRole || "ADMIN";

  const portalBase =
    rawRole === "HR" || location.pathname.startsWith("/hr")
      ? "/hr/dashboard"
      : "/admin/dashboard";

  const getDeletedAdminIds = () => {
    try {
      const stored = localStorage.getItem("immigo_deleted_admin_notifications_v1");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  };

  const getClearedTs = () => {
    try {
      return parseInt(localStorage.getItem("immigo_admin_notifs_cleared_ts") || "0", 10) || 0;
    } catch {
      return 0;
    }
  };

  const buildCrmQueryString = () => {
    const params = new URLSearchParams({ role: effectiveStaffRole });
    if (currentUserId) params.set("userId", currentUserId);
    if (assignedVendors.length > 0) params.set("assignedVendors", assignedVendors.join(","));
    return params.toString();
  };

  const fetchNotifications = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const deletedIds = getDeletedAdminIds();
      const clearedTs = getClearedTs();

      let backendNotifs = [];
      try {
        const res = await apiClient.get("/admin/notifications?limit=50");
        backendNotifs = res.data?.notifications || [];
      } catch {}

      let crmNotifs = [];
      let localAdminNotifs = [];
      if (effectiveStaffRole !== "EMPLOYEE_HR") {
        try {
          const crmRes = await apiClient.get(`/crm-sync/notifications?${buildCrmQueryString()}`);
          crmNotifs = (crmRes.data?.notifications || []).map((n) => ({
            _id: n.id || n.notificationId,
            id: n.id || n.notificationId,
            title: n.title,
            message: n.message,
            createdAt: n.timestamp || n.createdAt,
            isRead: !!n.read,
            read: !!n.read,
            type: n.type || "INFO",
            link: n.link || "/admin/vendor-candidates",
            actorId: n.actorId || null,
            actorRole: n.actorRole || null,
            recipientRole: n.recipientRole || null,
            vendorId: n.vendorId || null,
          }));
        } catch {}

        localAdminNotifs = (crmVendorService.getAdminNotifications({ sync: false }) || []).map((n) => ({
          _id: n.id,
          id: n.id,
          title: n.title,
          message: n.message,
          createdAt: n.timestamp,
          isRead: !!n.read,
          read: !!n.read,
          type: n.type || "INFO",
          link: n.link,
          actorId: n.actorId || null,
          actorRole: n.actorRole || null,
          recipientRole: n.recipientRole || null,
          vendorId: n.vendorId || null,
        }));
      }

      const all = [...crmNotifs, ...localAdminNotifs, ...backendNotifs];
      const seen = new Set();
      const merged = all.filter((n) => {
        if (n.actorId && currentUserId && String(n.actorId) === currentUserId) {
          return false;
        }
        if (effectiveStaffRole === "ADMIN") {
          if (n.actorRole === "ADMIN" || n.recipientRole === "SUPER_ADMIN") {
            return false;
          }
        }
        if (effectiveStaffRole === "SUPER_ADMIN") {
          if (n.actorRole === "SUPER_ADMIN") {
            return false;
          }
        }
        if (effectiveStaffRole === "VENDOR_HR" && assignedVendors.length > 0 && n.vendorId) {
          if (!assignedVendors.includes(String(n.vendorId))) {
            return false;
          }
        }

        const typeUpper = String(n.type || "").toUpperCase();
        if ((typeUpper === "MEETING" || typeUpper === "MEETING_REMINDER") && n.metadata?.date) {
          if (isMeetingExpired(n.metadata)) {
            return false;
          }
        }

        const key = String(n._id || n.id || `${n.title}-${n.createdAt}`);
        const id1 = String(n._id || "");
        const id2 = String(n.id || "");
        const titleKey = `${n.title || ""}-${n.createdAt || ""}`;

        if (deletedIds.has(key) || (id1 && deletedIds.has(id1)) || (id2 && deletedIds.has(id2)) || deletedIds.has(titleKey)) {
          return false;
        }

        const itemTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
        if (clearedTs && itemTime && itemTime <= clearedTs) {
          return false;
        }

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      const processed = merged.map((n) => {
        const itemTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
        const isRead = Boolean(
          n.isRead ||
          n.read ||
          (lastAdminReadAllTsRef.current && itemTime <= lastAdminReadAllTsRef.current)
        );
        const rawEmpId = n.employeeId || n.metadata?.employeeId || n.employeeCode || "";
        let link = n.link || "";
        if (!link) {
          if ((n.type === "DOCUMENT_UPLOAD" || n.type === "DOCUMENT_UPDATE") && rawEmpId) {
            link = `${portalBase}/employee/${rawEmpId}?tab=documents`;
          } else if (n.type === "LEAVE_APPLY") {
            link = `${portalBase}/leaves`;
          } else if (n.type === "EMPLOYEE_CREATED" && rawEmpId) {
            link = `${portalBase}/employee/${rawEmpId}`;
          }
        }
        return { ...n, isRead, read: isRead, link };
      });

      const unread = processed.filter((n) => !n.isRead && !n.read).length;
      const sig = JSON.stringify({
        unread,
        items: processed.map((n) => [n._id || n.id, Boolean(n.isRead || n.read), n.title, n.message, n.createdAt, n.link]),
      });
      if (lastNotifSigRef.current !== sig) {
        lastNotifSigRef.current = sig;
        setNotifications(processed);
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleImmediateWakeup = (e) => {
      if (e?.type === "storage" && (!e.key || !ADMIN_NOTIF_STORAGE_KEYS.has(e.key))) {
        return;
      }
      fetchNotifications();
    };
    window.addEventListener("immigo:admin-notification", handleImmediateWakeup);
    window.addEventListener("storage", handleImmediateWakeup);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchNotifications();
      }
    }, 25000);
    return () => {
      window.removeEventListener("immigo:admin-notification", handleImmediateWakeup);
      window.removeEventListener("storage", handleImmediateWakeup);
      clearInterval(interval);
    };
  }, [currentUserId, effectiveStaffRole]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    lastAdminReadAllTsRef.current = Date.now();
    lastNotifSigRef.current = "";
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));

    try {
      const requests = [apiClient.put("/admin/notifications/read-all")];
      if (effectiveStaffRole !== "EMPLOYEE_HR") {
        requests.push(apiClient.put(`/crm-sync/notifications/read-all?${buildCrmQueryString()}`));
      }
      await Promise.allSettled(requests);
      crmVendorService.markAllAdminNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkOneAsRead = async (id) => {
    const sId = String(id || "");
    lastNotifSigRef.current = "";
    setNotifications((prev) =>
      prev.map((n) => (String(n._id) === sId || String(n.id) === sId ? { ...n, isRead: true, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      if (sId.startsWith("admin-notif-")) {
        crmVendorService.markAdminNotificationRead(sId);
      } else {
        await apiClient.put(`/admin/notifications/${sId}/read`).catch(() => {});
      }
      await apiClient.put(`/crm-sync/notifications/${sId}/read`).catch(() => {});
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleDeleteOne = async (id, e) => {
    if (e) e.stopPropagation();
    const sId = String(id || "");
    lastNotifSigRef.current = "";

    const deletedIds = getDeletedAdminIds();
    deletedIds.add(sId);

    let targetItem = null;
    setNotifications((prev) => {
      targetItem = prev.find((n) => String(n._id) === sId || String(n.id) === sId);
      if (targetItem) {
        if (targetItem._id) deletedIds.add(String(targetItem._id));
        if (targetItem.id) deletedIds.add(String(targetItem.id));
        if (targetItem.notificationId) deletedIds.add(String(targetItem.notificationId));
        if (targetItem.title && targetItem.createdAt) {
          deletedIds.add(`${targetItem.title}-${targetItem.createdAt}`);
        }
      }
      if (targetItem && !targetItem.read && !targetItem.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => String(n._id) !== sId && String(n.id) !== sId);
    });

    try {
      localStorage.setItem("immigo_deleted_admin_notifications_v1", JSON.stringify(Array.from(deletedIds)));
    } catch {}

    try {
      crmVendorService.deleteAdminNotification(sId);
      if (targetItem) {
        if (targetItem.id) crmVendorService.deleteAdminNotification(String(targetItem.id));
        if (targetItem._id) crmVendorService.deleteAdminNotification(String(targetItem._id));
      }
    } catch {}

    try {
      await Promise.allSettled([
        apiClient.delete(`/admin/notifications/${sId}`),
        apiClient.delete(`/crm-sync/notifications/${sId}`),
      ]);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearAll = async () => {
    lastNotifSigRef.current = "";
    try {
      localStorage.setItem("immigo_admin_notifs_cleared_ts", Date.now().toString());
    } catch {}

    setNotifications([]);
    setUnreadCount(0);
    try {
      const requests = [apiClient.delete("/admin/notifications")];
      if (effectiveStaffRole !== "EMPLOYEE_HR") {
        requests.push(apiClient.delete(`/crm-sync/notifications?${buildCrmQueryString()}`));
      }
      await Promise.allSettled(requests);
      crmVendorService.clearAllAdminNotifications();
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          className ||
          "relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-slate-200/80 bg-white shadow-2xs focus:outline-none"
        }
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <UnifiedNotificationPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        onMarkOneRead={handleMarkOneAsRead}
        onDeleteOne={handleDeleteOne}
        portalBase={portalBase}
      />
    </div>
  );
}
