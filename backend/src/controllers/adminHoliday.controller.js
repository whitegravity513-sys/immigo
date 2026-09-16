import HolidayService from "../services/holiday.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Holiday Controller
 */
export const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await HolidayService.getHolidays();
  return res.status(200).json(holidays);
});

export const createHoliday = asyncHandler(async (req, res) => {
  const { date, title, description } = req.body;
  const holiday = await HolidayService.createOrUpdateHoliday(date, title, description);
  return res.status(200).json({ message: "Holiday saved successfully", holiday });
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  await HolidayService.deleteHoliday(req.params.id);
  return res.status(200).json({ message: "Holiday deleted successfully" });
});

export default {
  getHolidays,
  createHoliday,
  deleteHoliday,
};
