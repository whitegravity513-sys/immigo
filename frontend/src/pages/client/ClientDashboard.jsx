import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import ClientLayout from "../../components/client/layout/ClientLayout.jsx";
import crmClientService from "../../services/crmClientService.js";
import {
  ClientStatsCards,
  ClientRecentTable,
} from "../../components/client/dashboard/index.js";

export function ClientDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await crmClientService.getClients({ limit: 1000 });
        const list = Array.isArray(data) ? data : data?.clients || [];
        setClients(list);
      } catch (err) {
        console.error("Error loading clients dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const clientList = Array.isArray(clients) ? clients : [];
  const totalClients = clientList.length;
  const activeClients = clientList.filter(
    (c) => (c.status || "active").toLowerCase() === "active"
  ).length;

  const totalProjects = clientList.reduce((acc, c) => {
    return acc + (Array.isArray(c.projects) ? c.projects.length : 0);
  }, 0);

  const clientCards = [
    {
      title: "Total Clients",
      value: totalClients,
      sub: "Registered companies",
      icon: Building2,
      to: "/client/clients",
      color: "blue",
    },
    {
      title: "Active Organizations",
      value: activeClients,
      sub: "Active sourcing accounts",
      icon: TrendingUp,
      to: "/client/clients?status=Active",
      color: "emerald",
    },
    {
      title: "Active Projects",
      value: totalProjects,
      sub: "Deployment sites",
      icon: Briefcase,
      to: "/client/projects",
      color: "purple",
    },
  ];

  return (
    <ClientLayout
      title="Client Management Hub"
      breadcrumbs={[
        { label: "Admin", path: "/admin/dashboard" },
        { label: "Client", path: "/client/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-2.5 px-3 bg-white border border-gray-200/90 rounded-lg shadow-2xs">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-blue-600" />
            <h2 className="text-xs font-bold text-gray-900">Client Organizations Management</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/client/clients/new"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Plus size={12} />
              <span>Add New Client</span>
            </Link>

            <Link
              to="/client/clients"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors cursor-pointer"
            >
              <span>View All Clients</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        <ClientStatsCards clientCards={clientCards} />

        <ClientRecentTable
          clientList={clientList}
          totalClients={totalClients}
          loading={loading}
        />
      </div>
    </ClientLayout>
  );
}

export default ClientDashboard;
