import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import LoadingFallback from "../components/common/LoadingFallback.jsx";

// Auth
const UnifiedLogin = lazy(() => import("../pages/UnifiedLogin.jsx"));

// 1. Main Admin Central Dashboard
const MainAdminDashboard = lazy(() => import("../pages/admin/MainAdminDashboard.jsx"));

// Existing Admin / Workforce Sub-Routes (attendance-all, workforce, leaves, etc.)
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard.jsx"));

// 2. Dedicated HR Module
const HRDashboard = lazy(() => import("../pages/hr/HRDashboard.jsx"));

// 3. Existing Employee Module
const EmployeeDashboard = lazy(() => import("../pages/employee/EmployeeDashboard.jsx"));

// 4. Dedicated Client Management Module
const ClientLayout = lazy(() => import("../components/client/layout/ClientLayout.jsx"));
const ProjectLayout = lazy(() => import("../components/project/layout/ProjectLayout.jsx"));
const ClientDashboard = lazy(() => import("../pages/client/ClientDashboard.jsx"));
const CrmClients = lazy(() => import("../pages/crm/Clients.jsx"));
const CrmAddClient = lazy(() => import("../pages/crm/AddClient.jsx"));
const CrmClientDetails = lazy(() => import("../pages/crm/ClientDetails.jsx"));
const CrmEditClient = lazy(() => import("../pages/crm/EditClient.jsx"));
const CrmProjectDetails = lazy(() => import("../pages/crm/ProjectDetails.jsx"));
const CrmProjects = lazy(() => import("../pages/crm/Projects.jsx"));
const CrmAddProject = lazy(() => import("../pages/crm/AddProject.jsx"));
const CrmEditProject = lazy(() => import("../pages/crm/EditProject.jsx"));

// 5. Vendor Module
const VendorLogin = lazy(() => import("../pages/vendor/VendorLogin.jsx"));
const VendorRegister = lazy(() => import("../pages/vendor/VendorRegister.jsx"));
const VendorLayout = lazy(() => import("../components/vendor/layout/VendorLayout.jsx"));
const VendorDashboard = lazy(() => import("../pages/vendor/VendorDashboard.jsx"));
const VendorCandidates = lazy(() => import("../pages/vendor/Candidates.jsx"));
const VendorAddCandidate = lazy(() => import("../pages/vendor/AddCandidate.jsx"));
const VendorCandidateDetails = lazy(() => import("../pages/vendor/CandidateDetails.jsx"));
const VendorSubmitCandidate = lazy(() => import("../pages/vendor/SubmitCandidate.jsx"));
const VendorApplications = lazy(() => import("../pages/vendor/Applications.jsx"));
const VendorSelectedCandidates = lazy(() => import("../pages/vendor/SelectedCandidates.jsx"));
const VendorRejectedCandidates = lazy(() => import("../pages/vendor/RejectedCandidates.jsx"));
const VendorProcessingTimeline = lazy(() => import("../pages/vendor/ProcessingTimeline.jsx"));
const VendorProcessingDetails = lazy(() => import("../pages/vendor/VendorProcessingDetails.jsx"));
const VendorPayments = lazy(() => import("../pages/vendor/Payments.jsx"));
const VendorPaymentHistory = lazy(() => import("../pages/vendor/PaymentHistory.jsx"));
const VendorDocuments = lazy(() => import("../pages/vendor/Documents.jsx"));
const VendorProfile = lazy(() => import("../pages/vendor/Profile.jsx"));
const VendorProjectDetails = lazy(() => import("../pages/vendor/VendorProjectDetails.jsx"));
const VendorProjects = lazy(() => import("../pages/vendor/VendorProjects.jsx"));
const VendorEditCandidate = lazy(() => import("../pages/vendor/EditCandidate.jsx"));
const VendorRefunds = lazy(() => import("../pages/vendor/VendorRefunds.jsx"));
const VendorNewRefund = lazy(() => import("../pages/vendor/VendorNewRefund.jsx"));

// Admin Vendor Management Module
const VendorManagementLayout = lazy(() => import("../components/admin/layout/VendorManagementLayout.jsx"));
const AdminVendorDashboard = lazy(() => import("../pages/admin/vendor/AdminVendorDashboard.jsx"));
const AdminVendorsList = lazy(() => import("../pages/admin/vendor/AdminVendorsList.jsx"));
const AdminCandidatesList = lazy(() => import("../pages/admin/vendor/AdminCandidatesList.jsx"));
const AdminSubmissionsList = lazy(() => import("../pages/admin/vendor/AdminSubmissionsList.jsx"));
const AdminSelectedCandidates = lazy(() => import("../pages/admin/vendor/AdminSelectedCandidates.jsx"));
const AdminRejectedCandidates = lazy(() => import("../pages/admin/vendor/AdminRejectedCandidates.jsx"));
const AdminReassignCandidate = lazy(() => import("../pages/admin/vendor/AdminReassignCandidate.jsx"));
const AdminCandidateMilestones = lazy(() => import("../pages/admin/vendor/AdminCandidateMilestones.jsx"));
const AdminProcessingList = lazy(() => import("../pages/admin/vendor/AdminProcessingList.jsx"));
const AdminPaymentsList = lazy(() => import("../pages/admin/vendor/AdminPaymentsList.jsx"));
const AdminPaymentHistory = lazy(() => import("../pages/admin/vendor/AdminPaymentHistory.jsx"));
const AdminMilestonesList = lazy(() => import("../pages/admin/vendor/AdminMilestonesList.jsx"));
const AdminDocumentsList = lazy(() => import("../pages/admin/vendor/AdminDocumentsList.jsx"));
const AdminRefundsList = lazy(() => import("../pages/admin/vendor/AdminRefundsList.jsx"));
const AdminMasterLayout = lazy(() => import("../components/admin/layout/AdminMasterLayout.jsx"));

export default function AppRoutes() {
  const { token, user, logout, isAuthenticated, isAdmin, isVendor } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  isVendor
                    ? "/vendor/dashboard"
                    : isAdmin
                    ? "/admin/dashboard"
                    : "/employee/dashboard"
                }
                replace
              />
            ) : (
              <UnifiedLogin />
            )
          }
        />

        <Route path="/admin/login" element={<Navigate to="/login?role=admin" replace />} />
        <Route path="/employee/login" element={<Navigate to="/login?role=employee" replace />} />

        {/* Vendor Public Auth Routes */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />

        {/* 1. Main Admin Central Dashboard (Default landing for Admin) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <MainAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/dashboard/projects" element={<Navigate to="/client/projects" replace />} />

        {/* Existing Admin / Workforce Sub-Routes (Preserving all employee CRM, attendance, leaves, etc.) */}
        <Route
          path="/admin/dashboard/*"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard user={user} token={token} onLogout={logout} />
            </ProtectedRoute>
          }
        />

        {/* 2. HR Module (Connects directly to the original workforce & employee admin system) */}
        <Route path="/hr" element={<Navigate to="/admin/dashboard/workforce" replace />} />
        <Route path="/hr/dashboard" element={<Navigate to="/admin/dashboard/workforce" replace />} />
        <Route path="/hr/*" element={<Navigate to="/admin/dashboard/workforce" replace />} />

        {/* 3. Existing Employee Module (Accessible by employee and admin) */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRole={["employee", "admin"]}>
              <EmployeeDashboard user={user} token={token} onLogout={logout} />
            </ProtectedRoute>
          }
        />

        {/* 4. Dedicated Client Management Module */}
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Client Management"
                subtitle="Directory of overseas client organizations, contracts & manpower orders."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "All Clients" }]}
              >
                <CrmClients />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients/new"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Add New Client"
                subtitle="Register an overseas client organization and define requirements."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Add Client" }]}
              >
                <CrmAddClient />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients/:clientId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Client Overview"
                subtitle="Profile, projects, contacts and active manpower requirements."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Client Details" }]}
              >
                <CrmClientDetails />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients/:clientId/edit"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Edit Client"
                subtitle="Update company details, contacts, and requirements."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Edit Client" }]}
              >
                <CrmEditClient />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients/:clientId/projects/new"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Create Project / Requirement"
                subtitle="Define overseas deployment project and trade-wise manpower requirement."
                breadcrumbs={[{ label: "Projects", to: "/client/projects" }, { label: "New Project" }]}
              >
                <CrmAddProject />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients/:clientId/projects/:projectId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Project Details"
                subtitle="Site information and trade-wise manpower positions."
                breadcrumbs={[{ label: "Projects", to: "/client/projects" }, { label: "Project Details" }]}
              >
                <CrmProjectDetails />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/projects"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Projects Directory"
                subtitle="All active and pending overseas recruitment and site projects."
                breadcrumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Projects" }]}
              >
                <CrmProjects />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/projects/new"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Add New Project"
                subtitle="Create an overseas deployment project with manpower allocations."
                breadcrumbs={[{ label: "Projects", to: "/client/projects" }, { label: "New Project" }]}
              >
                <CrmAddProject />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/clients/:clientId/projects/:projectId/edit"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Edit Project"
                subtitle="Modify project and manpower allocations."
                breadcrumbs={[{ label: "Projects", to: "/client/projects" }, { label: "Edit Project" }]}
              >
                <CrmEditProject />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client/projects/:projectId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Project Details"
                subtitle="Site information and trade-wise manpower positions."
              >
                <CrmProjectDetails />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />

        {/* Alternate routes for CRM backward-compatibility */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Client Management"
                subtitle="Directory of overseas client organizations, contracts & manpower orders."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "All Clients" }]}
              >
                <CrmClients />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Add New Client"
                subtitle="Register an overseas client organization and define requirements."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Add Client" }]}
              >
                <CrmAddClient />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Client Overview"
                subtitle="Profile, projects, contacts and active manpower requirements."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Client Details" }]}
              >
                <CrmClientDetails />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId/edit"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Edit Client"
                subtitle="Update company details, contacts, and requirements."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Edit Client" }]}
              >
                <CrmEditClient />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:clientId/projects/:projectId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Project Details"
                subtitle="Site information and trade-wise manpower positions."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Clients", to: "/client/clients" }, { label: "Project Details" }]}
              >
                <CrmProjectDetails />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Projects Directory"
                subtitle="All active and pending overseas recruitment and site projects."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Projects" }]}
              >
                <CrmProjects />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClientLayout
                title="Add New Project"
                subtitle="Create an overseas deployment project with manpower allocations."
                breadcrumbs={[{ label: "Client Management", to: "/client/dashboard" }, { label: "Projects", to: "/client/projects" }, { label: "New Project" }]}
              >
                <CrmAddProject />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProjectLayout
                title="Project Details"
                subtitle="Site information and manpower requirements."
                breadcrumbs={[{ label: "Projects", to: "/client/projects" }, { label: "Project Details" }]}
              >
                <CrmProjectDetails />
              </ProjectLayout>
            </ProtectedRoute>
          }
        />

        {/* 5. Admin Vendor Management (Strictly Admin Access with Secondary Sidebar) */}
        <Route
          path="/admin/vendor"
          element={
            <ProtectedRoute allowedRole="admin">
              <VendorManagementLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<AdminVendorDashboard />} />
          <Route path="vendors" element={<AdminVendorsList />} />
          <Route path="candidates" element={<AdminCandidatesList />} />
          <Route path="submissions" element={<AdminSubmissionsList />} />
          <Route path="selected" element={<AdminSelectedCandidates />} />
          <Route path="rejected" element={<AdminRejectedCandidates />} />
          <Route path="reassign" element={<AdminReassignCandidate />} />
          <Route path="processing" element={<AdminProcessingList />} />
          <Route path="payments" element={<AdminPaymentsList />} />
          <Route path="payments/:appId" element={<AdminPaymentHistory />} />
          <Route path="refunds" element={<AdminRefundsList />} />
          <Route path="milestones" element={<AdminMilestonesList />} />
          <Route path="milestones-manage" element={<AdminCandidateMilestones />} />
          <Route path="documents" element={<AdminDocumentsList />} />
        </Route>

        <Route path="/admin/vendors" element={<Navigate to="/admin/vendor/vendors" replace />} />

        {/* 6. Vendor Portal (Strictly External Vendor Role) */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute allowedRole="vendor">
              <VendorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/vendor/dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="projects" element={<VendorProjects />} />
          <Route path="projects/:id" element={<VendorProjectDetails />} />
          <Route path="candidates" element={<VendorCandidates />} />
          <Route path="candidates/add" element={<VendorAddCandidate />} />
          <Route path="candidates/new" element={<VendorAddCandidate />} />
          <Route path="candidates/assign" element={<VendorSubmitCandidate />} />
          <Route path="assign-candidate" element={<VendorSubmitCandidate />} />
          <Route path="candidates/submit" element={<VendorSubmitCandidate />} />
          <Route path="submit-candidate" element={<VendorSubmitCandidate />} />
          <Route path="candidates/:id" element={<VendorCandidateDetails />} />
          <Route path="candidates/edit/:id" element={<VendorEditCandidate />} />
          <Route path="applications" element={<VendorApplications />} />
          <Route path="selected" element={<VendorSelectedCandidates />} />
          <Route path="rejected" element={<VendorRejectedCandidates />} />
          <Route path="processing" element={<VendorProcessingTimeline />} />
          <Route path="processing/:appId" element={<VendorProcessingDetails />} />
          <Route path="payments" element={<VendorPayments />} />
          <Route path="payments/:appId" element={<VendorPaymentHistory />} />
          <Route path="refunds" element={<VendorRefunds />} />
          <Route path="refunds/new" element={<VendorNewRefund />} />
          <Route path="documents" element={<VendorDocuments />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>

        {/* Top-level redirect */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  isVendor
                    ? "/vendor/dashboard"
                    : isAdmin
                    ? "/admin/dashboard"
                    : "/employee/dashboard"
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

