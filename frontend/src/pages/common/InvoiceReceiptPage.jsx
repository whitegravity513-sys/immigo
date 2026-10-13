import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

// Helper to convert number to Indian words matching the PDF format
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
      console.error("Error loading invoice data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Loading Official Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-2">Invoice Record Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">The requested milestone payment invoice could not be located.</p>
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

  // Milestone and Total Plan Amounts
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
  const invoiceNo = `IG/2026/A - ${seq}`;

  const clientCompanyName =
    app.clientName ||
    vendor?.companyName ||
    app.vendorName ||
    "REISEBUERO OVERSEAS PRIVATE LIMITED";

  const clientAddress =
    vendor?.address ||
    "Second Floor, Shop No. 208, Arjun Plaza, Plot No. 7\nSector - 5, Dwarka, New Delhi, South West Delhi - 110075";

  const clientGstin = vendor?.gstin || "07AAFCH2627E2ZU";
  const clientPan = vendor?.panNumber || "AAFCH2627E";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-8 px-2 sm:px-4 font-sans text-slate-900 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page {
            margin: 8mm;
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
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
            padding: 6mm !important;
            page-break-inside: avoid !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Action Controls */}
      <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between print-hide">
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
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* ── OFFICIAL A4 TAX INVOICE CONTAINER (1:1 Match with PDF) ── */}
      <div className="invoice-paper max-w-[850px] mx-auto bg-white border-2 border-slate-900 p-6 sm:p-8 shadow-md text-slate-900 text-[11px] leading-tight space-y-3 font-sans">
        
        {/* 1. HEADER ROW: LOGO & COMPANY INFO (LEFT) + TAX INVOICE METADATA (RIGHT) */}
        <div className="border border-slate-900 flex flex-col md:flex-row">
          {/* Header Left: immiGo Branding & Registered Address */}
          <div className="flex-1 p-3.5 border-b md:border-b-0 md:border-r border-slate-900 flex items-start gap-3">
            {/* Logo */}
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

            {/* Immigo Educare LLP Address Details */}
            <div className="text-[10px] text-slate-800 space-y-0.5 leading-tight pl-2">
              <h2 className="text-xs font-black uppercase text-slate-950 tracking-wide">
                IMMIGO EDUCARE LLP
              </h2>
              <p>C - 76, Phase - II</p>
              <p>Sector - 88, Noida</p>
              <p>Gautam Budh Nagar - 201301</p>
              <p>Uttar Pradesh, India.</p>
              <p className="font-semibold text-slate-900 pt-0.5">GSTIN: </p>
            </div>
          </div>

          {/* Header Right: TAX INVOICE Title & Invoice Details Box */}
          <div className="w-full md:w-[360px] flex flex-col">
            <div className="bg-slate-100/70 border-b border-slate-900 py-1 px-3 text-center">
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-950">
                TAX INVOICE
              </h1>
            </div>
            <div className="p-2.5 text-[10px] space-y-1 divide-y divide-slate-200">
              <div className="grid grid-cols-2 pb-1">
                <div>
                  <span className="text-slate-600">Invoice No. : </span>
                  <strong className="text-slate-950">{invoiceNo}</strong>
                </div>
                <div>
                  <span className="text-slate-600">Place of Supply : </span>
                  <strong className="text-slate-950">DL (07)</strong>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-slate-600">Invoice Date : </span>
                <strong className="text-slate-950">{formattedFullDate}</strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-600">Terms : </span>
                <strong className="text-slate-950">As per payment Annexure</strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-600">Due Date : </span>
                <strong className="text-slate-950"></strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BILL TO & SHIP TO SECTION (2 Equal Columns with Border) */}
        <div className="border border-slate-900 grid grid-cols-1 md:grid-cols-2">
          {/* Bill To */}
          <div className="p-3 border-b md:border-b-0 md:border-r border-slate-900 text-[10px] space-y-1">
            <div className="border-b border-slate-300 pb-1 mb-1 font-bold uppercase tracking-wider text-slate-600 text-[9px] text-center">
              Bill To
            </div>
            <h3 className="font-black text-slate-950 text-[11px] uppercase">
              {clientCompanyName}
            </h3>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {clientAddress}
            </p>
            <div className="pt-1 space-y-0.5 font-semibold text-slate-800">
              <p>GSTIN: {clientGstin}</p>
              <p>PAN: {clientPan}</p>
              <p className="text-[9px] text-slate-500 font-normal">
                Candidate: {app.candidateName} &bull; Trade: {app.position || "General Staff"}
              </p>
            </div>
          </div>

          {/* Ship To */}
          <div className="p-3 text-[10px] space-y-1">
            <div className="border-b border-slate-300 pb-1 mb-1 font-bold uppercase tracking-wider text-slate-600 text-[9px] text-center">
              Ship To
            </div>
            <h3 className="font-black text-slate-950 text-[11px] uppercase">
              {clientCompanyName}
            </h3>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {clientAddress}
            </p>
            <div className="pt-1 space-y-0.5 font-semibold text-slate-800">
              <p>GSTIN: {clientGstin}</p>
              <p>PAN: {clientPan}</p>
              <p className="text-[9px] text-slate-500 font-normal">
                Project: {app.projectName || "Overseas Placement"} &bull; Ref: {app.id}
              </p>
            </div>
          </div>
        </div>

        {/* 3. ITEM & DESCRIPTION TABLE */}
        <div className="border border-slate-900 overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-50 text-slate-800 font-bold text-center">
                <th className="py-1 px-1.5 border-r border-slate-900 w-10">SNO</th>
                <th className="py-1 px-2 border-r border-slate-900 text-left">Item & Description</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-16">SAC</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-10">Qty</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-12">GST%</th>
                <th className="py-1 px-2 border-r border-slate-900 text-right w-24">Rate</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-12">Disc.</th>
                <th className="py-1 px-2 text-right w-28">Gross Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-2 px-1.5 border-r border-slate-900 text-center font-semibold">1</td>
                <td className="py-2 px-2 border-r border-slate-900 font-medium">
                  Overseas Recruitment Consultancy
                </td>
                <td className="py-2 px-1.5 border-r border-slate-900 text-center">998519</td>
                <td className="py-2 px-1.5 border-r border-slate-900 text-center font-semibold">1</td>
                <td className="py-2 px-1.5 border-r border-slate-900 text-center font-medium">18%</td>
                <td className="py-2 px-2 border-r border-slate-900 text-right font-semibold">
                  ₹ {totalPlanAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-1.5 border-r border-slate-900 text-center"></td>
                <td className="py-2 px-2 text-right font-bold">
                  ₹ {totalPlanAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Total Amount Payable Row */}
              <tr className="border-b border-slate-900 font-bold bg-slate-50/50">
                <td colSpan={7} className="py-1.5 px-3 text-right border-r border-slate-900">
                  Total Amount Payable
                </td>
                <td className="py-1.5 px-2 text-right font-black">
                  ₹ {totalPlanAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Amount in words row */}
              <tr className="text-[10px]">
                <td colSpan={8} className="py-1.5 px-3">
                  <span className="text-slate-600">Amount (In words): </span>
                  <strong className="text-slate-950 font-black ml-4">
                    {numberToWords(totalPlanAmount)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. PAYMENT DETAILS TABLE */}
        <div className="border border-slate-900 overflow-x-auto">
          <div className="bg-slate-50 border-b border-slate-900 py-0.5 text-center font-bold text-[10px] uppercase text-slate-800">
            Payment Details
          </div>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-800 font-bold text-center">
                <th className="py-1 px-1.5 border-r border-slate-900 w-10">SNO</th>
                <th className="py-1 px-2 border-r border-slate-900 text-left">Desc.</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-20">Date</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-14">Mode</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-14">GST</th>
                <th className="py-1 px-2 border-r border-slate-900 text-right w-24">Net Amount</th>
                <th className="py-1 px-2 text-right w-28">Gross Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-1.5 border-r border-slate-900 text-center font-semibold">1</td>
                <td className="py-1.5 px-2 border-r border-slate-900 font-medium">
                  Payments Received by the company
                </td>
                <td className="py-1.5 px-1.5 border-r border-slate-900 text-center">{formattedShortDate}</td>
                <td className="py-1.5 px-1.5 border-r border-slate-900 text-center">A/c</td>
                <td className="py-1.5 px-1.5 border-r border-slate-900 text-center font-medium">0%</td>
                <td className="py-1.5 px-2 border-r border-slate-900 text-right font-semibold">
                  ₹ {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 px-2 text-right font-bold">
                  ₹ {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Gross Amount Summary rows on the right */}
              <tr className="border-b border-slate-900 text-[10px]">
                <td colSpan={5} className="py-1 px-3 border-r border-slate-900"></td>
                <td className="py-1 px-2 text-right font-bold border-r border-slate-900">
                  Gross Amount Received
                </td>
                <td className="py-1 px-2 text-right font-bold">
                  ₹ {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-900 text-[10px]">
                <td colSpan={5} className="py-1 px-3 border-r border-slate-900"></td>
                <td className="py-1 px-2 text-right font-bold text-red-600 border-r border-slate-900">
                  Gross Amount Due
                </td>
                <td className="py-1 px-2 text-right font-black text-red-600">
                  ₹ {dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Words row for Received and Due */}
              <tr className="text-[10px] border-b border-slate-200">
                <td colSpan={8} className="py-1 px-3">
                  <span className="text-slate-600">Amount Recvd. (In words): </span>
                  <strong className="text-slate-950 font-bold ml-3">
                    {numberToWords(paidAmount)}
                  </strong>
                </td>
              </tr>
              <tr className="text-[10px]">
                <td colSpan={8} className="py-1 px-3">
                  <span className="text-slate-600">Amount Due (In words): </span>
                  <strong className="text-slate-950 font-bold ml-6">
                    {numberToWords(dueAmount)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. TAX DETAILS TABLE */}
        <div className="border border-slate-900 overflow-x-auto">
          <div className="bg-slate-50 border-b border-slate-900 py-0.5 text-center font-bold text-[10px] uppercase text-slate-800">
            Tax Details
          </div>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-800 font-bold text-center">
                <th className="py-1 px-1.5 border-r border-slate-900 w-10">SNO</th>
                <th className="py-1 px-2 border-r border-slate-900 text-right">Taxable value/Net Amount</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-16">SAC</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-12">GST %</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-16">IGST</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-16">CGST</th>
                <th className="py-1 px-1.5 border-r border-slate-900 w-16">SGST</th>
                <th className="py-1 px-2 text-right w-24">Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900 text-center">
                <td className="py-1.5 px-1.5 border-r border-slate-900 font-semibold">1</td>
                <td className="py-1.5 px-2 border-r border-slate-900 text-right font-medium">
                  ₹ {paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 px-1.5 border-r border-slate-900">998519</td>
                <td className="py-1.5 px-1.5 border-r border-slate-900">0%</td>
                <td className="py-1.5 px-1.5 border-r border-slate-900">₹ -</td>
                <td className="py-1.5 px-1.5 border-r border-slate-900">₹ -</td>
                <td className="py-1.5 px-1.5 border-r border-slate-900">₹ -</td>
                <td className="py-1.5 px-2 text-right">₹ -</td>
              </tr>
              {/* Total Tax Amount row */}
              <tr className="border-b border-slate-900 font-bold">
                <td colSpan={4} className="py-1 px-3 text-right border-r border-slate-900">
                  Total Tax Amount
                </td>
                <td className="py-1 px-1.5 border-r border-slate-900 text-center">₹ -</td>
                <td className="py-1 px-1.5 border-r border-slate-900 text-center">₹ -</td>
                <td className="py-1 px-1.5 border-r border-slate-900 text-center">₹ -</td>
                <td className="py-1 px-2 text-right">₹ -</td>
              </tr>
              <tr className="text-[10px]">
                <td colSpan={8} className="py-1.5 px-3">
                  <span className="text-slate-600">Total Tax Amount (In words): </span>
                  <strong className="text-slate-950 ml-2">Zero Rupees Only</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. BANK DETAILS & SIGNATORY (2 Columns with Border) */}
        <div className="border border-slate-900 grid grid-cols-1 md:grid-cols-2">
          {/* Left: Bank Details */}
          <div className="p-3 border-b md:border-b-0 md:border-r border-slate-900 text-[10px] space-y-1">
            <div className="border-b border-slate-300 pb-1 mb-1 font-bold uppercase tracking-wider text-slate-700 text-[9px] text-center">
              Bank Details
            </div>
            <div className="space-y-0.5 text-slate-800">
              <p>
                <span className="text-slate-600 inline-block w-28">Account Holder</span>
                <strong className="text-slate-950">:Immigo Educare LLP</strong>
              </p>
              <p>
                <span className="text-slate-600 inline-block w-28">Account Number</span>
                <strong className="text-slate-950 font-mono">:925020043404157</strong>
              </p>
              <p>
                <span className="text-slate-600 inline-block w-28">IFSC</span>
                <strong className="text-slate-950 font-mono">:UTIB0004491</strong>
              </p>
              <p>
                <span className="text-slate-600 inline-block w-28">Bank & Branch</span>
                <strong className="text-slate-950">:Axis Bank, Sector - 45, Noida</strong>
              </p>
              <p>
                <span className="text-slate-600 inline-block w-28">SWIFT Code</span>
                <strong className="text-slate-950">:</strong>
              </p>
              <p>
                <span className="text-slate-600 inline-block w-28">PAN No.</span>
                <strong className="text-slate-950 font-mono">:AALFI5039G</strong>
              </p>
            </div>
          </div>

          {/* Right: Authorised Signatory with Digital Stamp & Signature */}
          <div className="p-3 flex flex-col justify-between text-right text-[10px]">
            <div className="font-bold uppercase tracking-wider text-slate-800 text-[9px] text-right">
              For Immigo Educare LLP
            </div>

            {/* Official Stamp & Signature Graphic matching the PDF */}
            <div className="py-2 flex items-center justify-end relative">
              {/* Digital Stamp Simulation */}
              <div className="w-32 h-16 border-2 border-dashed border-blue-600/70 rounded-full flex flex-col items-center justify-center p-1 text-blue-700 rotate-[-4deg] opacity-85 select-none pointer-events-none">
                <span className="text-[8px] font-black tracking-widest uppercase">
                  IMMIGO EDUCARE LLP
                </span>
                <svg className="w-20 h-6 text-blue-800 my-[-2px]" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10,20 Q25,5 35,22 T55,8 T75,24 T95,12" strokeLinecap="round" />
                </svg>
                <span className="text-[7px] font-bold uppercase tracking-wider">
                  DESIGNATED PARTNER
                </span>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-1 text-center sm:text-right">
              <span className="font-bold text-slate-950 uppercase text-[9px]">
                Authorised Signatory
              </span>
            </div>
          </div>
        </div>

        {/* 7. BOTTOM THANK YOU NOTE */}
        <div className="text-center pt-2">
          <p className="text-xs font-serif italic text-slate-800 tracking-wide">
            Thanks for your business
          </p>
        </div>

      </div>
    </div>
  );
}
