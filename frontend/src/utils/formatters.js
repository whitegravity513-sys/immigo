export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const getIndiaDateString = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};

export const getDateKey = (dateValue) => {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const toLocalDateStr = (d) => {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isDateInLeaveRange = (dateKey, leave) => {
  if (!leave?.startDate || !leave?.endDate) return false;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const current = new Date(`${dateKey}T00:00:00`);
  return current >= start && current <= end;
};

const parseClockMinutes = (timeStr) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
};

export const isMeetingExpired = (meeting) => {
  if (!meeting) return true;
  const statusUpper = String(meeting.status || "").toUpperCase();
  if (statusUpper === "COMPLETED" || statusUpper === "CANCELLED") return true;

  const dateStr = String(meeting.date || "").trim().slice(0, 10);
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const todayIst = getIndiaDateString();
  if (dateStr < todayIst) return true;
  if (dateStr > todayIst) return false;

  const timeParts = new Date()
    .toLocaleTimeString("en-GB", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    .split(":");
  const nowMinutes = (parseInt(timeParts[0], 10) || 0) * 60 + (parseInt(timeParts[1], 10) || 0);

  const endMinutes = parseClockMinutes(meeting.endTime);
  if (endMinutes !== null) return nowMinutes >= endMinutes;

  const startMinutes = parseClockMinutes(meeting.startTime);
  if (startMinutes !== null) return nowMinutes >= startMinutes + 60;

  return false;
};
