import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Edit2,
} from "lucide-react";
import StatusBadge from "../../ui/StatusBadge.jsx";

export function ClientDetailHeader({
  client,
  tabs,
  activeTab,
  setActiveTab,
  setDeleteModalOpen,
}) {
  if (!client) return null;

  return (
    <>
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        <Link
          to="/client/clients"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Client Management</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/client/clients" className="hover:text-blue-600 transition-colors">
            Clients
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">Client Details</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-extrabold text-xl flex items-center justify-center shrink-0">
              {client.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {client.companyName}
                </h1>
                <StatusBadge status={client.status} />
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <MapPin size={13} className="text-blue-500" />
                  {client.country} {client.city ? `• ${client.city}` : ""}
                </span>
                <span>•</span>
                <span>
                  Type: <strong className="text-gray-700">{client.companyType || "Enterprise"}</strong>
                </span>
                <span>•</span>
                <span>
                  Client ID:{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] text-gray-700 font-mono">
                    {client.id}
                  </code>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <Link
              to={`/client/clients/${client.id}/edit`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 size={14} />
              <span>Edit Client</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-6 border-b border-gray-200 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ClientDetailHeader;
