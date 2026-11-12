import { useState } from "react";
import { Calendar, PartyPopper, X, Bell } from "lucide-react";

const computeInitialOpen = (isHolidayToday, forceOpen, storageKey) => {
  if (!isHolidayToday) return false;
  if (forceOpen) return true;
  try {
    return !sessionStorage.getItem(storageKey);
  } catch {
    return true;
  }
};

export default function HolidayAnnouncementModals({
  todayHoliday,
  isHolidayToday = false,
  forceOpen = false,
  onCloseForce,
  onViewAnnouncements,
  onViewCalendar,
}) {
  const dateKey = String(
    todayHoliday?.date ||
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())
  ).split("T")[0];

  const storageKey = `holiday_popup_dismissed_${dateKey}`;
  const syncKey = `${isHolidayToday}:${forceOpen}:${storageKey}`;

  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  const [open, setOpen] = useState(() =>
    computeInitialOpen(isHolidayToday, forceOpen, storageKey)
  );

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (forceOpen && isHolidayToday) {
      setOpen(true);
    } else if (isHolidayToday) {
      try {
        if (!sessionStorage.getItem(storageKey)) {
          setOpen(true);
        }
      } catch {}
    } else {
      setOpen(false);
    }
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {}
    setOpen(false);
    if (typeof onCloseForce === "function") onCloseForce();
  };

  if (!open || !isHolidayToday) return null;

  const formattedDate = (() => {
    const d = new Date(`${dateKey}T00:00:00`);
    return isNaN(d.getTime())
      ? dateKey
      : d.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  })();

  const holidayTitle = todayHoliday?.title || "Official Company Holiday";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={handleDismiss}
    >
      <div
        className="bg-white w-full max-w-md h-[100dvh] overflow-y-auto border-l border-indigo-200 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 p-5 text-white relative">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={15} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <PartyPopper size={22} className="text-amber-200" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                <Calendar size={10} /> Official Holiday Declared
              </span>
              <h3 className="text-lg font-bold tracking-tight mt-1">
                Today is an Official Holiday
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200/80 space-y-1">
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              {formattedDate}
            </div>
            <div className="text-base font-bold text-slate-900">
              {holidayTitle}
            </div>
            {todayHoliday?.description && (
              <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                {todayHoliday.description}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold leading-relaxed">
            Today has been declared an official holiday, so attendance check-in and break tracking are disabled. Enjoy your holiday!
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {typeof onViewCalendar === "function" && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onViewCalendar();
                }}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar size={14} />
                <span>Holiday Calendar</span>
              </button>
            )}
            {typeof onViewAnnouncements === "function" && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onViewAnnouncements();
                }}
                className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Bell size={14} />
                <span>Notices</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
