import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  ArrowLeft,
  Download,
  Building2,
  FileText,
  MapPin,
  Calendar,
  Check,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

// Helper to convert number to Indian words
function numberToWords(num) {
  if (!num || isNaN(num)) return "Zero Rupees Only";
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return "Overflow";
    let n_ = ("000000000" + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_) return "";
    let str = "";
    str += Number(n_[1]) !== 0 ? (a[Number(n_[1])] || b[n_[1][0]] + " " + a[n_[1][1]]) + "Crore " : "";
    str += Number(n_[2]) !== 0 ? (a[Number(n_[2])] || b[n_[2][0]] + " " + a[n_[2][1]]) + "Lakh " : "";
    str += Number(n_[3]) !== 0 ? (a[Number(n_[3])] || b[n_[3][0]] + " " + a[n_[3][1]]) + "Thousand " : "";
    str += Number(n_[4]) !== 0 ? (a[Number(n_[4])] || b[n_[4][0]] + " " + a[n_[4][1]]) + "Hundred " : "";
    str += Number(n_[5]) !== 0 ? ((str !== "" ? "and " : "") + (a[Number(n_[5])] || b[n_[5][0]] + " " + a[n_[5][1]])) : "";
    return str.trim();
  };

  const words = inWords(Math.round(num));
  return words ? `Rupees ${words} Only` : "Rupees Zero Only";
}

export default function InvoiceReceiptPage() {
  const { appId, milestoneId } = useParams();
  const [application, setApplication] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId, milestoneId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const apps = await crmVendorService.getApplications();
      const app = (apps || []).find(
        (a) => String(a.id) === String(appId) || String(a.applicationId) === String(appId)
      );
      if (app) {
        setApplication(app);
        const m = (app.processMilestones || []).find(
          (item) => String(item.id) === String(milestoneId)
        ) || app.processMilestones?.[0];
        setMilestone(m);
      }
    } catch (err) {
      console.error("Error loading invoice data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600">Generating Official ImmiGo Invoice...</p>
        </div>
      </div>
    );
  }

  if (!application || !milestone) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm border border-slate-200">
          <h2 className="text-base font-black text-slate-900 mb-2">Invoice Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">The requested milestone payment invoice could not be located.</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const app = application;
  const isApproved = milestone.paymentStatus === "Approved" || milestone.paymentStatus === "Paid";
  const currentDate = milestone.paymentDate || new Date().toISOString().split("T")[0];
  const dateOfDay = currentDate.replace(/-/g, ""); // e.g. 20261013
  const seq = (app.id || "APP").replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "0001";
  
  // Format: IMMI-date of day -invoice sequence
  const invoiceNo = `IMMI-${dateOfDay}-${seq}`;
  const paidAmount = Number(milestone.paymentAmount || milestone.amount || 0);

  // Extract payment method and transaction ID
  let method = "Online Transfer (Razorpay)";
  let txnId = milestone.paymentRef || "N/A";

  if (milestone.paymentRef) {
    if (milestone.paymentRef.includes("[Razorpay]")) {
      method = "Razorpay Online Transfer";
      const match = milestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (match) txnId = match[1].trim();
    } else if (milestone.paymentRef.includes("[UPI]")) {
      method = "UPI Instant Transfer";
      const match = milestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (match) txnId = match[1].trim();
    } else if (milestone.paymentRef.includes("[Bank Transfer]")) {
      method = "NEFT / RTGS Bank Transfer";
      const match = milestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (match) txnId = match[1].trim();
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-8 px-4 font-sans antialiased text-slate-800 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-paper {
            max-width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Floating Action Bar (Hidden when printing or saving PDF) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition"
        >
          <ArrowLeft size={14} />
          <span>Close Window</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs cursor-pointer transition"
          >
            <Download size={14} />
            <span>Download / Save PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-4 py-2 rounded-xl shadow-2xs cursor-pointer transition"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Formal Corporate Invoice Document Page (A4 Paper Style) */}
      <div className="invoice-paper max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 sm:p-12 text-slate-800 space-y-6">
        {/* Header: ImmiGo Company Branding & Invoice Title */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                i
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1">
                  <span className="font-black text-slate-900 text-xl tracking-tight">immi</span>
                  <span className="font-black text-blue-600 text-xl tracking-tight">Go</span>
                  <span className="font-extrabold text-slate-700 text-lg ml-1">Global</span>
                </div>
                <span className="block text-[11px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">
                  Overseas Workforce & Manpower Solutions
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-3 space-y-0.5 leading-relaxed">
              <p>Registered International Placement & Human Resources Agency</p>
              <p>Corporate Office: 402-404, World Trade Centre, Connaught Place, New Delhi - 110001</p>
              <p>Email: accounts@immigo.com &bull; Support: support@immigo.com &bull; Phone: +91 (011) 4920-8000</p>
              <p className="font-mono text-[11px]">GSTIN: 07AAACI8832L1Z9 &bull; CIN: U74999DL2021PTC384912</p>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-black uppercase tracking-wider mb-2">
              Tax Invoice / Receipt
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
              #{invoiceNo}
            </h1>
            <div className="text-xs text-slate-500 mt-2 space-y-1">
              <p>
                <span className="font-semibold text-slate-700">Date of Issue: </span>
                <span className="font-mono">{currentDate}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Payment Status: </span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>PAID & VERIFIED</span>
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Currency: </span>
                <span className="font-bold text-slate-800">INR (₹)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Billed To & Project Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 p-5 rounded-xl border border-slate-200/90 text-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To (Vendor / Agency)
            </span>
            <h3 className="font-black text-slate-900 text-sm">{app.vendorName || "Partner Recruitment Agency"}</h3>
            <div className="mt-2 space-y-1 text-slate-600">
              <p>
                <strong className="text-slate-800">Candidate Name: </strong>
                {app.candidateName}
              </p>
              <p>
                <strong className="text-slate-800">Applied Trade: </strong>
                {app.position || "General Trade"}
              </p>
              <p>
                <strong className="text-slate-800">Candidate / App ID: </strong>
                <span className="font-mono">{app.id || app.applicationId}</span>
              </p>
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-200 sm:pl-6">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Overseas Project & Deployment Details
            </span>
            <h3 className="font-black text-slate-900 text-sm">{app.projectName || "International Placement Project"}</h3>
            <div className="mt-2 space-y-1 text-slate-600">
              <p>
                <strong className="text-slate-800">Client / Employer: </strong>
                {app.clientName || "Overseas Employer"}
              </p>
              <p>
                <strong className="text-slate-800">Destination Country: </strong>
                {app.country || "Overseas Deployment"}
              </p>
              <p>
                <strong className="text-slate-800">Milestone Stage: </strong>
                <span className="text-blue-700 font-bold">{milestone.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Itemized Invoice Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100/90 text-slate-700 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Description / Particulars</th>
                <th className="py-3 px-4">Candidate & Trade</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Rate (₹)</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="py-3.5 px-4 text-center font-bold text-slate-400">1</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <span>{milestone.name}</span>
                  <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                    Official overseas deployment milestone installment fee
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-slate-800">{app.candidateName}</span>
                  <span className="block text-[10px] text-slate-500">Trade: {app.position || "N/A"}</span>
                </td>
                <td className="py-3.5 px-4 text-center font-mono">1</td>
                <td className="py-3.5 px-4 text-right font-mono font-medium">₹{paidAmount.toLocaleString()}</td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                  ₹{paidAmount.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2.5 px-4 text-center font-bold text-slate-400">2</td>
                <td className="py-2.5 px-4 text-slate-600">
                  Document Verification, Processing & Attestation
                </td>
                <td className="py-2.5 px-4 text-slate-500">ImmiGo Compliance</td>
                <td className="py-2.5 px-4 text-center font-mono">1</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">Included</td>
                <td className="py-2.5 px-4 text-right text-emerald-600 font-bold font-mono">₹0.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculations & Amount in Words */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          {/* Amount in words & Payment confirmation */}
          <div className="flex-1 space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Total Amount in Words
              </span>
              <p className="text-xs font-bold text-slate-900 italic">
                {numberToWords(paidAmount)}
              </p>
            </div>

            {/* Payment Transaction Details Box */}
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] mb-1">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>PAYMENT CONFIRMATION & SETTLEMENT</span>
              </div>
              <div className="space-y-0.5 text-[11px] text-emerald-900">
                <p>
                  <strong>Payment Mode: </strong>
                  <span>{method}</span>
                </p>
                <p>
                  <strong>Transaction Reference / ID: </strong>
                  <code className="bg-emerald-100/90 text-emerald-900 px-1 py-0.5 rounded font-mono text-[10px]">
                    {txnId}
                  </code>
                </p>
                <p>
                  <strong>Date: </strong>
                  <span>{currentDate} &bull; Received into ImmiGo Global Account</span>
                </p>
              </div>
            </div>
          </div>

          {/* Subtotal & Total Box */}
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-800">₹{paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>CGST (0%):</span>
              <span className="font-mono text-slate-500">₹0.00</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>SGST (0%):</span>
              <span className="font-mono text-slate-500">₹0.00</span>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-slate-900 text-slate-900 font-black text-sm">
              <span>Total Paid:</span>
              <span className="font-mono text-blue-700 text-base">₹{paidAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer: Terms & Authorized Signatory */}
        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          <div className="text-[10px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-600 uppercase">Terms & Conditions:</p>
            <p>1. This is a computer auto-generated official invoice & receipt and does not require any physical signature.</p>
            <p>2. Milestone payments are strictly allocated toward candidate recruitment & overseas deployment.</p>
            <p>3. All disputes are subject to the exclusive jurisdiction of the courts of New Delhi, India.</p>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block text-center border-t border-slate-300 pt-3 min-w-[220px]">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-1">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Auto-Generated System Invoice</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mt-1">
                Authorized by
              </span>
              <span className="text-[11px] font-bold text-slate-800 block">
                ImmiGo Global Accounts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
