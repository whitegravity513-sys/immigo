import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  MapPin,
  ArrowRight,
  Plus,
  Mail,
  Phone,
  Globe,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import ClientLayout from "../../components/client/layout/ClientLayout.jsx";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import crmClientService from "../../services/crmClientService.js";

export function ClientDashboard() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientDashboard();
  }, []);

  const loadClientDashboard = async () => {
    setLoading(true);
    try {
      const [data, clientsRes] = await Promise.all([
        crmClientService.getDashboardStats(),
        crmClientService.getClients({ limit: 10 }),
      ]);
      setStats(data);
      setClients(clientsRes?.clients || []);
    } catch (err) {
      console.error("Failed to load client dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalClients = stats?.totalClients || clients.length || 0;
  const activeClients = stats?.activeClients || 0;
  const inactiveClients = Math.max(0, totalClients - activeClients);

  const clientCards = [
    {
      title: "Total Clients",
      value: totalClients,
      sub: "Registered Companies",
      to: "/client/clients",
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Active Clients",
      value: activeClients,
      sub: "Operational Accounts",
      to: "/client/clients?status=Active",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Inactive Clients",
      value: inactiveClients,
      sub: "Completed / On Hold",
      to: "/client/clients?status=Inactive",
      color: "text-gray-600 bg-gray-50 border-gray-200",
    },
  ];

  return (
    <ClientLayout
      title="Client Dashboard"
      subtitle="Comprehensive overview of foreign client organizations and company profiles."
      breadcrumbs={[
        { label: "Admin", path: "/admin/dashboard" },
        { label: "Client", path: "/client/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-6">
        {/* Top Action Ribbon - Strictly Client Focused */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-gray-200/90 rounded-xl shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">Client Organizations Management</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                Corporate CRM
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Direct employer relationships across UAE, Saudi Arabia, Qatar, Oman & Kuwait
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/client/clients/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Add New Client</span>
            </Link>

            <Link
              to="/client/clients"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>View All Clients</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Client KPI Summary Cards */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {clientCards.map((card) => (
              <Link
                key={card.title}
                to={card.to}
                className="p-4 bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all duration-150 block text-left group"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
                  {card.title}
                </p>
                <p className="text-2xl font-black text-gray-900 tracking-tight mt-1 leading-none group-hover:text-blue-600 transition-colors">
                  {card.value}
                </p>
                <p className="text-[11px] text-gray-500 mt-1.5 truncate">
                  {card.sub}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Full-Width Recent Clients Table (Strictly Client Details) */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
                <Building2 size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Recent Registered Clients</h3>
                <p className="text-[11px] text-gray-400">
                  Detailed company directory, primary liaisons and documentation
                </p>
              </div>
            </div>

            <Link
              to="/client/clients"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              <span>All Clients ({totalClients})</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="p-5">
              <LoadingSkeleton type="table" count={5} />
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-semibold">No clients registered yet.</p>
              <Link
                to="/client/clients/new"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus size={13} />
                <span>Add First Client</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5">Company Name</th>
                    <th className="py-3 px-4">Country & City</th>
                    <th className="py-3 px-4">Primary Contact</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => {
                    const primaryContact =
                      client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];

                    return (
                      <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                        {/* Company Name & Industry */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                              {client.companyName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/client/clients/${client.id}`}
                                className="font-bold text-gray-900 hover:text-blue-600 text-xs block truncate max-w-[200px]"
                                title={client.companyName}
                              >
                                {client.companyName}
                              </Link>
                              <span className="text-[10px] text-gray-400 font-normal">
                                {client.companyType || "Enterprise Client"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Country & City */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[11px]">
                            <MapPin size={11} className="text-blue-500 shrink-0" />
                            <span>
                              {client.country}
                              {client.city ? `, ${client.city}` : ""}
                            </span>
                          </div>
                        </td>

                        {/* Primary Contact Person */}
                        <td className="py-3 px-4">
                          {primaryContact ? (
                            <div>
                              <p className="font-bold text-gray-800 text-xs truncate max-w-[150px]">
                                {primaryContact.name}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                                {primaryContact.designation || "Liaison"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Not assigned</span>
                          )}
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {client.email && (
                              <div className="flex items-center gap-1 text-[11px] text-gray-600 truncate max-w-[180px]">
                                <Mail size={11} className="text-gray-400 shrink-0" />
                                <span>{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate max-w-[180px]">
                                <Phone size={11} className="text-gray-400 shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <StatusBadge status={client.status || "Active"} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/client/clients/${client.id}`}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              to={`/client/clients/${client.id}/edit`}
                              className="px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}

export default ClientDashboard;
