import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, Printer, ArrowLeft, Download, IndianRupee } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

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
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600">Generating Invoice Receipt...</p>
        </div>
      </div>
    );
  }

  if (!application || !milestone) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm">
          <h2 className="text-base font-black text-slate-900 mb-2">Receipt Not Found</h2>
          <p className="text-xs text-slate-500 mb-4">The requested milestone payment receipt could not be located.</p>
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
  const receiptNo = `REC-${(app.id || "APP").replace(/[^0-9]/g, "").slice(-4) || "8821"}-${(milestone.id || "M1").toUpperCase()}`;
  const currentDate = milestone.paymentDate || new Date().toISOString().split("T")[0];
  const paidAmount = Number(milestone.paymentAmount || milestone.amount || 0);

  // Extract payment method and transaction ID
  let method = "Online Transfer";
  let txnId = milestone.paymentRef || "N/A";

  if (milestone.paymentRef) {
    if (milestone.paymentRef.includes("[Razorpay]")) {
      method = "Razorpay Online";
      const match = milestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (match) txnId = match[1].trim();
    } else if (milestone.paymentRef.includes("[UPI]")) {
      method = "UPI Transfer";
      const match = milestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (match) txnId = match[1].trim();
    } else if (milestone.paymentRef.includes("[Bank Transfer]")) {
      method = "Bank Transfer / NEFT";
      const match = milestone.paymentRef.match(/TXN:\s*([^|]+)/);
      if (match) txnId = match[1].trim();
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4 font-sans antialiased text-slate-800 print:bg-white print:p-0">
      {/* Top Floating Action Bar (Hidden when printing) */}
      <div className="max-w-md mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition"
        >
          <ArrowLeft size={14} />
          <span>Close Window</span>
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-xl shadow-xs cursor-pointer transition"
        >
          <Printer size={14} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Main Swiggy / Zomato Style Bill Receipt Card */}
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:max-w-full">
        {/* Receipt Header Banner */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 pb-5 text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-inner">
            <ShieldCheck size={26} className="text-emerald-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block mb-0.5">
            Official Milestone Payment Receipt
          </span>
          <h1 className="text-xl font-black tracking-tight text-white">
            ImmiGo Global Placement
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Overseas Recruitment & Manpower Services
          </p>

          <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/15">
            <span>Receipt #{receiptNo}</span>
            <span>•</span>
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Perforated / Dashed Tear-Off Separator */}
        <div className="relative bg-white py-2">
          <div className="border-t-2 border-dashed border-slate-200 mx-5"></div>
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 print:hidden"></div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 print:hidden"></div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 pt-2 space-y-4 text-xs">
          {/* Candidate & Project Info */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate</span>
                <span className="text-sm font-black text-slate-900 block">{app.candidateName || "Candidate"}</span>
                <span className="text-[11px] text-slate-500 font-medium">Trade: {app.position || "General Trade"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project</span>
                <span className="text-xs font-bold text-slate-800 block">{app.projectName || "Client Project"}</span>
                <span className="text-[10px] text-indigo-600 font-semibold">{app.country || "Overseas"}</span>
              </div>
            </div>
          </div>

          {/* Paid Milestone Item */}
          <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-4">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
              Payment Milestone Installment
            </span>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-xs sm:text-sm">{milestone.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Recruitment milestone fee installment</p>
              </div>
              <span className="text-base font-black text-slate-900">
                ₹{paidAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Itemized Calculation Breakdown (Swiggy / Zomato Receipt Style) */}
          <div className="space-y-2 pt-1 border-b border-slate-100 pb-3 text-slate-600">
            <div className="flex justify-between text-xs">
              <span>Milestone Installment Amount</span>
              <span className="font-semibold text-slate-800">₹{paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Document Verification & Processing</span>
              <span className="text-emerald-600 font-semibold">FREE / Included</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Taxes & Platform Convenience Fee</span>
              <span className="text-emerald-600 font-semibold">₹0</span>
            </div>
          </div>

          {/* Total Amount Paid */}
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-black text-slate-900">Total Amount Paid</span>
            <span className="text-lg font-black text-indigo-700">₹{paidAmount.toLocaleString()}</span>
          </div>

          {/* Payment & Verification Seal */}
          <div className="pt-2">
            {isApproved ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wide text-emerald-800 block">
                    Payment Verified & Received
                  </span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Paid via <strong>{method}</strong> (Ref: <code className="font-mono text-[10px] bg-emerald-100 px-1 py-0.5 rounded">{txnId}</code>)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800">
                Payment status: <strong>{milestone.paymentStatus || "Submitted"}</strong>. Verification in progress.
              </div>
            )}
          </div>

          {/* Security & Verification Disclaimer */}
          <div className="pt-2 text-center text-[10px] text-slate-400">
            <p>This is a computer-generated official receipt issued by ImmiGo Overseas Placement.</p>
            <p className="mt-0.5">Generated securely on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Print Button Footer for Mobile */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center print:hidden">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
