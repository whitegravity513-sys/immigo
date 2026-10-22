import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  Key,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Camera,
  Upload,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function Profile() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  
  const [companyName, setCompanyName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [specialization, setSpecialization] = useState("");

  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    try {
      setLoading(true);
      const cur = crmVendorService.getCurrentVendor();
      if (cur) {
        setVendor(cur);
        setCompanyName(cur.companyName || "");
        setProfileImage(cur.profileImage || cur.logo || "");
        setPhone(cur.phone || "");
        setAlternatePhone(cur.alternatePhone || "");
        setWebsite(cur.website || "");
        setAddress(cur.address || "");
        setCity(cur.city || "");
        setState(cur.state || "");
        setContactPersonName(cur.contactPersonName || "");
        setContactPersonEmail(cur.contactPersonEmail || "");
        setContactPersonPhone(cur.contactPersonPhone || "");
        setSpecialization(cur.specialization || "");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image file size must be less than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setProfileImage(base64);
      try {
        const updated = await crmVendorService.updateVendorProfile(vendor.id, {
          profileImage: base64,
        });
        setVendor(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setSaveError("Failed to update profile image.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);

    try {
      const updated = await crmVendorService.updateVendorProfile(vendor.id, {
        companyName,
        profileImage,
        phone,
        alternatePhone,
        website,
        address,
        city,
        state,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
        specialization,
      });
      setVendor(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }

    try {
      await crmVendorService.changeVendorPassword(vendor.id, oldPassword, newPassword);
      setPwdSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (err) {
      setPwdError(err.message || "Password update failed");
    }
  };

  if (loading || !vendor) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Loading vendor profile...</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 max-w-full w-full mx-auto space-y-3 font-sans text-slate-800">
      {}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" />
          <span>Vendor Dossier</span>
        </div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Organization Profile & Credentials
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Maintain your statutory company registration, primary contacts, logo/avatar, and security credentials.
        </p>
      </div>

      {}
      <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative group shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={vendor.companyName}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                {vendor.companyName?.slice(0, 2).toUpperCase()}
              </div>
            )}

            <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-md transition-all hover:scale-110">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{vendor.companyName}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {vendor.status || "Approved"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vendor ID: <span className="font-mono font-medium text-slate-700">{vendor.id}</span> • Reg No: <span className="font-mono">{vendor.registrationNumber}</span>
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 sm:text-right">
          <div>Verified On: <span className="font-semibold text-slate-700">{vendor.verifiedAt ? new Date(vendor.verifiedAt).toLocaleDateString() : "Approved"}</span></div>
          <div>Recruitment License: <span className="font-semibold text-indigo-600">Active</span></div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-2xs p-3 sm:p-3.5">
        <h3 className="text-xs font-bold text-slate-900 mb-2.5 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <span>Company & Contact Details</span>
        </h3>

        {saveSuccess && (
          <div className="mb-2.5 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Profile updated successfully.
          </div>
        )}

        {saveError && (
          <div className="mb-2.5 p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {saveError}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={companyName}
                disabled
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Website
              </label>
              <input
                type="url"
                value={website}
                disabled
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Agency Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alternate Phone / Landline
              </label>
              <input
                type="text"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Designated Operations Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={contactPersonName}
                  disabled
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Direct Email</label>
                <input
                  type="email"
                  value={contactPersonEmail}
                  onChange={(e) => setContactPersonEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile / WhatsApp</label>
                <input
                  type="text"
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Office Address</label>
              <input
                type="text"
                value={address}
                disabled
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={city}
                disabled
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">State / Province</label>
              <input
                type="text"
                value={state}
                disabled
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Manpower Specialization</label>
              <input
                type="text"
                value={specialization}
                disabled
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-xs"
              />
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-2xs p-3 sm:p-3.5">
        <h3 className="text-xs font-bold text-slate-900 mb-2.5 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
          <Lock className="w-5 h-5 text-indigo-600" />
          <span>Security & Password</span>
        </h3>

        {pwdSuccess && (
          <div className="mb-2.5 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Password updated successfully.
          </div>
        )}

        {pwdError && (
          <div className="mb-2.5 p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {pwdError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm"
            >
              <Key className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
