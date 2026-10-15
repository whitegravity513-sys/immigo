import React, { useState } from "react";
import { Building2, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other",
];

export function VendorRegisterForm({
  formData,
  fieldErrors,
  generalError,
  loading,
  onChange,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 size={20} className="text-blue-600 shrink-0" />
          <span>Vendor / Agency Registration</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Complete the agency profile below. Compliance documents will be submitted upon admin review.
        </p>
      </div>

      {generalError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-2.5">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Agency / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={onChange}
              placeholder="e.g. Apex Global Overseas Pvt Ltd"
              className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                fieldErrors.companyName
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.companyName && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Contact Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="contactPersonName"
              value={formData.contactPersonName}
              onChange={onChange}
              placeholder="e.g. Rajesh Sharma"
              className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                fieldErrors.contactPersonName
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.contactPersonName && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.contactPersonName}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">
                +91
              </span>
              <input
                type="tel"
                name="mobile"
                maxLength={10}
                value={formData.mobile}
                onChange={onChange}
                placeholder="9876543210"
                className={`w-full pl-10 pr-3 py-2 text-xs rounded-lg border transition-all ${
                  fieldErrors.mobile
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-300 hover:border-slate-400"
                } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
              />
            </div>
            {fieldErrors.mobile && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.mobile}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Official Email (Login ID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="contact@agency.com"
              className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                fieldErrors.email
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.email && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              State <span className="text-rose-500">*</span>
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={onChange}
              className={`w-full px-2.5 py-2 text-xs rounded-lg border transition-all bg-white cursor-pointer ${
                fieldErrors.state
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {fieldErrors.state && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.state}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              City <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder="e.g. Mumbai"
              className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                fieldErrors.city
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.city && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              PAN Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="pan"
              maxLength={10}
              value={formData.pan}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                onChange(e);
              }}
              placeholder="ABCDE1234F"
              className={`w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border transition-all ${
                fieldErrors.pan
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.pan && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.pan}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="gstin"
              maxLength={15}
              value={formData.gstin}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                onChange(e);
              }}
              placeholder="27ABCDE1234F1Z5"
              className={`w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border transition-all ${
                fieldErrors.gstin
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.gstin && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.gstin}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Office Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={onChange}
              placeholder="Office No, Street, Commercial Area"
              className={`w-full px-3 py-2 text-xs rounded-lg border transition-all ${
                fieldErrors.address
                  ? "border-rose-400 bg-rose-50/20"
                  : "border-slate-300 hover:border-slate-400"
              } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
            />
            {fieldErrors.address && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.address}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={onChange}
                placeholder="Min 6 characters"
                className={`w-full px-3 py-2 pr-9 text-xs rounded-lg border transition-all ${
                  fieldErrors.password
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-300 hover:border-slate-400"
                } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChange}
                placeholder="Re-enter password"
                className={`w-full px-3 py-2 pr-9 text-xs rounded-lg border transition-all ${
                  fieldErrors.confirmPassword
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-slate-300 hover:border-slate-400"
                } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <span>Submitting Registration...</span>
            ) : (
              <>
                <span>Submit Agency Registration</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VendorRegisterForm;
