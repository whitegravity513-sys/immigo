import React from "react";
import { Award } from "lucide-react";

export function EmployeePaymentsTab({ emp, formatDate }) {
  if (!emp) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Award size={18} className="text-blue-600" />
            Employee Compensation & Package Records
          </h4>
          <p className="text-xs text-slate-500">
            Official compensation and package details recorded during employee onboarding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            Current Package (CTC)
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 block">
            {emp?.currentPackage ||
              (emp?.salary
                ? `₹${Number(emp.salary * 12).toLocaleString()} / yr`
                : "N/A")}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            As recorded in employment contract
          </span>
        </div>

        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Monthly Net Salary
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 block">
            {emp?.monthlySalary
              ? `₹${Number(emp.monthlySalary).toLocaleString()}`
              : emp?.salary
              ? `₹${Number(emp.salary).toLocaleString()}`
              : "Not Disclosed"}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            Monthly disbursement baseline
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Previous Package (CTC)
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 block">
            {emp?.previousPackage || "N/A"}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Prior employment compensation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
          <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Employment Details
          </h5>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Designation / Role</span>
              <span className="font-bold text-slate-900">
                {emp?.role || emp?.designation || "Staff Member"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Department</span>
              <span className="font-bold text-slate-900">
                {emp?.department || "General"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Employment Status</span>
              <span className="font-bold text-emerald-700 capitalize">
                {emp?.status || "Active"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Date of Joining</span>
              <span className="font-bold text-slate-900">
                {emp?.joiningDate ? formatDate(emp.joiningDate) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
          <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Experience & Background
          </h5>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Total Work Experience</span>
              <span className="font-bold text-slate-900">
                {emp?.experience ? `${emp.experience} Years` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Previous Company</span>
              <span className="font-bold text-slate-900">
                {emp?.previousCompany || "N/A"}
              </span>
            </div>
            {emp?.bankDetails?.accountNumber || emp?.accountNumber ? (
              <>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="font-bold text-slate-900">
                    {emp.bankDetails?.bankName || emp.bankName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Account Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {emp.bankDetails?.accountNumber || emp.accountNumber}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Bank Account Details</span>
                <span className="text-slate-400 font-medium">
                  Not provided during registration
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeePaymentsTab;
