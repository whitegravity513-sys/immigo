import { useState, useEffect, useRef } from "react";
import apiClient from "../../services/apiClient.js";
import { Bell } from "lucide-react";
import UnifiedNotificationPopover from "../common/UnifiedNotificationPopover.jsx";

export default function EmployeeNotificationBell({ token, onSelectMeeting, onNewNotification, onViewAll, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const lastKnownIdRef = useRef(null);
  const initialFetchDone = useRef(false);

  const getDeletedIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem("emp_deleted_notif_ids") || "[]"));
    } catch {
      return new Set();
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/employee/notifications?limit=50");
      if (res.data) {
        let list = res.data.notifications || [];
        const lastReadAllTs = parseInt(localStorage.getItem("emp_notifs_read_all_ts") || "0", 10);
        const clearedTs = parseInt(localStorage.getItem("emp_notifs_cleared_ts") || "0", 10);
        const deletedIds = getDeletedIds();

        list = list.filter((n) => {
          const notifId = String(n.id || n._id);
          if (deletedIds.has(notifId)) return false;
          const itemTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
          return !clearedTs || (itemTime && itemTime > clearedTs);
        });

        let effectiveUnread = 0;
        list = list.map((n) => {
          const itemTime = n.createdAt ? new Date(n.createdAt).getTime() : 0;
          const isRead = Boolean(n.read || (lastReadAllTs && itemTime && itemTime <= lastReadAllTs));
          if (!isRead) effectiveUnread++;
          return { ...n, read: isRead, isRead };
        });

        setNotifications(list);
        setUnreadCount(effectiveUnread);

        if (initialFetchDone.current && list.length > 0) {
          const newest = list[0];
          const newestId = newest.id || newest._id;
          if (newestId !== lastKnownIdRef.current && !newest.read) {
            lastKnownIdRef.current = newestId;
            if (onNewNotification) onNewNotification(newest);
            window.dispatchEvent(new CustomEvent("new-admin-notification", { detail: newest }));
          }
        }

        if (list.length > 0) {
          lastKnownIdRef.current = list[0].id || list[0]._id;
        }
        initialFetchDone.current = true;
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkOneAsRead = async (id) => {
    const sId = String(id || "");
    setNotifications((prev) =>
      prev.map((n) => (String(n.id) === sId || String(n._id) === sId ? { ...n, read: true, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiClient.put(`/employee/notifications/${sId}/read`, {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    localStorage.setItem("emp_notifs_read_all_ts", Date.now().toString());
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    try {
      await apiClient.put("/employee/notifications/read-all", {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    localStorage.setItem("emp_notifs_cleared_ts", Date.now().toString());
    localStorage.removeItem("emp_deleted_notif_ids");
    setNotifications([]);
    setUnreadCount(0);
    try {
      await apiClient.delete("/employee/notifications");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleDeleteOne = async (id, e) => {
    if (e) e.stopPropagation();
    const sId = String(id || "");
    const set = getDeletedIds();
    set.add(sId);
    try {
      localStorage.setItem("emp_deleted_notif_ids", JSON.stringify(Array.from(set)));
    } catch {}

    setNotifications((prev) => {
      const item = prev.find((n) => String(n.id) === sId || String(n._id) === sId);
      if (item && !item.read && !item.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return prev.filter((n) => String(n.id) !== sId && String(n._id) !== sId);
    });

    try {
      await apiClient.delete(`/employee/notifications/${sId}`);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          className ||
          "relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer border border-white/10 shadow-2xs focus:outline-none"
        }
        title="Notifications"
      >
        <Bell size={17} />
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
          if (item.type === "MEETING" && onSelectMeeting) {
            onSelectMeeting(item.meetingId || item.id);
          }
        }}
        onViewAll={onViewAll}
      />
    </div>
  );
}
