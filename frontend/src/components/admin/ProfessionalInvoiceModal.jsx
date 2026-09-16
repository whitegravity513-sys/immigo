import React from "react";
import * as XLSX from "xlsx";
import { Download, Printer, X, MapPin, Phone, Mail, CreditCard } from "lucide-react";

export default function ProfessionalInvoiceModal({ invoice, project, onClose }) {
  if (!invoice) return null;

  const clientName = invoice.clientName || project?.client?.name || project?.clientName || "—";
  const companyName = invoice.companyName || project?.client?.companyName || project?.companyName || "";
  const projectName = invoice.projectName || project?.projectName || "—";
  const projectId = invoice.projectId || project?.projectId || "—";

  const adminComp = invoice.adminCompanyName || "VESTA ENTERPRISE SOLUTIONS";
  const adminAddr = invoice.adminAddress || "LG-04, Dallas 1 Business Park H-202, Sector 63, Noida, U.P-201301";
  const adminPhone = invoice.adminContact || "+91-921-713-5322 | +91-879-641-4339"; 
  const adminEmail = invoice.adminEmail || "sales@vesta.in";
  const adminGst = invoice.adminGstn || "09EPOPS8385K1ZL";

  const clientContact = invoice.clientContact || project?.client?.mobile || project?.client?.phone || "";
  const clientEmail = invoice.clientEmail || project?.client?.email || "";

  let parsedItems = [];
  try {
    const tempItems = typeof invoice.items === "string" ? JSON.parse(invoice.items) : (invoice.items || []);
    parsedItems = Array.isArray(tempItems) ? tempItems : [];
  } catch (e) {
    console.error("Error parsing invoice items:", e);
    parsedItems = [];
  }

  const downloadExcel = () => {
    const workbook = XLSX.utils.book_new();

    const sheetData = [
      [adminComp.toUpperCase() + " — TAX INVOICE"],
      ["Office Address:", adminAddr],
      ["Phone:", adminPhone],
      ["Email:", adminEmail],
      ...(adminGst ? [["Company GSTIN:", adminGst]] : []),
      [],
      ["Invoice Number:", invoice.invoiceNo || "-"],
      ["Invoice Date:", invoice.date || "-"],
      ["Project Name:", projectName],
      ["Project ID:", projectId],
      ["Client Name:", clientName],
      ["Company Name:", companyName],
      ["Client Phone / Contact:", clientContact || "-"],
      ["Client Email:", clientEmail || "-"],
      ["Client GSTIN / GSTN:", invoice.gstn || "-"],
      ["Place of Supply:", invoice.supplyAddress || "-"],
      [],
      ["S.No", "Description", "SAC Code", "Amount (INR)"]
    ];

    parsedItems.forEach((item, index) => {
      sheetData.push([
        index + 1,
        item.description || "-",
        item.sacCode || "-",
        item.amount || 0
      ]);
    });

    sheetData.push([]);
    sheetData.push(["", "", "Subtotal", invoice.amount || 0]);
    if (invoice.tax > 0) {
      sheetData.push(["", "", `GST / TAX`, invoice.tax || 0]);
    }
    sheetData.push(["", "", "Final Total Amount (INR)", invoice.totalAmount || 0]);
    sheetData.push([]);
    sheetData.push(["BANK TRANSFER DETAILS"]);
    sheetData.push(["Beneficiary Name:", "VESTA ENTERPRISE SOLUTIONS"]);
    sheetData.push(["Bank Name:", "AU Small Finance Bank"]);
    sheetData.push(["Account Number:", "2602416217906823"]);
    sheetData.push(["IFSC Code:", "AUBL0004162"]);

    if (invoice.remark) {
      sheetData.push([]);
      sheetData.push(["Remark / Note:", invoice.remark]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Statement");

    const filename = `${invoice.invoiceNo || "Invoice"}_${projectName.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white"
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
          }
          body {
            margin: 0 !important;
            background: white !important;
          }
          .printable-sheet {
            padding: 0.8cm 1.5cm 1.5cm 1.5cm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="bg-white w-full max-w-3xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden my-auto print:shadow-none print:border-none print:my-0 print:max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Action Bar (Hidden in Print) */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-mono font-bold">
              {invoice.invoiceNo}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              {adminComp} — Tax Invoice
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Download size={13} /> Export Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Printer size={13} /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Compact Formal Printable Sheet matching classic executive template in Black & White */}
        <div className="printable-sheet p-6 sm:p-8 space-y-6 bg-white text-slate-800 print:space-y-5">
          {/* Corporate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-800 pb-6">

            {/* LEFT: Logo + Company Info — logo left-aligned with address below */}
            <div className="text-slate-800 max-w-sm">
              <div className="flex items-center justify-start gap-3.5 mb-2">
                <img src="/wg-logo.png" alt="VESTA Logo" className="h-12 w-12 object-contain shrink-0" />
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">
                    {adminComp}
                  </h1>
                  <p className="text-[10px] font-semibold text-slate-500 italic mt-0.5">
                    Software Development & IT Solutions
                  </p>
                </div>
              </div>
              {/* Address block — starts flush with logo left edge */}
              <div className="text-[11px] text-slate-700 leading-relaxed font-medium pl-0">
                <div>{adminAddr}</div>
                <div>Phone: <span className="font-semibold">{adminPhone}</span></div>
                <div>Email: <span className="font-semibold">{adminEmail}</span></div>
                {adminGst && (
                  <div className="font-bold text-slate-900 pt-0.5">
                    GSTIN: <span className="font-mono text-slate-900 font-bold">{adminGst}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Invoice stamp + number + date */}
            <div className="flex flex-col justify-between h-full sm:text-right sm:ml-auto">
              <h2 className="text-3xl sm:text-4xl font-black tracking-widest text-slate-400 uppercase select-none sm:text-right">
                INVOICE
              </h2>
              <div className="text-xs font-bold text-slate-800 space-y-1.5 mt-4">
                <div className="flex gap-3 sm:justify-end">
                  <span className="text-slate-500">INVOICE #:</span>
                  <span className="font-mono font-black text-slate-900">{invoice.invoiceNo}</span>
                </div>
                <div className="flex gap-3 sm:justify-end">
                  <span className="text-slate-500">DATE:</span>
                  <span className="font-semibold text-slate-900">{invoice.date}</span>
                </div>
                <div className="flex gap-3 sm:justify-end">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {(invoice.paymentStatus || "Unpaid").replace(/[^a-zA-Z\s]/g, "").trim()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client & Project Meta Columns (TO: and FOR:) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1 pb-2">
            {/* TO Box */}
            <div className="space-y-1 text-xs text-slate-800">
              <div className="font-black text-slate-900 uppercase tracking-wider text-xs pb-1 border-b border-slate-200">
                BILL TO:
              </div>
              <div className="font-bold text-sm text-slate-900 pt-1">{clientName}</div>
              {companyName && <div className="font-bold text-sm text-slate-700">{companyName}</div>}
              {invoice.supplyAddress && <div className="text-slate-600 leading-snug mt-0.5">{invoice.supplyAddress}</div>}
              {clientContact && <div className="mt-1">Phone: <span className="font-medium">{clientContact}</span></div>}
              {clientEmail && <div>Email: <span className="font-medium">{clientEmail}</span></div>}
              {invoice.gstn && (
                <div className="font-bold text-slate-900 pt-1">
                  GSTIN: <span className="font-mono text-slate-900">{invoice.gstn}</span>
                </div>
              )}
            </div>

            {/* FOR Box */}
            <div className="text-xs text-slate-800 sm:border-l sm:border-slate-200 sm:pl-6">
              <div className="font-black text-slate-900 uppercase tracking-wider text-xs pb-1 border-b border-slate-200">
                PROJECT DETAILS:
              </div>
              <div className="pt-2 space-y-1.5">
                <div className="font-bold text-sm text-slate-900 leading-snug">{projectName}</div>

                {/* Project Type Badge */}
                {(invoice.projectType || project?.projectType) && (
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                      {invoice.projectType || project?.projectType}
                    </span>
                  </div>
                )}

                {/* Reference ID */}
                <div className="flex items-center gap-2 text-slate-600">
                  <span>Ref. ID:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px]">
                    {projectId}
                  </span>
                </div>

                {/* Invoice Date & Due Date */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-slate-600">
                  <div>
                    <div className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">Invoice Date</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{invoice.date || "—"}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">Due Date</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>

                {/* Service tag */}
                <div className="text-slate-400 italic font-medium pt-0.5 text-[10px]">
                  Professional IT &amp; Software Services
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table with crisp boxed headers */}
          <div className="border-2 border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-800 text-[11px] font-black uppercase tracking-wider">
                  <th className="px-4 py-3 border-r border-slate-400 w-12 text-center">#</th>
                  <th className="px-4 py-3 border-r border-slate-400">DESCRIPTION</th>
                  <th className="px-4 py-3 border-r border-slate-400 w-32 text-center">SAC CODE</th>
                  <th className="px-4 py-3 w-36 text-right">AMOUNT (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-xs sm:text-sm">
                {parsedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-center border-r border-slate-300 text-slate-600 font-semibold">{idx + 1}</td>
                    <td className="px-4 py-3 border-r border-slate-300 font-semibold text-slate-900">{item.description || "—"}</td>
                    <td className="px-4 py-3 text-center border-r border-slate-300 font-mono text-xs text-slate-700">{item.sacCode || "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{(Number(item.amount) || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2 items-stretch print:break-inside-avoid">
            {/* Left: Bank Details */}
            <div className="sm:col-span-7 space-y-3 text-xs text-slate-700">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <CreditCard className="text-emerald-600 shrink-0 font-bold" size={15} />
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                    Bank Transfer Details
                  </span>
                </div>
                <div className="grid grid-cols-[115px_1fr] gap-x-2 gap-y-1.5 text-xs text-slate-700">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-bold text-slate-900">VESTA ENTERPRISE SOLUTIONS</span>
                  
                  <span className="text-slate-500">Account Number:</span>
                  <span className="font-mono font-bold text-slate-900 tracking-wider">2602416217906823</span>
                  
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-900">AUBL0004162</span>
                  
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-semibold text-slate-900">AU Small Finance Bank</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></span>
                  <span>Quote Invoice Number (<span className="font-bold text-slate-900">{invoice.invoiceNo}</span>) in your payment description.</span>
                </div>
              </div>
              {invoice.remark && (
                <div className="text-xs text-slate-700 italic border-l-2 border-slate-800 pl-3 py-1">
                  <span className="font-bold not-italic text-slate-900">Note:</span> {invoice.remark}
                </div>
              )}
            </div>

            {/* Right: Bordered Totals Box */}
            <div className="sm:col-span-5 border-2 border-slate-800 rounded-lg p-5 pt-6 space-y-3 bg-white flex flex-col justify-end">
              <div className="flex justify-between text-xs text-slate-700 font-semibold py-1">
                <span>SUBTOTAL:</span>
                <span>₹{(Number(invoice.amount) || 0).toLocaleString("en-IN")}</span>
              </div>

              {/* GST Breakdown */}
              {(() => {
                const subtotal = Number(invoice.amount) || 0;
                const igstRate = Number(invoice.igstRate) || 0;
                const cgstRate = Number(invoice.cgstRate) || 0;
                const sgstRate = Number(invoice.sgstRate) || 0;
                const igstAmt = (subtotal * igstRate) / 100;
                const cgstAmt = (subtotal * cgstRate) / 100;
                const sgstAmt = (subtotal * sgstRate) / 100;
                const hasGst = igstRate > 0 || cgstRate > 0 || sgstRate > 0;

                return hasGst ? (
                  <div className="space-y-1.5 border-t border-slate-200 pt-2">
                    {igstRate > 0 && (
                      <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                        <span>IGST @ {igstRate}%</span>
                        <span>₹{igstAmt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {cgstRate > 0 && (
                      <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                        <span>CGST @ {cgstRate}%</span>
                        <span>₹{cgstAmt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {sgstRate > 0 && (
                      <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                        <span>SGST @ {sgstRate}%</span>
                        <span>₹{sgstAmt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {Number(invoice.tax) > 0 && (igstRate > 0 || cgstRate > 0 || sgstRate > 0) && (
                      <div className="flex justify-between text-[11px] text-slate-700 font-bold pt-0.5">
                        <span>Total Tax:</span>
                        <span>₹{Number(invoice.tax).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                  </div>
                ) : Number(invoice.tax) > 0 ? (
                  <div className="flex justify-between text-xs text-slate-600 font-semibold py-1">
                    <span>GST / TAX:</span>
                    <span>₹{Number(invoice.tax).toLocaleString("en-IN")}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-[11px] text-slate-400 italic py-0.5">
                    <span>GST / TAX:</span>
                    <span>Nil</span>
                  </div>
                );
              })()}

              <div className="border-t-2 border-slate-800 pt-4 mt-2 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-wider text-slate-900">
                  TOTAL DUE:
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{(Number(invoice.totalAmount) || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Centered Bottom Message */}
          <div className="pt-8 border-t border-slate-300 text-center space-y-4 print:break-inside-avoid">
            <div className="text-base font-black tracking-wide text-slate-900 uppercase">
              Thank you for your business!
            </div>
            <div className="text-[10px] text-slate-500 pt-2 font-medium italic border-t border-slate-100">
              This is a computer-generated invoice and does not require a physical signature.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

