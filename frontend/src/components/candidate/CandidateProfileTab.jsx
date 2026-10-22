import React from "react";
import { Save } from "lucide-react";

export default function CandidateProfileTab({
  profileForm,
  setProfileForm,
  onSaveProfile,
  saveLoading = false,
}) {
  return (
    <form
      onSubmit={onSaveProfile}
      className="bg-white rounded-lg p-3.5 sm:p-4 border border-slate-200 shadow-2xs space-y-3"
    >
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-[#0f2744]">
          Personal Information
        </h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Basic candidate details and identity coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Full Name
          </label>
          <input
            type="text"
            required
            value={profileForm.fullName}
            onChange={(e) =>
              setProfileForm({ ...profileForm, fullName: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Mobile Number
          </label>
          <input
            type="tel"
            required
            value={profileForm.phone}
            onChange={(e) =>
              setProfileForm({ ...profileForm, phone: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Date of Birth
          </label>
          <input
            type="date"
            value={profileForm.dob}
            onChange={(e) =>
              setProfileForm({ ...profileForm, dob: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Gender
          </label>
          <select
            value={profileForm.gender}
            onChange={(e) =>
              setProfileForm({ ...profileForm, gender: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none cursor-pointer"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Permanent Residential Address
          </label>
          <input
            type="text"
            placeholder="Street / House No / Area"
            value={profileForm.address}
            onChange={(e) =>
              setProfileForm({ ...profileForm, address: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            City
          </label>
          <input
            type="text"
            value={profileForm.city}
            onChange={(e) =>
              setProfileForm({ ...profileForm, city: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            State / Province
          </label>
          <input
            type="text"
            value={profileForm.state}
            onChange={(e) =>
              setProfileForm({ ...profileForm, state: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Postal / Zip Code
          </label>
          <input
            type="text"
            value={profileForm.pincode}
            onChange={(e) =>
              setProfileForm({ ...profileForm, pincode: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100">
        <h2 className="text-xs sm:text-sm font-semibold text-[#0f2744]">
          Professional & Trade Information
        </h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Work experience, trade specialization, and overseas deployment preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Trade / Domain Specialization
          </label>
          <input
            type="text"
            placeholder="e.g. Electrician, Welder, Nurse, Cook"
            value={profileForm.trade}
            onChange={(e) =>
              setProfileForm({ ...profileForm, trade: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Preferred Job Role
          </label>
          <input
            type="text"
            placeholder="e.g. Senior Technician, Line Cook"
            value={profileForm.preferredJobRole}
            onChange={(e) =>
              setProfileForm({ ...profileForm, preferredJobRole: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Experience (Years)
          </label>
          <input
            type="number"
            min="0"
            max="40"
            value={profileForm.experienceYears}
            onChange={(e) =>
              setProfileForm({ ...profileForm, experienceYears: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Key Skills (Comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. MIG Welding, Blueprint Reading, Safety Compliance"
            value={profileForm.skills}
            onChange={(e) =>
              setProfileForm({ ...profileForm, skills: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Preferred Deployment Countries
          </label>
          <input
            type="text"
            placeholder="e.g. UAE, Saudi Arabia, Qatar, Malaysia"
            value={profileForm.countryPreference}
            onChange={(e) =>
              setProfileForm({ ...profileForm, countryPreference: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Passport Number (If held)
          </label>
          <input
            type="text"
            placeholder="e.g. Z1234567"
            value={profileForm.passportNumber}
            onChange={(e) =>
              setProfileForm({ ...profileForm, passportNumber: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Passport Expiry Date
          </label>
          <input
            type="date"
            value={profileForm.passportExpiry}
            onChange={(e) =>
              setProfileForm({ ...profileForm, passportExpiry: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
            Languages Spoken
          </label>
          <input
            type="text"
            placeholder="e.g. English, Hindi, Arabic"
            value={profileForm.languages}
            onChange={(e) =>
              setProfileForm({ ...profileForm, languages: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-100">
        <button
          type="submit"
          disabled={saveLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0f2744] hover:bg-[#163660] rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={13} />
          <span>{saveLoading ? "Saving Changes..." : "Save Profile & Continue"}</span>
        </button>
      </div>
    </form>
  );
}
