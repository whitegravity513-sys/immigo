import * as crmClientController from "./crm/crmClient.controller.js";
import * as crmProjectController from "./crm/crmProject.controller.js";
import * as crmApplicationController from "./crm/crmApplication.controller.js";
import * as crmNotificationController from "./crm/crmNotification.controller.js";
import * as crmCandidateController from "./crm/crmCandidate.controller.js";

export const { getClients, saveClient, deleteClient } = crmClientController;
export const { getAvailableProjects, addOrUpdateProject, deleteProject } = crmProjectController;
export const { getApplications, submitApplication, updateApplicationStatus } = crmApplicationController;
export const {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} = crmNotificationController;
export const { getCandidates, saveCandidate } = crmCandidateController;

export default {
  getClients,
  saveClient,
  deleteClient,
  getAvailableProjects,
  addOrUpdateProject,
  deleteProject,
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getCandidates,
  saveCandidate,
};
