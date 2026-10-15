import React from "react";
import {
  Building2,
  XCircle,
  UserCheck,
  Briefcase,
  Paperclip,
  UploadCloud,
  Mail,
  Send,
} from "lucide-react";

export function AdminAddVendorModal({
  isOpen,
  onClose,
  newVendorForm,
  setNewVendorForm,
  handleAddVendorSubmit,
  addVendorLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="text-blue-600" size={22} />
              <span>Register New Vendor Agency</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Fill out agency legal details, operational location, contact info, statutory document uploads, and portal access credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <XCircle size={22} />
          </button>
        </div>

        <form onSubmit={handleAddVendorSubmit} className="space-y-6 text-xs">
          {/* SECTION 1: AGENCY LEGAL & BUSINESS DETAILS */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <Building2 size={14} className="text-blue-600" />
              <span>1. Agency Legal & Statutory Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Agency / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVendorForm.companyName}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, companyName: e.target.value })
                  }
                  placeholder="e.g. Apex Global Manpower Consultants"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Business Structure / Type</label>
                <select
                  value={newVendorForm.businessType}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, businessType: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                >
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP (Limited Liability Partnership)</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Public Limited">Public Limited</option>
                  <option value="Other">Other Registration</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade License / Reg #</label>
                <input
                  type="text"
                  value={newVendorForm.registrationNumber}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, registrationNumber: e.target.value })
                  }
                  placeholder="e.g. REG-IND-99421"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Establishment Year</label>
                <input
                  type="text"
                  value={newVendorForm.establishmentYear}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, establishmentYear: e.target.value })
                  }
                  placeholder="e.g. 2018"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={newVendorForm.gstin}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, gstin: e.target.value })
                  }
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">PAN Card Number</label>
                <input
                  type="text"
                  value={newVendorForm.pan}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, pan: e.target.value })
                  }
                  placeholder="e.g. ABCDE1234F"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Website URL</label>
                <input
                  type="text"
                  value={newVendorForm.website}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, website: e.target.value })
                  }
                  placeholder="https://www.apexmanpower.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTACT PERSON & OFFICE LOCATION */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <UserCheck size={14} className="text-blue-600" />
              <span>2. Contact Person & Office Location</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={newVendorForm.contactPersonName}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, contactPersonName: e.target.value })
                  }
                  placeholder="e.g. Rajesh Varma"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={newVendorForm.designation}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, designation: e.target.value })
                  }
                  placeholder="e.g. Managing Director"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newVendorForm.email}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, email: e.target.value })
                  }
                  placeholder="vendor@company.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Mobile / Phone</label>
                <input
                  type="text"
                  value={newVendorForm.phone}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alternate Phone Number</label>
                <input
                  type="text"
                  value={newVendorForm.alternatePhone}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, alternatePhone: e.target.value })
                  }
                  placeholder="+91 98765 00000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={newVendorForm.city}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, city: e.target.value })
                  }
                  placeholder="Mumbai"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={newVendorForm.state}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, state: e.target.value })
                  }
                  placeholder="Maharashtra"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={newVendorForm.country}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, country: e.target.value })
                  }
                  placeholder="India"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pin Code</label>
                <input
                  type="text"
                  value={newVendorForm.pinCode}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, pinCode: e.target.value })
                  }
                  placeholder="400013"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Complete Office Address</label>
              <input
                type="text"
                value={newVendorForm.address}
                onChange={(e) =>
                  setNewVendorForm({ ...newVendorForm, address: e.target.value })
                }
                placeholder="Suite 402, Trade Link Towers, Senapati Bapat Marg, Lower Parel, Mumbai"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* SECTION 3: OPERATIONS & CAPACITIES */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <Briefcase size={14} className="text-blue-600" />
              <span>3. Operational Capacities & Trades</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Specialization Trades</label>
                <input
                  type="text"
                  value={newVendorForm.specialization}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, specialization: e.target.value })
                  }
                  placeholder="e.g. Construction, Electrical, Welding, Healthcare"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Countries / Destinations Served</label>
                <input
                  type="text"
                  value={newVendorForm.countriesServed}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, countriesServed: e.target.value })
                  }
                  placeholder="e.g. UAE, Saudi Arabia, Qatar, Oman"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Industry Experience (Yrs)</label>
                <input
                  type="text"
                  value={newVendorForm.experienceYears}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, experienceYears: e.target.value })
                  }
                  placeholder="e.g. 8"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Available Candidate Pool</label>
                <input
                  type="text"
                  value={newVendorForm.availableCandidates}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, availableCandidates: e.target.value })
                  }
                  placeholder="e.g. 150"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Capacity</label>
                <input
                  type="text"
                  value={newVendorForm.monthlyCapacity}
                  onChange={(e) =>
                    setNewVendorForm({ ...newVendorForm, monthlyCapacity: e.target.value })
                  }
                  placeholder="e.g. 50"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: STATUTORY DOCUMENTS & PORTAL CREDENTIALS */}
          <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
              <Paperclip size={14} className="text-blue-600" />
              <span>4. Statutory Document Uploads & Credentials</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Trade License / Reg Cert Doc</span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newVendorForm.tradeLicenseDocName}
                    onChange={(e) =>
                      setNewVendorForm({ ...newVendorForm, tradeLicenseDocName: e.target.value })
                    }
                    placeholder="Trade_License_Certificate.pdf"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                    <UploadCloud size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            alert("Please upload a PDF file.");
                            return;
                          }
                          setNewVendorForm((prev) => ({ ...prev, tradeLicenseDocName: file.name }));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Recruitment License Document</span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newVendorForm.recruitmentLicenseDocName}
                    onChange={(e) =>
                      setNewVendorForm({ ...newVendorForm, recruitmentLicenseDocName: e.target.value })
                    }
                    placeholder="Recruitment_Agency_License.pdf"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                    <UploadCloud size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            alert("Please upload a PDF file.");
                            return;
                          }
                          setNewVendorForm((prev) => ({ ...prev, recruitmentLicenseDocName: file.name }));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>GST Certificate Document</span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newVendorForm.gstDocName}
                    onChange={(e) =>
                      setNewVendorForm({ ...newVendorForm, gstDocName: e.target.value })
                    }
                    placeholder="GSTIN_Registration_Certificate.pdf"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                    <UploadCloud size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            alert("Please upload a PDF file.");
                            return;
                          }
                          setNewVendorForm((prev) => ({ ...prev, gstDocName: file.name }));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>PAN Card Copy Document <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newVendorForm.panDocName}
                    onChange={(e) =>
                      setNewVendorForm({ ...newVendorForm, panDocName: e.target.value })
                    }
                    placeholder="PAN_Card_Copy.pdf"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                    <UploadCloud size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== "application/pdf") {
                            alert("Please upload a PDF file.");
                            return;
                          }
                          setNewVendorForm((prev) => ({ ...prev, panDocName: file.name }));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80">
              <label className="block font-bold text-slate-800 mb-1">
                Vendor Portal Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newVendorForm.password}
                onChange={(e) =>
                  setNewVendorForm({ ...newVendorForm, password: e.target.value })
                }
                placeholder="Password@123"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-blue-900"
              />
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                This password will be dispatched to vendor email address for initial portal login.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/90 rounded-2xl border border-blue-200 text-blue-900 flex items-start gap-2.5">
            <Mail size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-semibold leading-relaxed">
              Upon creation, vendor account status will be set to <strong>Approved</strong>. An automated dispatch notification containing Vendor ID, Password, and Login URL will be generated and ready to copy.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addVendorLoading}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {addVendorLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={15} />
                  <span>Create Vendor & Generate Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
