import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient.js";
import { Megaphone, Trash2, Calendar, Tag, AlertTriangle } from "lucide-react";

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    title: "",
    message: "",
    category: "Company Notification",
    priority: "Medium",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await apiClient.get("/admin/announcements");
      setAnnouncements(res.data || []);
    } catch (err) {
      setErrorMsg("Failed to load announcements.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await apiClient.post("/admin/announcements", form);
      setSuccessMsg(res.data.message || "Announcement published successfully!");
      setForm({
        title: "",
        message: "",
        category: "Company Notification",
        priority: "Medium",
        date: new Date().toISOString().split("T")[0],
      });
      fetchAnnouncements();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to post announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await apiClient.delete(`/admin/announcements/${id}`);
      setSuccessMsg(res.data.message || "Announcement deleted.");
      fetchAnnouncements();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete announcement.");
    }
  };

  const formatDate = (ds) => {
    if (!ds) return "-";
    return new Date(ds).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Company Notification":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Important Announcements":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Internal Updates":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPriorityPill = (p) => {
    switch (p) {
      case "High":
        return "bg-rose-100 text-rose-800";
      case "Medium":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone size={22} className="text-blue-600" />
            Company Announcements & Broadcasts
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Publish official company notifications, internal updates, and urgent alerts for all employees
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl border border-emerald-100">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Announcement Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 h-fit text-left">
          <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">
            Create Announcement
          </h4>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="Company Notification">Company Notification</option>
                <option value="Internal Updates">Internal Updates</option>
                <option value="Important Announcements">Important Announcements</option>
                <option value="General Notice">General Notice</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Urgent)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject / Title</label>
              <input
                type="text"
                placeholder="e.g. Office Relocation & Holidays Notice"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Announcement Message</label>
              <textarea
                rows={4}
                placeholder="Provide detailed information for all team members..."
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 mt-2"
              disabled={loading}
            >
              <Megaphone size={16} />
              {loading ? "Publishing..." : "Broadcast Announcement"}
            </button>
          </form>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800">
              Published Announcements ({announcements.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr>
                  {["Date", "Category", "Priority", "Title & Message", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {formatDate(a.date || a.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadge(a.category)}`}>
                        {a.category || "Company Notification"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${getPriorityPill(a.priority)}`}>
                        {a.priority || "Medium"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-left max-w-xs">
                      <span className="text-sm font-black text-slate-900 block">{a.title}</span>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.message}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="text-center py-12 text-slate-400 font-semibold text-sm">
                        No announcements broadcasted yet.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
