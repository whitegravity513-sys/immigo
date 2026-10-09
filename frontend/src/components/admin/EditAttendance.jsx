import { useState } from 'react';
import apiClient from '../../services/apiClient.js';
import {
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  X,
  Clock,
  Calendar,
  User,
  Save,
  Sparkles,
} from 'lucide-react';

const formatHHMM = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const getTodayStr = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};

export default function EditAttendance({ attendance, onClose, onSaved }) {
  const [date, setDate] = useState(attendance?.date || getTodayStr());
  const [checkInTime, setCheckInTime] = useState(formatHHMM(attendance?.checkInTime));
  const [checkOutTime, setCheckOutTime] = useState(formatHHMM(attendance?.checkOutTime));
  const [status, setStatus] = useState(attendance?.status || 'Present');
  const [dayType, setDayType] = useState(attendance?.halfSalaryDeduct ? 'Half Day' : 'Full Day');
  const [loading, setLoading] = useState(false);
  const [waivinPenalty, setWaivingPenalty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const targetDate = date || getTodayStr();

      let calcCheckIn = undefined;
      if (checkInTime) {
        const dObj = new Date(`${targetDate}T${checkInTime}:00`);
        if (!isNaN(dObj.getTime())) {
          calcCheckIn = dObj.toISOString();
        }
      } else if (checkInTime === "") {
        calcCheckIn = null;
      }

      let calcCheckOut = undefined;
      if (status === "Active") {
        calcCheckOut = null;
      } else if (checkOutTime) {
        const dObj = new Date(`${targetDate}T${checkOutTime}:00`);
        if (!isNaN(dObj.getTime())) {
          calcCheckOut = dObj.toISOString();
        }
      } else if (checkOutTime === "") {
        calcCheckOut = null;
      }

      const payload = {
        employeeId: attendance.employeeId || attendance._id,
        date: targetDate,
        status,
        checkInTime: calcCheckIn,
        checkOutTime: calcCheckOut,
        halfSalaryDeduct: dayType === 'Half Day',
      };
      await apiClient.post("/admin/attendance/update", payload);
      setSuccess('Attendance updated successfully');
      setTimeout(() => {
        if (typeof onSaved === 'function') onSaved();
        onClose();
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleWaivePenalty = async () => {
    setWaivingPenalty(true);
    setError('');
    try {
      const payload = {
        employeeId: attendance.employeeId || attendance._id,
        date: date || getTodayStr(),
        status: 'Present',
        penaltyWaivedByAdmin: true,
      };
      await apiClient.post("/admin/attendance/update", payload);
      setSuccess('Penalty absent waived! Attendance marked as Present.');
      setTimeout(() => {
        if (typeof onSaved === 'function') onSaved();
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to waive penalty');
    } finally {
      setLoading(false);
    }
  };

  const isPenalty = attendance?.isPenaltyAbsent && !attendance?.penaltyWaivedByAdmin;
  const empName = attendance?.name || "Staff Member";
  const empCode = attendance?.employeeCode || attendance?.employeeIdCode || attendance?.employeeId || "";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[2px] flex justify-end transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[390px] sm:max-w-[420px] h-full shadow-2xl border-l border-slate-200/90 flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                <Clock size={15} />
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Edit Attendance</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Quick Panel
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 truncate mt-1">
              Adjust check-in, check-out times & shift status
            </p>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            onClick={onClose}
            title="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-slate-800">
          {/* Employee Info Card */}
          <div className="p-3 bg-slate-50/80 border border-slate-200/90 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {String(empName).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">{empName}</div>
              <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {empCode ? `ID: ${empCode}` : "Selected Employee"}
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {isPenalty && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
              <ShieldAlert size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-rose-800 uppercase text-[10px] tracking-wide">
                  Penalty Absent Active
                </div>
                <div className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                  Leave applied &lt; 7 days in advance. You can waive it below.
                </div>
              </div>
            </div>
          )}

          {attendance?.penaltyWaivedByAdmin && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
              <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
              <span>Penalty has been waived by admin</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
              <CheckCircle size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form Fields: Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Date
              </label>
              <input
                type="date"
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Status
              </label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active (Working)</option>
                <option value="Present">Present</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
          </div>

          {/* Day Type (Full Day / Half Day) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Shift Day Type
            </label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              value={dayType}
              onChange={(e) => setDayType(e.target.value)}
            >
              <option value="Full Day">Full Day (Standard Shift)</option>
              <option value="Half Day">Half Day (Half Salary Deduct)</option>
            </select>
          </div>

          {/* Check-in & Check-out Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Clock size={11} className="text-emerald-600" />
                <span>Check‑In Time</span>
              </label>
              <input
                type="time"
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Clock size={11} className="text-rose-600" />
                <span>Check‑Out Time</span>
              </label>
              <input
                type="time"
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>
          </div>

          {/* Waive Penalty Button */}
          {isPenalty && (
            <button
              type="button"
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              onClick={handleWaivePenalty}
              disabled={loading || waivinPenalty}
            >
              <ShieldCheck size={14} />
              <span>{waivinPenalty ? 'Waiving Penalty…' : '⚡ Waive Penalty & Mark Present'}</span>
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-xs transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            onClick={handleSave}
            disabled={loading || waivinPenalty}
          >
            <Save size={13} />
            <span>{loading ? 'Saving Changes…' : 'Save Changes'}</span>
          </button>
          <button
            type="button"
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
            onClick={onClose}
            disabled={loading || waivinPenalty}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
