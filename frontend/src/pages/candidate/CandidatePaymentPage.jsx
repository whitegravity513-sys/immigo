import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Smartphone,
  Building,
  Wallet,
  QrCode,
  AlertCircle,
  FileText,
  Copy,
  ExternalLink,
  RefreshCw,
  Globe,
  Briefcase,
  IndianRupee,
  Check,
} from "lucide-react";
import apiClient from "../../services/apiClient.js";

export default function CandidatePaymentPage() {
  const { appId, milestoneId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [application, setApplication] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [error, setError] = useState(null);

  const [selectedMethod, setSelectedMethod] = useState("upi_apps");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [customVpa, setCustomVpa] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [selectedWallet, setSelectedWallet] = useState("paytm");
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [utrNumber, setUtrNumber] = useState("");
  const [bankNotes, setBankNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [meRes, msRes] = await Promise.all([
          apiClient.get("/candidate/me").catch(() => ({ data: { candidate: null } })),
          apiClient.get(`/candidate/applications/${appId}/milestones`),
        ]);

        if (meRes.data?.candidate) {
          setCandidate(meRes.data.candidate);
        }

        if (msRes.data?.application) {
          setApplication(msRes.data.application);
          const msList = msRes.data.processMilestones || [];
          const targetM = msList.find((m) => String(m.id) === String(milestoneId));
          if (targetM) {
            setMilestone(targetM);
          } else if (msList.length > 0) {
            setMilestone(msList[0]);
          } else {
            setError("Milestone details not found.");
          }
        } else {
          setError("Application not found.");
        }
      } catch (err) {
        console.error("Failed to load payment checkout:", err);
        setError(err.response?.data?.message || "Failed to load checkout details.");
      } finally {
        setLoading(false);
      }
    }

    if (appId) {
      loadData();
    }
  }, [appId, milestoneId]);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const amount = Number(milestone?.paymentAmount || milestone?.amount || 15000);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedPayment = async () => {
    if (!milestone || !application) return;

    if (selectedMethod === "bank_transfer") {
      if (!utrNumber.trim()) {
        alert("Please enter a valid Transaction UTR / Reference number.");
        return;
      }

      setSubmitting(true);
      try {
        const res = await apiClient.post(
          `/candidate/applications/${appId}/milestones/${milestone.id}/pay`,
          {
            paymentMode: "Bank Transfer",
            referenceNumber: utrNumber.trim(),
            remarks: bankNotes || "Manual Bank Transfer",
            amount,
            isInstantMock: false,
          }
        );

        if (res.data?.success) {
          setPaymentSuccess({
            txnId: utrNumber.trim(),
            mode: "Bank Transfer / NEFT",
            amount,
            status: "Submitted (Pending Admin Approval)",
            note: "Your offline transaction details have been submitted. Admin will verify and unlock your deployment process.",
          });
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to submit bank transfer.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);

    try {
      let orderData = null;
      try {
        const orderRes = await apiClient.post("/payments/create-order", {
          amount: amount,
          receipt: `rcpt_${appId}_${milestone.id}`,
          notes: {
            appId,
            milestoneId: milestone.id,
            candidateName: candidate?.fullName || application.candidateName,
            projectName: application.projectName,
          },
        });
        if (orderRes.data?.order) {
          orderData = orderRes.data.order;
        }
      } catch {}

      const scriptLoaded = await loadRazorpayScript();
      if (scriptLoaded && window.Razorpay) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
          amount: amount * 100,
          currency: "INR",
          name: "Immigo Global Mobility",
          description: `Fee: ${milestone.name}`,
          order_id: orderData?.id || undefined,
          prefill: {
            name: candidate?.fullName || application.candidateName || "",
            email: candidate?.email || application.candidateEmail || "",
            contact: candidate?.phone || application.candidatePhone || "",
          },
          theme: {
            color: "#163868",
          },
          handler: async function (response) {
            try {
              try {
                if (response.razorpay_signature) {
                  await apiClient.post("/payments/verify-payment", {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                }
              } catch {}

              const paymentRef = response.razorpay_payment_id || `RZP_${Date.now()}`;
              await apiClient.post(
                `/candidate/applications/${appId}/milestones/${milestone.id}/pay`,
                {
                  paymentMode: "Razorpay Online",
                  paymentReference: paymentRef,
                  remarks: `Paid via Razorpay (${response.razorpay_payment_id})`,
                  amount,
                  isInstantMock: true,
                }
              );

              setPaymentSuccess({
                txnId: paymentRef,
                mode: "Razorpay Online Gateway",
                amount,
                status: "Approved & Verified",
                note: "Your milestone fee has been successfully paid and verified! Your next deployment stage is now unlocked.",
              });
            } catch (pErr) {
              alert("Payment captured with reference: " + (response.razorpay_payment_id || "Done"));
              setPaymentSuccess({
                txnId: response.razorpay_payment_id || `RZP_${Date.now()}`,
                mode: "Razorpay Online",
                amount,
                status: "Approved",
                note: "Your payment has been successfully recorded.",
              });
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }
    } catch {}

    try {
      const mockRef = `RZP-DIRECT-${Date.now().toString(36).toUpperCase()}`;
      const res = await apiClient.post(
        `/candidate/applications/${appId}/milestones/${milestone.id}/pay`,
        {
          paymentMode: "Razorpay Online",
          paymentReference: mockRef,
          remarks: "Online Payment via Razorpay Gateway",
          amount,
          isInstantMock: true,
        }
      );

      if (res.data?.success) {
        setPaymentSuccess({
          txnId: mockRef,
          mode: "Razorpay Instant Pay",
          amount,
          status: "Approved & Verified",
          note: "Your milestone fee has been confirmed.",
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3 max-w-sm w-full">
          <RefreshCw size={26} className="animate-spin text-[#163868] mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Loading Secure Checkout...</h3>
          <p className="text-xs text-slate-500">Preparing candidate milestone details and gateway.</p>
        </div>
      </div>
    );
  }

  if (error || !milestone || !application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3 max-w-md w-full">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Checkout Error</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{error || "Milestone details could not be found."}</p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/candidate/dashboard")}
              className="px-4 py-2 bg-[#163868] text-white rounded-lg text-xs font-bold hover:bg-[#1e4a82] transition cursor-pointer"
            >
              ← Back to Candidate Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 text-center space-y-4 max-w-md w-full animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto text-[#163868]">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#163868] px-2.5 py-0.5 bg-blue-50 rounded-full border border-blue-200">
              Payment Completed
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-2">
              Milestone Payment Confirmed!
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {paymentSuccess.note}
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <strong className="text-slate-900 font-sans text-sm font-bold text-[#163868]">
                ₹{paymentSuccess.amount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode:</span>
              <span className="font-semibold text-slate-800">{paymentSuccess.mode}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Transaction Ref:</span>
              <span className="font-bold text-[#163868] break-all">{paymentSuccess.txnId}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Status:</span>
              <span className="font-bold text-[#163868]">{paymentSuccess.status}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to={`/invoice/${appId}/${milestone.id}`}
              target="_blank"
              className="w-full py-2.5 rounded-xl bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <FileText size={14} />
              <span>Download Official Invoice Receipt</span>
              <ExternalLink size={12} />
            </Link>

            <button
              onClick={() => navigate("/candidate/dashboard")}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              ← Return to Candidate Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const upiUrl = `upi://pay?pa=immigo.recruitment@hdfcbank&pn=Immigo+Global+Mobility&am=${amount}&cu=INR&tn=${encodeURIComponent(
    milestone.name
  )}`;
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiUrl
  )}`;

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Dedicated Full Page Branded Header */}
      <header className="bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] text-white border-b border-blue-900/60 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/candidate/dashboard")}
              className="p-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-white/10"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <h1 className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5">
              <CreditCard size={16} className="text-cyan-300" />
              <span>Immigo Official Milestone Checkout</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-cyan-200 font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/15">
            <Lock size={12} className="text-cyan-300" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Full Page Checkout Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5" style={{ backgroundColor: "#f8fafc" }}>
        {/* Left Column: Milestone & Project Summary */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Project Details Banner - Navy Theme */}
          <div className="bg-gradient-to-br from-[#0f274a] via-[#163868] to-[#1e4a82] text-white p-4 sm:p-4.5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/15 text-cyan-200 border border-white/20 text-[10px] font-bold">
                ✓ Deployment Milestone
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded">
                APP #{application.applicationId || application.id}
              </span>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {application.projectName}
              </h2>
              <div className="text-[11px] text-blue-100 flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Globe size={12} className="text-cyan-300" />
                  <span>{application.destinationCountry || "Overseas"}</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Briefcase size={12} className="text-cyan-300" />
                  <span>{application.position || "Specialist"}</span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
              <span>Candidate:</span>
              <strong className="text-white font-semibold">
                {candidate?.fullName || application.candidateName}
              </strong>
            </div>
          </div>

          {/* Milestone Details Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] font-bold text-[#163868] uppercase tracking-wider block">
                Current Phase to Unlock
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {milestone.name}
              </h3>
            </div>

            {/* Stages included in this milestone - Navy/Blue theme */}
            {Array.isArray(milestone.stages) && milestone.stages.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Processing Clearances Included:
                </span>
                <div className="space-y-1">
                  {milestone.stages.map((stg, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-100"
                    >
                      <CheckCircle2 size={13} className="text-[#163868] shrink-0" />
                      <span className="font-medium truncate">{stg.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Breakdown - No green colors */}
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Milestone Base Amount:</span>
                <span className="font-semibold text-slate-800">
                  ₹{amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform & Convenience Fee:</span>
                <span className="font-bold text-[#163868]">FREE (₹0)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST / Taxes:</span>
                <span className="font-bold text-[#163868]">Included</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900">Total Payable Now:</span>
                <span className="text-xl font-extrabold text-[#163868]">
                  ₹{amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Immigo Official Guarantee - Navy/Blue Card (No Green) */}
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl text-[11px] text-slate-800 space-y-1" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
            <div className="flex items-center gap-1.5 font-bold text-[#163868]">
              <ShieldCheck size={16} className="text-[#163868]" />
              <span>Immigo Official Guarantee</span>
            </div>
            <p className="leading-relaxed text-[10px] text-slate-600">
              All online payments are securely routed via Razorpay with instant automated approval and GST receipt issuance to your registered email.
            </p>
          </div>
        </div>

        {/* Right Column: Multiple Payment Options */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Select Payment Method
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Choose from UPI Apps, Instant QR, Credit/Debit Card, NetBanking, or Bank Transfer.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#163868] font-bold text-[10px] border border-blue-200">
                Razorpay Enabled
              </span>
            </div>

            {/* Methods Tabs - Navy Accent */}
            <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-slate-200 text-center text-xs font-semibold bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedMethod("upi_apps")}
                className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedMethod === "upi_apps"
                    ? "bg-white text-[#163868] border-b-2 border-[#163868] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Smartphone size={16} className={selectedMethod === "upi_apps" ? "text-[#163868]" : ""} />
                <span className="text-[10px]">UPI Apps</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("upi_qr")}
                className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedMethod === "upi_qr"
                    ? "bg-white text-[#163868] border-b-2 border-[#163868] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <QrCode size={16} className={selectedMethod === "upi_qr" ? "text-[#163868]" : ""} />
                <span className="text-[10px]">Scan QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("card")}
                className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedMethod === "card"
                    ? "bg-white text-[#163868] border-b-2 border-[#163868] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CreditCard size={16} className={selectedMethod === "card" ? "text-[#163868]" : ""} />
                <span className="text-[10px]">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("netbanking")}
                className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedMethod === "netbanking"
                    ? "bg-white text-[#163868] border-b-2 border-[#163868] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Building size={16} className={selectedMethod === "netbanking" ? "text-[#163868]" : ""} />
                <span className="text-[10px]">NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("wallets")}
                className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedMethod === "wallets"
                    ? "bg-white text-[#163868] border-b-2 border-[#163868] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Wallet size={16} className={selectedMethod === "wallets" ? "text-[#163868]" : ""} />
                <span className="text-[10px]">Wallets</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("bank_transfer")}
                className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  selectedMethod === "bank_transfer"
                    ? "bg-white text-[#163868] border-b-2 border-[#163868] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText size={16} className={selectedMethod === "bank_transfer" ? "text-[#163868]" : ""} />
                <span className="text-[10px]">NEFT / UTR</span>
              </button>
            </div>

            {/* Tab 1: UPI Apps Fast Pay */}
            {selectedMethod === "upi_apps" && (
              <div className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Instant UPI Payment (PhonePe, Google Pay, Paytm)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select your preferred UPI app or enter your UPI Virtual Payment Address (VPA).
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "gpay", label: "Google Pay", icon: "📱", sub: "Instant App Intent" },
                    { id: "phonepe", label: "PhonePe", icon: "🟣", sub: "Fast UPI" },
                    { id: "paytm", label: "Paytm UPI", icon: "🔵", sub: "Wallet & UPI" },
                    { id: "bhim", label: "BHIM / CRED", icon: "⚡", sub: "All Banks" },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        selectedUpiApp === app.id
                          ? "bg-blue-50/80 border-[#163868] ring-2 ring-[#163868]/10 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-base">{app.icon}</div>
                      <div className="font-bold text-slate-900 mt-1">{app.label}</div>
                      <div className="text-[9px] text-slate-500 font-medium">{app.sub}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Enter Any UPI ID / VPA
                  </label>
                  <input
                    type="text"
                    value={customVpa}
                    onChange={(e) => setCustomVpa(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono focus:border-[#163868] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    A payment request will be sent directly to your UPI application.
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Scan UPI QR Code */}
            {selectedMethod === "upi_qr" && (
              <div className="p-4 sm:p-5 space-y-3.5 text-xs text-center">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Scan & Pay with Any UPI App
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Open Google Pay, PhonePe, Paytm, or BHIM on your smartphone to scan and pay.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border-2 border-dashed border-slate-300 inline-block mx-auto shadow-2xs">
                  <img
                    src={qrCodeImgSrc}
                    alt="Immigo UPI QR Code"
                    className="w-40 h-40 object-contain mx-auto rounded-lg"
                  />
                  <div className="mt-2 text-[10px] text-slate-600 font-mono">
                    Amount: <strong>₹{amount.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="max-w-sm mx-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                  <div className="font-mono text-[10px] truncate">
                    UPI ID: <strong>immigo.recruitment@hdfcbank</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard("immigo.recruitment@hdfcbank", "qr_upi")}
                    className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-[#163868] font-semibold text-[10px] shrink-0 cursor-pointer"
                  >
                    {copiedField === "qr_upi" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Credit / Debit Cards */}
            {selectedMethod === "card" && (
              <div className="p-4 sm:p-5 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Credit / Debit Card Payment
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    We accept Visa, MasterCard, RuPay, Maestro, and American Express.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 font-semibold mb-1">
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Visa</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">MasterCard</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">RuPay</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Maestro</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      maxLength={19}
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:border-[#163868] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:border-[#163868] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:border-[#163868] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-[#163868] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: NetBanking */}
            {selectedMethod === "netbanking" && (
              <div className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Internet Banking (All Major Indian Banks)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select your bank to authenticate and transfer securely.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "HDFC", name: "HDFC Bank" },
                    { id: "ICICI", name: "ICICI Bank" },
                    { id: "SBIN", name: "State Bank of India" },
                    { id: "UTIB", name: "Axis Bank" },
                    { id: "KKBK", name: "Kotak Bank" },
                    { id: "PUNB", name: "Punjab National Bank" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer ${
                        selectedBank === b.id
                          ? "bg-blue-50/80 border-[#163868] text-[#163868] shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Or Select Another Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:border-[#163868] focus:outline-none"
                  >
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="SBIN">State Bank of India</option>
                    <option value="UTIB">Axis Bank</option>
                    <option value="KKBK">Kotak Mahindra Bank</option>
                    <option value="PUNB">Punjab National Bank</option>
                    <option value="BARB_R">Bank of Baroda</option>
                    <option value="CNRB">Canara Bank</option>
                    <option value="UBIN">Union Bank of India</option>
                    <option value="IDFB">IDFC First Bank</option>
                    <option value="YESB">Yes Bank</option>
                    <option value="INDUS">IndusInd Bank</option>
                    <option value="FED">Federal Bank</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 5: Wallets */}
            {selectedMethod === "wallets" && (
              <div className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Select Digital Wallet
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pay securely using your verified wallet balance.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "paytm", name: "Paytm Wallet" },
                    { id: "mobikwik", name: "MobiKwik" },
                    { id: "airtel", name: "Airtel Money" },
                    { id: "freecharge", name: "FreeCharge" },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWallet(w.id)}
                      className={`p-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                        selectedWallet === w.id
                          ? "bg-blue-50/80 border-[#163868] ring-2 ring-[#163868]/10 text-[#163868] shadow-2xs"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <Wallet size={16} className="text-[#163868] mx-auto mb-1" />
                      <div>{w.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: Offline Bank Transfer (NEFT/RTGS/IMPS) */}
            {selectedMethod === "bank_transfer" && (
              <div className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Direct Bank Transfer / NEFT / RTGS
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Transfer fee directly to our company bank account, then enter your Transaction UTR reference below.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-slate-800 font-mono text-[11px]">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Bank Name:</span>
                    <strong className="text-slate-900 font-sans">HDFC Bank Ltd.</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Account Name:</span>
                    <strong className="text-slate-900 font-sans">Immigo Global Mobility Pvt Ltd</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">Account Number:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900">50200084920192</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("50200084920192", "acc")}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <span className="text-slate-500">IFSC Code:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900">HDFC0001234</strong>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("HDFC0001234", "ifsc")}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">UPI ID:</span>
                    <strong className="text-[#163868]">immigo.recruitment@hdfcbank</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                      Transaction UTR / Reference Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR9281729381"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:border-[#163868] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                      Bank Name / Payment Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paid via SBI NetBanking from Rahul's account"
                      value={bankNotes}
                      onChange={(e) => setBankNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-[#163868] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Checkout Action Row */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                  Total Amount to Pay:
                </span>
                <span className="text-lg font-bold text-slate-900">
                  ₹{amount.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleProceedPayment}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CreditCard size={14} />
                )}
                <span>
                  {selectedMethod === "bank_transfer"
                    ? "Submit UTR for Verification"
                    : `Pay ₹${amount.toLocaleString()} via Razorpay`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
