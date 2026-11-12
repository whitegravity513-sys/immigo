import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import { useAuth } from "../../../context/useAuth.js";

import CandidateProfileBar from "../../../components/admin/candidate/milestones/CandidateProfileBar.jsx";
import MilestoneTabsNav from "../../../components/admin/candidate/milestones/MilestoneTabsNav.jsx";
import MilestoneHeaderCard from "../../../components/admin/candidate/milestones/MilestoneHeaderCard.jsx";
import MilestoneClearanceDocs from "../../../components/admin/candidate/milestones/MilestoneClearanceDocs.jsx";
import MilestoneStagesChecklist from "../../../components/admin/candidate/milestones/MilestoneStagesChecklist.jsx";
import MilestonePaymentModal from "../../../components/admin/candidate/milestones/MilestonePaymentModal.jsx";

export default function AdminDirectCandidateMilestones() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [application, setApplication] = useState(null);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  const [milestonesList, setMilestonesList] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [milestonesCustomized, setMilestonesCustomized] = useState(false);
  const [notification, setNotification] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "Online",
    paymentRef: "",
    remarks: "",
  });

  const [docTitle, setDocTitle] = useState("");
  const [docAudience, setDocAudience] = useState("both");
  const [docUploading, setDocUploading] = useState(false);

  const loadApplicationData = useCallback(async () => {
    try {
      setLoading(true);
      await crmVendorService.getAvailableProjects().catch(() => []);
      const apps = await crmVendorService.getApplications();
      const app = apps.find(
        (a) =>
          String(a.id) === String(id) ||
          String(a.applicationId) === String(id) ||
          String(a._id) === String(id)
      );

      if (app) {
        setApplication(app);
        const syncedMs = !app.milestonesOverridden
          ? crmVendorService.syncAppMilestonesWithProject(app)
          : [];
        const milestones =
          syncedMs.length > 0
            ? syncedMs
            : Array.isArray(app.processMilestones) && app.processMilestones.length > 0
              ? app.processMilestones
              : app.paymentPlan?.milestones || [];

        setMilestonesList(milestones);
        setMilestonesCustomized(Boolean(app.milestonesOverridden));
        const sum = milestones.reduce(
          (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
          0
        );
        setTotalAmount(sum > 0 ? sum : Number(app.paymentPlan?.totalAmount || 0));
      }
    } catch {
      setNotification({ type: "error", message: "Failed to load candidate application" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) loadApplicationData();
    });
    const handleRefresh = () => {
      if (!cancelled) loadApplicationData();
    };
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadApplicationData]);

  const autoSyncMilestones = async (newList, customTotal, options = {}) => {
    if (!application) return;
    try {
      const candId = application.applicationId || application.id;
      const isCustomized = options.customized !== undefined ? Boolean(options.customized) : true;
      const nextCustomized = milestonesCustomized || isCustomized;
      if (isCustomized && !milestonesCustomized) {
        setMilestonesCustomized(true);
      }
      const computedSum = (newList || []).reduce(
        (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
        0
      );
      const nextTotal =
        customTotal !== undefined && customTotal !== null && !Number.isNaN(Number(customTotal))
          ? Number(customTotal)
          : computedSum;
      if (customTotal === undefined) {
        setTotalAmount(nextTotal);
      }
      await crmVendorService.updateCandidateMilestones(
        candId,
        newList,
        nextTotal,
        application,
        { preserveProjectSync: !nextCustomized && !application.milestonesOverridden }
      );
    } catch (err) {
      console.warn("Milestone auto-sync:", err?.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const candId = application.applicationId || application.id;
      await crmVendorService.updateCandidateMilestones(
        candId,
        milestonesList,
        totalAmount,
        application,
        { preserveProjectSync: !milestonesCustomized && !application.milestonesOverridden }
      );
      setSaveSuccess(true);
      setNotification({ type: "success", message: "Candidate milestone workflow updated successfully!" });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setNotification({ type: "error", message: err.message || "Failed to save workflow" });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOpenRecordPayment = (idx) => {
    const m = milestonesList[idx];
    setPaymentForm({
      amount: Number(m?.paymentAmount ?? m?.amount ?? 0),
      paymentMethod: "Bank Transfer",
      paymentRef: `TXN-${Date.now().toString().slice(-6)}`,
      remarks: "Direct milestone payment recorded by Administrator",
    });
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    try {
      const candId = application.applicationId || application.id;
      const currentM = milestonesList[activeMilestoneIdx];
      await crmVendorService.recordMilestonePayment(
        candId,
        currentM.id,
        Number(paymentForm.amount),
        paymentForm.paymentMethod,
        paymentForm.paymentRef,
        paymentForm.remarks,
        user?.name || "Admin",
        application
      );

      const updated = [...milestonesList];
      updated[activeMilestoneIdx] = {
        ...updated[activeMilestoneIdx],
        status: "Paid",
        paymentStatus: "Approved",
        paidAmount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentRef: paymentForm.paymentRef,
        paymentRemark: paymentForm.remarks,
        paymentDate: new Date().toLocaleDateString(),
        approvedBy: user?.name || "Admin",
      };

      setMilestonesList(updated);
      setPaymentModalOpen(false);
      setNotification({
        type: "success",
        message: `Payment of ₹${Number(paymentForm.amount).toLocaleString()} recorded! Milestone unlocked.`,
      });
      autoSyncMilestones(updated, totalAmount, { customized: false });
    } catch (err) {
      setNotification({ type: "error", message: err.message || "Payment recording failed" });
    }
  };

  const handleUnlockMilestone = (idx) => {
    const updated = [...milestonesList];
    updated[idx] = {
      ...updated[idx],
      status: "In Progress",
      paymentStatus: "Approved",
    };
    setMilestonesList(updated);
    autoSyncMilestones(updated, totalAmount, { customized: false });
    setNotification({ type: "success", message: `${updated[idx].name} unlocked directly!` });
  };

  const handleCompleteMilestone = (idx) => {
    const updated = [...milestonesList];
    const completedStages = (updated[idx].stages || []).map((s) => ({
      ...s,
      status: "Completed",
      completedAt: s.completedAt || new Date().toISOString(),
    }));

    updated[idx] = {
      ...updated[idx],
      status: "Completed",
      stages: completedStages,
    };

    if (idx + 1 < updated.length && updated[idx + 1].status === "Locked") {
      updated[idx + 1].status = "In Progress";
    }

    setMilestonesList(updated);
    autoSyncMilestones(updated, totalAmount, { customized: false });
    setNotification({
      type: "success",
      message: `${updated[idx].name} marked complete! Advanced to next deployment phase.`,
    });
  };

  const handleAddStage = (mIdx) => {
    const updated = [...milestonesList];
    const newStage = {
      id: `stage_${Date.now()}`,
      name: "New Verification Step",
      status: "Pending",
      remark: "",
      document: null,
    };
    updated[mIdx].stages = [...(updated[mIdx].stages || []), newStage];
    setMilestonesList(updated);
    autoSyncMilestones(updated);
  };

  const handleRemoveStage = (mIdx, sIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].stages = updated[mIdx].stages.filter((_, i) => i !== sIdx);
    setMilestonesList(updated);
    autoSyncMilestones(updated);
  };

  const handleStageNameChange = (mIdx, sIdx, val) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].name = val;
    setMilestonesList(updated);
    setMilestonesCustomized(true);
  };

  const handleStageStatusChange = (mIdx, sIdx, val) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].status = val;
    if (val === "Completed") {
      updated[mIdx].stages[sIdx].completedAt = new Date().toISOString();
    }
    setMilestonesList(updated);
    autoSyncMilestones(updated, totalAmount, { customized: false });
  };

  const handleStageRemarkChange = (mIdx, sIdx, val) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].remark = val;
    setMilestonesList(updated);
  };

  const handleFileUploadForStage = (mIdx, sIdx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeUrl = URL.createObjectURL(file);
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].document = {
      fileName: file.name,
      fileUrl: fakeUrl,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString(),
    };
    setMilestonesList(updated);
    autoSyncMilestones(updated, totalAmount, { customized: false });
    setNotification({ type: "success", message: `Proof file attached: ${file.name}` });
  };

  const handleRemoveStageDocument = (mIdx, sIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].document = null;
    setMilestonesList(updated);
    autoSyncMilestones(updated, totalAmount, { customized: false });
  };

  const handleUploadClearanceDocument = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setDocUploading(true);
      const fakeUrl = URL.createObjectURL(file);
      const title = docTitle.trim() || file.name.replace(/\.[^/.]+$/, "");
      const newDoc = {
        id: `clr_${Date.now()}`,
        title,
        fileName: file.name,
        fileUrl: fakeUrl,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        targetAudience: docAudience,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.name || "Admin",
      };

      const updated = [...milestonesList];
      const currDocs = updated[activeMilestoneIdx].clearanceDocuments || [];
      updated[activeMilestoneIdx].clearanceDocuments = [...currDocs, newDoc];

      setMilestonesList(updated);
      autoSyncMilestones(updated, totalAmount, { customized: false });
      setDocTitle("");
      setNotification({ type: "success", message: `Clearance document uploaded: ${title}` });
    } catch {
      setNotification({ type: "error", message: "Failed to upload document" });
    } finally {
      setDocUploading(false);
    }
  };

  const handleRemoveClearanceDocument = (docId) => {
    const updated = [...milestonesList];
    const currDocs = updated[activeMilestoneIdx].clearanceDocuments || [];
    updated[activeMilestoneIdx].clearanceDocuments = currDocs.filter((d) => d.id !== docId);
    setMilestonesList(updated);
    autoSyncMilestones(updated, totalAmount, { customized: false });
    setNotification({ type: "success", message: "Clearance document removed." });
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-2xs max-w-4xl mx-auto my-6">
        <div className="w-7 h-7 border-2 border-[#163868] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700">Loading candidate milestones...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6 text-center bg-white rounded-xl border border-slate-200 max-w-lg mx-auto my-6">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-xs font-bold text-slate-900">Application Not Found</h3>
        <p className="text-[11px] text-slate-500 mt-1">Unable to locate candidate application details.</p>
        <button
          onClick={() => navigate("/admin/candidates/selected")}
          className="mt-3 px-3.5 py-1.5 bg-[#163868] text-white rounded-lg text-xs font-bold hover:bg-[#1e4a82] cursor-pointer"
        >
          Return to Selected Candidates
        </button>
      </div>
    );
  }

  const currentM = milestonesList[activeMilestoneIdx] || milestonesList[0];
  const totalPaid = milestonesList.reduce((sum, m) => {
    if (m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed") {
      return sum + (Number(m.amount || m.paymentAmount) || 0);
    }
    return sum;
  }, 0);

  const isCurrentCompleted =
    currentM?.status === "Completed" ||
    (Array.isArray(currentM?.stages) &&
      currentM.stages.length > 0 &&
      currentM.stages.every((s) => s.status === "Completed"));

  const isCurrentPaid = currentM?.status === "Paid" || currentM?.paymentStatus === "Approved" || isCurrentCompleted;

  return (
    <div className="space-y-3 max-w-6xl w-full mx-auto font-sans antialiased text-slate-800 pb-10 text-xs">
      {notification && (
        <div
          className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${notification.type === "success"
            ? "bg-blue-50 text-[#163868] border-blue-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle2 size={15} className="text-[#163868]" /> : <AlertCircle size={15} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-0.5 hover:opacity-75 cursor-pointer">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate("/admin/candidates/selected")}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#163868]" />
              <span>Candidate Milestone & Process Workflow</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Configure deployment stages, verify milestone fees, upload candidate & vendor clearance documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer ${saveSuccess ? "bg-[#163868]" : "bg-[#163868] hover:bg-[#1e4a82]"
              } disabled:opacity-50`}
          >
            {saveLoading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            <span>{saveSuccess ? "Saved Successfully!" : "Save Plan"}</span>
          </button>
        </div>
      </div>

      <CandidateProfileBar
        application={application}
        totalPaid={totalPaid}
        totalAmount={totalAmount}
      />

      <MilestoneTabsNav
        milestonesList={milestonesList}
        activeMilestoneIdx={activeMilestoneIdx}
        setActiveMilestoneIdx={setActiveMilestoneIdx}
        totalAmount={totalAmount}
        setTotalAmount={setTotalAmount}
        autoSyncMilestones={autoSyncMilestones}
      />

      {currentM && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          <MilestoneHeaderCard
            currentM={currentM}
            activeMilestoneIdx={activeMilestoneIdx}
            milestonesList={milestonesList}
            setMilestonesList={setMilestonesList}
            autoSyncMilestones={autoSyncMilestones}
            isCurrentPaid={isCurrentPaid}
            isCurrentCompleted={isCurrentCompleted}
            application={application}
            onOpenRecordPayment={handleOpenRecordPayment}
            onUnlockMilestone={handleUnlockMilestone}
            onCompleteMilestone={handleCompleteMilestone}
          />

          <MilestoneClearanceDocs
            application={application}
            currentM={currentM}
            docTitle={docTitle}
            setDocTitle={setDocTitle}
            docAudience={docAudience}
            setDocAudience={setDocAudience}
            docUploading={docUploading}
            onUploadClearanceDoc={handleUploadClearanceDocument}
            onRemoveClearanceDoc={handleRemoveClearanceDocument}
          />

          <MilestoneStagesChecklist
            currentM={currentM}
            activeMilestoneIdx={activeMilestoneIdx}
            milestonesList={milestonesList}
            onAddStage={handleAddStage}
            onRemoveStage={handleRemoveStage}
            onStageNameChange={handleStageNameChange}
            onStageStatusChange={handleStageStatusChange}
            onStageRemarkChange={handleStageRemarkChange}
            onFileUploadForStage={handleFileUploadForStage}
            onRemoveStageDocument={handleRemoveStageDocument}
            autoSyncMilestones={autoSyncMilestones}
          />
        </div>
      )}

      <MilestonePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        currentM={currentM}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
}
