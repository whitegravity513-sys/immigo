import React from "react";

export function ClientContactsTab({ client }) {
  if (!client) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(client.contacts || []).map((contact, idx) => (
        <div
          key={contact.id || idx}
          className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-100">
                {contact.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{contact.name}</h4>
                  {contact.isPrimary && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      Primary Contact
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {contact.designation || "Representative"} •{" "}
                  {contact.department || "Operations"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Email:</span>
              <a
                href={`mailto:${contact.email}`}
                className="font-semibold text-blue-600 hover:underline"
              >
                {contact.email}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="font-semibold text-gray-800">{contact.phone}</span>
            </div>
            {contact.whatsapp && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">WhatsApp:</span>
                <span className="font-semibold text-emerald-700">
                  {contact.whatsapp}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ClientContactsTab;
