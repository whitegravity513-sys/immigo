import React from "react";

export default function VendorOverviewTab({ vendor }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Company Profile & Statutory
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Vendor Code</span>
            <p className="font-mono font-semibold text-white mt-0.5">{vendor.vendorId}</p>
          </div>
          <div>
            <span className="text-slate-400">Agency Name</span>
            <p className="font-semibold text-white mt-0.5">{vendor.companyName}</p>
          </div>
          <div>
            <span className="text-slate-400">PAN</span>
            <p className="font-mono text-white mt-0.5">{vendor.pan || "N/A"}</p>
          </div>
          <div>
            <span className="text-slate-400">GSTIN</span>
            <p className="font-mono text-white mt-0.5">{vendor.gstin || "N/A"}</p>
          </div>
          <div className="col-span-2">
            <span className="text-slate-400">Registered Address</span>
            <p className="text-slate-200 mt-0.5">{vendor.address || "N/A"}</p>
          </div>
          <div>
            <span className="text-slate-400">Payment Terms</span>
            <p className="font-semibold text-blue-400 mt-0.5">{vendor.paymentTerms || "Standard Net-30"}</p>
          </div>
          <div>
            <span className="text-slate-400">Onboarded At</span>
            <p className="text-slate-200 mt-0.5">
              {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Bank Settlement Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Bank Name</span>
            <p className="font-semibold text-white mt-0.5">
              {vendor.bankDetails?.bankName || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Account Number</span>
            <p className="font-mono text-white mt-0.5">
              {vendor.bankDetails?.accountNumber || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-slate-400">IFSC Code</span>
            <p className="font-mono text-white mt-0.5">
              {vendor.bankDetails?.ifscCode || vendor.bankDetails?.ifsc || "N/A"}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Account Holder</span>
            <p className="text-white mt-0.5">
              {vendor.bankDetails?.accountHolderName || vendor.bankDetails?.accountName || "N/A"}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 mb-1">Administrative Notes</h4>
          <p className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            {vendor.vendorNotes || "No specific internal notes added for this vendor."}
          </p>
        </div>
      </div>
    </div>
  );
}

