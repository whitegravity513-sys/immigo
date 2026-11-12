import EmployeeService from "../services/employee.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEmployee = asyncHandler(async (req, res) => {
  const newEmployee = await EmployeeService.createEmployee(req.body, req.user);
  const emailStatus = newEmployee?._emailStatus || {};
  const recipientsStr = (emailStatus.recipients || []).join(", ");

  let message = `Employee created successfully with ID: ${newEmployee.employeeId}`;
  if (emailStatus.sent && recipientsStr) {
    message = `Employee created successfully with ID: ${newEmployee.employeeId}. Credentials emailed to ${recipientsStr}.`;
  } else if (emailStatus.simulated) {
    message = `Employee created with ID: ${newEmployee.employeeId}. (SMTP credentials missing — email simulated on server.)`;
  } else if (emailStatus.attempted && !emailStatus.sent) {
    message = `Employee created with ID: ${newEmployee.employeeId}, but credentials email could not be delivered (${emailStatus.error || "SMTP authentication failed"}).`;
  }

  return res.status(201).json({
    message,
    employee: newEmployee,
    emailSent: Boolean(emailStatus.sent),
    emailSimulated: Boolean(emailStatus.simulated),
    emailError: emailStatus.error || "",
    emailRecipients: emailStatus.recipients || [],
  });
});

export const getNextEmployeeId = asyncHandler(async (req, res) => {
  const employeeId = await EmployeeService.getNextEmployeeId();
  return res.status(200).json({ employeeId });
});

export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await EmployeeService.getEmployees();
  return res.status(200).json(employees);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
  const emailStatus = employee?._emailStatus || {};
  const recipientsStr = (emailStatus.recipients || []).join(", ");

  let message = "Employee updated successfully";
  if (emailStatus.attempted) {
    if (emailStatus.sent && recipientsStr) {
      message = `Employee updated and credentials emailed to ${recipientsStr}.`;
    } else if (emailStatus.simulated) {
      message = "Employee updated. (SMTP credentials missing — credentials email simulated.)";
    } else {
      message = `Employee updated, but credentials email delivery failed (${emailStatus.error || "SMTP error"}).`;
    }
  }

  return res.status(200).json({
    message,
    employee,
    emailAttempted: Boolean(emailStatus.attempted),
    emailSent: Boolean(emailStatus.sent),
    emailSimulated: Boolean(emailStatus.simulated),
    emailError: emailStatus.error || "",
    emailRecipients: emailStatus.recipients || [],
  });
});

export const resendEmployeeCredentials = asyncHandler(async (req, res) => {
  const result = await EmployeeService.resendCredentials(req.params.id);
  const recipientsStr = (result.recipients || []).join(", ");

  if (!result.sent && !result.simulated) {
    return res.status(502).json({
      success: false,
      message: `Failed to send credentials email to ${recipientsStr || "employee"}: ${result.error || "SMTP authentication error"}`,
      emailSent: false,
      emailError: result.error || "SMTP authentication error",
      emailRecipients: result.recipients || [],
    });
  }

  return res.status(200).json({
    success: true,
    message: result.sent
      ? `Credentials email sent successfully to ${recipientsStr}.`
      : `SMTP not configured on server; email dispatch simulated for ${recipientsStr}.`,
    emailSent: Boolean(result.sent),
    emailSimulated: Boolean(result.simulated),
    emailRecipients: result.recipients || [],
  });
});

export const deactivateEmployee = asyncHandler(async (req, res) => {
  const targetStatus = req.body?.status;
  const employee = await EmployeeService.toggleStatus(req.params.id, targetStatus);
  return res.status(200).json({
    message: `Employee ${employee.status === "active" ? "activated" : "marked inactive"} successfully`,
    employee,
  });
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const result = await EmployeeService.deleteEmployee(req.params.id);
  return res.status(200).json(result);
});

export const setLeaveBalance = asyncHandler(async (req, res) => {
  const { leaveBalance, allocatedLeaves } = req.body;
  const employee = await EmployeeService.setLeaveBalance(req.params.id, leaveBalance, allocatedLeaves);
  return res.status(200).json({
    message: "Leave balance updated successfully",
    employee,
  });
});

export const uploadAdminDocument = asyncHandler(async (req, res) => {
  const employee = await EmployeeService.uploadDocument(req.params.id, req.body, "Admin");
  return res.status(201).json({
    message: "Document uploaded successfully",
    employee,
  });
});

export const deleteAdminDocument = asyncHandler(async (req, res) => {
  const employee = await EmployeeService.deleteDocument(req.params.id, req.params.docId);
  return res.status(200).json({
    message: "Document deleted successfully",
    employee,
  });
});

export const reviewAdminDocument = asyncHandler(async (req, res) => {
  const { status, verificationNote } = req.body;
  const adminId = req.user?._id || req.user?.id || req.admin?._id || null;
  const employee = await EmployeeService.reviewDocument(req.params.id, req.params.docId, {
    status,
    verificationNote,
    adminId,
    actor: req.user,
  });
  return res.status(200).json({
    message: `Document ${status === "Verified" ? "approved" : "rejected"} successfully`,
    employee,
  });
});

export const getEmployeeHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const history = await EmployeeService.getEmployeeHistory(req.params.id, startDate, endDate);
  return res.status(200).json(history);
});

export const getEmployeeMonthlyDetails = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { month, year, startDate, endDate } = req.query;
  const details = await EmployeeService.getEmployeeMonthlyDetails(employeeId, month, year, startDate, endDate);
  return res.status(200).json(details);
});

export const getEmployeeNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  const note = await EmployeeService.getEmployeeNote(id, date);
  return res.status(200).json(note);
});

export const getEmployeeLeaves = asyncHandler(async (req, res) => {
  const leaves = await EmployeeService.getEmployeeLeaves(req.params.id);
  return res.status(200).json(leaves);
});

export default {
  createEmployee,
  getNextEmployeeId,
  getEmployees,
  updateEmployee,
  resendEmployeeCredentials,
  deactivateEmployee,
  deleteEmployee,
  setLeaveBalance,
  uploadAdminDocument,
  deleteAdminDocument,
  reviewAdminDocument,
  getEmployeeHistory,
  getEmployeeMonthlyDetails,
  getEmployeeNote,
  getEmployeeLeaves,
};
