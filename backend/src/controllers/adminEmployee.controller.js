import EmployeeService from "../services/employee.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Admin Employee Controller
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const newEmployee = await EmployeeService.createEmployee(req.body);
  return res.status(201).json({
    message: `Employee created successfully with ID: ${newEmployee.employeeId}`,
    employee: newEmployee,
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
  return res.status(200).json({
    message: "Employee updated successfully",
    employee,
  });
});

export const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await EmployeeService.toggleStatus(req.params.id);
  return res.status(200).json({
    message: `Employee ${employee.status === "active" ? "activated" : "deactivated"} successfully`,
    employee,
  });
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

export const getEmployeeHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const history = await EmployeeService.getEmployeeHistory(req.params.id, startDate, endDate);
  return res.status(200).json(history);
});

export const getEmployeeMonthlyDetails = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { month, year } = req.query;
  const details = await EmployeeService.getEmployeeMonthlyDetails(employeeId, month, year);
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
  deactivateEmployee,
  setLeaveBalance,
  uploadAdminDocument,
  deleteAdminDocument,
  getEmployeeHistory,
  getEmployeeMonthlyDetails,
  getEmployeeNote,
  getEmployeeLeaves,
};
