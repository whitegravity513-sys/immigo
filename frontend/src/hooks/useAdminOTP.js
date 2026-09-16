import { useState, useEffect, useRef } from "react";
import { adminVerifyOTP } from "../services/authService";

export const useAdminOTP = (email, onVerifySuccess, onResend, setErrorMsg, setSuccessMsg, setLoading) => {
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(45);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (otpRefs[0].current) {
      otpRefs[0].current.focus();
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (/^[0-9]$/.test(value) || value === "") {
      const newDigits = [...otpDigits];
      newDigits[index] = value;
      setOtpDigits(newDigits);

      if (value !== "" && index < 5) {
        otpRefs[index + 1].current.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && otpDigits[index] === "" && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^[0-9]{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtpDigits(digits);
      otpRefs[5].current.focus();
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const data = await adminVerifyOTP(email, otpCode);
      onVerifySuccess(data.accessToken, { email: data.admin.email, role: "admin" }, "admin");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await onResend();
      setResendTimer(45);
      setOtpDigits(["", "", "", "", "", ""]);
      setSuccessMsg("A fresh verification OTP has been sent to your email.");
      setTimeout(() => {
        if (otpRefs[0].current) otpRefs[0].current.focus();
      }, 100);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Resending OTP failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec) => {
    const min = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${min.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return {
    otpDigits,
    resendTimer,
    otpRefs,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleOtpVerifySubmit,
    handleResendClick,
    formatTimer
  };
};
