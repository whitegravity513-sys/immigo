import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient.js";
import { Megaphone, Trash2, CalendarDays, Sun, Bell } from "lucide-react";

const TABS = [
  { key: "announcement", label: "Announcement" },
  { key: "holiday",      label: "Holiday" },
];

const defaultAnnForm = {
  title: "", message: "", category: "Company Notification",
  priority: "Medium", date: new Date().toISOString().split("T")[0],
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
  const [annForm, setAnnForm] = useState(defaultAnnForm);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [listTab, setListTab] = useState("announcements");

  const fmtDate = (ds) => {
    if (!ds) return "-";
    return new Date(ds).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  useEffect(() => { fetchAnnouncements(); }, []);
  useEffect(() => { if (errorMsg) { const t = setTimeout(() => setErrorMsg(""), 5000); return () => clearTimeout(t); } }, [errorMsg]);
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(""), 5000); return () => clearTimeout(t); } }, [successMsg]);

  const fetchAnnouncements = async () => {
    try { const res = await apiClient.get("/admin/announcements"); setAnnouncements(res.data || []); } catch {}
  };

  const handleAnnSubmit = async (e) => {
    e.preventDefault(); setAnnLoading(true); setErrorMsg(""); setSuccessMsg("");
    try {
      const res = await apiClient.post("/admin/announcements", annForm);
      setSuccessMsg(res.data.message || "Announcement published!"); setAnnForm(defaultAnnForm);
      fetchAnnouncements(); setListTab("announcements");
    } catch (err) { setErrorMsg(err.response?.data?.message || "Failed to post announcement."); }
    finally { setAnnLoading(false); }
  };

  const handleHolSubmit = async (e) => {
    setErrorMsg(""); setSuccessMsg("");
    try { await handleCreateHolidaySubmit(e); setSuccessMsg("Holiday declared!"); setListTab("holidays"); }
    catch (err) { setErrorMsg(err?.message || "Failed to save holiday."); }
  };

  const handleDeleteAnn = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try { const res = await apiClient.delete(`/admin/announcements/${id}`); setSuccessMsg(res.data.message || "Deleted."); fetchAnnouncements(); }
    catch (err) { setErrorMsg(err.response?.data?.message || "Failed to delete."); }
  };

  const getCategoryBadge = (cat) => {
    const m = { "Company Notification": "bg-blue-50 text-blue-700 border-blue-200", "Important Announcements": "bg-rose-50 text-rose-700 border-rose-200", "Internal Updates": "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return m[cat] || "bg-slate-100 text-slate-700 border-slate-200";
  };
  const getPriorityPill = (p) => ({ High: "bg-rose-100 text-rose-800", Medium: "bg-amber-100 text-amber-800" }[p] || "bg-slate-100 text-slate-600");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Megaphone size={22} className="text-blue-600" />
          Announcements &amp; Holidays
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Publish company broadcasts or declare official holidays — all in one place
        </p>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100">{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 h-fit text-left space-y-4">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setType(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  type === t.key ? (t.key === "announcement" ? "bg-blue-600 text-white shadow-sm" : "bg-amber-500 text-white shadow-sm") : "text-slate-500 hover:text-slate-800"
                }`}>
                {t.key === "announcement" ? <Bell size={14}/> : <Sun size={14}/>}
                {t.label}
              </button>
            ))}
          </div>

          {type === "announcement" && (
            <form onSubmit={handleAnnSubmit} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select value={annForm.category} onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer">
                  <option>Company Notification</option><option>Internal Updates</option>
                  <option>Important Announcements</option><option>General Notice</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                  <input type="date" value={annForm.date} onChange={(e) => setAnnForm({ ...annForm, date: e.target.value })} required
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                  <select value={annForm.priority} onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer">
                    <option>Low</option><option>Medium</option><option value="High">High (Urgent)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Title</label>
                <input type="text" placeholder="e.g. Office Relocation Notice" required value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                <textarea rows={4} placeholder="Detailed information for all team members..." required value={annForm.message} onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"/>
              </div>
              <button type="submit" disabled={annLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-60">
                <Megaphone size={15}/>{annLoading ? "Publishing..." : "Broadcast Announcement"}
              </button>
            </form>
          )}

          {type === "holiday" && (
            <form onSubmit={handleHolSubmit} className="space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Holiday Date</label>
                <input type="date" required value={holidayForm?.date || ""} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Holiday Title</label>
                <input type="text" placeholder="e.g. Diwali, Eid, Republic Day" required value={holidayForm?.title || ""} onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"/>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description (optional)</label>
                <textarea rows={3} placeholder="e.g. National holiday. Office closed." value={holidayForm?.description || ""} onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white resize-none"/>
              </div>
              <button type="submit" disabled={holidayLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-60">
                <CalendarDays size={15}/>{holidayLoading ? "Saving..." : "Declare Holiday"}
              </button>
            </form>
          )}
        </div>

        {/* List Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden lg:col-span-2">
          <div className="px-6 py-3.5 border-b border-slate-100 flex items-center gap-3">
            {[{ key: "announcements", label: `Announcements (${announcements.length})` }, { key: "holidays", label: `Holidays (${holidays.length})` }].map((t) => (
              <button key={t.key} onClick={() => setListTab(t.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${listTab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            {listTab === "announcements" && (
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead><tr>{["Date","Category","Priority","Title & Message","Action"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                ))}</tr></thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">{fmtDate(a.date || a.createdAt)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadge(a.category)}`}>{a.category || "Company Notification"}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getPriorityPill(a.priority)}`}>{a.priority || "Medium"}</span>
                      </td>
                      <td className="px-4 py-3.5 text-left max-w-xs">
                        <span className="text-sm font-black text-slate-900 block">{a.title}</span>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.message}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleDeleteAnn(a._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && <tr><td colSpan="5"><div className="text-center py-12 text-slate-400 font-semibold text-sm">No announcements yet.</div></td></tr>}
                </tbody>
              </table>
            )}
            {listTab === "holidays" && (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead><tr>{["Date","Title","Description","Action"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                ))}</tr></thead>
                <tbody>
                  {holidays.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3.5 text-sm font-bold text-amber-700 whitespace-nowrap">{fmtDate(h.date)}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{h.title}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[200px] truncate" title={h.description}>{h.description || <span className="italic text-slate-300">No description</span>}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleDeleteHoliday(h._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete holiday">
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {holidays.length === 0 && <tr><td colSpan="4"><div className="text-center py-12 text-slate-400 font-semibold text-sm">No holidays declared yet.</div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
