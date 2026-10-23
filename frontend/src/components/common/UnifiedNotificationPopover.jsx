import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Trash2,
  Video,
  UserCheck,
  IndianRupee,
  Briefcase,
  Calendar,
  Info,
  ArrowRight,
  Check,
  CheckCheck,
  X,
} from "lucide-react";

export default function UnifiedNotificationPopover({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onClearAll,
  onMarkOneRead,
  onDeleteOne,
  onItemClick,
  onViewAll,
  viewAllLink,
  className = "",
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const getItemCategory = (n) => {
    const text = `${n.type || ""} ${n.title || ""} ${n.message || ""}`.toLowerCase();
    if (text.includes("meeting") || text.includes("interview") || text.includes("video")) {
      return "meeting";
    }
    if (
      text.includes("candidate") ||
      text.includes("registration") ||
      text.includes("selected") ||
      text.includes("application")
    ) {
      return "candidate";
    }
    if (
      text.includes("payment") ||
      text.includes("milestone") ||
      text.includes("fee") ||
      text.includes("receipt") ||
      text.includes("invoice")
    ) {
      return "payment";
    }
    return "system";
  };

  const counts = useMemo(() => {
    let unread = 0;
    let meetings = 0;
    let candidates = 0;
    let payments = 0;

    notifications.forEach((n) => {
      const isRead = Boolean(n.read || n.isRead);
      if (!isRead) unread++;
      const cat = getItemCategory(n);
      if (cat === "meeting") meetings++;
      if (cat === "candidate") candidates++;
      if (cat === "payment") payments++;
    });

    return {
      all: notifications.length,
      unread,
      meetings,
      candidates,
      payments,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const isRead = Boolean(n.read || n.isRead);
      if (activeTab === "unread") return !isRead;
      if (activeTab === "meetings") return getItemCategory(n) === "meeting";
      if (activeTab === "candidates") return getItemCategory(n) === "candidate";
      if (activeTab === "payments") return getItemCategory(n) === "payment";
      return true;
    });
  }, [notifications, activeTab]);

  const groupedNotifications = useMemo(() => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    filteredNotifications.forEach((n) => {
      const ts = n.createdAt ? new Date(n.createdAt).getTime() : 0;
      if (!ts || ts >= startOfToday) {
        today.push(n);
      } else if (ts >= startOfYesterday) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    const groups = [];
    if (today.length > 0) groups.push({ label: "TODAY", items: today });
    if (yesterday.length > 0) groups.push({ label: "YESTERDAY", items: yesterday });
    if (earlier.length > 0) groups.push({ label: "EARLIER", items: earlier });

    if (groups.length === 0 && filteredNotifications.length > 0) {
      groups.push({ label: "NOTIFICATIONS", items: filteredNotifications });
    }

    return groups;
  }, [filteredNotifications]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case "meeting":
        return {
          label: "MEETING",
          badgeBg: "bg-blue-50 text-blue-700",
          icon: <Video size={16} className="text-blue-600" />,
          actionText: "View meeting",
        };
      case "candidate":
        return {
          label: "CANDIDATE",
          badgeBg: "bg-blue-50 text-blue-700",
          icon: <UserCheck size={16} className="text-blue-600" />,
          actionText: "View candidate",
        };
      case "payment":
        return {
          label: "PAYMENT",
          badgeBg: "bg-blue-50 text-[#163868]",
          icon: <IndianRupee size={16} className="text-[#163868]" />,
          actionText: "View receipt",
        };
      default:
        return {
          label: "UPDATE",
          badgeBg: "bg-blue-50 text-blue-700",
          icon: <Bell size={16} className="text-blue-600" />,
          actionText: "View details",
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden font-sans text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 ${className}`}
    >
      {/* Top Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={17} className="text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Header Actions: Mark All Read & Delete All */}
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Delete all notifications"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 border-b border-slate-100 flex items-center gap-4 text-xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`py-2 font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === "all"
              ? "border-blue-600 text-blue-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>All</span>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`py-2 font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === "unread"
              ? "border-blue-600 text-blue-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Unread</span>
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {counts.unread}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meetings")}
          className={`py-2 font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === "meetings"
              ? "border-blue-600 text-blue-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Meetings</span>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {counts.meetings}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("candidates")}
          className={`py-2 font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === "candidates"
              ? "border-blue-600 text-blue-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Candidates</span>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {counts.candidates}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 text-xs">
        {groupedNotifications.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-xs text-slate-600">No notifications in this view</p>
            <p className="text-[11px] text-slate-400 mt-0.5">You are completely up to date!</p>
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label} className="space-y-0">
              <div className="px-4 py-1.5 bg-blue-50/40 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-y border-slate-100/80">
                {group.label}
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((n) => {
                  const notifId = n.id || n._id;
                  const isRead = Boolean(n.read || n.isRead);
                  const cat = getItemCategory(n);
                  const meta = getCategoryMeta(cat);
                  const timeAgo = formatTimeAgo(n.createdAt || n.timestamp);

                  return (
                    <div
                      key={notifId || `${n.title}-${n.createdAt}`}
                      className={`p-3 transition-colors flex items-start gap-2.5 hover:bg-slate-50/80 group relative ${
                        !isRead ? "bg-blue-50/20" : "bg-white"
                      }`}
                    >
                      {/* Unread blue dot */}
                      <div className="pt-2 shrink-0">
                        <span
                          className={`block w-2 h-2 rounded-full ${
                            !isRead ? "bg-blue-600" : "bg-transparent"
                          }`}
                        />
                      </div>

                      {/* Icon Avatar */}
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs">
                        {meta.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${meta.badgeBg}`}
                          >
                            {meta.label}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-medium text-slate-400">
                              {timeAgo}
                            </span>
                            {/* Individual Delete Button */}
                            {onDeleteOne && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteOne(notifId, e);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                title="Delete this notification"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 leading-tight">
                          {n.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>

                        {/* Action buttons: View Link | Mark Read | Delete */}
                        <div className="mt-1.5 flex items-center gap-2.5 text-[11px] flex-wrap">
                          {n.link ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onItemClick) onItemClick(n);
                                if (!isRead && onMarkOneRead) onMarkOneRead(notifId);
                                onClose();
                                navigate(n.link);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{meta.actionText}</span>
                              <ArrowRight size={11} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onItemClick) onItemClick(n);
                                if (!isRead && onMarkOneRead) onMarkOneRead(notifId);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>View details</span>
                              <ArrowRight size={11} />
                            </button>
                          )}

                          {!isRead && onMarkOneRead && (
                            <>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkOneRead(notifId);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                Mark read
                              </button>
                            </>
                          )}

                          {onDeleteOne && (
                            <>
                              <span className="text-slate-300">•</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteOne(notifId, e);
                                }}
                                className="text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex flex-col items-center justify-center gap-1 text-center">
        <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
          {viewAllLink ? (
            <Link
              to={viewAllLink}
              onClick={onClose}
              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all notifications</span>
              <ArrowRight size={12} />
            </Link>
          ) : onViewAll ? (
            <button
              type="button"
              onClick={() => {
                onViewAll();
                onClose();
              }}
              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all notifications</span>
              <ArrowRight size={12} />
            </button>
          ) : null}

          {notifications.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-slate-500 hover:text-rose-600 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Delete all</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live updates enabled</span>
        </div>
      </div>
    </div>
  );
}
