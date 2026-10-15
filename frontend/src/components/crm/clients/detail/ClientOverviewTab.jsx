import React from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  User,
} from "lucide-react";

export function ClientOverviewTab({ client, totalClientManpower, primaryContact }) {
  if (!client) return null;

  const contact =
    primaryContact ||
    client.contacts?.find((c) => c.isPrimary) ||
    client.contacts?.[0];

  const manpower =
    totalClientManpower !== undefined && totalClientManpower !== null
      ? totalClientManpower
      : (client.projects || []).reduce((sum, p) => {
          const posTotal = (p.positions || []).reduce(
            (s, pos) => s + (Number(pos.quantity) || 0),
            0
          );
          return sum + posTotal;
        }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Projects
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {client.projects?.length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Deployment work sites</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Required Manpower
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {Number(manpower || 0).toLocaleString()} Persons
          </p>
          <p className="text-xs text-gray-500 mt-1">Sum across all trades & projects</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Requirements
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {(client.projects || []).filter((p) => p.status === "Active").length} Projects
          </p>
          <p className="text-xs text-gray-500 mt-1">Under immediate sourcing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <span>Company Information</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Company Name</span>
              <span className="font-semibold text-gray-900">{client.companyName}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Company Type</span>
              <span className="font-semibold text-gray-900">{client.companyType || "—"}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Country</span>
              <span className="font-semibold text-gray-900">{client.country}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">City / State</span>
              <span className="font-semibold text-gray-900">
                {client.city} {client.state ? `, ${client.state}` : ""}
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Commercial Reg (CR) No</span>
              <span className="font-mono text-gray-900">{client.registrationNumber || "—"}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Trade License No</span>
              <span className="font-mono text-gray-900">{client.tradeLicenseNumber || "—"}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Tax / VAT Number</span>
              <span className="font-mono text-gray-900">{client.taxNumber || "—"}</span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Registered Address</span>
              <span className="font-semibold text-gray-900">
                {client.address || "—"} {client.addressLine2 ? `, ${client.addressLine2}` : ""}
              </span>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Official Email</span>
              <a
                href={`mailto:${client.email}`}
                className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Mail size={12} />
                <span>{client.email || "—"}</span>
              </a>
            </div>

            <div>
              <span className="text-gray-400 block text-[11px]">Company Phone</span>
              <span className="font-semibold text-gray-900 flex items-center gap-1">
                <Phone size={12} className="text-gray-400" />
                <span>{client.phone || "—"}</span>
              </span>
            </div>

            {client.website && (
              <div className="sm:col-span-2">
                <span className="text-gray-400 block text-[11px]">Website</span>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <Globe size={12} />
                  <span>{client.website}</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <span>Primary Contact Person</span>
            </h3>
          </div>

          {contact ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-100">
                  {contact.name?.charAt(0).toUpperCase() || "C"}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{contact.name || "Contact Person"}</p>
                  <p className="text-xs text-gray-500">
                    {contact.designation || "HR Lead"} •{" "}
                    {contact.department || "Human Resources"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[11px]">Email Address</span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Mail size={12} />
                    <span>{contact.email || "—"}</span>
                  </a>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Phone Number</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                    <Phone size={12} className="text-gray-400" />
                    <span>{contact.phone || "—"}</span>
                  </span>
                </div>

                {contact.whatsapp && (
                  <div>
                    <span className="text-gray-400 block text-[11px]">WhatsApp</span>
                    <span className="font-semibold text-emerald-700 mt-0.5 block">
                      {contact.whatsapp}
                    </span>
                  </div>
                )}

                {contact.altPhone && (
                  <div>
                    <span className="text-gray-400 block text-[11px]">Alternative Phone</span>
                    <span className="font-semibold text-gray-800 mt-0.5 block">
                      {contact.altPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No primary contact added.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientOverviewTab;
