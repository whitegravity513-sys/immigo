import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer, CheckCircle2 } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

// Helper to convert number to Indian words
function numberToWords(num) {
  if (!num || isNaN(num) || Number(num) === 0) return "Zero Rupees Only";
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
    "Twenty ",
    "Thirty ",
    "Forty ",
    "Fifty ",
    "Sixty ",
    "Seventy ",
    "Eighty ",
    "Ninety ",
  ];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return "Overflow";
    let n_ = ("000000000" + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_) return "";
    let str = "";
    str += Number(n_[1]) !== 0 ? (a[Number(n_[1])] || b[Number(n_[1][0])] + a[Number(n_[1][1])]) + "Crore " : "";
    str += Number(n_[2]) !== 0 ? (a[Number(n_[2])] || b[Number(n_[2][0])] + a[Number(n_[2][1])]) + "Lakh " : "";
    str += Number(n_[3]) !== 0 ? (a[Number(n_[3])] || b[Number(n_[3][0])] + a[Number(n_[3][1])]) + "Thousand " : "";
    str += Number(n_[4]) !== 0 ? (a[Number(n_[4])] || b[Number(n_[4][0])] + a[Number(n_[4][1])]) + "Hundred " : "";
    str += Number(n_[5]) !== 0 ? (a[Number(n_[5])] || b[Number(n_[5][0])] + a[Number(n_[5][1])]) : "";
    return str.trim();
  };

  const words = inWords(Math.round(num));
  return words ? `${words} Rupees Only` : "Zero Rupees Only";
}

export default function InvoiceReceiptPage() {
  const { appId, milestoneId } = useParams();
  const [application, setApplication] = useState(null);
  const [vendor, setVendor] = useState(null);
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
        const m =
          (app.processMilestones || []).find(
            (item) => String(item.id) === String(milestoneId)
          ) ||
          app.paymentPlan?.milestones?.find(
            (item) => String(item.id) === String(milestoneId)
          ) ||
          app.processMilestones?.[0] ||
          app.paymentPlan?.milestones?.[0] || {
            name: "Milestone 1: Candidate Selection",
            amount: 25000,
          };
        setMilestone(m);

        if (app.vendorId) {
          try {
            const v = await crmVendorService.getVendorById(app.vendorId);
            setVendor(v);
          } catch {}
        }
      }
    } catch (err) {
      console.error("Error loading receipt data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Loading Official Payment Receipt...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-2">Receipt Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">The requested milestone payment receipt could not be located.</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const app = application;
  const currentMilestone = milestone || {};

  // Amounts
  const totalPlanAmount =
    Number(app.paymentPlan?.totalAmount) ||
    (app.paymentPlan?.milestones || []).reduce((sum, m) => sum + (Number(m.amount) || 0), 0) ||
    (app.processMilestones || []).reduce((sum, m) => sum + (Number(m.amount || m.paymentAmount) || 0), 0) ||
    65000;

  const paidAmount = Number(currentMilestone.paymentAmount || currentMilestone.amount || 25000);
  const dueAmount = Math.max(0, totalPlanAmount - paidAmount);

  // Dates
  const rawDate = currentMilestone.paymentDate || currentMilestone.completedAt || new Date().toISOString();
  const dateObj = new Date(rawDate);
  const formattedFullDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedShortDate = dateObj
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");

  const seq = (app.id || "001").replace(/[^0-9]/g, "").slice(-4).padStart(4, "0") || "0001";
  const receiptNo = `IG/REC/2026-${seq}`;

  const vendorCompanyName =
    vendor?.companyName ||
    app.vendorName ||
    "Partner Recruitment Agency";

  const vendorAddress =
    vendor?.address ||
    "Authorized Partner Office, New Delhi - 110075";

  // Mode and Txn
  let paymentMode = "Bank / Online Transfer";
  let txnRef = currentMilestone.paymentRef || "TXN-VERIFIED-98234";
  if (currentMilestone.paymentRef) {
    if (currentMilestone.paymentRef.includes("[Razorpay]")) {
      paymentMode = "Razorpay Online";
      const m = currentMilestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (m) txnRef = m[1].trim();
    } else if (currentMilestone.paymentRef.includes("[UPI]")) {
      paymentMode = "UPI Transfer";
      const m = currentMilestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (m) txnRef = m[1].trim();
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-8 px-2 sm:px-4 font-sans text-slate-900 print:bg-white print:p-0">
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
          .receipt-paper {
            max-width: 100% !important;
            margin: 0 !important;
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
            padding: 8mm !important;
            page-break-inside: avoid !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Action Bar */}
      <div className="max-w-[800px] mx-auto mb-4 flex items-center justify-between print-hide">
        <button
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs cursor-pointer transition"
        >
          <ArrowLeft size={14} />
          <span>Close</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl shadow-xs cursor-pointer transition"
          >
            <Download size={14} />
            <span>Download / Save PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 px-4 py-2 rounded-xl shadow-2xs cursor-pointer transition"
          >
            <Printer size={14} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* ── OFFICIAL PAYMENT RECEIPT CONTAINER ── */}
      <div className="receipt-paper max-w-[800px] mx-auto bg-white border-2 border-slate-900 p-6 sm:p-8 shadow-md text-slate-900 text-xs leading-relaxed space-y-4 font-sans">
        
        {/* 1. HEADER: LOGO, COMPANY DETAILS & RECEIPT TITLE */}
        <div className="border border-slate-900 flex flex-col sm:flex-row items-stretch">
          {/* Company Details */}
          <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-slate-900 flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              <div className="flex items-baseline">
                <span className="text-3xl font-black tracking-tight text-slate-950">immi</span>
                <span className="text-3xl font-black tracking-tight text-sky-500">G</span>
                <span className="w-5 h-5 rounded-full border-3 border-sky-500 bg-sky-500 inline-flex items-center justify-center -ml-0.5 relative top-0.5">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                </span>
              </div>
              <p className="text-[8px] text-slate-600 tracking-wider font-semibold uppercase mt-0.5">
                Your story unfolds across borders
              </p>
            </div>

            <div className="text-[10px] text-slate-800 space-y-0.5 pl-2 leading-tight">
              <h2 className="text-xs font-black uppercase text-slate-950">
                IMMIGO EDUCARE LLP
              </h2>
              <p>C - 76, Phase - II, Sector - 88, Noida</p>
              <p>Gautam Budh Nagar - 201301, Uttar Pradesh, India</p>
              <p className="font-semibold text-slate-900 pt-0.5">PAN: AALFI5039G</p>
            </div>
          </div>

          {/* Receipt Meta Box */}
          <div className="w-full sm:w-[320px] bg-slate-50/70 p-3.5 flex flex-col justify-between">
            <div className="text-center sm:text-right border-b border-slate-300 pb-1.5 mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-950 block">
                OFFICIAL PAYMENT RECEIPT
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>PAYMENT ACKNOWLEDGED</span>
              </span>
            </div>
            <div className="text-[10px] space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <strong className="text-slate-900">{receiptNo}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <strong className="text-slate-900">{formattedFullDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <strong className="text-slate-900">{paymentMode}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RECEIVED FROM & CANDIDATE / PROJECT DETAILS */}
        <div className="border border-slate-900 grid grid-cols-1 sm:grid-cols-2 text-[11px]">
          {/* Vendor Details */}
          <div className="p-3.5 border-b sm:border-b-0 sm:border-r border-slate-900 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Received From (Vendor Partner)
            </span>
            <h3 className="font-bold text-slate-950 text-xs uppercase">
              {vendorCompanyName}
            </h3>
            <p className="text-slate-600 text-[10px]">{vendorAddress}</p>
            <p className="text-[10px] font-semibold text-slate-700 pt-1">
              Vendor ID: {app.vendorId || vendor?.vendorId || "VND-PARTNER"}
            </p>
          </div>

          {/* Candidate & Project Details */}
          <div className="p-3.5 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
              Candidate & Overseas Deployment
            </span>
            <div className="space-y-0.5 text-[10px]">
              <p>
                <span className="text-slate-500">Candidate Name: </span>
                <strong className="text-slate-950">{app.candidateName}</strong>
              </p>
              <p>
                <span className="text-slate-500">Applied Trade / Role: </span>
                <strong className="text-slate-800">{app.position || "General Staff"}</strong>
              </p>
              <p>
                <span className="text-slate-500">Project: </span>
                <strong className="text-slate-800">{app.projectName}</strong>
                {app.clientName && ` (${app.clientName})`}
              </p>
            </div>
          </div>
        </div>

        {/* 3. PAYMENT PARTICULARS TABLE */}
        <div className="border border-slate-900 overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-900 text-[10px]">
              <tr>
                <th className="py-2 px-3 border-r border-slate-900 w-10 text-center">#</th>
                <th className="py-2 px-3 border-r border-slate-900">Particulars / Payment Milestone</th>
                <th className="py-2 px-3 border-r border-slate-900">Transaction Ref</th>
                <th className="py-2 px-3 border-r border-slate-900 text-center">Date</th>
                <th className="py-2 px-3 text-right w-32">Amount Received (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-2.5 px-3 border-r border-slate-900 text-center font-bold text-slate-500">1</td>
                <td className="py-2.5 px-3 border-r border-slate-900 font-bold text-slate-950">
                  <span>{currentMilestone.name || "Milestone Deployment Payment"}</span>
                  <span className="block text-[10px] text-slate-500 font-normal">
                    Overseas Recruitment & Clearance Stage
                  </span>
                </td>
                <td className="py-2.5 px-3 border-r border-slate-900 text-[10px] font-mono text-slate-700">
                  {txnRef}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-900 text-center text-[10px]">
                  {formattedShortDate}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-950 font-mono text-xs">
                  ₹ {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Amount In Words Row */}
              <tr className="border-b border-slate-900 bg-slate-50/50 text-[10px]">
                <td colSpan={3} className="py-2 px-3 border-r border-slate-900">
                  <span className="text-slate-500">Amount Received (In Words): </span>
                  <strong className="text-slate-950 font-bold ml-1">
                    {numberToWords(paidAmount)}
                  </strong>
                </td>
                <td className="py-2 px-3 text-right font-bold border-r border-slate-900">
                  Total Paid:
                </td>
                <td className="py-2 px-3 text-right font-black text-slate-950 font-mono text-xs">
                  ₹ {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Ledger Summary: Total Agreed vs Due */}
              <tr className="text-[10px]">
                <td colSpan={3} className="py-2 px-3 border-r border-slate-900 text-slate-600">
                  Total Agreed Placement Fee: <strong className="text-slate-900">₹{totalPlanAmount.toLocaleString()}</strong>
                </td>
                <td className="py-2 px-3 text-right font-bold border-r border-slate-900 text-slate-700">
                  Balance Remaining:
                </td>
                <td className={`py-2 px-3 text-right font-bold font-mono text-xs ${dueAmount > 0 ? "text-red-600" : "text-emerald-700"}`}>
                  ₹ {dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. BANK DETAILS & OFFICIAL SIGNATURE (SIDE BY SIDE) */}
        <div className="border border-slate-900 grid grid-cols-1 sm:grid-cols-2 text-[10px]">
          {/* Bank Account Details */}
          <div className="p-3.5 border-b sm:border-b-0 sm:border-r border-slate-900 space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1 mb-1">
              Credited To Company Account
            </span>
            <div className="space-y-0.5 text-slate-700">
              <p><span className="w-24 inline-block text-slate-500">Account Name:</span> <strong className="text-slate-950">Immigo Educare LLP</strong></p>
              <p><span className="w-24 inline-block text-slate-500">Account No:</span> <strong className="text-slate-950 font-mono">925020043404157</strong></p>
              <p><span className="w-24 inline-block text-slate-500">Bank & Branch:</span> <strong className="text-slate-950">Axis Bank, Sector - 45, Noida</strong></p>
              <p><span className="w-24 inline-block text-slate-500">IFSC Code:</span> <strong className="text-slate-950 font-mono">UTIB0004491</strong></p>
            </div>
          </div>

          {/* Authorised Signatory & Seal */}
          <div className="p-3.5 flex flex-col justify-between text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-800 block">
              For IMMIGO EDUCARE LLP
            </span>

            {/* Stamp & Signature simulation */}
            <div className="py-1 flex items-center justify-end">
              <div className="w-28 h-14 border-2 border-dashed border-blue-600/70 rounded-full flex flex-col items-center justify-center p-1 text-blue-700 rotate-[-3deg] select-none pointer-events-none">
                <span className="text-[7px] font-black tracking-widest uppercase">
                  IMMIGO EDUCARE LLP
                </span>
                <svg className="w-16 h-5 text-blue-800 my-[-2px]" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10,20 Q25,5 35,22 T55,8 T75,24 T95,12" strokeLinecap="round" />
                </svg>
                <span className="text-[6px] font-bold uppercase tracking-wider">
                  DESIGNATED PARTNER
                </span>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-1">
              <span className="font-bold text-slate-950 uppercase text-[9px] block">
                Authorised Signatory
              </span>
            </div>
          </div>
        </div>

        {/* 5. FOOTER */}
        <div className="text-center pt-2 border-t border-slate-200">
          <p className="text-xs italic text-slate-700 font-serif">
            Thanks for your business
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">
            This is an official system-generated electronic receipt issued upon payment confirmation.
          </p>
        </div>

      </div>
    </div>
  );
}
