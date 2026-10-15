import React from "react";
import {
  Calendar as CalendarIcon,
  Phone,
  HeartHandshake,
  MapPin,
  Building,
  Award,
  Briefcase,
} from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export function EmployeeProfileHeader({
  emp,
  safeEmpName,
  formatDate,
  formatFileUrl,
  postDojWorkingDays,
  presentCount,
  halfDayCount,
  absentCount,
}) {
  if (!emp) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {emp.profileImage ? (
            <img
              src={formatFileUrl(emp.profileImage)}
              alt={safeEmpName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-3xl shadow-md shrink-0">
              {safeEmpName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {safeEmpName}
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  emp.status === "inactive"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {emp.status ? emp.status.toUpperCase() : "ACTIVE"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-medium">
              <EmployeeIdBadge id={emp.employeeId} />
              <span>&bull;</span>
              <span className="text-slate-500">
                {emp.department || "General Department"}
              </span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-800">
                {emp.designation || "Employee"}
              </span>
            </div>
            <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              <p>
                <span className="text-slate-400 font-medium">Work Email:</span>{" "}
                <span className="font-semibold text-slate-700">{emp.email}</span>
              </p>
              {emp.personalEmail && (
                <p>
                  <span className="text-slate-400 font-medium">Personal Email:</span>{" "}
                  <span className="font-semibold text-slate-700">
                    {emp.personalEmail}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <CalendarIcon size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Joining Date
            </span>
            <span className="font-bold text-slate-800">
              {emp.joiningDate ? formatDate(emp.joiningDate) : "Not specified"}
            </span>
            {emp.leavingDate && (
              <span className="text-rose-600 block font-semibold text-[11px]">
                Left: {formatDate(emp.leavingDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <Phone size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Contact Phone
            </span>
            <span className="font-bold text-slate-800">
              {emp.phone || "No phone added"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <HeartHandshake size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Emergency Contact
            </span>
            <span className="font-bold text-slate-800">
              {emp.emergencyContact?.name
                ? `${emp.emergencyContact.name} (${
                    emp.emergencyContact.relation || "Contact"
                  })`
                : "Not provided"}
            </span>
            {emp.emergencyContact?.phone && (
              <span className="text-slate-500 block font-semibold text-[11px]">
                {emp.emergencyContact.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <MapPin size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Residential Address
            </span>
            <span className="font-bold text-slate-800 line-clamp-2">
              {emp.address || "Address not provided"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <Building size={16} className="text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Previous Company
            </span>
            <span className="font-bold text-slate-800">
              {emp.previousCompany || "Fresher / Not specified"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <Award size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Total Experience
            </span>
            <span className="font-bold text-slate-800">
              {emp.experience || "Not specified"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <Briefcase size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Previous Package
            </span>
            <span className="font-bold text-slate-800">
              {emp.previousPackage || "N/A"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-600">
          <Briefcase size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-400 block uppercase text-[10px]">
              Current Package / CTC
            </span>
            <span className="font-bold text-emerald-700 font-black">
              {emp.currentPackage || "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
        <div className="flex flex-col items-center bg-blue-50 rounded-xl py-3 border border-blue-100">
          <span className="text-2xl font-black text-blue-700">
            {postDojWorkingDays}
          </span>
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mt-0.5">
            Working Days
          </span>
        </div>
        <div className="flex flex-col items-center bg-emerald-50 rounded-xl py-3 border border-emerald-100">
          <span className="text-2xl font-black text-emerald-600">
            {presentCount}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">
            Full Days
          </span>
        </div>
        <div className="flex flex-col items-center bg-amber-50 rounded-xl py-3 border border-amber-100">
          <span className="text-2xl font-black text-amber-600">
            {halfDayCount}
          </span>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">
            Half Days
          </span>
        </div>
        <div className="flex flex-col items-center bg-rose-50 rounded-xl py-3 border border-rose-100">
          <span className="text-2xl font-black text-rose-600">
            {absentCount}
          </span>
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide mt-0.5">
            Absent
          </span>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfileHeader;
