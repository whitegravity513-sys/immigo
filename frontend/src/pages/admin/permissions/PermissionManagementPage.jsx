import React, { useState, useEffect, useMemo } from "react";
import AdminMasterLayout from "../../../components/admin/layout/AdminMasterLayout.jsx";
import permissionService from "../../../services/permissionService.js";
import crmVendorService from "../../../services/crmVendorService.js";
import adminVendorV1Service from "../../../services/adminVendorV1Service.js";
import { usePermissions } from "../../../context/PermissionContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import DeleteConfirmModal from "../../../components/common/DeleteConfirmModal.jsx";
import { MANAGEMENT_GROUPS } from "../../../constants/permissionGroups.js";

import AdminUsersTable from "../../../components/admin/permissions/AdminUsersTable.jsx";
import VendorHRScopeView from "../../../components/admin/permissions/VendorHRScopeView.jsx";
import PermissionMatrix from "../../../components/admin/permissions/PermissionMatrix.jsx";
import CreateAdminModal from "../../../components/admin/permissions/CreateAdminModal.jsx";
import EditAdminModal from "../../../components/admin/permissions/EditAdminModal.jsx";
import ConfirmSaveModal from "../../../components/admin/permissions/ConfirmSaveModal.jsx";

export function PermissionManagementPage() {
  const { user: currentUser } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const canManageStaff = Boolean(
    isSuperAdmin || String(currentUser?.role || "").toUpperCase() === "ADMIN"
  );

  const [adminsList, setAdminsList] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const [initialPermissions, setInitialPermissions] = useState([]);
  const [effectivePermissions, setEffectivePermissions] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({
    hr: true,
    clients: false,
    projects: false,
    vendors: false,
    candidates: false,
    finance: false,
    rolesAndPermissions: false,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    hrType: "",
    assignedVendors: [],
  });

  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    hrType: "",
    assignedVendors: [],
    isActive: true,
  });

  useEffect(() => {
    loadAdmins();
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const [v1Res, legacyRes] = await Promise.allSettled([
        adminVendorV1Service.getVendors({ limit: 500 }),
        crmVendorService.getVendors(),
      ]);

      const v1List =
        v1Res.status === "fulfilled"
          ? Array.isArray(v1Res.value?.vendors)
            ? v1Res.value.vendors
            : Array.isArray(v1Res.value)
            ? v1Res.value
            : []
          : [];
      const legacyList =
        legacyRes.status === "fulfilled" && Array.isArray(legacyRes.value) ? legacyRes.value : [];

      const byId = new Map();
      [...v1List, ...legacyList].forEach((v) => {
        const key = String(v?.vendorId || v?.id || v?._id || "").trim();
        if (!key) return;
        const existing = byId.get(key) || {};
        byId.set(key, {
          ...existing,
          ...v,
          vendorId: v.vendorId || existing.vendorId || key,
          id: key,
          companyName: v.companyName || v.name || existing.companyName || `Agency ${key}`,
        });
      });

      setAvailableVendors(Array.from(byId.values()));
    } catch {
      setAvailableVendors([]);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await permissionService.getAdmins();
      if (res && res.success) {
        const list = res.admins || res.data || [];
        setAdminsList(list);
        if (list.length > 0 && !selectedAdminId) {
          const defaultSelect =
            list.find((a) => !a.isSuperAdmin && a.role !== "SUPER_ADMIN") || list[0];
          setSelectedAdminId(defaultSelect.id || defaultSelect._id);
        }
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || err.message || "Failed to load staff list", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedAdminData = useMemo(() => {
    if (!selectedAdminId) return null;
    return adminsList.find((a) => (a.id || a._id) === selectedAdminId) || null;
  }, [adminsList, selectedAdminId]);

  useEffect(() => {
    if (!selectedAdminData) return;
    const isVendor =
      selectedAdminData.role === "VENDOR_HR" ||
      (selectedAdminData.role === "HR" && selectedAdminData.hrType === "VENDOR_HR");
    if (isVendor) {
      setInitialPermissions([]);
      setEffectivePermissions([]);
      return;
    }

    const existingPerms = Array.isArray(selectedAdminData.assignedPermissions)
      ? selectedAdminData.assignedPermissions
      : Array.isArray(selectedAdminData.permissions)
      ? selectedAdminData.permissions
      : [];
    setInitialPermissions([...existingPerms]);
    setEffectivePermissions([...existingPerms]);
  }, [selectedAdminData]);

  const showFeedback = (msg, type = "success") => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const isSelectedVendorHR = useMemo(() => {
    if (!selectedAdminData) return false;
    return (
      selectedAdminData.role === "VENDOR_HR" ||
      (selectedAdminData.role === "HR" && selectedAdminData.hrType === "VENDOR_HR")
    );
  }, [selectedAdminData]);

  const isSelectedEmployeeHR = useMemo(() => {
    if (!selectedAdminData) return false;
    return (
      selectedAdminData.role === "EMPLOYEE_HR" ||
      (selectedAdminData.role === "HR" && selectedAdminData.hrType !== "VENDOR_HR")
    );
  }, [selectedAdminData]);

  const isSelectedAdmin = useMemo(() => {
    if (!selectedAdminData) return false;
    return selectedAdminData.role === "ADMIN" || selectedAdminData.role === "SUPER_ADMIN";
  }, [selectedAdminData]);

  const visibleGroups = useMemo(() => {
    if (isSelectedEmployeeHR) {
      return MANAGEMENT_GROUPS.filter((g) => g.id === "hr");
    }
    return MANAGEMENT_GROUPS;
  }, [isSelectedEmployeeHR]);

  const allCurrentKeys = useMemo(() => {
    return visibleGroups.flatMap((g) => g.subsections.flatMap((s) => s.actions.map((a) => a.key)));
  }, [visibleGroups]);

  const isPermissionChecked = (permKey) => {
    if (selectedAdminData?.isSuperAdmin) return true;
    return effectivePermissions.includes(permKey);
  };

  const togglePermission = (permKey) => {
    if (selectedAdminData?.isSuperAdmin) return;
    setEffectivePermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const selectAllInGroup = (group) => {
    if (selectedAdminData?.isSuperAdmin) return;
    const groupKeys = group.subsections.flatMap((s) => s.actions.map((a) => a.key));
    setEffectivePermissions((prev) => Array.from(new Set([...prev, ...groupKeys])));
  };

  const clearAllInGroup = (group) => {
    if (selectedAdminData?.isSuperAdmin) return;
    const groupKeys = group.subsections.flatMap((s) => s.actions.map((a) => a.key));
    setEffectivePermissions((prev) => prev.filter((k) => !groupKeys.includes(k)));
  };

  const handleSelectAllGlobal = () => {
    if (selectedAdminData?.isSuperAdmin) return;
    setEffectivePermissions([...allCurrentKeys]);
  };

  const handleClearAllGlobal = () => {
    if (selectedAdminData?.isSuperAdmin) return;
    setEffectivePermissions([]);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const setAllGroups = (expanded) => {
    const next = {};
    visibleGroups.forEach((g) => {
      next[g.id] = expanded;
    });
    setExpandedGroups(next);
  };

  const changesDiff = useMemo(() => {
    const added = effectivePermissions.filter((k) => !initialPermissions.includes(k));
    const removed = initialPermissions.filter((k) => !effectivePermissions.includes(k));
    return {
      added,
      removed,
      hasChanges: added.length > 0 || removed.length > 0,
    };
  }, [effectivePermissions, initialPermissions]);

  const handleSaveChanges = async () => {
    if (!selectedAdminData) return;
    try {
      setSaving(true);
      await permissionService.updateAdminPermissions(
        selectedAdminData.id || selectedAdminData._id,
        { permissions: effectivePermissions }
      );
      setInitialPermissions([...effectivePermissions]);
      setIsConfirmSaveOpen(false);
      showFeedback(`Permissions successfully updated for ${selectedAdminData.name}!`);
      loadAdmins();
    } catch (err) {
      showFeedback(err.response?.data?.message || err.message || "Failed to update permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  const openCreateDrawer = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: isSuperAdmin ? "ADMIN" : "EMPLOYEE_HR",
      hrType: isSuperAdmin ? "" : "EMPLOYEE_HR",
      assignedVendors: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        hrType: formData.hrType,
        assignedVendors: formData.assignedVendors || [],
      };
      const res = await permissionService.createAdmin(payload);
      showFeedback(res?.message || `Account created for ${formData.name}!`);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: isSuperAdmin ? "ADMIN" : "EMPLOYEE_HR",
        hrType: isSuperAdmin ? "" : "EMPLOYEE_HR",
        assignedVendors: [],
      });
      await loadAdmins();
      if (res?.admin?.id || res?.admin?._id) {
        setSelectedAdminId(res.admin.id || res.admin._id);
      }
    } catch (err) {
      showFeedback(err.response?.data?.message || err.message || "Failed to create account", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        hrType: editFormData.hrType,
        assignedVendors: editFormData.assignedVendors || [],
        isActive: editFormData.isActive,
      };
      if (editFormData.password && String(editFormData.password).trim()) {
        payload.password = String(editFormData.password).trim();
      }
      const res = await permissionService.updateAdmin(editFormData.id, payload);
      showFeedback(res?.message || `Account updated for ${editFormData.name}!`);
      setIsEditModalOpen(false);
      await loadAdmins();
    } catch (err) {
      showFeedback(err.response?.data?.message || err.message || "Failed to update account", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      setDeletingAdmin(true);
      await permissionService.deleteAdmin(adminToDelete.id || adminToDelete._id);
      showFeedback(`Account for ${adminToDelete.name} deleted.`);
      setAdminToDelete(null);
      if ((adminToDelete.id || adminToDelete._id) === selectedAdminId) {
        setSelectedAdminId(null);
      }
      loadAdmins();
    } catch (err) {
      showFeedback(err.response?.data?.message || err.message || "Failed to delete account", "error");
    } finally {
      setDeletingAdmin(false);
    }
  };

  return (
    <AdminMasterLayout title="Role & Permission Management">
      <div className="space-y-4">
        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
              feedbackMsg.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <AdminUsersTable
            adminsList={adminsList}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedAdminId={selectedAdminId}
            onSelectAdmin={setSelectedAdminId}
            onOpenCreateModal={openCreateDrawer}
            onOpenEditModal={(adm) => {
              const isVendorRole = adm.role === "HR" && adm.hrType === "VENDOR_HR";
              const isEmpRole = adm.role === "HR" && adm.hrType !== "VENDOR_HR";
              setEditFormData({
                id: adm.id || adm._id,
                name: adm.name,
                email: adm.email,
                password: adm.rawPassword || "",
                role: isVendorRole ? "VENDOR_HR" : isEmpRole ? "EMPLOYEE_HR" : adm.role,
                hrType: adm.hrType || (adm.role === "HR" ? "EMPLOYEE_HR" : ""),
                assignedVendors: adm.assignedVendors || [],
                isActive: adm.isActive !== false,
              });
              setIsEditModalOpen(true);
            }}
            onOpenDeleteModal={setAdminToDelete}
            isSuperAdmin={isSuperAdmin}
            canManageStaff={canManageStaff}
          />

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
            {selectedAdminData ? (
              isSelectedVendorHR ? (
                <VendorHRScopeView
                  selectedAdminData={selectedAdminData}
                  availableVendors={availableVendors}
                  onOpenEditModal={(adm) => {
                    setEditFormData({
                      id: adm.id || adm._id,
                      name: adm.name,
                      email: adm.email,
                      password: adm.rawPassword || "",
                      role: "VENDOR_HR",
                      hrType: "VENDOR_HR",
                      assignedVendors: adm.assignedVendors || [],
                      isActive: adm.isActive !== false,
                    });
                    setIsEditModalOpen(true);
                  }}
                  onOpenDeleteModal={setAdminToDelete}
                />
              ) : (
                <PermissionMatrix
                  selectedAdminData={selectedAdminData}
                  visibleGroups={visibleGroups}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                  setAllGroups={setAllGroups}
                  isPermissionChecked={isPermissionChecked}
                  togglePermission={togglePermission}
                  selectAllInGroup={selectAllInGroup}
                  clearAllInGroup={clearAllInGroup}
                  handleSelectAllGlobal={handleSelectAllGlobal}
                  handleClearAllGlobal={handleClearAllGlobal}
                  effectivePermissions={effectivePermissions}
                  initialPermissions={initialPermissions}
                  setEffectivePermissions={setEffectivePermissions}
                  changesDiff={changesDiff}
                  allCurrentKeys={allCurrentKeys}
                  isSuperAdmin={isSuperAdmin}
                  isSelectedAdmin={isSelectedAdmin}
                  isSelectedEmployeeHR={isSelectedEmployeeHR}
                  saving={saving}
                  onOpenConfirmSave={() => setIsConfirmSaveOpen(true)}
                />
              )
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select an account from the left directory to inspect and assign permissions.
              </div>
            )}
          </div>
        </div>

        <CreateAdminModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateAdmin}
          creating={saving}
          availableVendors={availableVendors}
          isSuperAdmin={isSuperAdmin}
        />

        <EditAdminModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          onSubmit={handleEditAdmin}
          saving={saving}
          availableVendors={availableVendors}
          isSuperAdmin={isSuperAdmin}
        />

        <ConfirmSaveModal
          isOpen={isConfirmSaveOpen}
          onClose={() => setIsConfirmSaveOpen(false)}
          selectedAdminName={selectedAdminData?.name}
          changesDiff={changesDiff}
          onConfirm={handleSaveChanges}
          saving={saving}
        />

        {adminToDelete && (
          <DeleteConfirmModal
            isOpen={Boolean(adminToDelete)}
            onClose={() => setAdminToDelete(null)}
            onConfirm={handleDeleteAdmin}
            title={`Delete ${adminToDelete?.name}`}
            message={`Are you sure you want to permanently delete the account for ${adminToDelete?.name} (${adminToDelete?.email})? This action cannot be reversed.`}
            loading={deletingAdmin}
          />
        )}
      </div>
    </AdminMasterLayout>
  );
}

export default PermissionManagementPage;
