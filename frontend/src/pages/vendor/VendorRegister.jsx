import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import VendorRegisterShowcase from "../../components/vendor/register/VendorRegisterShowcase.jsx";
import VendorRegisterForm from "../../components/vendor/register/VendorRegisterForm.jsx";
import VendorRegisterSuccess from "../../components/vendor/register/VendorRegisterSuccess.jsx";

export function VendorRegister() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPersonName: "",
    email: "",
    mobile: "",
    state: "",
    city: "",
    address: "",
    pan: "",
    gstin: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [submittedVendor, setSubmittedVendor] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.companyName.trim()) {
      errors.companyName = "Company Name is required";
    }

    if (!formData.contactPersonName.trim()) {
      errors.contactPersonName = "Contact Person is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email address";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim().replace(/\D/g, ""))) {
      errors.mobile = "Enter 10-digit mobile";
    }

    if (!formData.state) {
      errors.state = "Select state";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    const panClean = formData.pan.trim().toUpperCase();
    if (!panClean) {
      errors.pan = "PAN is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean)) {
      errors.pan = "Invalid PAN format";
    }

    if (formData.gstin.trim()) {
      const gstClean = formData.gstin.trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstClean)) {
        errors.gstin = "Invalid GSTIN format";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Min 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactPersonName: formData.contactPersonName.trim(),
        email: formData.email.trim().toLowerCase(),
        loginEmail: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        state: formData.state,
        city: formData.city.trim(),
        address: formData.address.trim(),
        pan: formData.pan.trim().toUpperCase(),
        gstin: formData.gstin.trim().toUpperCase() || undefined,
        password: formData.password,
        status: "Registration Pending",
      };

      const res = await crmVendorService.register(payload);
      setSubmittedVendor(res.vendor || payload);
      setSuccessSubmitted(true);
    } catch (err) {
      console.error("Vendor registration failed:", err);
      const msg = err.response?.data?.message || err.message || "Registration failed. Please check inputs.";
      if (msg.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: "An agency with this email already exists." }));
      } else if (msg.toLowerCase().includes("mobile") || msg.toLowerCase().includes("phone")) {
        setFieldErrors((prev) => ({ ...prev, mobile: "This mobile number is already registered." }));
      } else {
        setGeneralError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
      <VendorRegisterShowcase />

      <div className="w-full lg:w-1/2 xl:w-[48%] min-h-screen flex flex-col justify-between px-4 sm:px-8 lg:px-10 xl:px-14 py-6 bg-white overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <ImmiGoLogo size="sm" subtitle="Partner Network" />
          <Link
            to="/login"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Already registered? Log In</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="w-full max-w-xl mx-auto my-auto py-6">
          {successSubmitted ? (
            <VendorRegisterSuccess
              vendorName={submittedVendor?.companyName || formData.companyName}
              email={formData.email}
            />
          ) : (
            <VendorRegisterForm
              formData={formData}
              fieldErrors={fieldErrors}
              generalError={generalError}
              loading={loading}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0">
          <span>&copy; {new Date().getFullYear()} ImmiGo CRM &bull; Designed by White Gravity Web Solutions</span>
          <span className="flex items-center gap-1 text-slate-500 font-medium">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>SSL Secured</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default VendorRegister;
