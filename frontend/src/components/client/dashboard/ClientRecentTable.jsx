import React from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, ArrowRight, MapPin, Mail, Phone } from "lucide-react";
import StatusBadge from "../../crm/ui/StatusBadge.jsx";
import LoadingSkeleton from "../../crm/ui/LoadingSkeleton.jsx";

export default function ClientRecentTable({
  clientList,
  totalClients,
  loading,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs">
            <Building2 size={14} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">Recent Registered Clients</h3>
            <p className="text-[10px] text-gray-400">
              Detailed company directory, primary liaisons and documentation
            </p>
          </div>
        </div>

        <Link
          to="/client/clients"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
        >
          <span>All Clients ({totalClients})</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      {loading ? (
        <div className="p-4">
          <LoadingSkeleton type="table" count={5} />
        </div>
      ) : clientList.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Building2 size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs font-semibold">No clients registered yet.</p>
          <Link
            to="/client/clients/new"
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus size={12} />
            <span>Add First Client</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2 px-3.5">Company Name</th>
                <th className="py-2 px-2.5 text-[10px]">Country & City</th>
                <th className="py-2 px-2.5 text-[10px]">Primary Contact</th>
                <th className="py-2 px-2.5 text-[10px]">Contact Info</th>
                <th className="py-2 px-2.5 text-[10px]">Status</th>
                <th className="py-2 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientList.map((client) => {
                const primaryContact =
                  client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];

                return (
                  <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
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

                    <td className="py-1.5 px-2.5">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[10px]">
                        <MapPin size={10} className="text-blue-500 shrink-0" />
                        <span>
                          {client.country}
                          {client.city ? `, ${client.city}` : ""}
                        </span>
                      </div>
                    </td>

                    <td className="py-1.5 px-2.5">
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
                        <span className="text-gray-400 italic text-[10px]">Not assigned</span>
                      )}
                    </td>

                    <td className="py-1.5 px-2.5">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-600 truncate max-w-[180px]">
                            <Mail size={10} className="text-gray-400 shrink-0" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate max-w-[180px]">
                            <Phone size={10} className="text-gray-400 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-1.5 px-2.5">
                      <StatusBadge status={client.status || "Active"} size="sm" />
                    </td>

                    <td className="py-2 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/client/clients/${client.id}`}
                          className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          to={`/client/clients/${client.id}/edit`}
                          className="px-2 py-0.5 text-[10px] font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
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
  );
}
