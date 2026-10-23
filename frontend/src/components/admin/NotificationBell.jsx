import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../services/apiClient.js";
import crmVendorService from "../../services/crmVendorService.js";
import { Bell } from "lucide-react";
import UnifiedNotificationPopover from "../common/UnifiedNotificationPopover.jsx";

export default function NotificationBell({ className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const deletedAdminIdsRef = useRef(new Set());
  const lastAdminReadAllTsRef = useRef(0);

  const fetchNotifications = async () => {
    try {
      let backendNotifs = [];
      try {
        const res = await apiClient.get("/admin/notifications?limit=50");
        backendNotifs = res.data?.notifications || [];
      } catch {}

      let crmNotifs = [];
      try {
        const crmRes = await apiClient.get("/crm-sync/notifications?role=ADMIN");
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
        }));
      } catch {}

      const localAdminNotifs = (crmVendorService.getAdminNotifications() || []).map((n) => ({
        _id: n.id,
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.timestamp,
        isRead: !!n.read,
        read: !!n.read,
        type: n.type || "INFO",
        link: n.link,
      }));

      const all = [...crmNotifs, ...localAdminNotifs, ...backendNotifs];
      const seen = new Set();
      const merged = all.filter((n) => {
        const key = String(n._id || n.id || `${n.title}-${n.createdAt}`);
        if (deletedAdminIdsRef.current.has(key)) return false;
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
        return { ...n, isRead, read: isRead };
      });

      const unread = processed.filter((n) => !n.isRead && !n.read).length;
      setNotifications(processed);
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleImmediateWakeup = () => {
      fetchNotifications();
    };
    window.addEventListener("immigo:admin-notification", handleImmediateWakeup);
    window.addEventListener("storage", handleImmediateWakeup);
    const interval = setInterval(fetchNotifications, 3000);
    return () => {
      window.removeEventListener("immigo:admin-notification", handleImmediateWakeup);
      window.removeEventListener("storage", handleImmediateWakeup);
      clearInterval(interval);
    };
  }, []);

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
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));

    try {
      await Promise.allSettled([
        apiClient.put("/admin/notifications/read-all"),
        apiClient.put("/crm-sync/notifications/read-all?role=ADMIN"),
      ]);
      crmVendorService.markAllAdminNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkOneAsRead = async (id) => {
    const sId = String(id || "");
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
    deletedAdminIdsRef.current.add(sId);

    setNotifications((prev) => {
      const item = prev.find((n) => String(n._id) === sId || String(n.id) === sId);
      if (item && !item.read && !item.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => String(n._id) !== sId && String(n.id) !== sId);
    });

    try {
      if (sId.startsWith("admin-notif-")) {
        crmVendorService.deleteAdminNotification(sId);
      } else {
        await apiClient.delete(`/admin/notifications/${sId}`).catch(() => {});
      }
      await apiClient.delete(`/crm-sync/notifications/${sId}`).catch(() => {});
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await Promise.allSettled([
        apiClient.delete("/admin/notifications"),
        apiClient.delete("/crm-sync/notifications?role=ADMIN"),
      ]);
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
          "relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer border border-slate-200 shadow-2xs focus:outline-none"
        }
        title="Notifications"
      >
        <Bell size={17} className={className ? "text-blue-200 hover:text-white" : "text-slate-700"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
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
        onItemClick={(item) => {
          const sId = item.id || item._id;
          handleMarkOneAsRead(sId);
        }}
        viewAllLink="/admin/candidates/selected"
      />
    </div>
  );
}
