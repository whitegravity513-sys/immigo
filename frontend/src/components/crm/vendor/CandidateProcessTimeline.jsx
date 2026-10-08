import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, Lock, Check, X, IndianRupee, ShieldCheck } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function CandidateProcessTimeline({ application, isAdmin = false, onUpdate }) {
  const [activeStageForm, setActiveStageForm] = useState(null); // { mId, sId }
  const [stageRemark, setStageRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const [paymentAction, setPaymentAction] = useState(null); // { mId, action: 'Approve' | 'Reject' | 'Submit' }
  const [paymentRemark, setPaymentRemark] = useState("");
  
  // Detailed vendor payment form
  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    method: "Bank Transfer",
    txnId: "",
    proofUrl: "",
    remark: ""
  });

  if (!application || !application.processMilestones) {
    return <div className="text-sm text-slate-500 p-4">No processing timeline available.</div>;
  }

  const handleCompleteStage = async (mId, sId) => {
    if (!stageRemark) return alert("Please enter a remark.");
    setLoading(true);
    try {
      await crmVendorService.completeStage(application.id, mId, sId, stageRemark, isAdmin ? "Admin" : "Vendor");
      if (onUpdate) onUpdate();
      setActiveStageForm(null);
      setStageRemark("");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (mId, action) => {
    setLoading(true);
    try {
      if (action === "Submit") {
        // Serialize form data into the remark or pass to backend
        const payload = `[${vendorPaymentForm.method}] TXN: ${vendorPaymentForm.txnId} | Date: ${vendorPaymentForm.date} | Remark: ${vendorPaymentForm.remark}`;
        await crmVendorService.submitMilestonePayment(application.id, mId, payload); 
      } else if (action === "Approve") {
        await crmVendorService.approveMilestonePayment(application.id, mId, isAdmin ? "Admin" : "Vendor", paymentRemark);
      } else if (action === "Reject") {
        await crmVendorService.rejectMilestonePayment(application.id, mId, paymentRemark);
      }

      if (onUpdate) onUpdate();
      setPaymentAction(null);
      setPaymentRemark("");
      setVendorPaymentForm({ date: new Date().toISOString().split('T')[0], method: "Bank Transfer", txnId: "", proofUrl: "", remark: "" });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (mId, rawAmount) => {
    try {
      setLoading(true);

      let parsedAmount = 10000;
      if (typeof rawAmount === "number" && !isNaN(rawAmount) && rawAmount > 0) {
        parsedAmount = rawAmount;
      } else if (typeof rawAmount === "string") {
        const cleaned = parseFloat(rawAmount.replace(/[^0-9.]/g, ""));
        if (!isNaN(cleaned) && cleaned > 0) {
          parsedAmount = cleaned;
        }
      }

      const res = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });
      const orderData = await res.json();

      if (!orderData.success) {
        throw new Error(orderData.message);
      }

      const options = {
        key: "rzp_test_TlPlO103C4S5Jl",
        amount: orderData.order.amount,
        currency: "INR",
        name: "ImmiGo Recruitment",
        description: "Milestone Payment",
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("http://localhost:5000/api/payments/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const payload = `[Razorpay] TXN: ${response.razorpay_payment_id} | Date: ${new Date().toISOString().split('T')[0]} | Remark: Paid Online via Razorpay`;
              await crmVendorService.submitMilestonePayment(application.id, mId, payload);
              if (onUpdate) onUpdate();
              alert("Payment successful!");
            } else {
              alert("Payment verification failed.");
            }
          } catch(e) {
            alert("Error verifying payment");
          }
        },
        theme: { color: "#4f46e5" },
      };

      const loadRazorpay = () => {
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
        setLoading(false);
      };

      if (window.Razorpay) {
        loadRazorpay();
      } else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        script.onload = loadRazorpay;
        script.onerror = () => {
          alert("Failed to load Razorpay SDK");
          setLoading(false);
        };
      }
    } catch(err) {
      alert("Razorpay error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {application.processMilestones.map((milestone, index) => {
        const isCompleted = milestone.status === "Completed";
        const isLocked = milestone.status === "Locked";
        const isActive = milestone.status === "Active" || milestone.status === "Payment Required";
        
        // Hide completed milestones for Admin to focus on active ones
        if (isAdmin && isCompleted) return null;
        
        return (
          <div 
            key={milestone.id} 
            className={`border rounded-xl p-4 transition-all ${
              isCompleted ? "border-emerald-200 bg-emerald-50/30" :
              isActive ? "border-indigo-300 bg-white shadow-sm ring-1 ring-indigo-100" :
              "border-slate-200 bg-slate-50 opacity-75"
            }`}
          >
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                   isLocked ? <Lock className="w-4 h-4 text-slate-400" /> :
                   <Circle className="w-4 h-4 text-indigo-600 fill-indigo-600" />}
                  <span className={isCompleted ? "text-emerald-900" : isLocked ? "text-slate-500" : "text-indigo-900"}>
                    MILESTONE {index + 1}: {milestone.name}
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  {milestone.paymentAmount?.toLocaleString() || "0"}
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                  milestone.paymentStatus === "Approved" ? "bg-emerald-100 text-emerald-700" :
                  milestone.paymentStatus === "Rejected" ? "bg-rose-100 text-rose-700" :
                  milestone.paymentStatus === "Submitted" ? "bg-amber-100 text-amber-700" :
                  milestone.paymentStatus === "Not Required" ? "bg-slate-100 text-slate-500" :
                  "bg-indigo-100 text-indigo-700"
                }`}>
                  {milestone.paymentStatus === "Not Required" ? "No Payment Required" : `Payment ${milestone.paymentStatus}`}
                </div>
              </div>
            </div>

            <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
              {milestone.stages.map((stage, sIdx) => {
                const sCompleted = stage.status === "Completed";
                const sInProgress = stage.status === "In Progress";
                const sLocked = stage.status === "Locked";
                
                const isFormOpen = activeStageForm?.mId === milestone.id && activeStageForm?.sId === stage.id;

                return (
                  <div key={stage.id} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${
                      sCompleted ? "bg-emerald-500 border-emerald-500" :
                      sInProgress ? "bg-white border-indigo-500 ring-4 ring-indigo-50" :
                      "bg-slate-200 border-slate-300"
                    }`} />

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {sLocked && <Lock className="w-3 h-3 text-slate-300" />}
                          <span className={`text-xs font-bold ${
                            sCompleted ? "text-slate-700" :
                            sInProgress ? "text-indigo-700" :
                            "text-slate-400"
                          }`}>
                            Stage {sIdx + 1}: {stage.name} {sInProgress && "- In Progress"}
                          </span>
                          {sCompleted && <Check className="w-3 h-3 text-emerald-500" />}
                        </div>
                        
                        {sCompleted && (
                          <div className="mt-1 space-y-1">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Completed: {stage.completedAt} by {stage.completedBy}
                            </p>
                            {stage.remark && (
                              <p className="text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                {stage.remark}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {sInProgress && !isFormOpen && isAdmin && (
                        <button
                          onClick={() => setActiveStageForm({ mId: milestone.id, sId: stage.id })}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}

                      {isFormOpen && (
                        <div className="w-full sm:w-64 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Completion Remark</label>
                          <textarea
                            value={stageRemark}
                            onChange={(e) => setStageRemark(e.target.value)}
                            placeholder="Enter notes..."
                            className="w-full text-xs border border-slate-300 rounded p-1.5 mb-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                            rows={2}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setActiveStageForm(null); setStageRemark(""); }}
                              className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={loading}
                              onClick={() => handleCompleteStage(milestone.id, stage.id)}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Section */}
            {(milestone.paymentStatus !== "Not Required" || Number(milestone.paymentAmount) > 0) && (
              <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className={`w-4 h-4 ${milestone.paymentStatus === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="text-xs font-bold text-slate-700">Payment Authorization</span>
                  </div>
                  {milestone.paymentDate && (
                    <p className="text-[10px] text-slate-500">Approved on {milestone.paymentDate} by {milestone.approvedBy}</p>
                  )}
                  {milestone.paymentRemark && (
                    <p className="text-[10px] text-slate-600 italic mt-0.5">"{milestone.paymentRemark}"</p>
                  )}
                  {milestone.paymentRef && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                      Ref: {milestone.paymentRef}
                    </p>
                  )}
                </div>

                {isAdmin && (milestone.paymentStatus === "Payment Required" || milestone.paymentStatus === "Submitted" || milestone.paymentStatus === "Pending") && !paymentAction && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentAction({ mId: milestone.id, action: "Reject" })}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setPaymentAction({ mId: milestone.id, action: "Approve" })}
                      className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Approve Payment
                    </button>
                  </div>
                )}

                {!isAdmin && (milestone.paymentStatus === "Payment Required" || milestone.paymentStatus === "Rejected" || milestone.paymentStatus === "Pending" || milestone.paymentStatus === "Due" || !milestone.paymentStatus) && !paymentAction && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentAction({ mId: milestone.id, action: "Submit" })}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Submit Offline Receipt
                    </button>
                    <button
                      onClick={() => {
                        const amt = Number(milestone.paymentAmount || milestone.amount || 10000);
                        handleRazorpayPayment(milestone.id, amt);
                      }}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-indigo-600 border border-transparent text-white hover:bg-indigo-700 text-[10px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
                    >
                      <IndianRupee size={12} />
                      <span>Pay Online via Razorpay</span>
                    </button>
                  </div>
                )}

                {paymentAction?.mId === milestone.id && (
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg w-full sm:max-w-md mt-4 sm:mt-0">
                    {paymentAction.action === "Submit" ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">Submit Payment Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Date</label>
                            <input type="date" value={vendorPaymentForm.date} onChange={e => setVendorPaymentForm({...vendorPaymentForm, date: e.target.value})} className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
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
                        onClick={() => { setPaymentAction(null); setPaymentRemark(""); }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold px-3 py-1.5"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handlePaymentAction(milestone.id, paymentAction.action)}
                        className={`text-[11px] font-bold px-4 py-1.5 rounded-lg text-white transition-colors ${
                          paymentAction.action === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                          paymentAction.action === 'Reject' ? 'bg-rose-600 hover:bg-rose-700' :
                          'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        Confirm {paymentAction.action}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
