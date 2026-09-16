import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient.js";

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ title: "", message: "" });

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
      const t = setTimeout(() => setErrorMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 6000);
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
      setSuccessMsg(res.data.message);
      setForm({ title: "", message: "" });
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
      setSuccessMsg(res.data.message);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Broadcast Announcements</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Send live notifications to all employees</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-xl border border-emerald-100">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 h-fit">
          <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">New Announcement</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</label>
              <input
                type="text"
                placeholder="e.g. Office closed tomorrow"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</label>
              <textarea
                rows={4}
                placeholder="Details of the announcement..."
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
              disabled={loading}
            >
              {loading ? "Broadcasting..." : "Broadcast to All"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden lg:col-span-2">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-800">Past Announcements ({announcements.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["Date", "Title", "Message", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {a.title}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 max-w-xs truncate" title={a.message}>
                      {a.message}
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all border border-rose-100 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center py-12 text-slate-500 font-semibold text-sm">
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
