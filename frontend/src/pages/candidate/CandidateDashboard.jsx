import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import AppFooter from "../../components/common/AppFooter.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import apiClient from "../../services/apiClient.js";

import CandidateSidebar from "../../components/candidate/CandidateSidebar.jsx";
import CandidateNavbar from "../../components/candidate/CandidateNavbar.jsx";
import CandidateOverviewTab from "../../components/candidate/CandidateOverviewTab.jsx";
import CandidateProfileTab from "../../components/candidate/CandidateProfileTab.jsx";
import CandidateDocumentsTab from "../../components/candidate/CandidateDocumentsTab.jsx";
import CandidateJobsTab from "../../components/candidate/CandidateJobsTab.jsx";
import CandidateApplicationsTab from "../../components/candidate/CandidateApplicationsTab.jsx";
import CandidateMilestonesTab from "../../components/candidate/CandidateMilestonesTab.jsx";
import CandidatePaymentModal from "../../components/candidate/CandidatePaymentModal.jsx";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const [selectedAppForProcessing, setSelectedAppForProcessing] = useState(null);
  const [milestonesData, setMilestonesData] = useState(null);
  const [milestonesLoading, setMilestonesLoading] = useState(false);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedMilestoneToPay, setSelectedMilestoneToPay] = useState(null);
  const [paymentTypeTab, setPaymentTypeTab] = useState("online");
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [paymentNotesInput, setPaymentNotesInput] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    countryPreference: "",
    education: [],
    skills: "",
    trade: "",
    experienceYears: 0,
    currentOccupation: "",
    preferredJobRole: "",
    languages: "",
    passportNumber: "",
    passportExpiry: "",
    passportIssueCountry: "",
  });

  const [uploadCategory, setUploadCategory] = useState("resume");
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/candidate/notifications");
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch {}
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await apiClient.patch(`/candidate/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const fetchAppMilestones = async (appId) => {
    if (!appId) return;
    setMilestonesLoading(true);
    try {
      const res = await apiClient.get(`/candidate/applications/${appId}/milestones`);
      if (res.data?.success) {
        setMilestonesData(res.data);
      }
    } catch (err) {
      console.error("Failed to load milestones:", err);
    } finally {
      setMilestonesLoading(false);
    }
  };

  const fetchCandidateData = async () => {
    setLoading(true);
    try {
      const [candRes, projRes, appRes] = await Promise.all([
        apiClient.get("/candidate/me"),
        apiClient.get("/candidate/projects"),
        apiClient.get("/candidate/my-applications"),
      ]);

      if (candRes.data?.candidate) {
        const c = candRes.data.candidate;
        setCandidate(c);
        const p = c.profile || {};
        setProfileForm({
          fullName: c.fullName || "",
          phone: c.phone || "",
          dob: p.dob || "",
          gender: p.gender || "",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          pincode: p.pincode || "",
          countryPreference: Array.isArray(p.countryPreference)
            ? p.countryPreference.join(", ")
            : p.countryPreference || "",
          education: Array.isArray(p.education) ? p.education : [],
          skills: Array.isArray(p.skills) ? p.skills.join(", ") : p.skills || "",
          trade: p.trade || "",
          experienceYears: p.experienceYears || 0,
          currentOccupation: p.currentOccupation || "",
          preferredJobRole: p.preferredJobRole || "",
          languages: Array.isArray(p.languages)
            ? p.languages.join(", ")
            : p.languages || "",
          passportNumber: p.passportNumber || "",
          passportExpiry: p.passportExpiry || "",
          passportIssueCountry: p.passportIssueCountry || "",
        });
      }
      if (projRes.data?.projects) {
        setProjects(projRes.data.projects);
      }
      if (appRes.data?.applications) {
        const apps = appRes.data.applications;
        setApplications(apps);

        const selectedApp = apps.find(
          (a) => a.status === "Selected" || a.status === "Completed"
        );
        if (selectedApp) {
          setSelectedAppForProcessing(selectedApp);
          fetchAppMilestones(selectedApp.applicationId || selectedApp.id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch candidate details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateData();
    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/candidate/login", { replace: true });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setNotification(null);
    try {
      const profileData = {
        dob: profileForm.dob,
        gender: profileForm.gender,
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        pincode: profileForm.pincode,
        countryPreference: profileForm.countryPreference
          ? profileForm.countryPreference.split(",").map((s) => s.trim())
          : [],
        skills: profileForm.skills
          ? profileForm.skills.split(",").map((s) => s.trim())
          : [],
        trade: profileForm.trade,
        experienceYears: Number(profileForm.experienceYears) || 0,
        totalExperienceYears: Number(profileForm.experienceYears) || 0,
        currentOccupation: profileForm.currentOccupation,
        preferredJobRole: profileForm.preferredJobRole,
        languages: profileForm.languages
          ? profileForm.languages.split(",").map((s) => s.trim())
          : [],
        passportNumber: profileForm.passportNumber,
        passportExpiry: profileForm.passportExpiry,
        passportIssueCountry: profileForm.passportIssueCountry,
      };

      const payload = {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        profile: profileData,
        ...profileData,
      };

      const res = await apiClient.put("/candidate/profile", payload);
      if (res.data?.candidate) {
        setCandidate(res.data.candidate);
      }
      setNotification({
        type: "success",
        message: "Profile coordinates updated successfully!",
      });
      fetchNotifications();
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setNotification({
          type: "error",
          message: "File size exceeds 10MB limit.",
        });
        return;
      }
      setDocFile(file);
      setDocFileName(file.name);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setNotification({
        type: "error",
        message: "Please choose a file to upload.",
      });
      return;
    }
    setUploadingDoc(true);
    setNotification(null);

    try {
      const toBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });

      const base64Data = await toBase64(docFile);

      const res = await apiClient.post("/candidate/documents", {
        docType: uploadCategory,
        category: uploadCategory,
        name: docFile.name,
        fileName: docFile.name,
        fileSize: docFile.size,
        fileData: base64Data,
      });

      if (res.data?.candidate) {
        setCandidate(res.data.candidate);
      }
      setNotification({
        type: "success",
        message: "Document uploaded successfully for review!",
      });
      setDocFile(null);
      setDocFileName("");
      fetchCandidateData();
      fetchNotifications();
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Document upload failed.",
      });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleApplyProject = async (project) => {
    try {
      setNotification(null);
      const res = await apiClient.post("/candidate/apply", {
        projectId: String(project.id || project.projectId),
      });
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Application for "${project.projectName}" submitted successfully!`,
        });
        fetchCandidateData();
        fetchNotifications();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Application submission failed.",
      });
    }
  };

  const handlePayMilestone = async (isOnline = true) => {
    if (!selectedMilestoneToPay || !selectedAppForProcessing) return;

    if (!isOnline && !paymentRefInput.trim()) {
      setNotification({
        type: "error",
        message: "Please provide a valid UTR or payment reference number.",
      });
      return;
    }

    setSubmittingPayment(true);
    setNotification(null);

    const appId =
      selectedAppForProcessing.applicationId || selectedAppForProcessing.id;
    const milestoneId = selectedMilestoneToPay.id;
    const amount = Number(
      selectedMilestoneToPay.paymentAmount || selectedMilestoneToPay.amount || 15000
    );

    try {
      const res = await apiClient.post(
        `/candidate/applications/${appId}/milestones/${milestoneId}/pay`,
        {
          paymentMode: isOnline ? "Online" : "Bank Transfer",
          paymentReference: isOnline
            ? `PAY-ONLINE-${Date.now().toString(36).toUpperCase()}`
            : paymentRefInput.trim(),
          remarks: isOnline
            ? "Instant Online Payment via Payment Gateway"
            : paymentNotesInput || "Manual Bank Transfer",
          amount,
        }
      );

      if (res.data?.success) {
        setNotification({
          type: "success",
          message: res.data.message || "Payment processed successfully!",
        });
        setPayModalOpen(false);
        setPaymentRefInput("");
        setPaymentNotesInput("");
        fetchAppMilestones(appId);
        fetchCandidateData();
        fetchNotifications();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to process payment.",
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const completionPercent = candidate?.profile?.profileCompletionPercent || 20;
  const isProfileComplete = completionPercent >= 80 || candidate?.profile?.profileCompleted;
  const hasUploadedDocs = (candidate?.documents || []).length > 0;
  const hasVerifiedDoc = (candidate?.documents || []).some((d) => d.status === "Verified");
  const canApply =
    candidate?.jobApplicationAccess === "Unlocked" ||
    candidate?.documentStatus === "Verified" ||
    hasVerifiedDoc ||
    (isProfileComplete && hasUploadedDocs);

  const selectedApps = (applications || []).filter(
    (a) => a.status === "Selected" || a.status === "Completed"
  );

  const tabTitles = {
    overview: "Dashboard Overview",
    profile: "Complete Profile",
    documents: "Upload Compliance Documents",
    jobs: "Available Job Openings",
    applications: "My Applications & Interviews",
    processing: "Recruitment Pipeline & Milestones",
  };

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <CandidateSidebar
        candidate={candidate}
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
        projectsCount={projects.length}
        applicationsCount={applications.length}
        selectedAppsCount={selectedApps.length}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        <CandidateNavbar
          activeTabTitle={tabTitles[activeTab] || "Candidate Portal"}
          accountStatus={candidate?.accountStatus || "Active"}
          unreadNotifCount={unreadNotifCount}
          notifications={notifications}
          notifDropdownOpen={notifDropdownOpen}
          setNotifDropdownOpen={setNotifDropdownOpen}
          onMarkNotificationRead={handleMarkNotificationRead}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {notification && (
            <div
              className={`p-2.5 rounded-lg border flex items-center justify-between shadow-xs transition-all text-xs ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={15} className="text-rose-600 shrink-0" />
                )}
                <span className="font-semibold text-xs">{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-black/5 rounded cursor-pointer"
              >
                <XCircle size={13} />
              </button>
            </div>
          )}

          {activeTab === "overview" && (
            <CandidateOverviewTab
              candidate={candidate}
              user={user}
              completionPercent={completionPercent}
              canApply={canApply}
              isProfileComplete={isProfileComplete}
              hasUploadedDocs={hasUploadedDocs}
              applications={applications}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "profile" && (
            <CandidateProfileTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              onSaveProfile={handleSaveProfile}
              saveLoading={saveLoading}
            />
          )}

          {activeTab === "documents" && (
            <CandidateDocumentsTab
              candidate={candidate}
              uploadCategory={uploadCategory}
              setUploadCategory={setUploadCategory}
              handleFileChange={handleFileChange}
              handleUploadDocument={handleUploadDocument}
              docFileName={docFileName}
              uploadingDoc={uploadingDoc}
              docFile={docFile}
            />
          )}

          {activeTab === "jobs" && (
            <CandidateJobsTab
              projects={projects}
              applications={applications}
              canApply={canApply}
              isProfileComplete={isProfileComplete}
              onApplyProject={handleApplyProject}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefreshProjects={fetchCandidateData}
            />
          )}

          {activeTab === "applications" && (
            <CandidateApplicationsTab
              applications={applications}
              onSelectAppForProcessing={(app) => {
                setSelectedAppForProcessing(app);
                fetchAppMilestones(app.applicationId || app.id);
                setActiveTab("processing");
              }}
            />
          )}

          {activeTab === "processing" && (
            <CandidateMilestonesTab
              selectedApps={selectedApps}
              selectedAppForProcessing={selectedAppForProcessing}
              setSelectedAppForProcessing={setSelectedAppForProcessing}
              milestonesData={milestonesData}
              onOpenPayModal={(m) => {
                setSelectedMilestoneToPay(m);
                setPayModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onFetchAppMilestones={fetchAppMilestones}
            />
          )}

          <CandidatePaymentModal
            isOpen={payModalOpen}
            onClose={() => setPayModalOpen(false)}
            selectedMilestone={selectedMilestoneToPay}
            paymentTypeTab={paymentTypeTab}
            setPaymentTypeTab={setPaymentTypeTab}
            submittingPayment={submittingPayment}
            paymentRefInput={paymentRefInput}
            setPaymentRefInput={setPaymentRefInput}
            paymentNotesInput={paymentNotesInput}
            setPaymentNotesInput={setPaymentNotesInput}
            onPayMilestone={handlePayMilestone}
          />
        </main>

        <AppFooter role="candidate" />
      </div>
    </div>
  );
}
