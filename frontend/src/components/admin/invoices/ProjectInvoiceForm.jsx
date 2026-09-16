import React from "react";
import { Plus, Building2 } from "lucide-react";

export default function ProjectInvoiceForm({
  logic, // The returned object from useInvoiceLogic
  project
}) {
  const {
    editingInvoiceId, editingInvoiceNo,
    clientNameVal, companyNameVal,
    clientContact, setClientContact,
    clientEmail, setClientEmail,
    gstn, setGstn,
    formDate, setFormDate,
    supplyAddress, setSupplyAddress,
    adminCompanyName, setAdminCompanyName,
    adminGstn, setAdminGstn,
    adminAddress, setAdminAddress,
    adminContact, setAdminContact,
    adminEmail, setAdminEmail,
    items, handleItemChange, handleAddItemRow, handleRemoveItemRow,
    igstRate, setIgstRate,
    cgstRate, setCgstRate,
    sgstRate, setSgstRate,
    remark, setRemark,
    paymentStatus, setPaymentStatus,
    subtotal, igstAmount, cgstAmount, sgstAmount, totalAmount,
    handleCreateInvoice, setActiveTab, loading,
    setEditingInvoiceId, setEditingInvoiceNo
  } = logic;

  return (
    <form onSubmit={handleCreateInvoice} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-800">
              {editingInvoiceId ? `Editing Official Invoice (${editingInvoiceNo})` : "1. Client Contact & Billing Details"}
            </h3>
            <p className="text-xs text-slate-500">
              {editingInvoiceId ? "Update line items, tax rates or client/company metadata below" : "Unique Invoice Number auto-generated based on Financial Year starting 1st April (e.g. VESTA-26-27-001)"}
            </p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold uppercase font-mono">
            {editingInvoiceId ? editingInvoiceNo : "FY VESTA-YY-YY-XXX"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Project Name
            </label>
            <input
              type="text"
              disabled
              value={project?.projectName || ""}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Client Name
            </label>
            <input
              type="text"
              disabled
              value={clientNameVal || "—"}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Company Name
            </label>
            <input
              type="text"
              disabled
              value={companyNameVal || "—"}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Client Contact / Phone
            </label>
            <input
              type="text"
              placeholder="e.g. +91 9876543210"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Client Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. client@company.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Client GSTIN / GSTN
            </label>
            <input
              type="text"
              placeholder="e.g. 07AABCU9603R1ZM"
              value={gstn}
              onChange={(e) => setGstn(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Invoice Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Place of Supply / Client Address
            </label>
            <input
              type="text"
              placeholder="e.g. Noida, Uttar Pradesh"
              value={supplyAddress}
              onChange={(e) => setSupplyAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Our Agency / Company Details - Compact Collapsible */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs p-4">
        <details>
          <summary className="cursor-pointer flex items-center gap-2 text-sm font-black text-slate-700 select-none">
            <Building2 size={15} className="text-green-600" />
            2. Our Agency / Company Details
            <span className="ml-auto text-[10px] text-slate-400 font-normal">(click to expand/edit)</span>
          </summary>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
              <input type="text" value={adminCompanyName} onChange={(e) => setAdminCompanyName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500 font-bold" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Our GSTIN</label>
              <input type="text" value={adminGstn} onChange={(e) => setAdminGstn(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-green-500 font-bold" />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Office Address</label>
              <input type="text" value={adminAddress} onChange={(e) => setAdminAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Phone</label>
              <input type="text" value={adminContact} onChange={(e) => setAdminContact(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
              <input type="text" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500" />
            </div>
          </div>
        </details>
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-800">Invoice Items (Description, SAC Code & Amount)</h3>
            <p className="text-xs text-slate-500">
              Fully editable descriptions and amounts for each installment or milestone service
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddItemRow}
            className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Add Another Row
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
              <div className="sm:col-span-6 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Description {idx + 1}
                </label>
                <input
                  type="text"
                  placeholder={`Service / installment description #${idx + 1}`}
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-medium"
                />
              </div>

              <div className="sm:col-span-3 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  SAC Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 998314"
                  value={item.sacCode}
                  onChange={(e) => handleItemChange(idx, "sacCode", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={item.amount}
                    onChange={(e) => handleItemChange(idx, "amount", e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-green-500"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="mt-5 p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Remove row"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GST Tax & Total Calculation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3">
          GST Calculation & Total
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">
              IGST Rate (%)
            </label>
            <input type="number" min="0" max="100" value={igstRate}
              onChange={(e) => setIgstRate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">
              CGST Rate (%)
            </label>
            <input type="number" min="0" max="100" value={cgstRate}
              onChange={(e) => setCgstRate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">
              SGST Rate (%)
            </label>
            <input type="number" min="0" max="100" value={sgstRate}
              onChange={(e) => setSgstRate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">
              Remark / Note
            </label>
            <input type="text" placeholder="Optional note" value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase">
              Payment Status
            </label>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-green-500 cursor-pointer"
              style={{ color: paymentStatus === 'Paid' ? '#16a34a' : '#dc2626' }}>
              <option value="Unpaid">❌ Unpaid</option>
              <option value="Paid">✅ Paid</option>
              <option value="Partially Paid">⚠️ Partially Paid</option>
            </select>
          </div>
        </div>

        <div className="bg-white-50 border border-slate-200 text-slate-900 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-xs text-slate-600 font-medium">
            <div>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</div>
            {igstAmount > 0 && <div>IGST ({igstRate}%): ₹{igstAmount.toLocaleString("en-IN")}</div>}
            {cgstAmount > 0 && <div>CGST ({cgstRate}%): ₹{cgstAmount.toLocaleString("en-IN")}</div>}
            {sgstAmount > 0 && <div>SGST ({sgstRate}%): ₹{sgstAmount.toLocaleString("en-IN")}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-black-500 uppercase tracking-wider">Final Total Amount</div>
            <div className="text-2xl font-black text-black-700">
              ₹{totalAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setEditingInvoiceId(null);
            setEditingInvoiceNo("");
            setActiveTab("list");
          }}
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-green-600/30 transition-all cursor-pointer"
        >
          {loading
            ? editingInvoiceId
              ? "Updating..."
              : "Generating..."
            : editingInvoiceId
            ? "Update Official Invoice Now"
            : "Generate Official Invoice Now"}
        </button>
      </div>
    </form>
  );
}
