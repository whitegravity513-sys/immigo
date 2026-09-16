import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Check,
  Calendar,
  Activity,
  AlertTriangle,
  XCircle,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const toLocalDateStr = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RenewalManagement() {
  const [renewals, setRenewals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    projectId: "",
    hostingerPurchaseDate: "",
    amcPurchaseDate: "",
    notes: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchRenewals();
    fetchProjects();
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

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/admin/renewals`, {
        withCredentials: true,
      });
      setRenewals(r.data);
    } catch (err) {
      setErrorMsg("Failed to load renewals.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const r = await axios.get(`${API_BASE}/admin/projects`, {
        withCredentials: true,
      });
      setProjects(r.data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const handleOpenModal = (renewal = null) => {
    if (renewal) {
      setFormData({
        id: renewal.id,
        projectId: renewal.projectId,
        hostingerPurchaseDate: toLocalDateStr(renewal.hostingerPurchaseDate),
        amcPurchaseDate: toLocalDateStr(renewal.amcPurchaseDate),
        notes: renewal.notes || "",
      });
    } else {
      setFormData({
        id: "",
        projectId: "",
        hostingerPurchaseDate: "",
        amcPurchaseDate: "",
        notes: "",
      });
    }
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      if (formData.id) {
        await axios.put(`${API_BASE}/admin/renewals/${formData.id}`, formData, {
          withCredentials: true,
        });
        setSuccessMsg("Renewal updated successfully");
      } else {
        await axios.post(`${API_BASE}/admin/renewals`, formData, {
          withCredentials: true,
        });
        setSuccessMsg("Renewal created successfully");
      }
      setIsModalOpen(false);
      fetchRenewals();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save renewal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this renewal?"))
      return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/admin/renewals/${id}`, {
        withCredentials: true,
      });
      setSuccessMsg("Renewal deleted successfully");
      fetchRenewals();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete renewal.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRenewals = renewals.filter((r) => {
    const clientName = r.client?.name || "";
    const clientCompany = r.client?.company || "";
    const projectName = r.projectName || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      clientName.toLowerCase().includes(searchLower) ||
      clientCompany.toLowerCase().includes(searchLower) ||
      projectName.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "All" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold">
            <Check size={14} /> {status}
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-bold">
            <AlertTriangle size={14} /> {status}
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-800 border border-green-300 rounded-lg text-xs font-bold">
            <XCircle size={14} /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  const formatDate = (ds) =>
    ds
      ? new Date(ds).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="text-green-600" /> Renewal Management
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Track Hostinger and AMC renewals for projects.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} /> Add Renewal
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-medium text-sm flex items-center gap-2">
          <XCircle size={18} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-medium text-sm flex items-center gap-2">
          <Check size={18} /> {successMsg}
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by project, client, or company..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["All", "Active", "Expiring Soon", "Expired"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filterStatus === s ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50 border-b border-slate-200">
                  Project / Client Info
                </th>
                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50 border-b border-slate-200">
                  Hostinger
                </th>
                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50 border-b border-slate-200">
                  AMC
                </th>
                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50 border-b border-slate-200">
                  Status
                </th>
                <th className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50 border-b border-slate-200 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRenewals.length > 0 ? (
                filteredRenewals.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <strong className="text-slate-800 font-bold text-sm block">
                        {r.projectName || "No Project"}
                      </strong>
                      <span className="text-xs text-slate-600 font-medium block mt-0.5">
                        Client: {r.client?.name || "No Client"}
                      </span>
                      {r.client?.company && (
                        <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
                          Company: {r.client?.company}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.hostingerPurchaseDate ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-500">
                            Purchased:{" "}
                            <strong className="text-slate-700">
                              {formatDate(r.hostingerPurchaseDate)}
                            </strong>
                          </span>
                          <span className="text-xs text-slate-500">
                            Expires:{" "}
                            <strong className="text-slate-700">
                              {formatDate(r.hostingerExpiryDate)}
                            </strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.amcPurchaseDate ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-500">
                            Purchased:{" "}
                            <strong className="text-slate-700">
                              {formatDate(r.amcPurchaseDate)}
                            </strong>
                          </span>
                          <span className="text-xs text-slate-500">
                            Expires:{" "}
                            <strong className="text-slate-700">
                              {formatDate(r.amcExpiryDate)}
                            </strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(r)}
                          className="p-2 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500 font-medium text-sm"
                  >
                    {loading ? "Loading renewals..." : "No renewals found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-lg font-black text-slate-800">
                {formData.id ? "Edit Renewal" : "Add Renewal"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Project *
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-500 transition-colors"
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  required
                >
                  <option value="">Select a Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectName} {p.client?.name ? `(${p.client.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} /> Hostinger Purchase
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-500 transition-colors"
                    value={formData.hostingerPurchaseDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hostingerPurchaseDate: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Expiry auto-calculates to +1 year
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} /> AMC Purchase
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-500 transition-colors"
                    value={formData.amcPurchaseDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amcPurchaseDate: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    Expiry auto-calculates to +1 year
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-500 transition-colors resize-none"
                  rows="3"
                  placeholder="Enter any additional details..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                ></textarea>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                type="button"
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-70 flex items-center gap-2 cursor-pointer"
              >
                {loading
                  ? "Saving..."
                  : formData.id
                    ? "Update Renewal"
                    : "Save Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
