import { useState, useEffect, useMemo } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  Megaphone,
  Trash2,
  CalendarDays,
  Sun,
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";

const FORM_TABS = [
  { key: "announcement", label: "Announcement", icon: Bell },
  { key: "holiday", label: "Public Holiday", icon: CalendarDays },
];

const defaultAnnForm = {
  title: "",
  message: "",
  category: "Company Notification",
  priority: "Medium",
  date: new Date().toISOString().split("T")[0],
};

export default function AnnouncementsSection({
  holidays = [],
  holidayForm,
  setHolidayForm,
  holidayLoading,
  handleCreateHolidaySubmit,
  handleDeleteHoliday,
}) {
  const [type, setType] = useState("announcement");
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [fetchingAnnouncements, setFetchingAnnouncements] = useState(false);
  const [annForm, setAnnForm] = useState(defaultAnnForm);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [listTab, setListTab] = useState("announcements");
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  }, []);

  const fmtDate = (ds) => {
    if (!ds) return "—";
    try {
      return new Date(ds).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return ds;
    }
  };

  const getCalendarParts = (ds) => {
    if (!ds) return { month: "CAL", day: "--", weekday: "" };
    try {
      const dt = new Date(ds);
      return {
        month: dt.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
        day: dt.getDate(),
        weekday: dt.toLocaleDateString("en-IN", { weekday: "short" }),
      };
    } catch {
      return { month: "DATE", day: "--", weekday: "" };
    }
  };

  const fetchAnnouncements = async () => {
    setFetchingAnnouncements(true);
    try {
      const res = await apiClient.get("/admin/announcements");
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setFetchingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    setAnnLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await apiClient.post("/admin/announcements", annForm);
      setSuccessMsg(res.data?.message || "Announcement published successfully!");
      setAnnForm(defaultAnnForm);
      fetchAnnouncements();
      setListTab("announcements");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to post announcement.");
    } finally {
      setAnnLoading(false);
    }
  };

  const handleHolSubmit = async (e) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await handleCreateHolidaySubmit(e);
      setSuccessMsg("Public holiday registered successfully!");
      setListTab("holidays");
    } catch (err) {
      setErrorMsg(err?.message || "Failed to save holiday.");
    }
  };

  const handleDeleteAnn = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await apiClient.delete(`/admin/announcements/${id}`);
      setSuccessMsg(res.data?.message || "Announcement deleted.");
      fetchAnnouncements();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete announcement.");
    }
  };

  const getCategoryBadge = (cat) => {
    const m = {
      "Company Notification": "bg-blue-50 text-blue-700 border-blue-200",
      "Important Announcements": "bg-rose-50 text-rose-700 border-rose-200",
      "Internal Updates": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "General Notice": "bg-purple-50 text-purple-700 border-purple-200",
    };
    return m[cat] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getPriorityPill = (p) => {
    const m = {
      High: "bg-rose-100 text-rose-800 border-rose-200",
      Medium: "bg-amber-100 text-amber-800 border-amber-200",
      Low: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return m[p] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  // Next upcoming holiday computation
  const upcomingHoliday = useMemo(() => {
    if (!holidays || holidays.length === 0) return null;
    const sorted = [...holidays]
      .filter((h) => h.date >= todayStr)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
    return sorted[0] || null;
  }, [holidays, todayStr]);

  // Filtered lists
  const filteredAnnouncements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return announcements;
    return announcements.filter((a) => {
      const title = (a.title || "").toLowerCase();
      const message = (a.message || "").toLowerCase();
      const category = (a.category || "").toLowerCase();
      const priority = (a.priority || "").toLowerCase();
      return (
        title.includes(q) ||
        message.includes(q) ||
        category.includes(q) ||
        priority.includes(q)
      );
    });
  }, [announcements, searchQuery]);

  const filteredHolidays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return holidays;
    return holidays.filter((h) => {
      const title = (h.title || "").toLowerCase();
      const desc = (h.description || "").toLowerCase();
      const date = (h.date || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || date.includes(q);
    });
  }, [holidays, searchQuery]);

  return (
    <div className="space-y-5 text-slate-800">
      {/* ── TOP HEADER WITH STATS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Megaphone size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Announcements &amp; Company Holidays</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Broadcast notices to all employees and maintain official public holiday schedules
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs">
              <Bell size={14} className="text-blue-600 shrink-0" />
              <span className="text-slate-600 font-medium">Broadcasts:</span>
              <span className="font-black text-blue-900">{announcements.length}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs">
              <CalendarDays size={14} className="text-amber-600 shrink-0" />
              <span className="text-slate-600 font-medium">Holidays:</span>
              <span className="font-black text-amber-900">{holidays.length}</span>
            </div>

            {upcomingHoliday && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs">
                <Sparkles size={14} className="text-emerald-600 shrink-0" />
                <span className="text-slate-600 font-medium">Next:</span>
                <span className="font-bold text-emerald-900 truncate max-w-[140px]">
                  {upcomingHoliday.title} ({fmtDate(upcomingHoliday.date)})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION BANNERS ── */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="p-1 text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="p-1 text-emerald-500 hover:text-emerald-800 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT GRID (RESPONSIVE FORM + LIST) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN: CREATION FORM (4 COLS ON DESKTOP, FULL ON MOBILE) ── */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Form Tabs Switcher */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70">
            <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl gap-1">
              {FORM_TABS.map((t) => {
                const IconComponent = t.icon;
                const isActive = type === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      setType(t.key);
                      setListTab(t.key === "announcement" ? "announcements" : "holidays");
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? t.key === "announcement"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <IconComponent size={14} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Bodies */}
          <div className="p-4 sm:p-5">
            {type === "announcement" ? (
              <form onSubmit={handleAnnSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={annForm.category}
                    onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="Company Notification">Company Notification</option>
                    <option value="Internal Updates">Internal Updates</option>
                    <option value="Important Announcements">Important Announcements</option>
                    <option value="General Notice">General Notice</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Broadcast Date
                    </label>
                    <input
                      type="date"
                      value={annForm.date}
                      onChange={(e) => setAnnForm({ ...annForm, date: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Priority Level
                    </label>
                    <select
                      value={annForm.priority}
                      onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Company Offsite / Office Update"
                    required
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Broadcast Message Details
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide full details, schedules, instructions or guidelines for all staff members..."
                    required
                    value={annForm.message}
                    onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={annLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Megaphone size={14} className={annLoading ? "animate-pulse" : ""} />
                  <span>{annLoading ? "Broadcasting..." : "Publish Announcement"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleHolSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Holiday Date
                  </label>
                  <input
                    type="date"
                    required
                    value={holidayForm?.date || ""}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Holiday Name / Occasion
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali, Republic Day, Eid-ul-Fitr, Christmas"
                    required
                    value={holidayForm?.title || ""}
                    onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Description &amp; Notes (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Mandatory public holiday. All branches and offices will remain closed."
                    value={holidayForm?.description || ""}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, description: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={holidayLoading}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CalendarDays size={14} className={holidayLoading ? "animate-pulse" : ""} />
                  <span>{holidayLoading ? "Saving Holiday..." : "Declare Public Holiday"}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: RESPONSIVE DIRECTORY & LISTINGS (8 COLS ON DESKTOP, FULL ON MOBILE) ── */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Header Bar: Filter Tabs & Real-time Search */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setListTab("announcements")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  listTab === "announcements"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Megaphone size={12} className="text-blue-600" />
                <span>Announcements ({announcements.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setListTab("holidays")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  listTab === "holidays"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <CalendarDays size={12} className="text-amber-600" />
                <span>Holidays ({holidays.length})</span>
              </button>
            </div>

            {/* Real-time search bar & refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={listTab === "announcements" ? "Search announcements..." : "Search holidays..."}
                  className="w-full sm:w-44 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {listTab === "announcements" && (
                <button
                  type="button"
                  onClick={fetchAnnouncements}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                  title="Refresh announcements"
                >
                  <RefreshCw
                    size={13}
                    className={fetchingAnnouncements ? "animate-spin text-blue-600" : ""}
                  />
                </button>
              )}
            </div>
          </div>

          {/* ── LIST TAB 1: ANNOUNCEMENTS ── */}
          {listTab === "announcements" && (
            <div>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden p-3.5 space-y-3">
                {filteredAnnouncements.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Bell size={30} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No announcements found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery ? "Try a different search query" : "Create one using the form on top"}
                    </p>
                  </div>
                ) : (
                  filteredAnnouncements.map((a) => (
                    <div
                      key={a._id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getCategoryBadge(
                              a.category
                            )}`}
                          >
                            {a.category || "Company Notification"}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded border ${getPriorityPill(
                              a.priority
                            )}`}
                          >
                            {a.priority || "Medium"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAnn(a._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete announcement"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                          {a.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line">
                          {a.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 pt-1 border-t border-slate-100">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{fmtDate(a.date || a.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Tablet & Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 whitespace-nowrap">Category</th>
                      <th className="px-3 py-3 whitespace-nowrap">Priority</th>
                      <th className="px-4 py-3">Title &amp; Broadcast Details</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAnnouncements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-xs font-semibold">
                          <Bell size={28} className="mx-auto mb-2 text-slate-300" />
                          <p className="font-bold text-slate-600">No announcements found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {searchQuery ? "Try a different search query" : "Create one using the form on the left"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredAnnouncements.map((a) => (
                        <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap align-top">
                            {fmtDate(a.date || a.createdAt)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap align-top">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadge(
                                a.category
                              )}`}
                            >
                              {a.category || "Company Notification"}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap align-top">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded border ${getPriorityPill(
                                a.priority
                              )}`}
                            >
                              {a.priority || "Medium"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <span className="text-xs sm:text-sm font-black text-slate-900 block">
                              {a.title}
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1 max-w-lg line-clamp-3">
                              {a.message}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                            <button
                              type="button"
                              onClick={() => handleDeleteAnn(a._id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete announcement"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LIST TAB 2: COMPANY PUBLIC HOLIDAYS ── */}
          {listTab === "holidays" && (
            <div>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden p-3.5 space-y-3">
                {filteredHolidays.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <CalendarDays size={30} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No public holidays found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery ? "Try a different search query" : "Declare a holiday using the form on top"}
                    </p>
                  </div>
                ) : (
                  filteredHolidays.map((h) => {
                    const cal = getCalendarParts(h.date);
                    const isUpcoming = h.date >= todayStr;
                    return (
                      <div
                        key={h._id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs flex items-start justify-between gap-3 transition-all"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Mini Calendar Badge */}
                          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                            <span className="text-[9px] font-black text-amber-700 leading-none">
                              {cal.month}
                            </span>
                            <span className="text-base font-black text-amber-900 leading-tight">
                              {cal.day}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                                {h.title}
                              </h4>
                              {isUpcoming && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {h.description || "Official company-wide holiday"}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                              {cal.weekday}, {fmtDate(h.date)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h._id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete holiday"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tablet & Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      <th className="px-4 py-3 whitespace-nowrap">Holiday Date</th>
                      <th className="px-3 py-3">Holiday Name</th>
                      <th className="px-4 py-3">Description &amp; Details</th>
                      <th className="px-3 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredHolidays.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-xs font-semibold">
                          <CalendarDays size={28} className="mx-auto mb-2 text-slate-300" />
                          <p className="font-bold text-slate-600">No public holidays found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {searchQuery ? "Try a different search query" : "Declare a holiday using the form on the left"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredHolidays.map((h) => {
                        const isUpcoming = h.date >= todayStr;
                        return (
                          <tr key={h._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-bold text-amber-800 whitespace-nowrap">
                              {fmtDate(h.date)}
                            </td>
                            <td className="px-3 py-3 font-black text-slate-900">
                              {h.title}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-sm">
                              {h.description || (
                                <span className="italic text-slate-400">Official company-wide holiday</span>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              {isUpcoming ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Upcoming
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  Past
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteHoliday(h._id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete holiday"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
