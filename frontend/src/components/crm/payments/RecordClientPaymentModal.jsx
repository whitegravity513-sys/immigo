import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileCheck,
  Percent,
  Receipt,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import crmClientService from "../../../services/crmClientService.js";

const PAYMENT_METHODS = [
  "Bank Transfer",
  "NEFT",
  "RTGS",
  "IMPS",
  "UPI",
  "Cheque",
  "Other",
];

const GST_TREATMENTS = [
  "Not Applicable",
  "Included in Amount",
  "Added Separately",
];

const GST_RATES = [18, 12, 5, 28];

export function RecordClientPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialClientId = "",
  initialMilestoneId = "",
  initialProjectId = "",
  initialCandidateId = "",
  initialCandidateName = "",
}) {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [formData, setFormData] = useState({
    clientId: initialClientId || "",
    clientName: "",
    milestoneId: initialMilestoneId || "",
    milestoneName: "",
    projectId: initialProjectId || "",
    projectName: "",
    candidateId: initialCandidateId || "",
    candidateName: initialCandidateName || "",
    paymentDate: new Date().toISOString().split("T")[0],
    amountPaid: "",
    paymentMethod: "Bank Transfer",
    transactionReference: "",
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

  // Load clients list
  useEffect(() => {
    if (!isOpen) return;
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const res = await crmClientService.getClients({ limit: 100 });
        const list = res.clients || [];
        setClients(list);

        // Preselect client if provided
        if (initialClientId) {
          const found = list.find((c) => String(c.id) === String(initialClientId));
          if (found) {
            setSelectedClient(found);
            setFormData((prev) => ({
              ...prev,
              clientId: found.id,
              clientName: found.companyName || found.name || "",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch clients for payment modal:", err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, [isOpen, initialClientId]);

  // Sync selected milestone when client changes or initialMilestoneId is set
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

  // Handle client selection change
  const handleClientChange = (e) => {
    const cId = e.target.value;
    const found = clients.find((c) => String(c.id) === String(cId));
    setSelectedClient(found || null);
    setSelectedMilestone(null);
    setFormData((prev) => ({
      ...prev,
      clientId: cId,
      clientName: found?.companyName || found?.name || "",
      milestoneId: "",
      milestoneName: "",
      projectId: "",
      projectName: "",
      amountPaid: "",
    }));
    if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: "" }));
  };

  // Handle milestone selection change
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

  // Calculate live financial numbers
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

  // Handle file upload
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
    if (!formData.milestoneId) errs.milestoneId = "Please select a milestone";
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
        remainingMilestoneBalance: remainingAfterPayment,
        gstRate: formData.gstApplicable ? Number(formData.gstRate) : 0,
        gstAmount: computedGstAmount,
        totalTransactionAmount: computedTotalTransaction,
        status: "Completed",
      };

      const result = await crmClientService.recordClientPayment(payload);
      if (onSuccess) onSuccess(result);
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Receipt size={20} className="text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Record Client Payment</h2>
              <p className="text-xs text-blue-200">
                Register actual payment transaction made to client against recruitment milestones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errors.form && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* 1. Client & Milestone Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Client <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={handleClientChange}
                disabled={Boolean(initialClientId)}
                className={`w-full px-3 py-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-blue-500 bg-white ${
                  errors.clientId ? "border-rose-300 bg-rose-50/50" : "border-slate-300"
                }`}
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name} ({c.id})
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="text-[11px] text-rose-600 mt-1">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Milestone <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.milestoneId}
                onChange={handleMilestoneChange}
                disabled={!selectedClient}
                className={`w-full px-3 py-2.5 rounded-lg border text-xs focus:ring-1 focus:ring-blue-500 bg-white ${
                  errors.milestoneId ? "border-rose-300 bg-rose-50/50" : "border-slate-300"
                }`}
              >
                <option value="">-- Select Milestone --</option>
                {(selectedClient?.paymentMilestones || []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Agreed: ₹{Number(m.amount).toLocaleString()} (Bal: ₹{Number(m.remainingBalance ?? m.amount).toLocaleString()})
                  </option>
                ))}
              </select>
              {errors.milestoneId && <p className="text-[11px] text-rose-600 mt-1">{errors.milestoneId}</p>}
            </div>
          </div>

          {/* Milestone Status Highlight Banner */}
          {selectedMilestone && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs flex-wrap gap-2">
              <div>
                <span className="font-bold text-blue-900 block">{selectedMilestone.name}</span>
                <span className="text-[11px] text-blue-700">
                  Trigger: <strong>{selectedMilestone.condition}</strong> &bull; Timeline: {selectedMilestone.timeline || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Agreed Amount</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{Number(selectedMilestone.amount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Current Balance</span>
                  <span className="font-mono font-bold text-emerald-700">
                    ₹{Number(selectedMilestone.remainingBalance ?? selectedMilestone.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Optional Project & Candidate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Related Project (Optional)</label>
              <select
                value={formData.projectId}
                onChange={(e) => {
                  const pId = e.target.value;
                  const proj = (selectedClient?.projects || []).find((p) => String(p.id) === String(pId));
                  setFormData((prev) => ({
                    ...prev,
                    projectId: pId,
                    projectName: proj?.projectName || proj?.name || "",
                  }));
                }}
                disabled={!selectedClient}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- No Specific Project --</option>
                {(selectedClient?.projects || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName || p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Payment Amount, Method, Date, Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
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
                  className={`w-full pl-7 pr-3 py-2.5 rounded-lg border text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 ${
                    errors.amountPaid ? "border-rose-300 bg-rose-50/50" : "border-slate-300"
                  }`}
                />
              </div>
              {errors.amountPaid && <p className="text-[11px] text-rose-600 mt-1">{errors.amountPaid}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction Ref / UTR <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.transactionReference}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, transactionReference: e.target.value.toUpperCase() }));
                  if (errors.transactionReference) setErrors((prev) => ({ ...prev, transactionReference: "" }));
                }}
                placeholder="e.g. UTR129381923"
                className={`w-full px-3 py-2.5 rounded-lg border text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-blue-500 ${
                  errors.transactionReference ? "border-rose-300 bg-rose-50/50" : "border-slate-300"
                }`}
              />
              {errors.transactionReference && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.transactionReference}</p>
              )}
            </div>
          </div>

          {/* 4. GST Section */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">GST / Tax Treatment</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
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
                <span>GST Applicable</span>
              </label>
            </div>

            {formData.gstApplicable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST Treatment</label>
                  <select
                    value={formData.gstTreatment}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gstTreatment: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    {GST_TREATMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gstRate: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}% Standard GST
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Transparent Calculation Breakdown */}
            <div className="mt-2 p-3 rounded-lg bg-white border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Agreed Milestone</span>
                <span className="font-mono font-bold text-slate-800">₹{agreedAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Base Payment</span>
                <span className="font-mono font-bold text-blue-700">₹{numericAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">
                  GST Amount {formData.gstApplicable && `(${formData.gstRate}%)`}
                </span>
                <span className="font-mono font-bold text-amber-700">₹{computedGstAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Transaction</span>
                <span className="font-mono font-extrabold text-emerald-700 text-sm">
                  ₹{computedTotalTransaction.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Remarks & Payment Proof Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Note</label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="e.g. Mobilization payment disbursed to client account via HDFC NetBanking"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Proof (Optional)</label>
              <div className="border border-dashed border-slate-300 rounded-lg p-2.5 text-center bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                <input
                  type="file"
                  id="payment-proof-input"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="payment-proof-input"
                  className="cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Upload size={14} />
                  <span>{formData.paymentProofName || "Upload Bank Receipt / Voucher"}</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Transaction reference will be validated to prevent accidental duplicate entries.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
              >
                {submitting ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecordClientPaymentModal;
