import { useState, useEffect } from "react";
import { adminLogin } from "../services/authService";

export const useAdminLogin = (onLoginSuccess) => {
  const [email, setEmail] = useState("admin@vesta.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const data = await adminLogin(email, password);
      if (data && data.accessToken) {
        if (onLoginSuccess) {
          onLoginSuccess(data.accessToken, { email: data.admin.email, role: "admin" }, "admin");
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Admin login credentials validation failed.");
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    loading,
    errorMsg,
    successMsg,
    handleCredentialsSubmit
  };
};
