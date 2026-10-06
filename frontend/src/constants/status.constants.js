export const ATTENDANCE_STATUS = Object.freeze({
  ACTIVE: "Active",
  ON_BREAK: "On Break",
  CHECKED_OUT: "Checked Out",
  ABSENT: "Absent",
  WEEKLY_OFF: "Weekly Off",
  HOLIDAY: "Holiday",
  SYNCING: "Syncing...",
});

export const STATUS_COLORS = Object.freeze({
  Active: "bg-emerald-500",
  "On Break": "bg-sky-500",
  "Checked Out": "bg-slate-400",
  Absent: "bg-rose-500",
  "Weekly Off": "bg-slate-400",
  Holiday: "bg-indigo-500",
  "Syncing...": "bg-sky-500 animate-pulse",
});

export default {
  ATTENDANCE_STATUS,
  STATUS_COLORS,
};
