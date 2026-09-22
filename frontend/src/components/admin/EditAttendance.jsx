import { useState } from 'react';
import apiClient from '../../services/apiClient.js';
import { CheckCircle, AlertCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Modal component for admin to edit an employee's check‑in / check‑out times.
 * Also allows admin to waive penalty absents applied due to < 7 day advance notice.
 */
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
      setTimeout(() => { onSaved(); onClose(); }, 800);
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
      setTimeout(() => { onSaved(); onClose(); }, 900);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to waive penalty');
    } finally {
      setLoading(false);
    }
  };

  const isPenalty = attendance.isPenaltyAbsent && !attendance.penaltyWaivedByAdmin;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-base font-black text-slate-800">Edit Attendance</h3>
          <button className="text-slate-500 text-xl cursor-pointer p-1" onClick={onClose}>×</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Penalty Alert Banner */}
          {isPenalty && (
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <ShieldAlert size={18} className="text-rose-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-black text-rose-700 uppercase tracking-wide">Penalty Absent</div>
                <div className="text-xs text-rose-600 mt-0.5">
                  Auto-marked because leave was applied less than <strong>7 days</strong> in advance. Admin can waive this penalty below.
                </div>
              </div>
            </div>
          )}

          {attendance.penaltyWaivedByAdmin && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
              <ShieldCheck size={16} /> Penalty waived by admin
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-100 text-rose-700 rounded text-xs">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-xs">
              <CheckCircle size={16} /> <span>{success}</span>
            </div>
          )}

          {/* Employee */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Employee</label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold"
              value={attendance.name || attendance.employeeId}
              readOnly
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active (Working Now)</option>
              <option value="Present">Present</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          {/* Day Type (Full Day / Half Day) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Day Type</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
              value={dayType}
              onChange={(e) => setDayType(e.target.value)}
            >
              <option value="Full Day">Full Day (8+ Hours)</option>
              <option value="Half Day">Half Day (&lt; 8 Hours)</option>
            </select>
          </div>

          {/* Check-In */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Check‑In Time</label>
            <input
              type="time"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </div>

          {/* Check-Out */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Check‑Out Time</label>
            <input
              type="time"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              onClick={handleSave}
              disabled={loading || waivinPenalty}
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition-colors"
              onClick={onClose}
              disabled={loading || waivinPenalty}
            >
              Cancel
            </button>
          </div>

          {/* Waive Penalty Button - only shown if it's a penalty absent */}
          {isPenalty && (
            <button
              className="w-full py-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={handleWaivePenalty}
              disabled={loading || waivinPenalty}
            >
              <ShieldCheck size={16} />
              {waivinPenalty ? 'Waiving Penalty…' : '⚡ Waive Penalty & Mark Present'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
