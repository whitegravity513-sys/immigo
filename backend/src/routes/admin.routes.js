import express from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/adminAnnouncement.controller.js";
import {
  createEmployee,
  getNextEmployeeId,
  getEmployees,
  updateEmployee,
  deactivateEmployee,
  setLeaveBalance,
  getEmployeeHistory,
  getEmployeeMonthlyDetails,
  getEmployeeNote,
  getEmployeeLeaves,
} from "../controllers/adminEmployee.controller.js";
import {
  getAttendanceReport,
  getAttendanceByDate,
  updateAttendance,
  getAttendanceSummary,
  getDailyNotes,
} from "../controllers/adminAttendance.controller.js";
import {
  getLeaves,
  updateLeaveStatus,
} from "../controllers/adminLeave.controller.js";
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from "../controllers/adminHoliday.controller.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../controllers/client.controller.js";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import {
  createInvoice,
  getAllInvoices,
  getInvoicesByProject,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoice.controller.js";
import {
  createProjectPayment,
  getAllProjectPayments,
  getPaymentsByProject,
  updateProjectPayment,
  deleteProjectPayment,
} from "../controllers/payment.controller.js";
import {
  createRenewal,
  getRenewals,
  updateRenewal,
  deleteRenewal,
  getRenewalAlerts,
} from "../controllers/renewal.controller.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from "../controllers/notification.controller.js";
import {
  createMeeting,
  getAdminMeetings,
  updateMeeting,
  deleteMeeting,
  sendBroadcastNotification,
} from "../controllers/meeting.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// ─── EMPLOYEE ROUTES ───
router.post("/employee/create", verifyAdmin, createEmployee);
router.get("/employee/next-id", verifyAdmin, getNextEmployeeId);
router.get("/employee/list", verifyAdmin, getEmployees);
router.put("/employee/update/:id", verifyAdmin, updateEmployee);
router.put("/employee/deactivate/:id", verifyAdmin, deactivateEmployee);
router.put("/employee/:id/leave-balance", verifyAdmin, setLeaveBalance);
router.get("/employee/:id/history", verifyAdmin, getEmployeeHistory);
router.get("/employee/:employeeId/monthly", verifyAdmin, getEmployeeMonthlyDetails);
router.get("/employee/:id/note", verifyAdmin, getEmployeeNote);
router.get("/employee/:id/leaves", verifyAdmin, getEmployeeLeaves);

// ─── ATTENDANCE ROUTES ───
router.get("/attendance", verifyAdmin, getAttendanceReport);
router.get("/attendance/range", verifyAdmin, getAttendanceByDate);
router.post("/attendance/update", verifyAdmin, updateAttendance);
router.get("/attendance/summary", verifyAdmin, getAttendanceSummary);
router.get("/attendance/notes", verifyAdmin, getDailyNotes);

// ─── LEAVE ROUTES ───
router.get("/leaves", verifyAdmin, getLeaves);
router.put("/leaves/:id", verifyAdmin, updateLeaveStatus);

// ─── HOLIDAY ROUTES ───
router.get("/holidays", verifyAdmin, getHolidays);
router.post("/holidays", verifyAdmin, createHoliday);
router.delete("/holidays/:id", verifyAdmin, deleteHoliday);

// ─── EXPENSE CATEGORY ROUTES ───
router.get("/expense-categories", verifyAdmin, getCategories);
router.post("/expense-categories", verifyAdmin, createCategory);
router.put("/expense-categories/:id", verifyAdmin, updateCategory);
router.delete("/expense-categories/:id", verifyAdmin, deleteCategory);

// ─── EXPENSE ROUTES ───
router.get("/expenses", verifyAdmin, getExpenses);
router.post("/expenses", verifyAdmin, createExpense);
router.put("/expenses/:id", verifyAdmin, updateExpense);
router.delete("/expenses/:id", verifyAdmin, deleteExpense);

// ─── CLIENT ROUTES ───
router.post("/clients", verifyAdmin, createClient);
router.get("/clients", verifyAdmin, getClients);
router.get("/clients/:id", verifyAdmin, getClientById);
router.put("/clients/:id", verifyAdmin, updateClient);
router.delete("/clients/:id", verifyAdmin, deleteClient);

// ─── PROJECT ROUTES ───
router.post("/projects", verifyAdmin, createProject);
router.get("/projects", verifyAdmin, getProjects);
router.get("/projects/:id", verifyAdmin, getProjectById);
router.put("/projects/:id", verifyAdmin, updateProject);
router.delete("/projects/:id", verifyAdmin, deleteProject);

// ─── INVOICE ROUTES ───
router.post("/invoices", verifyAdmin, createInvoice);
router.get("/invoices/all", verifyAdmin, getAllInvoices);
router.get("/invoices/project/:projectId", verifyAdmin, getInvoicesByProject);
router.get("/invoices/:id", verifyAdmin, getInvoiceById);
router.put("/invoices/:id", verifyAdmin, updateInvoice);
router.delete("/invoices/:id", verifyAdmin, deleteInvoice);

// ─── PROJECT PAYMENT ROUTES ───
router.post("/project-payments", verifyAdmin, createProjectPayment);
router.get("/project-payments/all", verifyAdmin, getAllProjectPayments);
router.get("/project-payments/project/:projectId", verifyAdmin, getPaymentsByProject);
router.put("/project-payments/:id", verifyAdmin, updateProjectPayment);
router.delete("/project-payments/:id", verifyAdmin, deleteProjectPayment);

// ─── RENEWAL ROUTES ───
router.get("/renewals/alerts", verifyAdmin, getRenewalAlerts);
router.post("/renewals", verifyAdmin, createRenewal);
router.get("/renewals", verifyAdmin, getRenewals);
router.put("/renewals/:id", verifyAdmin, updateRenewal);
router.delete("/renewals/:id", verifyAdmin, deleteRenewal);

// ─── NOTIFICATION ROUTES ───
router.get("/notifications", verifyAdmin, getNotifications);
router.put("/notifications/read-all", verifyAdmin, markAllAsRead);
router.put("/notifications/:id/read", verifyAdmin, markAsRead);
router.delete("/notifications", verifyAdmin, clearAllNotifications);
router.post("/notifications/broadcast", verifyAdmin, sendBroadcastNotification);

// ─── MEETING & CALENDAR ROUTES ───
router.post("/meetings", verifyAdmin, createMeeting);
router.get("/meetings", verifyAdmin, getAdminMeetings);
router.put("/meetings/:id", verifyAdmin, updateMeeting);
router.delete("/meetings/:id", verifyAdmin, deleteMeeting);
// ─── ANNOUNCEMENT ROUTES ───
router.get("/announcements", verifyAdmin, getAnnouncements);
router.post("/announcements", verifyAdmin, createAnnouncement);
router.delete("/announcements/:id", verifyAdmin, deleteAnnouncement);

export default router;
