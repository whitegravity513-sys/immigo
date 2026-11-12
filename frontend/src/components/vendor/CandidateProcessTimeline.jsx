import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Check,
  IndianRupee,
  ShieldCheck,
  Receipt,
  Upload,
  Download,
  FileCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import refundService, { isAppRefundLocked, getAppRefundStatus } from "../../services/refundService.js";
import { apiClient } from "../../services/apiClient.js";
import { useAuth } from "../../context/useAuth.js";
import DateInput from "../common/DateInput.jsx";

const getNowTimestamp = () => Date.now();
const getTodayDateStr = () => new Date().toISOString().split("T")[0];

export default function CandidateProcessTimeline({
  application,
  project = null,
  refunds = null,
  isAdmin = false,
  canManageStages: canManageStagesProp,
  onUpdate,
}) {
  const { user, role: authRole, isSuperAdmin: authIsSuperAdmin, isVendorHR } = useAuth();
  const normalizedRole = String(user?.role || authRole || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const isRestrictedPortalUser = ["VENDOR", "CANDIDATE", "EMPLOYEE"].includes(normalizedRole);
  const canManageStages = Boolean(
    (canManageStagesProp !== undefined ? canManageStagesProp : isAdmin) && !isRestrictedPortalUser
  );
  const actorLabel = isVendorHR
    ? "Vendor HR"
    : authIsSuperAdmin
    ? "Super Admin"
    : "Admin";

  const [activeStageForm, setActiveStageForm] = useState(null);
  const [stageRemark, setStageRemark] = useState("");
  const [stageNextStatus, setStageNextStatus] = useState("Completed");
  const [loading, setLoading] = useState(false);

  const [paymentAction, setPaymentAction] = useState(null);
  const [paymentRemark, setPaymentRemark] = useState("");
  const [syncedRefunds, setSyncedRefunds] = useState([]);

  useEffect(() => {
    if (refunds !== null) return;
    let active = true;
    const sync = () => {
      refundService
        .getAllRefunds()
        .then((res) => {
          if (active && Array.isArray(res)) setSyncedRefunds(res);
        })
        .catch(() => {});
    };
    sync();
    window.addEventListener("immigo:refund-update", sync);
    window.addEventListener("storage", sync);
    return () => {
      active = false;
      window.removeEventListener("immigo:refund-update", sync);
      window.removeEventListener("storage", sync);
    };
  }, [refunds]);

  const effectiveRefunds = refunds !== null ? refunds : syncedRefunds;
  const refundLocked = isAppRefundLocked(application, effectiveRefunds);
  const refundStatus = getAppRefundStatus(application, effectiveRefunds);

  const [vendorPaymentForm, setVendorPaymentForm] = useState(() => ({
    date: getTodayDateStr(),
    method: "Bank Transfer",
    txnId: "",
    proofUrl: "",
    remark: "",
  }));

  const appId = application?.id || application?.applicationId || application?._id;

  const syncedFromProject =
    !application?.milestonesOverridden && crmVendorService.syncAppMilestonesWithProject
      ? crmVendorService.syncAppMilestonesWithProject(
          application,
          project ? [project] : null
        )
      : [];

  const rawMilestones =
    Array.isArray(syncedFromProject) && syncedFromProject.length > 0
      ? syncedFromProject
      : Array.isArray(application?.processMilestones) && application.processMilestones.length > 0
      ? application.processMilestones
      : Array.isArray(application?.paymentPlan?.milestones) && application.paymentPlan.milestones.length > 0
      ? application.paymentPlan.milestones
      : [];

  const processMilestones = (rawMilestones || []).map((m, mIdx) => {
    const fallbackStageName = `${m.name || `Milestone ${mIdx + 1}`} Verification`;
    const stages =
      Array.isArray(m.stages) && m.stages.length > 0
        ? m.stages
        : [
            {
              id: `s${mIdx}_1`,
              name: fallbackStageName,
              status: m.status === "Completed" ? "Completed" : "Pending",
            },
          ];
    return {
      ...m,
      paymentAmount: Number(m.paymentAmount ?? m.amount ?? 0),
      amount: Number(m.paymentAmount ?? m.amount ?? 0),
      stages,
    };
  });

  const handleVisaUpload = async (mId, sId, file) => {
    if (refundLocked) {
      return alert(`Processing is frozen due to an active refund claim (${refundStatus || "Pending Admin Approval"}). Please await Admin review before continuing.`);
    }
    if (!canManageStages) {
      return alert("Only Admin, Super Admin, or Vendor HR can upload visa documents.");
    }
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target.result;
          await crmVendorService.uploadStageVisa(appId, mId, sId, dataUrl, file.name);
          if (onUpdate) onUpdate();
          alert("Visa document uploaded successfully!");
        } catch (uploadErr) {
          alert("Failed to save visa: " + uploadErr.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Failed to upload visa: " + err.message);
      setLoading(false);
    }
  };

  const handleUpdateStageStatus = async (mId, sId, targetStatus = stageNextStatus) => {
    if (refundLocked) {
      return alert(`Processing is frozen due to an active refund claim (${refundStatus || "Pending Admin Approval"}). Please await Admin review before continuing.`);
    }
    if (!canManageStages) {
      return alert("Only Admin, Super Admin, or Vendor HR can update stages.");
    }
    const cleanRemark = (stageRemark || "").trim();
    setLoading(true);
    try {
      const appSnapshot = { ...application, processMilestones };
      const updater = crmVendorService.updateStageStatus || crmVendorService.completeStage;
      if (crmVendorService.updateStageStatus) {
        await crmVendorService.updateStageStatus(
          appId,
          mId,
          sId,
          targetStatus,
          cleanRemark,
          actorLabel,
          appSnapshot
        );
      } else {
        await updater(appId, mId, sId, cleanRemark, actorLabel, appSnapshot);
      }
      if (onUpdate) onUpdate();
      setActiveStageForm(null);
      setStageRemark("");
      setStageNextStatus("Completed");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (mId, action) => {
    if (refundLocked) {
      return alert(`Payment processing is frozen due to an active refund claim (${refundStatus || "Pending Admin Approval"}). Please await Admin review before continuing.`);
    }
    setLoading(true);
    try {
      const appSnapshot = { ...application, processMilestones };
      if (action === "Submit") {
        const targetM = (processMilestones || []).find((m) => m.id === mId);
        const mAmount = Number(targetM?.paymentAmount ?? targetM?.amount ?? 0);

        const payload = `[${vendorPaymentForm.method}] Amount: ₹${mAmount.toLocaleString()} | TXN: ${vendorPaymentForm.txnId} | Date: ${vendorPaymentForm.date} | Remark: ${vendorPaymentForm.remark}`;
        await crmVendorService.submitMilestonePayment(appId, mId, payload, appSnapshot);
        alert("Offline payment details submitted successfully! Pending Admin verification.");
      } else if (action === "Approve" && canManageStages) {
        await crmVendorService.approveMilestonePayment(appId, mId, actorLabel, paymentRemark, appSnapshot);
        alert("Milestone payment approved! Candidate stages are now unlocked.");
      } else if (action === "Reject" && canManageStages) {
        await crmVendorService.rejectMilestonePayment(appId, mId, paymentRemark);
        alert("Milestone payment rejected.");
      }

      if (onUpdate) onUpdate();
      setPaymentAction(null);
      setPaymentRemark("");
      setVendorPaymentForm({ date: getTodayDateStr(), method: "Bank Transfer", txnId: "", proofUrl: "", remark: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (mId, rawAmount) => {
    if (refundLocked) {
      return alert(`Payment processing is frozen due to an active refund claim (${refundStatus || "Pending Admin Approval"}). Please await Admin review before continuing.`);
    }
    try {
      setLoading(true);

      const targetM = (processMilestones || []).find((m) => m.id === mId);
      const parsedAmount = Number(rawAmount ?? targetM?.paymentAmount ?? targetM?.amount ?? 0);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setLoading(false);
        alert("Milestone payment amount must be greater than zero before initiating online payment.");
        return;
      }

      let orderData = null;
      let razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
      try {
        const orderRes = await apiClient.post("/payments/create-order", {
          applicationId: appId,
          milestoneId: mId,
          amount: parsedAmount,
          receipt: `rcpt_${appId}_${mId}_${getNowTimestamp()}`,
        });
        orderData = orderRes?.data?.order || null;
        if (orderRes?.data?.keyId) {
          razorpayKey = orderRes.data.keyId;
        }
      } catch (apiErr) {
        setLoading(false);
        alert(apiErr?.response?.data?.message || apiErr?.message || "Unable to initialize secure Razorpay order.");
        return;
      }

      if (!orderData?.id || !razorpayKey) {
        setLoading(false);
        alert("Payment gateway is not configured on the server. Please use manual bank transfer or contact admin.");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "ImmiGo Recruitment & Operations",
        description: `Milestone Payment: ${targetM?.name || "Processing Stage"}`,
        order_id: orderData.id,
        prefill: {
          name: application.candidateName || "Candidate Sponsor",
          email: "support@immigo.com",
          contact: application.phone || application.candidatePhone || "9876543210",
        },
        handler: async function (response) {
          try {
            if (!response.razorpay_payment_id || !response.razorpay_signature) {
              throw new Error("Incomplete payment gateway response received.");
            }
            const resolvedOrderId = response.razorpay_order_id || orderData.id;
            await apiClient.post("/payments/verify-payment", {
              razorpay_order_id: resolvedOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              applicationId: appId,
              milestoneId: mId,
            });

            const payload = `[Razorpay] TXN: ${response.razorpay_payment_id} | Date: ${getTodayDateStr()} | Remark: Paid Online via Razorpay`;
            await crmVendorService.submitMilestonePayment(
              appId,
              mId,
              payload,
              { ...application, processMilestones },
              {
                milestoneId: mId,
                razorpay_order_id: resolvedOrderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );
            if (onUpdate) onUpdate();
            alert("Payment successful! Opening your official invoice receipt in a new tab...");
            window.open(`/invoice/${appId}/${mId}`, "_blank");
          } catch (e) {
            alert(e?.response?.data?.message || e?.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: { color: "#4f46e5" },
      };

      const executeCheckout = () => {
        if (!window.Razorpay) {
          alert("Razorpay Checkout SDK could not be loaded. Please disable blockers or try again.");
          setLoading(false);
          return;
        }

        try {
          const rzpInstance = new window.Razorpay(options);
          rzpInstance.on("payment.failed", (resp) => {
            alert(resp?.error?.description || "Transaction failed or cancelled.");
            setLoading(false);
          });
          rzpInstance.open();
        } catch (rzpErr) {
          console.error("Razorpay instance error:", rzpErr);
          alert("Razorpay modal error: " + rzpErr.message);
          setLoading(false);
        }
      };

      if (window.Razorpay) {
        executeCheckout();
      } else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        script.onload = executeCheckout;
        script.onerror = () => {
          alert("Failed to load Razorpay SDK. Please check your internet connection.");
          setLoading(false);
        };
      }
    } catch (err) {
      alert("Razorpay error: " + err.message);
      setLoading(false);
    }
  };

  if (!application || processMilestones.length === 0) {
    return (
      <div className="text-xs text-slate-500 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        No processing timeline available for this candidate.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {refundLocked && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-rose-950">
              Payment &amp; Processing Frozen — Refund Claim ({refundStatus || "Pending Admin Approval"})
            </div>
            <p className="text-rose-800 leading-relaxed">
              {refundStatus === "Pending Admin Approval"
                ? "All milestone payments, payment approvals, visa uploads, and stage progression are paused until Admin reviews and responds to this refund request."
                : "Admin has processed this refund claim. Payment and stage progression on this project remain closed; proceed with candidate reassignment if applicable."}
            </p>
          </div>
        </div>
      )}
      {processMilestones.map((milestone, index) => {

        const prevMilestone = index > 0 ? processMilestones[index - 1] : null;
        const isPrevCompleted = index === 0 ||
          prevMilestone?.status === "Completed" ||
          (Array.isArray(prevMilestone?.stages) && prevMilestone.stages.length > 0 && prevMilestone.stages.every(s => s.status === "Completed"));

        const isMilestoneStagesCompleted = Array.isArray(milestone.stages) && milestone.stages.length > 0 && milestone.stages.every(s => s.status === "Completed");
        const isCompleted = milestone.status === "Completed" || isMilestoneStagesCompleted;
        const isLocked = !isPrevCompleted;
        const amt = Number(milestone.paymentAmount ?? milestone.amount ?? 0);
        const isApproved =
          amt > 0
            ? milestone.paymentStatus === "Approved" ||
              milestone.status === "Paid" ||
              milestone.status === "Completed"
            : milestone.paymentStatus === "Approved";
        const isPaymentSubmitted = milestone.paymentStatus === "Submitted";
        const requiresPayment = amt > 0 && !isApproved;
        const isActive = !isLocked && !isCompleted;

        return (
          <div 
            key={milestone.id} 
            className={`border rounded-xl p-4 transition-all ${
              isCompleted ? "border-blue-300/80 bg-gradient-to-br from-blue-50/90 via-slate-50/80 to-blue-50/60 shadow-2xs" :
              !isLocked && (isActive || requiresPayment) ? "border-blue-400 bg-white shadow-xs ring-1 ring-blue-200" :
              "border-slate-200 bg-slate-50 opacity-75"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> :
                   isLocked ? <Lock className="w-4 h-4 text-slate-400" /> :
                   <Circle className="w-4 h-4 text-blue-600 fill-blue-600" />}
                  <span className={isCompleted ? "text-slate-900 font-extrabold" : isLocked ? "text-slate-500" : "text-blue-950 font-extrabold"}>
                    MILESTONE {index + 1}: {milestone.name}
                  </span>
                </h3>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  {amt.toLocaleString()}
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                  isLocked ? "bg-slate-200 text-slate-600" :
                  isCompleted ? "bg-blue-100 text-blue-950 border border-blue-200" :
                  isApproved ? "bg-blue-100/90 text-blue-900 border border-blue-200" :
                  isPaymentSubmitted ? "bg-amber-100 text-amber-800" :
                  requiresPayment ? "bg-blue-50 text-blue-700 border border-blue-200" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {isLocked ? "Locked" :
                   isCompleted ? "Completed" :
                   isApproved ? "Payment Approved" :
                   isPaymentSubmitted ? "Payment Submitted (Pending)" :
                   requiresPayment ? "Payment Required" :
                   "No Payment Required"}
                </div>
              </div>
            </div>

            {isLocked && (
              <div className="mb-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                <Lock size={15} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Milestone {index + 1} is Locked:</strong> Payment and processing will unlock automatically once all stages of Milestone {index} are completed.
                </span>
              </div>
            )}

            {!isLocked && requiresPayment && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 shadow-2xs">
                <Lock size={15} className="text-amber-600 shrink-0" />
                <span>
                  {isPaymentSubmitted
                    ? "Payment submitted by vendor (Pending Admin Approval). Processing stages below will unlock once Admin approves received payment."
                    : milestone.paymentStatus === "Rejected"
                    ? `Payment receipt rejected${milestone.paymentRemark ? `: ${milestone.paymentRemark}` : ""}. Please re-submit payment proof or pay online to unlock stages below.`
                    : "Milestone payment required. Complete payment first so Admin can approve receipt and unlock processing stages below."}
                </span>
              </div>
            )}

            {!isLocked && (amt > 0 || isApproved || isPaymentSubmitted || milestone.paymentStatus === "Rejected") && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className={`w-4 h-4 ${isApproved ? "text-emerald-600" : milestone.paymentStatus === "Rejected" ? "text-rose-600" : "text-amber-600"}`} />
                    <span className="text-xs font-bold text-slate-800">Milestone Payment & Receipt</span>
                  </div>
                  {milestone.paymentDate && (
                    <p className="text-[10px] text-slate-500">
                      Approved on {milestone.paymentDate} by {milestone.approvedBy || "Admin"}
                    </p>
                  )}
                  {milestone.paymentRemark && (
                    <p className="text-[10px] text-slate-600 italic mt-0.5">&quot;{milestone.paymentRemark}&quot;</p>
                  )}
                  {milestone.paymentRef && (
                    <p className="text-[10px] text-slate-600 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                      Ref: {milestone.paymentRef}
                    </p>
                  )}
                  {isApproved && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => window.open(`/invoice/${appId}/${milestone.id}`, "_blank")}
                        className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Receipt size={13} className="text-indigo-600" />
                        <span>View Invoice / Receipt</span>
                      </button>
                    </div>
                  )}
                </div>

                {!refundLocked && canManageStages && (isPaymentSubmitted || requiresPayment) && !paymentAction && (
                  <div className="flex gap-2 flex-wrap">
                    {isPaymentSubmitted && (
                      <button
                        type="button"
                        onClick={() => setPaymentAction({ mId: milestone.id, action: "Reject" })}
                        className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Reject Receipt
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPaymentAction({ mId: milestone.id, action: "Approve" })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      {isPaymentSubmitted ? "Approve Received Payment" : "Verify & Approve Payment"}
                    </button>
                  </div>
                )}

                {!refundLocked && !canManageStages && isPaymentSubmitted && !paymentAction && (
                  <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    Submitted — Pending Admin Verification
                  </span>
                )}

                {!refundLocked && !canManageStages && requiresPayment && !isPaymentSubmitted && !paymentAction && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPaymentAction({ mId: milestone.id, action: "Submit" })}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Submit Offline Receipt (₹{amt.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRazorpayPayment(milestone.id, amt)}
                      disabled={loading || amt <= 0}
                      className="px-3.5 py-1.5 bg-indigo-600 border border-transparent text-white hover:bg-indigo-700 text-[10px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                    >
                      <IndianRupee size={12} />
                      <span>Pay Online ₹{amt.toLocaleString()} via Razorpay</span>
                    </button>
                  </div>
                )}

                {!refundLocked && paymentAction?.mId === milestone.id && (
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg w-full sm:max-w-md mt-4 sm:mt-0">
                    {paymentAction.action === "Submit" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="text-sm font-bold text-slate-800">Submit Payment Details</h4>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            Milestone Due: ₹{amt.toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Date</label>
                            <DateInput value={vendorPaymentForm.date} onChange={e => setVendorPaymentForm({...vendorPaymentForm, date: e.target.value})} className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none bg-white focus:border-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                            <select value={vendorPaymentForm.method} onChange={e => setVendorPaymentForm({...vendorPaymentForm, method: e.target.value})} className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500">
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="UPI">UPI</option>
                              <option value="Cheque">Cheque</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Transaction / Reference ID</label>
                          <input type="text" value={vendorPaymentForm.txnId} onChange={e => setVendorPaymentForm({...vendorPaymentForm, txnId: e.target.value})} placeholder="e.g. UTR123456789" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Proof / Screenshot</label>
                          <input type="file" accept="image/*,.pdf" className="w-full text-xs border border-slate-300 rounded p-1 outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-slate-100" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Optional Remark</label>
                          <textarea value={vendorPaymentForm.remark} onChange={e => setVendorPaymentForm({...vendorPaymentForm, remark: e.target.value})} rows={2} className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" placeholder="Any details..." />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{paymentAction.action} Remark</label>
                        <input
                          type="text"
                          value={paymentRemark}
                          onChange={(e) => setPaymentRemark(e.target.value)}
                          placeholder="Reason..."
                          className="w-full text-xs border border-slate-300 rounded p-1.5 mb-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setPaymentAction(null); setPaymentRemark(""); }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold px-3 py-1.5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handlePaymentAction(milestone.id, paymentAction.action)}
                        className={`text-[11px] font-bold px-4 py-1.5 rounded-lg text-white transition-colors cursor-pointer ${
                          paymentAction.action === "Approve" ? "bg-emerald-600 hover:bg-emerald-700" :
                          paymentAction.action === "Reject" ? "bg-rose-600 hover:bg-rose-700" :
                          "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        Confirm {paymentAction.action}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Processing Stages
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {(milestone.stages || []).filter((s) => s.status === "Completed").length}/{(milestone.stages || []).length} Completed
                </span>
              </div>
              <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
                {(milestone.stages || []).map((stage, sIdx) => {
                  const sCompleted = stage.status === "Completed";
                  const isMilestoneLocked = isLocked || requiresPayment;
                  const sInProgress = !isMilestoneLocked && stage.status === "In Progress";
                  const sStageLocked = isMilestoneLocked || stage.status === "Locked";

                  const isFormOpen = activeStageForm?.mId === milestone.id && activeStageForm?.sId === stage.id;

                  return (
                    <div key={stage.id} className="relative pl-6">
                      <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${
                        sCompleted ? "bg-blue-600 border-blue-600" :
                        sInProgress ? "bg-white border-blue-600 ring-4 ring-blue-100" :
                        "bg-slate-200 border-slate-300"
                      }`} />

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {sStageLocked && <Lock className="w-3 h-3 text-slate-300" />}
                            <span className={`text-xs font-bold ${
                              sCompleted ? "text-slate-800" :
                              sInProgress ? "text-blue-900" :
                              !isMilestoneLocked ? "text-slate-700" :
                              "text-slate-400"
                            }`}>
                              Stage {sIdx + 1}: {stage.name}
                            </span>
                            {!sStageLocked && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sCompleted
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : sInProgress
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {stage.status || "Pending"}
                              </span>
                            )}
                            {sCompleted && <Check className="w-3 h-3 text-blue-600 font-bold" />}
                          </div>

                          {(sCompleted || stage.remark || stage.updatedBy) && (
                            <div className="mt-1 space-y-1">
                              {(stage.completedAt || stage.updatedBy) && (
                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {sCompleted
                                    ? `Completed${stage.completedAt ? `: ${stage.completedAt}` : ""}${stage.completedBy ? ` by ${stage.completedBy}` : ""}`
                                    : `Updated by ${stage.updatedBy || "Authorized User"}`}
                                </p>
                              )}
                              {stage.remark && (
                                <p className="text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                  {stage.remark}
                                </p>
                              )}
                            </div>
                          )}

                          {stage.visaDocumentUrl && (
                            <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Official Visa Issued</span>
                                  <span className="text-xs font-semibold text-emerald-950">{stage.visaFileName || "Visa_Document.pdf"}</span>
                                </div>
                              </div>
                              <a
                                href={stage.visaDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={stage.visaFileName || "Candidate_Visa.pdf"}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer self-start sm:self-auto"
                              >
                                <Download size={11} />
                                <span>Download Visa</span>
                              </a>
                            </div>
                          )}

                          {!refundLocked && canManageStages && (stage.name?.toLowerCase().includes("visa") || sIdx === ((milestone.stages || []).length - 1)) && !stage.visaDocumentUrl && (
                            <div className="mt-2 p-2 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                                <Upload size={13} className="text-indigo-600" />
                                <span>Upload Official Visa Copy:</span>
                              </span>
                              <label className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-2xs">
                                <span>Select File</span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => handleVisaUpload(milestone.id, stage.id, e.target.files[0])}
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        {!refundLocked && canManageStages && !isFormOpen && !isMilestoneLocked && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const initialStageStatus = ["Pending", "In Progress", "Completed"].includes(stage.status)
                                  ? stage.status
                                  : "Completed";
                                setStageNextStatus(initialStageStatus);
                                setStageRemark(stage.remark || "");
                                setActiveStageForm({ mId: milestone.id, sId: stage.id });
                              }}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                                sCompleted
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                              }`}
                            >
                              {sCompleted ? "Update Status" : "Update Stage"}
                            </button>
                          </div>
                        )}

                        {!refundLocked && canManageStages && isFormOpen && (
                          <div className="w-full sm:w-72 bg-white border border-slate-200 p-3 rounded-lg shadow-sm space-y-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Stage Status</label>
                              <select
                                value={stageNextStatus}
                                onChange={(e) => setStageNextStatus(e.target.value)}
                                className="w-full text-xs font-semibold border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                Stage Remark (Optional)
                              </label>
                              <textarea
                                value={stageRemark}
                                onChange={(e) => setStageRemark(e.target.value)}
                                placeholder="Optional stage update notes..."
                                className="w-full text-xs border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => { setActiveStageForm(null); setStageRemark(""); }}
                                className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold px-2 py-1 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => handleUpdateStageStatus(milestone.id, stage.id, stageNextStatus)}
                                className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded transition-colors cursor-pointer"
                              >
                                Save Update
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {Array.isArray(milestone.clearanceDocuments) &&
              milestone.clearanceDocuments.filter((d) => !d.targetAudience || d.targetAudience !== "candidate").length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/90 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-bold text-[#163868] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#163868]" />
                    <span>Official Milestone Clearance Documents</span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                    {milestone.clearanceDocuments.filter((d) => !d.targetAudience || d.targetAudience !== "candidate").length} Documents Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {milestone.clearanceDocuments
                    .filter((d) => !d.targetAudience || d.targetAudience !== "candidate")
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-blue-300 transition"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded bg-blue-100 text-[#163868] flex items-center justify-center shrink-0">
                            <FileCheck size={13} />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 truncate">{doc.title}</div>
                            <div className="text-[10px] text-slate-500">
                              {doc.size || "PDF"} &bull; {doc.uploadedAt || "Uploaded"}
                            </div>
                          </div>
                        </div>

                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.fileName || `${doc.title}.pdf`}
                          className="px-2.5 py-1 bg-[#163868] hover:bg-[#1e4a82] text-white text-[10px] font-bold rounded-md flex items-center gap-1 shrink-0 transition"
                        >
                          <Download size={11} />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
