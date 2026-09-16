import Holiday from "../models/Holiday.js";

export const getTodayDateString = () => {
  const d = new Date();
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  return formatter.format(d);
};

export const isSunday = (dateObjOrStr) => {
  let dt;
  if (typeof dateObjOrStr === "string") {
    const parts = dateObjOrStr.split("-");
    if (parts.length === 3) {
      dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dt = new Date(dateObjOrStr);
    }
  } else {
    dt = new Date(dateObjOrStr);
  }
  return dt.getDay() === 0;
};

export const isSecondOrFourthSaturday = (dateObjOrStr) => {
  let dt;
  if (typeof dateObjOrStr === "string") {
    const parts = dateObjOrStr.split("-");
    if (parts.length === 3) {
      dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dt = new Date(dateObjOrStr);
    }
  } else {
    dt = new Date(dateObjOrStr);
  }

  if (dt.getDay() !== 6) return false;

  const day = dt.getDate();
  const satCount = Math.ceil(day / 7);
  return satCount === 2 || satCount === 4;
};

export const isWeeklyOff = (dateObjOrStr) => {
  return isSunday(dateObjOrStr) || isSecondOrFourthSaturday(dateObjOrStr);
};

export const getWorkingDays = (year, month, holidayDatesSet = new Set()) => {
  const days = [];
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dt = new Date(year, month - 1, d);
    const dayOfWeek = dt.getDay();

    // Sunday - skip
    if (dayOfWeek === 0) continue;

    // 2nd or 4th Saturday - skip
    if (dayOfWeek === 6) {
      const satCount = Math.ceil(d / 7);
      if (satCount === 2 || satCount === 4) continue;
    }

    // Admin Holiday - skip
    if (holidayDatesSet.has(dateStr)) continue;

    days.push(dateStr);
  }

  return days;
};

export const getHolidayForDate = async (dateStr) => {
  return await Holiday.findOne({ date: dateStr });
};
