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
