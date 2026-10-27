import React from "react";
import { Link } from "react-router-dom";
import { FileCheck, ArrowRight } from "lucide-react";

export default function HrPendingDocsList({ pendingDocs }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900">Pending Documents</h2>
          </div>
          <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
            {pendingDocs.length} Pending
          </span>
        </div>

        <div className="p-3 divide-y divide-gray-100">
          {pendingDocs.map((doc) => (
            <div key={doc.id} className="py-3.5 px-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate text-sm">{doc.employee}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{doc.document}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Submitted: {doc.submittedDate}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-gray-50/70 border-t border-gray-100">
        <Link
          to="/admin/dashboard/workforce"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-blue-600 hover:text-blue-800"
        >
          <span>Open Document Verification Center</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
