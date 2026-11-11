import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import UserPermission from "../models/UserPermission.js";
import AuditLog from "../models/AuditLog.js";
import { ROLES } from "../constants/roles.js";
import { MODULES, ALL_PERMISSIONS } from "../constants/permissions.js";
import PermissionService from "../services/permission.service.js";
import NotificationService from "../services/notification.service.js";
import { sendStaffAccountCredentialsEmail } from "../services/email.service.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNextHRId } from "../utils/idGenerator.js";
import { logAudit, invalidateUserAuthCache } from "../middleware/rbac.middleware.js";

export const getAdmins = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;

  const query = {
    role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR] },
  };

  if (!req.isSuperAdmin && req.userRole === ROLES.ADMIN) {
    query.role = ROLES.HR;
  } else if (role && role !== "ALL") {
    query.role = role.toUpperCase();
  }

  if (status !== undefined && status !== "") {
    query.isActive = status === "true" || status === "active";
  }

  if (search) {
    const s = String(search).trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }

  const users = await User.find(query).select("+rawPassword").sort({ createdAt: -1 });

  const userIds = users.map((u) => u._id);
  const userPerms = await UserPermission.find({ userId: { $in: userIds } });
  const permMap = new Map();
  userPerms.forEach((up) => {
    permMap.set(String(up.userId), up);
  });

  const adminsWithPerms = await Promise.all(
    users.map(async (u) => {
      const resolved = await PermissionService.resolveUserPermissions(u);
      const permDoc = permMap.get(String(u._id));

      return {
        id: u._id.toString(),
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        hrType: u.hrType || "",
        hrId: u.hrId || "",
        assignedVendors: u.assignedVendors || [],
        phone: u.phone || "",
        department: u.department || "",
        isActive: u.isActive,
        isSuperAdmin: resolved.isSuperAdmin,
        rawPassword: u.rawPassword || "",
        permissionCount: resolved.permissions.includes("*")
          ? ALL_PERMISSIONS.length
          : resolved.permissions.length,
        assignedPermissions: permDoc ? permDoc.assignedPermissions : [],
        deniedPermissions: permDoc ? permDoc.deniedPermissions : [],
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      };
    })
  );

  return res.status(200).json({
    success: true,
    count: adminsWithPerms.length,
    admins: adminsWithPerms,
  });
});

export const getAdminById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("+rawPassword");

  if (!user) {
    throw new ApiError(404, "Admin account not found");
  }

  const resolved = await PermissionService.resolveUserPermissions(user);
  const permDoc = await UserPermission.findOne({ userId: user._id });

  return res.status(200).json({
    success: true,
    admin: {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      hrType: user.hrType || "",
      hrId: user.hrId || "",
      assignedVendors: user.assignedVendors || [],
      phone: user.phone || "",
      department: user.department || "",
      isActive: user.isActive,
      isSuperAdmin: resolved.isSuperAdmin,
      rawPassword: user.rawPassword || "",
      assignedPermissions: permDoc ? permDoc.assignedPermissions : [],
      deniedPermissions: permDoc ? permDoc.deniedPermissions : [],
      effectivePermissions: resolved.permissions,
      notes: permDoc?.notes || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export const createAdmin = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role = ROLES.ADMIN,
    hrType = "",
    assignedVendors = [],
    phone = "",
    department = "",
    assignedPermissions = [],
    notes = "",
  } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required.");
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    throw new ApiError(409, "An account with this email address already exists.");
  }

  let assignedRole = role;
  let assignedHrType = hrType;

  if (role === "EMPLOYEE_HR" || role === "VENDOR_HR") {
    assignedRole = ROLES.HR;
    assignedHrType = role;
  } else if (role === ROLES.HR) {
    assignedHrType = hrType || "EMPLOYEE_HR";
  }

  if (assignedRole === ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "Creation of additional Super Admin accounts is disabled. You can create HR and Admin accounts.");
  }

  const validRoles = [ROLES.ADMIN, ROLES.HR];
  if (!validRoles.includes(assignedRole)) {
    assignedRole = ROLES.ADMIN;
  }

  if (!req.isSuperAdmin && req.userRole !== ROLES.SUPER_ADMIN) {
    if (assignedRole !== ROLES.HR) {
      throw new ApiError(403, "Admins are strictly permitted to create HR staff accounts only.");
    }
  }

  const plainPassword = String(password).trim();
  if (plainPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters.");
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const generatedHrId = assignedRole === ROLES.HR ? await generateNextHRId() : "";

  const newUser = await User.create({
    name: String(name).trim(),
    email: cleanEmail,
    passwordHash,
    rawPassword: plainPassword,
    role: assignedRole,
    hrType: assignedHrType,
    hrId: generatedHrId,
    assignedVendors: Array.isArray(assignedVendors) ? assignedVendors : [],
    phone: phone ? String(phone).trim() : "",
    department: department ? String(department).trim() : "",
    isActive: true,
    isEmailVerified: true,
  });

  let userPermDoc = null;
  if (Array.isArray(assignedPermissions) && assignedPermissions.length > 0) {
    const validPerms = assignedPermissions.filter((p) => ALL_PERMISSIONS.includes(p));
    userPermDoc = await UserPermission.create({
      userId: newUser._id,
      assignedPermissions: validPerms,
      assignedBy: req.user?._id || null,
      notes,
    });
  }

  const roleLabel =
    assignedRole === ROLES.ADMIN
      ? "Administrator"
      : assignedHrType === "VENDOR_HR"
      ? "Vendor HR"
      : "Employee HR";

  let emailResult = { success: false };
  try {
    emailResult = await sendStaffAccountCredentialsEmail({
      to: newUser.email,
      name: newUser.name,
      email: newUser.email,
      password: plainPassword,
      roleLabel,
    });
  } catch (mailErr) {
    emailResult = { success: false, error: mailErr?.message };
  }

  await NotificationService.notifyStaffAction({
    actor: req.user,
    type: "STAFF_ACCOUNT",
    title: "Staff Account Created",
    message: `${newUser.name} (${roleLabel}) was added to the portal.`,
    moduleScope: "GENERAL",
    metadata: { staffId: newUser._id.toString(), email: newUser.email, role: assignedRole, link: "/admin/permissions" },
  });

  await logAudit({
    req,
    action: "ADMIN_CREATE",
    targetResource: "ADMIN",
    targetId: newUser._id,
    targetName: newUser.name,
    description: `Created new ${assignedRole === ROLES.HR ? assignedHrType : assignedRole} account [${newUser.name}].`,
    changes: {
      email: newUser.email,
      role: newUser.role,
      hrType: newUser.hrType,
      hrId: newUser.hrId || "",
      assignedVendors: newUser.assignedVendors,
      assignedPermissions: userPermDoc?.assignedPermissions || [],
    },
  });

  const resolved = await PermissionService.resolveUserPermissions(newUser);

  return res.status(201).json({
    success: true,
    emailSent: Boolean(emailResult?.success),
    message: emailResult?.success
      ? `Account for ${newUser.name} created and login credentials sent to ${newUser.email}.`
      : `Account for ${newUser.name} created successfully.`,
    admin: {
      id: newUser._id.toString(),
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      hrType: newUser.hrType,
      hrId: newUser.hrId || "",
      assignedVendors: newUser.assignedVendors,
      phone: newUser.phone || "",
      department: newUser.department || "",
      isActive: newUser.isActive,
      isSuperAdmin: resolved.isSuperAdmin,
      rawPassword: plainPassword,
      effectivePermissions: resolved.permissions,
      assignedPermissions: userPermDoc?.assignedPermissions || [],
    },
  });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    role,
    hrType,
    assignedVendors,
    phone,
    department,
    isActive,
    password,
  } = req.body;

  const targetUser = await User.findById(id).select("+rawPassword");
  if (!targetUser) {
    throw new ApiError(404, "Admin/HR account not found");
  }

  if (targetUser.role === ROLES.SUPER_ADMIN && !req.isSuperAdmin) {
    throw new ApiError(403, "Cannot modify protected Super Admin account.");
  }

  if (!req.isSuperAdmin && req.userRole === ROLES.ADMIN) {
    if (targetUser.role !== ROLES.HR) {
      throw new ApiError(403, "Admins are strictly permitted to manage HR staff accounts only.");
    }
    if (role && role !== ROLES.HR && role !== "EMPLOYEE_HR" && role !== "VENDOR_HR") {
      throw new ApiError(403, "Admins cannot change an account role away from HR.");
    }
  }

  if (String(req.userId) === String(targetUser._id) && isActive === false) {
    throw new ApiError(400, "You cannot deactivate your own account.");
  }

  const before = {
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    hrType: targetUser.hrType,
    assignedVendors: targetUser.assignedVendors,
    isActive: targetUser.isActive,
  };

  if (name) targetUser.name = String(name).trim();
  if (email) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (cleanEmail !== targetUser.email) {
      const emailTaken = await User.findOne({ email: cleanEmail, _id: { $ne: targetUser._id } });
      if (emailTaken) {
        throw new ApiError(409, "An account with this email address already exists.");
      }
      targetUser.email = cleanEmail;
    }
  }

  if (role) {
    if (role === "EMPLOYEE_HR" || role === "VENDOR_HR") {
      targetUser.role = ROLES.HR;
      targetUser.hrType = role;
      if (role === "EMPLOYEE_HR") {
        targetUser.assignedVendors = [];
      }
    } else if ([ROLES.ADMIN, ROLES.HR].includes(role)) {
      targetUser.role = role;
      if (role === ROLES.ADMIN) {
        targetUser.hrType = "";
        targetUser.assignedVendors = [];
      }
    } else if (role === ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Accounts cannot be promoted to Super Admin.");
    }
  }

  if (hrType !== undefined && targetUser.role === ROLES.HR) {
    targetUser.hrType = hrType;
    if (hrType !== "VENDOR_HR") {
      targetUser.assignedVendors = [];
    }
  }

  if (assignedVendors !== undefined && Array.isArray(assignedVendors)) {
    targetUser.assignedVendors =
      targetUser.role === ROLES.HR && targetUser.hrType === "VENDOR_HR" ? assignedVendors : [];
  }

  if (phone !== undefined) {
    targetUser.phone = String(phone).trim();
  }

  if (department !== undefined) {
    targetUser.department = String(department).trim();
  }

  if (isActive !== undefined) {
    targetUser.isActive = Boolean(isActive);
  }

  let passwordChanged = false;
  const trimmedPassword = password !== undefined && password !== null ? String(password).trim() : "";
  if (trimmedPassword) {
    if (trimmedPassword.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters.");
    }
    if (trimmedPassword !== (targetUser.rawPassword || "")) {
      targetUser.passwordHash = await bcrypt.hash(trimmedPassword, 10);
      targetUser.rawPassword = trimmedPassword;
      targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
      targetUser.passwordChangedAt = new Date();
      passwordChanged = true;
    }
  }

  if (targetUser.role === ROLES.HR && !targetUser.hrId) {
    targetUser.hrId = await generateNextHRId();
  }

  await targetUser.save();
  invalidateUserAuthCache(id);
  PermissionService.invalidateUserCache(id);

  try {
    const adminUpdate = { email: targetUser.email };
    if (passwordChanged) {
      adminUpdate.password = targetUser.passwordHash;
    }
    await Admin.findOneAndUpdate({ email: before.email }, { $set: adminUpdate });
  } catch {}

  const roleLabel =
    targetUser.role === ROLES.ADMIN
      ? "Administrator"
      : targetUser.hrType === "VENDOR_HR"
      ? "Vendor HR"
      : "Employee HR";

  if (passwordChanged) {
    try {
      await sendStaffAccountCredentialsEmail({
        to: targetUser.email,
        name: targetUser.name,
        email: targetUser.email,
        password: trimmedPassword,
        roleLabel,
        isPasswordReset: true,
      });
    } catch {}
  }

  await NotificationService.notifyStaffAction({
    actor: req.user,
    type: "STAFF_ACCOUNT",
    title: "Staff Account Updated",
    message: `Account details updated for ${targetUser.name} (${roleLabel}).`,
    moduleScope: "GENERAL",
    metadata: { staffId: targetUser._id.toString(), email: targetUser.email, passwordChanged, link: "/admin/permissions" },
  });

  await logAudit({
    req,
    action: isActive !== undefined && isActive !== before.isActive ? "ADMIN_STATUS_CHANGE" : "ADMIN_UPDATE",
    targetResource: "ADMIN",
    targetId: targetUser._id,
    targetName: targetUser.name,
    description: `Updated profile for [${targetUser.name}].`,
    changes: { before, after: { name: targetUser.name, email: targetUser.email, role: targetUser.role, hrType: targetUser.hrType, assignedVendors: targetUser.assignedVendors, isActive: targetUser.isActive } },
  });

  const resolved = await PermissionService.resolveUserPermissions(targetUser);

  return res.status(200).json({
    success: true,
    message: passwordChanged
      ? "Account updated and new password emailed successfully."
      : "Account details updated successfully.",
    admin: {
      id: targetUser._id.toString(),
      _id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      hrType: targetUser.hrType,
      hrId: targetUser.hrId || "",
      assignedVendors: targetUser.assignedVendors,
      phone: targetUser.phone,
      department: targetUser.department,
      isActive: targetUser.isActive,
      isSuperAdmin: resolved.isSuperAdmin,
      rawPassword: targetUser.rawPassword || "",
      effectivePermissions: resolved.permissions,
    },
  });
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (String(req.userId) === String(id)) {
    throw new ApiError(400, "You cannot delete your own administrator account.");
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, "Admin account not found");
  }

  if (targetUser.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "Protected Super Admin accounts cannot be deleted.");
  }

  if (!req.isSuperAdmin && req.userRole === ROLES.ADMIN) {
    if (targetUser.role !== ROLES.HR) {
      throw new ApiError(403, "Admins are strictly permitted to manage HR staff accounts only.");
    }
  }

  await User.findByIdAndDelete(id);
  await UserPermission.deleteMany({ userId: id });
  await Admin.deleteMany({ email: targetUser.email });
  invalidateUserAuthCache(id);
  PermissionService.invalidateUserCache(id);

  await logAudit({
    req,
    action: "ADMIN_DELETE",
    targetResource: "ADMIN",
    targetId: id,
    targetName: targetUser.name,
    description: `Permanently deleted admin account [${targetUser.name}] (${targetUser.email}).`,
    changes: { deletedEmail: targetUser.email, role: targetUser.role },
  });

  return res.status(200).json({
    success: true,
    message: `Admin account for ${targetUser.name} has been deleted.`,
  });
});

export const getAdminPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "Admin account not found");
  }

  const permDoc = await UserPermission.findOne({ userId: user._id });
  const resolved = await PermissionService.resolveUserPermissions(user);

  return res.status(200).json({
    success: true,
    adminId: user._id.toString(),
    adminName: user.name,
    adminEmail: user.email,
    role: user.role,
    isSuperAdmin: resolved.isSuperAdmin,
    assignedPermissions: permDoc ? permDoc.assignedPermissions : [],
    deniedPermissions: permDoc ? permDoc.deniedPermissions : [],
    effectivePermissions: resolved.permissions,
  });
});

export const updateAdminPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions, deniedPermissions = [], notes = "" } = req.body;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    throw new ApiError(404, "Target account not found");
  }

  if (!req.isSuperAdmin && req.userRole === ROLES.ADMIN) {
    if (targetUser.role !== ROLES.HR) {
      throw new ApiError(403, "Admins are only permitted to configure permissions for HR staff.");
    }
  }

  const ipAddress = req.ip || req.connection?.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";

  const result = await PermissionService.updateAdminPermissions({
    targetAdminId: id,
    newPermissions: permissions,
    deniedPermissions,
    actorUser: req.user,
    notes,
    ipAddress,
    userAgent,
  });

  return res.status(200).json({
    success: true,
    message: "Permissions updated and applied successfully.",
    ...result,
  });
});

export const getModulesAndPermissions = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    modules: MODULES,
    allPermissions: ALL_PERMISSIONS,
  });
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, targetResource, limit = 50, page = 1 } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (targetResource) filter.targetResource = targetResource;

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(100, parseInt(limit, 10))),
    AuditLog.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    logs,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / limit) || 1,
  });
});

export const getMyPermissions = asyncHandler(async (req, res) => {
  const user = req.user;
  const resolved = await PermissionService.resolveUserPermissions(user);

  return res.status(200).json({
    success: true,
    user: {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    role: user.role,
    isSuperAdmin: resolved.isSuperAdmin,
    permissions: resolved.permissions,
  });
});

export default {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminPermissions,
  updateAdminPermissions,
  getModulesAndPermissions,
  getAuditLogs,
  getMyPermissions,
};
