import React, { useState, useEffect } from "react";
import {
  PartyPopper,
  Calendar,
  Sparkles,
  BellRing,
  Megaphone,
  X,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  SunMedium
} from "lucide-react";

export default function HolidayAnnouncementModals({
  todayHoliday,
  isHolidayToday,
  announcements = [],
  onViewAnnouncements,
  onViewCalendar,
}) {
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null);

  // Today's date string for unique daily dismissal
  const todayDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  // ── 1. Holiday Popup Trigger ──
  useEffect(() => {
    if (isHolidayToday && todayHoliday) {
      const dismissedKey = `immigo_holiday_popup_dismissed_${todayDateStr}`;
      const isDismissed = sessionStorage.getItem(dismissedKey);
      if (!isDismissed) {
        setShowHolidayModal(true);
      }
    }
  }, [isHolidayToday, todayHoliday, todayDateStr]);

  const handleDismissHoliday = () => {
    sessionStorage.setItem(`immigo_holiday_popup_dismissed_${todayDateStr}`, "true");
    setShowHolidayModal(false);
  };

  // ── 2. Announcement Popup Trigger ──
  useEffect(() => {
    if (!announcements || announcements.length === 0) return;

    // Find the latest announcement that hasn't been acknowledged/seen
    const unread = announcements.find((a) => {
      const aId = a._id || a.id;
      return !localStorage.getItem(`immigo_announcement_seen_${aId}`);
    });

    if (unread) {
      setCurrentAnnouncement(unread);
      // If holiday modal is open, announcement will wait or appear once holiday is closed
      if (!showHolidayModal) {
        setShowAnnouncementModal(true);
      }
    }
  }, [announcements, showHolidayModal]);

  const handleDismissAnnouncement = () => {
    if (currentAnnouncement) {
      const aId = currentAnnouncement._id || currentAnnouncement.id;
      localStorage.setItem(`immigo_announcement_seen_${aId}`, "true");
    }
    setShowAnnouncementModal(false);
  };

  const handleGoToAnnouncements = () => {
    handleDismissAnnouncement();
    if (typeof onViewAnnouncements === "function") {
      onViewAnnouncements();
    }
  };

  const formattedDate = (d) => {
    if (!d) return "Today";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          1. FESTIVE HOLIDAY POPUP MODAL
      ═══════════════════════════════════════════════════════ */}
      {showHolidayModal && todayHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-indigo-100 overflow-hidden relative animate-in zoom-in-95 duration-200 text-left">
            {/* Top Festive Header Banner */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 p-6 text-white text-center relative overflow-hidden">
              <button
                type="button"
                onClick={handleDismissHoliday}
                className="absolute top-4 right-4 p-1.5 rounded-full text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              {/* Glowing festive decoration */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
                  <PartyPopper size={32} />
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-300/30 mb-2">
                  <Sparkles size={12} className="text-amber-300" />
                  Official Company Holiday
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  {todayHoliday.title || todayHoliday.name || "Holiday"}
                </h3>

                <p className="text-xs text-blue-200 mt-1 font-medium flex items-center gap-1">
                  <Calendar size={13} className="text-blue-300" />
                  {formattedDate(todayHoliday.date || todayDateStr)}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/60 rounded-2xl border border-amber-200/80">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {todayHoliday.description ||
                    "Official company operations and normal shifts are closed today. Wishing you and your family a wonderful holiday!"}
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Attendance is optional today.</strong> Work logs and shift check-ins are not mandated.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Your paid leave / holiday balance is automatically accounted for by HRMS.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDismissHoliday}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md shadow-blue-950/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <SunMedium size={16} className="text-amber-300" />
                  <span>Happy Holiday • Continue to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          2. CORPORATE ANNOUNCEMENT POPUP MODAL
      ═══════════════════════════════════════════════════════ */}
      {showAnnouncementModal && !showHolidayModal && currentAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-blue-100 overflow-hidden relative animate-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 p-5 text-white flex items-center justify-between border-b border-blue-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/60 border border-blue-400/40 text-white flex items-center justify-center shadow-xs">
                  <Megaphone size={18} className="text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight">
                    Official Announcement
                  </h3>
                  <p className="text-[11px] text-blue-200/80 font-medium">
                    Corporate Broadcast & Notice
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissAnnouncement}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Badges & Date */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {currentAnnouncement.category || "Company Notification"}
                  </span>
                  {currentAnnouncement.priority === "High" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs animate-pulse">
                      High Priority
                    </span>
                  )}
                </div>

                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Calendar size={13} />
                  {currentAnnouncement.date
                    ? formattedDate(currentAnnouncement.date)
                    : formattedDate(currentAnnouncement.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {currentAnnouncement.title}
              </h4>

              {/* Message Body */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 max-h-64 overflow-y-auto custom-scrollbar">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {currentAnnouncement.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDismissAnnouncement}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-md shadow-blue-950/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>I Have Read & Acknowledged</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToAnnouncements}
                  className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Notice Board</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
