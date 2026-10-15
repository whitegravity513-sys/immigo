import ActivityService from "../services/activity.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminActivities = asyncHandler(async (req, res) => {
  const result = await ActivityService.getAdminActivities(req.query);
  return res.status(200).json({
    success: true,
    ...result,
  });
});

export const getEmployeeActivities = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id || req.user.employeeId;
  const result = await ActivityService.getEmployeeActivities(employeeId, req.query);
  return res.status(200).json({
    success: true,
    ...result,
  });
});

export default {
  getAdminActivities,
  getEmployeeActivities,
};
