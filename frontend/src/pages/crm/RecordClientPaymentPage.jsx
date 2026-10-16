import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  Percent,
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Info,
} from "lucide-react";
import crmClientService from "../../services/crmClientService.js";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "NEFT",
  "RTGS",
  "IMPS",
  "Other",
];

const PAYMENT_STATUSES = [
  "Verified",
  "Pending Verification",
  "Received",
];

const GST_TREATMENTS = [
  "Not Applicable",
  "Included in Amount",
  "Added Separately",
];

const GST_RATES = [18, 12, 5, 28];

export default function RecordClientPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";
  const initialMilestoneId = searchParams.get("milestoneId") || "";
  const { showToast } = useCrmToast() || { showToast: (msg) => console.log(msg) };

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [formData, setFormData] = useState({
    clientId: initialClientId,
    clientName: "",
    milestoneId: initialMilestoneId,
    milestoneName: "",
    projectId: "",
    projectName: "",
    candidateId: "",
    candidateName: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amountPaid: "",
    paymentMethod: "Bank Transfer",
    transactionReference: "",
    receivedBy: "Admin",
    status: "Verified",
    gstApplicable: false,
    gstTreatment: "Not Applicable",
    gstRate: 18,
    gstAmount: 0,
    totalTransactionAmount: 0,
    remarks: "",
    paymentProofUrl: "",
    paymentProofName: "",
  });

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const res = await crmClientService.getClients({ limit: 200 });
        const list = Array.isArray(res?.clients) ? res.clients : Array.isArray(res) ? res : [];
        setClients(list);

        if (initialClientId) {
          const found = list.find((c) => String(c.id || c._id) === String(initialClientId));
          if (found) {
            setSelectedClient(found);
            setFormData((prev) => ({
              ...prev,
              clientId: found.id || found._id,
              clientName: found.companyName || "",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch clients for payment page:", err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, [initialClientId]);

  
  useEffect(() => {
    if (selectedClient && selectedClient.paymentMilestones) {
      const msList = selectedClient.paymentMilestones || [];
      const ms = initialMilestoneId
        ? msList.find((m) => String(m.id) === String(initialMilestoneId))
        : msList[0];
      if (ms) {
        setSelectedMilestone(ms);
        setFormData((prev) => ({
          ...prev,
          milestoneId: ms.id,
          milestoneName: ms.name,
          amountPaid: prev.amountPaid || (ms.remainingBalance ? String(ms.remainingBalance) : String(ms.amount || "")),
        }));
      }
    }
  }, [selectedClient, initialMilestoneId]);

  const handleClientChange = (e) => {
    const cId = e.target.value;
    const found = clients.find((c) => String(c.id || c._id) === String(cId));
    setSelectedClient(found || null);
    setSelectedMilestone(null);
    setFormData((prev) => ({
      ...prev,
      clientId: cId,
      clientName: found?.companyName || "",
      milestoneId: "",
      milestoneName: "",
      projectId: "",
      projectName: "",
      amountPaid: "",
    }));
    if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: "" }));
  };

  const handleMilestoneChange = (e) => {
    const mId = e.target.value;
    const msList = selectedClient?.paymentMilestones || [];
    const found = msList.find((m) => String(m.id) === String(mId));
    setSelectedMilestone(found || null);
    setFormData((prev) => ({
      ...prev,
      milestoneId: mId,
      milestoneName: found?.name || "",
      amountPaid: found ? String(found.remainingBalance || found.amount || "") : "",
    }));
    if (errors.milestoneId) setErrors((prev) => ({ ...prev, milestoneId: "" }));
  };

  
  const numericAmount = Math.max(0, Number(formData.amountPaid) || 0);
  let computedGstAmount = 0;
  let computedTotalTransaction = numericAmount;

  if (formData.gstApplicable && formData.gstTreatment !== "Not Applicable") {
    const rate = Number(formData.gstRate) || 18;
    if (formData.gstTreatment === "Added Separately") {
      computedGstAmount = Math.round(numericAmount * (rate / 100) * 100) / 100;
      computedTotalTransaction = numericAmount + computedGstAmount;
    } else if (formData.gstTreatment === "Included in Amount") {
      computedGstAmount = Math.round((numericAmount - numericAmount / (1 + rate / 100)) * 100) / 100;
      computedTotalTransaction = numericAmount;
    }
  }

  const agreedAmount = Number(selectedMilestone?.amount) || numericAmount;
  const currentPaid = Number(selectedMilestone?.paidAmount) || 0;
  const remainingAfterPayment = Math.max(0, agreedAmount - (currentPaid + numericAmount));

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        paymentProofUrl: reader.result,
        paymentProofName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!formData.clientId) errs.clientId = "Please select a client";
    if (!formData.milestoneId) errs.milestoneId = "Please select a payment milestone";
    if (!formData.amountPaid || Number(formData.amountPaid) <= 0) {
      errs.amountPaid = "Payment amount must be greater than zero";
    }
    if (!formData.transactionReference || !formData.transactionReference.trim()) {
      errs.transactionReference = "Transaction Reference / UTR is required";
    }
    if (!formData.paymentDate) errs.paymentDate = "Payment date is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amountPaid: numericAmount,
        agreedMilestoneAmount: agreedAmount,
        totalMilestoneAmount: agreedAmount,
        previouslyReceivedAmount: currentPaid,
        remainingMilestoneBalance: remainingAfterPayment,
        remainingMilestoneAmount: remainingAfterPayment,
        gstRate: formData.gstApplicable ? Number(formData.gstRate) : 0,
        gstAmount: computedGstAmount,
        totalTransactionAmount: computedTotalTransaction,
        status: formData.status || "Verified",
        paymentStatus: formData.status || "Verified",
        receivedBy: formData.receivedBy || "Admin",
      };

      await crmClientService.recordClientPayment(payload);
      showToast("Payment recorded successfully", "success");
      if (formData.clientId) {
        navigate(`/client/clients/${formData.clientId}?tab=milestones`);
      } else {
        navigate("/client/payments-expenses");
      }
    } catch (err) {
      console.error("Failed to record payment:", err);
      setErrors((prev) => ({
        ...prev,
        form: err.message || "Failed to record payment. Please check your entries.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
              <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <Link to="/client/ledger" className="hover:text-blue-600 transition-colors">
                Payment Ledger
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-bold">Record Payment</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <Receipt className="text-blue-600" size={26} />
              <span>Record Client Payment</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Register actual payment transaction made to client against recruitment milestones.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>Back to Ledger</span>
          </button>
        </div>
      </div>

      {}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
        {errors.form && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building2 size={15} className="text-blue-600" />
            <span>1. Client & Milestone Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={handleClientChange}
                disabled={loadingClients}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white ${
                  errors.clientId ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">-- Choose Client Organization --</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.companyName} ({c.country || "Overseas"})
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.clientId}
                </p>
              )}
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Milestone <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.milestoneId}
                onChange={handleMilestoneChange}
                disabled={!selectedClient}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white ${
                  errors.milestoneId ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">
                  {selectedClient ? "-- Choose Milestone --" : "Select a client first"}
                </option>
                {(selectedClient?.paymentMilestones || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Agreed: ₹{Number(m.amount).toLocaleString("en-IN")} (Balance: ₹
                    {Number(m.remainingBalance !== undefined ? m.remainingBalance : m.amount).toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
              {errors.milestoneId && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.milestoneId}
                </p>
              )}
            </div>
          </div>

          {}
          {selectedMilestone && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Milestone</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedMilestone.name}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{selectedMilestone.condition}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Agreed Amount</span>
                  <p className="font-bold text-gray-900 mt-0.5 font-mono">
                    ₹{agreedAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Currently Paid</span>
                  <p className="font-bold text-emerald-700 mt-0.5 font-mono">
                    ₹{currentPaid.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Remaining Balance</span>
                  <p className="font-black text-blue-900 mt-0.5 font-mono text-sm">
                    ₹{remainingAfterPayment.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Related Project <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => {
                const pId = e.target.value;
                const p = selectedClient?.projects?.find((proj) => String(proj.id) === String(pId));
                setFormData((prev) => ({
                  ...prev,
                  projectId: pId,
                  projectName: p?.projectName || "",
                }));
              }}
              disabled={!selectedClient}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">-- No specific project --</option>
              {(selectedClient?.projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 border-b border-gray-100 pb-2">
            <CreditCard size={15} className="text-emerald-600" />
            <span>2. Transaction & Disbursement Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.paymentDate ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.paymentDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.paymentDate}</p>
              )}
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-gray-800"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={formData.amountPaid}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, amountPaid: e.target.value }));
                    if (errors.amountPaid) setErrors((prev) => ({ ...prev, amountPaid: "" }));
                  }}
                  placeholder="25000"
                  className={`w-full pl-7 pr-3 py-2 text-xs font-mono font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.amountPaid ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.amountPaid && (
                <p className="text-[11px] text-red-600 mt-1">{errors.amountPaid}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Transaction Reference / UTR <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.transactionReference}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, transactionReference: e.target.value }));
                  if (errors.transactionReference) setErrors((prev) => ({ ...prev, transactionReference: "" }));
                }}
                placeholder="e.g. UTR1792043077457 or CHQ-928173"
                className={`w-full px-3 py-2 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase ${
                  errors.transactionReference ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              />
              {errors.transactionReference && (
                <p className="text-[11px] text-red-600 mt-1">{errors.transactionReference}</p>
              )}
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Proof / Voucher <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload size={14} className="text-gray-400" />
                <span className="text-xs text-gray-600 truncate flex-1">
                  {formData.paymentProofName || "Upload bank advice, receipt or screenshot"}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Received By
              </label>
              <input
                type="text"
                value={formData.receivedBy}
                onChange={(e) => setFormData((prev) => ({ ...prev, receivedBy: e.target.value }))}
                placeholder="e.g. Accounts Manager / Admin"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Verification Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900"
              >
                {PAYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">
                Note: "Pending Verification" receipts are logged but excluded from confirmed revenue calculations until verified.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Percent size={15} className="text-indigo-600" />
              <span>3. Tax & GST Handling</span>
            </h2>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={formData.gstApplicable}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gstApplicable: e.target.checked,
                    gstTreatment: e.target.checked ? "Added Separately" : "Not Applicable",
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>GST Applicable for this payment</span>
            </label>
          </div>

          {formData.gstApplicable && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    GST Treatment
                  </label>
                  <select
                    value={formData.gstTreatment}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gstTreatment: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    {GST_TREATMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gstRate: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono font-medium"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}% GST
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {}
              <div className="pt-2 border-t border-indigo-100 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Base Milestone Amount</span>
                  <p className="font-mono font-bold text-gray-800 mt-0.5">
                    ₹{numericAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">GST Amount ({formData.gstRate}%)</span>
                  <p className="font-mono font-bold text-indigo-700 mt-0.5">
                    ₹{computedGstAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Total Bank Transfer</span>
                  <p className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                    ₹{computedTotalTransaction.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-700">
            Remarks & Finance Notes <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={formData.remarks}
            onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="Add any finance notes, cheque clearance details, or milestone comments..."
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate("/client/ledger")}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/30 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Submit & Record Payment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
