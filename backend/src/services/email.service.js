import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import "../config/env.js";
import { logger } from "../utils/logger.js";
import { UPLOAD_ROOT } from "../utils/fileStorage.js";
import { generateMouPdfBuffer } from "../utils/mouPdfGenerator.js";

const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : "";
  const rawPass = process.env.SMTP_PASS;
  const pass = rawPass ? rawPass.trim().replace(/\s+/g, "") : "";
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || user === "your_email@gmail.com") {
    logger.warn("SMTP credentials not fully configured in .env. Falling back to development console mode.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

let transporter = createTransporter();
export const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};
const DEFAULT_FROM = process.env.EMAIL_FROM || '"ImmiGo" <abhishekyadav36219@gmail.com>';

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const resolveVendorRecipients = (to) => {
  const designatedRecipient = process.env.VENDOR_NOTIFICATION_EMAIL || "abhishekyadav36219@gmail.com";
  const recipients = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
  if (designatedRecipient && !recipients.includes(designatedRecipient)) {
    recipients.push(designatedRecipient);
  }
  return recipients;
};

const MIME_EXT_MAP = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
};

const buildMouPdfAttachment = (vendor = {}, stage = "issued", filePrefix = "MOU") => {
  try {
    const cleanVendorCode = String(vendor?.vendorId || "VENDOR").replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanMouNum = String(vendor?.mouDocument?.mouNumber || vendor?.mouDocument?.refNumber || "IMMIGO")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const pdfBuffer = generateMouPdfBuffer(vendor, { stage });
    if (!pdfBuffer || !pdfBuffer.length) return null;
    return {
      filename: `${filePrefix}_${cleanVendorCode}_${cleanMouNum}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    };
  } catch (err) {
    logger.error("Failed to generate MOU PDF attachment:", err);
    return null;
  }
};

const buildUploadedMouAttachment = (fileUrl = "", baseName = "Signed_MOU_Copy") => {
  try {
    const src = String(fileUrl || "").trim();
    if (!src) return null;

    if (src.startsWith("data:")) {
      const match = src.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/s);
      if (!match) return null;
      const mimeType = String(match[1]).toLowerCase();
      const ext = MIME_EXT_MAP[mimeType] || ".pdf";
      const buf = Buffer.from(match[2].trim(), "base64");
      if (!buf.length || buf.length > 10 * 1024 * 1024) return null;
      return {
        filename: `${baseName}${ext}`,
        content: buf,
        contentType: mimeType,
      };
    }

    if (src.startsWith("/uploads/")) {
      const rel = src.replace(/^\/uploads\//, "");
      const resolved = path.resolve(UPLOAD_ROOT, rel);
      if (!resolved.startsWith(`${UPLOAD_ROOT}${path.sep}`)) return null;
      if (!fs.existsSync(resolved)) return null;
      const ext = path.extname(resolved) || ".pdf";
      return {
        filename: `${baseName}${ext}`,
        path: resolved,
      };
    }

    return null;
  } catch (err) {
    logger.error("Failed to prepare uploaded MOU attachment:", err);
    return null;
  }
};

const generateOtpEmailTemplate = ({ otp, purposeTitle, name = "User", expiryMinutes = 10 }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${purposeTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      margin: 0;
      padding: 24px;
    }
    .email-card {
      max-width: 520px;
      margin: 0 auto;
      background: linear-gradient(180deg, #161e2e 0%, #0f172a 100%);
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 36px 28px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .brand-logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #38bdf8;
      text-align: center;
      margin-bottom: 24px;
    }
    .heading {
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
      text-align: center;
      margin-bottom: 12px;
    }
    .description {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      text-align: center;
      margin-bottom: 28px;
    }
    .otp-container {
      background: #090d16;
      border: 1px dashed #38bdf8;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      margin-bottom: 28px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #38bdf8;
      font-family: monospace;
      margin: 0;
    }
    .warning-box {
      background: rgba(239, 68, 68, 0.08);
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #fca5a5;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #1e293b;
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-card">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: -1px; line-height: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">immi</span><span style="font-size: 30px; font-weight: 900; color: #38bdf8; letter-spacing: -1px; line-height: 1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Go</span><span style="font-size: 26px; font-weight: 900; color: #fb923c; margin-left: 3px;">&#10140;</span>
      <div style="font-size: 10px; font-weight: 800; color: #38bdf8; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Security & Authentication
      </div>
    </div>
    <div class="heading">${purposeTitle}</div>
    <div class="description">
      Dear <strong>${name}</strong>,<br>
      We received a verification request for your account. Please use the following One-Time Password (OTP) to proceed:
    </div>
    
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>
    
    <div class="warning-box">
      <strong>Security Notice:</strong> This verification code is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once. For your account security, never share this code with anyone. ImmiGo representatives will never ask for your code.
    </div>
    
    <div class="footer">
      If you did not initiate this request, please disregard this email or contact support to secure your account.<br>
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

export const sendOtpEmail = async ({ to, otp, purpose, name = "User" }) => {
  let purposeTitle = "Your Verification Code";
  if (purpose === "PASSWORD_RESET") {
    purposeTitle = "Password Reset Verification Code";
  } else if (purpose === "EMAIL_VERIFICATION") {
    purposeTitle = "Verify Your Email Address";
  } else if (purpose === "LOGIN_2FA") {
    purposeTitle = "Two-Factor Authentication Code";
  }

  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
  const htmlContent = generateOtpEmailTemplate({
    otp,
    purposeTitle,
    name,
    expiryMinutes,
  });

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: `[ImmiGo] ${purposeTitle}: ${otp}`,
    html: htmlContent,
    text: `Dear ${name},\n\nYour ImmiGo verification code for ${purposeTitle} is: ${otp}.\n\nThis code will expire in ${expiryMinutes} minutes. For your security, do not share this code with anyone.\n\nBest regards,\nImmiGo Team`,
  };

  logger.info(`[OTP DISPATCH] Destination: ${to} | Purpose: ${purpose}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated email dispatch successful.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send email via SMTP:", error);
    return { success: false, error: error.message };
  }
};


export const sendVendorRegistrationApprovedEmail = async ({
  to,
  vendorName = "Vendor Partner",
  vendorId = "",
  loginEmail = "",
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const loginUrl = `${finalPortalUrl}/vendor/login`;
  const designatedRecipient = process.env.VENDOR_NOTIFICATION_EMAIL || "abhishekyadav36219@gmail.com";

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vendor Registration Approved - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #a7f3d0; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .info-box { background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.8; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-bottom: 24px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Partner Onboarding Network
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">Registration Approved &bull; Compliance Review</div>
    <div class="title">Welcome, ${vendorName}!</div>
    <div class="text">
      We are pleased to inform you that your vendor partner registration has been reviewed and approved by the ImmiGo Administration Team.
      Your portal access is now active. Please sign in to submit your required compliance documents to complete onboarding.
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${vendorId}<br>
      <strong>Login Email:</strong> ${loginEmail || to}<br>
      <strong>Portal Access URL:</strong> <a href="${loginUrl}">${loginUrl}</a><br>
      <strong>Next Step:</strong> Upload required compliance documents (PAN Card, Business Registration / GST Certificate) in your onboarding portal.
    </div>

    <a href="${loginUrl}" class="btn">Access Vendor Portal</a>

    <div class="text" style="font-size: 12px; color: #64748b;">
      <em>Security Notice:</em> For your account security, passwords are encrypted and never sent via email. You can manage or reset your password anytime using the "Forgot Password" link on the portal sign-in page.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  
  const recipients = [to];
  if (designatedRecipient && designatedRecipient !== to && !recipients.includes(designatedRecipient)) {
    recipients.push(designatedRecipient);
  }

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Vendor Registration Approved: ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nYour vendor registration with ImmiGo has been reviewed and approved. Please sign in to your onboarding portal to upload your required compliance documents.\n\nLogin Email: ${loginEmail || to}\nPortal Access: ${loginUrl}\n\nBest regards,\nImmiGo Operations Team`,
  };

  logger.info(`[VENDOR APPROVAL EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor approval email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor approval email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor approval email:", error);
    return { success: false, error: error.message };
  }
};


export const sendVendorRegistrationConfirmationEmail = async ({
  to,
  vendorName = "Vendor Partner",
  contactPerson = "",
  vendorId = "",
  loginEmail = "",
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const loginUrl = `${finalPortalUrl}/vendor/login`;
  const recipients = resolveVendorRecipients(to);
  const safeName = escapeHtml(contactPerson || vendorName);
  const safeCompany = escapeHtml(vendorName);
  const safeId = escapeHtml(vendorId);
  const safeEmail = escapeHtml(loginEmail || to);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vendor Registration Received - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #bfdbfe; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .info-box { background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.8; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-bottom: 24px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">
            Partner Onboarding Network
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">Registration Submitted &bull; Pending Admin Approval</div>
    <div class="title">Welcome, ${safeName}!</div>
    <div class="text">
      Thank you for registering <strong>${safeCompany}</strong> as a Vendor Partner with ImmiGo. Your registration has been received successfully and is currently under review by the ImmiGo Administration Team.
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${safeId}<br>
      <strong>Agency Name:</strong> ${safeCompany}<br>
      <strong>Login Email:</strong> ${safeEmail}<br>
      <strong>Current Status:</strong> Registration Pending Verification<br>
      <strong>Next Step:</strong> Once Admin approves your registration, you will receive an approval confirmation email to log in, submit compliance documents, and execute your partnership MOU.
    </div>

    <a href="${loginUrl}" class="btn">Vendor Portal Sign In</a>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Vendor Registration Received: ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Dear ${contactPerson || vendorName},\n\nThank you for registering ${vendorName} (${vendorId}) with ImmiGo.\n\nYour registration is currently pending Admin verification. Once approved, you will receive a confirmation email to sign in and complete document verification and MOU execution.\n\nLogin Email: ${loginEmail || to}\nVendor Portal: ${loginUrl}\n\nBest regards,\nImmiGo Operations Team`,
  };

  logger.info(`[VENDOR REGISTRATION CONFIRMATION EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor registration confirmation email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor registration confirmation email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor registration confirmation email:", error);
    return { success: false, error: error.message };
  }
};

export const sendVendorDocCorrectionEmail = async ({
  to,
  vendorName = "Vendor Partner",
  vendorId = "",
  remarks = "",
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const docsUrl = `${finalPortalUrl}/vendor/documents?tab=company`;
  const recipients = resolveVendorRecipients(to);
  const safeName = escapeHtml(vendorName);
  const safeId = escapeHtml(vendorId);
  const safeRemarks = escapeHtml(remarks || "Please re-upload clearer copies of your compliance documents.");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document Correction Required - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #fff7ed; color: #c2410c; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #fed7aa; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .remark-box { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.7; color: #92400e; }
    .btn { display: inline-block; background-color: #d97706; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-bottom: 24px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
    </div>
    <div class="badge">Action Required &bull; Compliance Documents</div>
    <div class="title">Document Correction Requested (${safeName})</div>
    <div class="text">
      Our Compliance Review Team reviewed your submitted documents for Vendor ID <strong>${safeId}</strong> and requires updated copies before issuing your MOU.
    </div>
    <div class="remark-box">
      <strong>Admin Remarks:</strong><br>${safeRemarks}
    </div>
    <a href="${docsUrl}" class="btn">Re-upload Compliance Documents</a>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Action Required: Document Correction Requested (${vendorId})`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nAdmin has requested corrections on your compliance documents (${vendorId}).\nRemarks: ${remarks}\n\nPlease log in to re-upload clear documents: ${docsUrl}\n\nBest regards,\nImmiGo Operations Team`,
  };

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor document correction email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor document correction email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor document correction email:", error);
    return { success: false, error: error.message };
  }
};

export const sendVendorDocsVerifiedAndMouIssuedEmail = async ({
  to,
  vendor = {},
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const mouUrl = `${finalPortalUrl}/vendor/documents?openMou=1`;
  const vendorName = vendor.companyName || vendor.contactPersonName || "Vendor Partner";
  const vendorId = vendor.vendorId || "";
  const mouDoc = vendor.mouDocument || {};
  const mouNumber = mouDoc.mouNumber || mouDoc.refNumber || "MOU-IMMIGO";
  const agreementDate = mouDoc.agreementDate || new Date().toISOString().split("T")[0];
  const validityYears = mouDoc.validityYears || "1 Year";
  const recipients = resolveVendorRecipients(to || vendor.email);

  const safeName = escapeHtml(vendorName);
  const safeId = escapeHtml(vendorId);
  const safeMouNum = escapeHtml(mouNumber);
  const safeDate = escapeHtml(agreementDate);
  const safeValidity = escapeHtml(validityYears);

  const mouAttachment = buildMouPdfAttachment(vendor, "issued", "MOU");
  const attachments = mouAttachment ? [mouAttachment] : [];

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Documents Verified &amp; MOU Issued - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #a7f3d0; }
    .title { font-size: 19px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.65; color: #475569; margin-bottom: 18px; }
    .info-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.85; color: #1e293b; }
    .step-box { background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.7; color: #312e81; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 8px; text-decoration: none; margin-bottom: 22px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">
            Legal &amp; Compliance Desk
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">&check; Documents Verified &bull; Official MOU Issued</div>
    <div class="title">Compliance Verified &amp; Official MOU Ready, ${safeName}!</div>
    <div class="text">
      Great news! Your submitted compliance documents for <strong>${safeName}</strong> have been verified and approved by the ImmiGo Administration Team. Your official <strong>Memorandum of Understanding (MOU)</strong> has now been issued and is attached to this email as a PDF.
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${safeId}<br>
      <strong>MOU Reference No.:</strong> ${safeMouNum}<br>
      <strong>Agreement Date:</strong> ${safeDate}<br>
      <strong>Validity Term:</strong> ${safeValidity}<br>
      <strong>Attached Document:</strong> Official MOU Agreement PDF (${safeId})
    </div>

    <div class="step-box">
      <strong>Next Step &mdash; Review &amp; Sign Your MOU:</strong><br>
      1. Review the attached official MOU PDF carefully.<br>
      2. Sign in to the Vendor Portal to either <strong>Digitally Sign</strong> online OR <strong>Download, Sign &amp; Stamp</strong> and upload your signed copy.<br>
      3. Once your signed MOU is verified by Admin, your Vendor Portal will be <strong>Fully Activated</strong>.
    </div>

    <a href="${mouUrl}" class="btn">Review &amp; Sign MOU on Portal</a>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Documents Verified & Official MOU Issued (${mouNumber}) - ${vendorName}`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nYour compliance documents (${vendorId}) have been verified by ImmiGo Admin and your Official MOU (${mouNumber}) has been issued.\n\nThe MOU agreement PDF is attached to this email. Please review and sign it on the Vendor Portal (Digitally Sign or Download, Sign/Stamp & Upload Signed Copy):\n${mouUrl}\n\nBest regards,\nImmiGo Legal & Operations Team`,
    attachments,
  };

  logger.info(`[VENDOR DOCS VERIFIED & MOU ISSUED EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId} | MOU: ${mouNumber} | Attachments: ${attachments.length}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor MOU issued email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor docs verified & MOU issued email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor MOU issued email:", error);
    return { success: false, error: error.message };
  }
};

export const sendVendorMouSignedConfirmationEmail = async ({
  to,
  vendor = {},
  signMethod = "digital",
  signatoryName = "",
  designation = "",
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const mouUrl = `${finalPortalUrl}/vendor/documents?openMou=1`;
  const vendorName = vendor.companyName || vendor.contactPersonName || "Vendor Partner";
  const vendorId = vendor.vendorId || "";
  const mouNumber = vendor?.mouDocument?.mouNumber || vendor?.mouDocument?.refNumber || "MOU-IMMIGO";
  const methodLabel = signMethod === "upload" ? "Uploaded Signed & Stamped Copy" : "Digital Signature";
  const resolvedSignatory = signatoryName || vendor?.signedMou?.signatoryName || vendor.contactPersonName || "Authorized Signatory";
  const resolvedDesignation = designation || vendor?.signedMou?.designation || "Authorized Signatory";
  const signedAtStr = new Date(vendor?.signedMou?.signedAt || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const recipients = resolveVendorRecipients(to || vendor.email);

  const safeName = escapeHtml(vendorName);
  const safeId = escapeHtml(vendorId);
  const safeMouNum = escapeHtml(mouNumber);
  const safeMethod = escapeHtml(methodLabel);
  const safeSignatory = escapeHtml(resolvedSignatory);
  const safeDesig = escapeHtml(resolvedDesignation);

  const attachments = [];
  const signedPdfAttachment = buildMouPdfAttachment(vendor, "signed", "Signed_MOU");
  if (signedPdfAttachment) attachments.push(signedPdfAttachment);

  if (signMethod === "upload") {
    const uploadedUrl = vendor.signedMouDocUrl || vendor?.signedMou?.signedFileUrl || "";
    const cleanCode = String(vendorId || "VENDOR").replace(/[^a-zA-Z0-9_-]/g, "_");
    const uploadedAttachment = buildUploadedMouAttachment(uploadedUrl, `Uploaded_Signed_MOU_${cleanCode}`);
    if (uploadedAttachment) attachments.push(uploadedAttachment);
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Signed MOU Confirmation - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #fde68a; }
    .title { font-size: 19px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.65; color: #475569; margin-bottom: 18px; }
    .info-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 22px; font-size: 13px; line-height: 1.85; color: #1e293b; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 26px; border-radius: 8px; text-decoration: none; margin-bottom: 22px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">
            Partner Onboarding Network
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">Signed MOU Received &bull; Pending Admin Approval</div>
    <div class="title">Signed MOU Submitted Successfully, ${safeName}!</div>
    <div class="text">
      This confirms that the signed <strong>Memorandum of Understanding (MOU)</strong> for <strong>${safeName}</strong> has been received and recorded on the ImmiGo platform. Our Administration Team will review and issue final approval shortly. A copy of your signed MOU is attached to this email.
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${safeId}<br>
      <strong>MOU Reference No.:</strong> ${safeMouNum}<br>
      <strong>Signing Method:</strong> ${safeMethod}<br>
      <strong>Authorized Signatory:</strong> ${safeSignatory} (${safeDesig})<br>
      <strong>Submitted On:</strong> ${escapeHtml(signedAtStr)}<br>
      <strong>Current Status:</strong> Pending Admin Verification &amp; Activation
    </div>

    <a href="${mouUrl}" class="btn">View Submitted MOU Status</a>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Signed MOU Submitted (${mouNumber}) - ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nYour signed MOU (${mouNumber}) for Vendor ID ${vendorId} has been submitted successfully via ${methodLabel}.\nSignatory: ${resolvedSignatory} (${resolvedDesignation})\nStatus: Pending Admin Verification & Activation.\n\nA copy of the signed MOU is attached to this email.\nView Status: ${mouUrl}\n\nBest regards,\nImmiGo Operations Team`,
    attachments,
  };

  logger.info(`[VENDOR MOU SIGNED EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId} | Method: ${signMethod} | Attachments: ${attachments.length}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor signed MOU confirmation email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor signed MOU confirmation email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor signed MOU confirmation email:", error);
    return { success: false, error: error.message };
  }
};

export const sendVendorMouCorrectionEmail = async ({
  to,
  vendorName = "Vendor Partner",
  vendorId = "",
  remarks = "",
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const mouUrl = `${finalPortalUrl}/vendor/documents?openMou=1`;
  const recipients = resolveVendorRecipients(to);
  const safeName = escapeHtml(vendorName);
  const safeId = escapeHtml(vendorId);
  const safeRemarks = escapeHtml(remarks || "Please re-submit a clear signed & stamped MOU copy.");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MOU Re-submission Requested - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #fff7ed; color: #c2410c; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #fed7aa; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .remark-box { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.7; color: #92400e; }
    .btn { display: inline-block; background-color: #d97706; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-bottom: 24px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
    </div>
    <div class="badge">MOU Correction Requested</div>
    <div class="title">Signed MOU Re-submission Required (${safeName})</div>
    <div class="text">
      Our Administration Team reviewed your submitted MOU for Vendor ID <strong>${safeId}</strong> and has requested an updated submission before activation.
    </div>
    <div class="remark-box">
      <strong>Admin Remarks:</strong><br>${safeRemarks}
    </div>
    <a href="${mouUrl}" class="btn">Re-submit Signed MOU</a>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Action Required: MOU Re-submission Requested (${vendorId})`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nAdmin has requested a re-submission of your signed MOU (${vendorId}).\nRemarks: ${remarks}\n\nPlease re-submit on the Vendor Portal: ${mouUrl}\n\nBest regards,\nImmiGo Operations Team`,
  };

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor MOU correction email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor MOU correction email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor MOU correction email:", error);
    return { success: false, error: error.message };
  }
};

export const sendVendorActivationEmail = async ({
  to,
  vendorName = "Vendor Partner",
  vendorId = "",
  portalUrl = "",
  vendor = null,
}) => {
  const finalPortalUrl = portalUrl || process.env.FRONTEND_URL || "http://localhost:5173";
  const loginUrl = `${finalPortalUrl}/vendor/login`;
  const recipients = resolveVendorRecipients(to);
  const mouNumber = vendor?.mouDocument?.mouNumber || vendor?.mouDocument?.refNumber || "";

  const attachments = [];
  if (vendor) {
    const approvedPdf = buildMouPdfAttachment(vendor, "approved", "Executed_MOU");
    if (approvedPdf) attachments.push(approvedPdf);
    if (vendor.mouSignMethod === "upload" && (vendor.signedMouDocUrl || vendor?.signedMou?.signedFileUrl)) {
      const cleanCode = String(vendorId || "VENDOR").replace(/[^a-zA-Z0-9_-]/g, "_");
      const uploadedCopy = buildUploadedMouAttachment(
        vendor.signedMouDocUrl || vendor?.signedMou?.signedFileUrl,
        `Uploaded_Signed_MOU_${cleanCode}`
      );
      if (uploadedCopy) attachments.push(uploadedCopy);
    }
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vendor Account Activated - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #a7f3d0; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.8; color: #166534; }
    .btn { display: inline-block; background-color: #16a34a; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-bottom: 24px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #2563eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Partner Operations Network
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">&check; Fully Active Partner</div>
    <div class="title">Congratulations, ${escapeHtml(vendorName)}!</div>
    <div class="text">
      Your compliance documents have been verified and your signed Memorandum of Understanding (MOU) has been fully approved by the ImmiGo Administration Team.
      Your vendor partner account is now <strong>Fully Active</strong> with complete operational access.${attachments.length ? " Your final approved MOU copy is attached for your records." : ""}
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${escapeHtml(vendorId)}<br>
      ${mouNumber ? `<strong>MOU Reference No.:</strong> ${escapeHtml(mouNumber)}<br>` : ""}
      <strong>Account Status:</strong> Active Partner &bull; Full Operational Privileges<br>
      <strong>Enabled Operations:</strong> Access to Overseas Deployment Projects, Candidate Profile Submissions, Milestone Tracking, and Payment Settlements.
    </div>

    <a href="${loginUrl}" class="btn">Launch Operational Dashboard</a>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Vendor Account Activated: ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nCongratulations! Your vendor partner account (${vendorId}) has been fully activated by ImmiGo Admin and your MOU${mouNumber ? ` (${mouNumber})` : ""} is officially approved. You now have complete access to candidate deployment, overseas projects, and milestone management.\n\nPortal Access: ${loginUrl}\n\nBest regards,\nImmiGo Operations Team`,
    attachments,
  };

  logger.info(`[VENDOR ACTIVATION EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId} | Attachments: ${attachments.length}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated vendor activation email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Vendor activation email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor activation email:", error);
    return { success: false, error: error.message };
  }
};


export const sendCredentialsEmail = async ({
  to,
  name = "Team Member",
  role = "User",
  loginId = "",
  email = "",
  password = "",
  department = "",
  portalUrl = "",
  loginType = "Enterprise Portal",
  isPasswordReset = false,
}) => {
  const finalPortalUrl = portalUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/employee/login`;
  const designatedRecipient = process.env.VENDOR_NOTIFICATION_EMAIL || "abhishekyadav36219@gmail.com";
  const isEmployee = loginType.toLowerCase().includes("employee");

  const safeName = escapeHtml(name);
  const safeRole = escapeHtml(role);
  const safeLoginId = escapeHtml(loginId || (Array.isArray(to) ? to[0] : to));
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const safeDept = escapeHtml(department);
  const safeLoginType = escapeHtml(loginType);
  const safePortalUrl = escapeHtml(finalPortalUrl);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isPasswordReset ? "Updated Account Credentials" : "Account Credentials"} - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #eef2ff; color: #3730a3; font-size: 11px; font-weight: 700; margin-bottom: 14px; border: 1px solid #c7d2fe; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; }
    .cred-row { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { font-weight: 600; color: #64748b; margin-right: 8px; }
    .cred-value { font-weight: 800; color: #0f172a; font-family: monospace; font-size: 14px; }
    .btn { display: inline-block; background-color: #3b2875; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; margin-bottom: 20px; text-align: center; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #3b2875; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #3b2875; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Workforce &amp; Global Operations
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">${safeLoginType} &bull; ${isPasswordReset ? "Credentials Updated" : "Account Activated"}</div>
    <div class="title">${isPasswordReset ? `Credentials Updated, ${safeName}` : `Welcome, ${safeName}!`}</div>
    <div class="text">
      ${isPasswordReset
        ? `Your login credentials for the <strong>${safeLoginType}</strong> (${safeRole}) have been updated by an administrator. Please use the updated credentials below to sign in:`
        : `Your official account for the <strong>${safeLoginType}</strong> (${safeRole}) has been created successfully. Please find your sign-in credentials and portal access link below:`}
    </div>

    <div class="creds-box">
      <div class="cred-row">
        <span class="cred-label">${isEmployee ? "Employee ID (Login ID):" : "Login ID:"}</span>
        <span class="cred-value" style="color: #2563eb;">${safeLoginId}</span>
      </div>
      ${email ? `
      <div class="cred-row">
        <span class="cred-label">Company Email:</span>
        <span class="cred-value" style="font-family: inherit; font-weight: 600;">${safeEmail}</span>
      </div>` : ""}
      ${department ? `
      <div class="cred-row">
        <span class="cred-label">Department / Role:</span>
        <span class="cred-value" style="font-family: inherit; font-weight: 600;">${safeDept} (${safeRole})</span>
      </div>` : ""}
      <div class="cred-row">
        <span class="cred-label">Password:</span>
        <span class="cred-value">${safePassword}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Portal URL:</span>
        <span class="cred-value"><a href="${safePortalUrl}" style="color: #2563eb; text-decoration: underline;">${safePortalUrl}</a></span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${safePortalUrl}" class="btn">Sign In to Portal</a>
    </div>

    <div class="text" style="font-size: 12px; color: #64748b;">
      <em>Security Notice:</em> Please keep your credentials strictly confidential and sign in using your ${isEmployee ? "Employee ID" : "Login ID"} above.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const recipients = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
  if (designatedRecipient && !recipients.includes(designatedRecipient)) {
    recipients.push(designatedRecipient);
  }

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: isPasswordReset
      ? `[ImmiGo] Updated Account Credentials & Access Details (${loginType})`
      : `[ImmiGo] Official Account Credentials & Access Details (${loginType})`,
    html: htmlContent,
    text: `Dear ${name},\n\n${isPasswordReset ? `Your login credentials for ${loginType} (${role}) have been updated.` : `Your official account for ${loginType} (${role}) has been created successfully.`}\n\n${isEmployee ? "Employee ID (Login ID)" : "Login ID"}: ${loginId || to}\n${email ? `Company Email: ${email}\n` : ""}${department ? `Department: ${department}\n` : ""}Password: ${password}\nPortal URL: ${finalPortalUrl}\n\nPlease keep your credentials confidential.\n\nBest regards,\nImmiGo Team`,
  };

  logger.info(`[CREDENTIALS EMAIL DISPATCH] Destination: ${mailOptions.to} | LoginId: ${loginId} | Reset: ${isPasswordReset}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated credentials email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Credentials email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send credentials email:", error);
    return { success: false, error: error.message };
  }
};

export const sendStaffAccountCredentialsEmail = async ({
  to,
  name = "Staff Member",
  email = "",
  staffId = "",
  password = "",
  roleLabel = "Staff",
  department = "",
  assignedVendors = [],
  isPasswordReset = false,
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/login`;
  const loginEmail = email || to;
  const vendorListStr = Array.isArray(assignedVendors) && assignedVendors.length > 0 ? assignedVendors.join(", ") : "";

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(loginEmail);
  const safeStaffId = escapeHtml(staffId);
  const safePassword = escapeHtml(password);
  const safeRole = escapeHtml(roleLabel);
  const safeDept = escapeHtml(department);
  const safeVendors = escapeHtml(vendorListStr);
  const safePortalUrl = escapeHtml(finalPortalUrl);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Staff Portal Access - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #eef2ff; color: #3730a3; font-size: 11px; font-weight: 700; margin-bottom: 14px; border: 1px solid #c7d2fe; }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .creds-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; }
    .cred-row { padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { font-weight: 600; color: #64748b; margin-right: 8px; }
    .cred-value { font-weight: 800; color: #0f172a; font-family: monospace; font-size: 14px; }
    .btn { display: inline-block; background-color: #3b2875; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; margin-bottom: 20px; text-align: center; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td valign="middle" style="line-height: 1;">
          <span style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #3b2875; letter-spacing: -1px;">Go</span><span style="font-size: 24px; font-weight: 900; color: #f97316; margin-left: 3px;">&#10140;</span>
          <div style="font-size: 10px; font-weight: 800; color: #3b2875; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">
            Admin &amp; Management Portal
          </div>
        </td>
      </tr>
    </table>

    <div class="badge">${safeRole} &bull; ${isPasswordReset ? "Credentials Updated" : "Account Created"}</div>
    <div class="title">${isPasswordReset ? `Credentials Updated, ${safeName}` : `Welcome, ${safeName}!`}</div>
    <div class="text">
      ${isPasswordReset
        ? `Your login credentials for the <strong>${safeRole}</strong> portal account have been updated by an administrator. Use your updated credentials below to sign in:`
        : `Your official <strong>${safeRole}</strong> portal account has been created. Use the login credentials and portal link below to access your workspace:`}
    </div>

    <div class="creds-box">
      <div class="cred-row">
        <span class="cred-label">Role:</span>
        <span class="cred-value" style="font-family: inherit;">${safeRole}</span>
      </div>
      ${staffId ? `
      <div class="cred-row">
        <span class="cred-label">Staff / HR ID (Login ID):</span>
        <span class="cred-value" style="color: #2563eb;">${safeStaffId}</span>
      </div>` : ""}
      <div class="cred-row">
        <span class="cred-label">Login Email:</span>
        <span class="cred-value" style="color: #2563eb; font-family: inherit;">${safeEmail}</span>
      </div>
      ${department ? `
      <div class="cred-row">
        <span class="cred-label">Department:</span>
        <span class="cred-value" style="font-family: inherit; font-weight: 600;">${safeDept}</span>
      </div>` : ""}
      ${vendorListStr ? `
      <div class="cred-row">
        <span class="cred-label">Assigned Vendors:</span>
        <span class="cred-value" style="font-family: inherit; font-weight: 600;">${safeVendors}</span>
      </div>` : ""}
      <div class="cred-row">
        <span class="cred-label">Password:</span>
        <span class="cred-value">${safePassword}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Portal URL:</span>
        <span class="cred-value"><a href="${safePortalUrl}" style="color: #2563eb; text-decoration: underline;">${safePortalUrl}</a></span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${safePortalUrl}" class="btn">Sign In to ${safeRole} Portal</a>
    </div>

    <div class="text" style="font-size: 12px; color: #64748b;">
      <em>Security Notice:</em> ${staffId ? "You may sign in using either your Staff / HR ID or your registered Login Email." : "Please sign in using your registered Login Email."} Keep these credentials strictly confidential.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: isPasswordReset
      ? `[ImmiGo] Updated Portal Login Credentials (${roleLabel})`
      : `[ImmiGo] Your Staff Portal Account Credentials (${roleLabel})`,
    html: htmlContent,
    text: `Dear ${name},\n\n${isPasswordReset ? `Your ${roleLabel} portal credentials have been updated.` : `Your ${roleLabel} portal account has been created.`}\n\nRole: ${roleLabel}\n${staffId ? `Staff / HR ID (Login ID): ${staffId}\n` : ""}Login Email: ${loginEmail}\n${department ? `Department: ${department}\n` : ""}${vendorListStr ? `Assigned Vendors: ${vendorListStr}\n` : ""}Password: ${password}\nPortal URL: ${finalPortalUrl}\n\nBest regards,\nImmiGo Team`,
  };

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info(`[STAFF CREDENTIALS EMAIL SIMULATED] To: ${to} | Role: ${roleLabel}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Staff credentials email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send staff credentials email:", error);
    return { success: false, error: error.message };
  }
};

export const sendCandidateApprovalEmail = async ({
  to,
  candidateName = "Candidate",
  candidateId = "",
  portalUrl = "",
}) => {
  const finalPortalUrl = portalUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/candidate/login`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Congratulations! Your Immigo Account Has Been Approved</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 36px 32px; box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08); }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; background-color: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 700; margin-bottom: 20px; border: 1px solid #bae6fd; }
    .title { font-size: 22px; font-weight: 800; color: #0f2744; margin-bottom: 16px; line-height: 1.3; }
    .text { font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 20px; }
    .steps-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .steps-card h3 { font-size: 15px; font-weight: 700; color: #0f2744; margin-top: 0; margin-bottom: 12px; }
    .steps-list { margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.8; color: #334155; }
    .notice-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; font-size: 13px; color: #92400e; line-height: 1.6; margin-bottom: 26px; }
    .btn { display: inline-block; background-color: #0f2744; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; margin-bottom: 24px; text-align: center; }
    .signature { font-size: 14px; line-height: 1.6; color: #0f2744; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .footer { padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div style="margin-bottom: 24px;">
      <span style="font-size: 28px; font-weight: 900; color: #0f2744; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">immi</span><span style="font-size: 28px; font-weight: 900; color: #0284c7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -1px;">Go</span>
      <div style="font-size: 11px; font-weight: 700; color: #0284c7; letter-spacing: 1px; text-transform: uppercase; margin-top: 3px;">
        Your Global Career Partner
      </div>
    </div>

    <div class="badge">&check; Registration Approved &bull; ID: ${candidateId}</div>
    <div class="title">Congratulations! Your Immigo Account Has Been Approved</div>
    
    <div class="text">
      Dear <strong>${candidateName}</strong>,<br><br>
      Congratulations!<br><br>
      We are pleased to inform you that your registration with Immigo has been approved. Your account is now active, and you can log in to your candidate portal to continue with the next steps.
    </div>

    <div class="steps-card">
      <h3>What happens next?</h3>
      <ol class="steps-list">
        <li>Log in to your Immigo Candidate Portal using your registered email address and password.</li>
        <li>Complete your candidate profile with the required personal, educational, and professional information.</li>
        <li>Upload the required documents, including your resume and other documents requested by Immigo.</li>
        <li>Wait for our team to review and verify your submitted documents.</li>
        <li>Once your required documents are verified, you will be able to explore eligible job opportunities and apply for projects matching your skills and experience.</li>
      </ol>
    </div>

    <div class="notice-box">
      <strong>Important Notice:</strong> Please note that account approval does not guarantee job selection. Job application access depends on successful document verification and the eligibility requirements of each project.
    </div>

    <div style="text-align: center;">
      <a href="${finalPortalUrl}" class="btn">Login to Candidate Portal</a>
    </div>

    <div class="text" style="font-size: 13px; color: #64748b; text-align: center;">
      Candidate Portal Login: <a href="${finalPortalUrl}" style="color: #0284c7; word-break: break-all;">${finalPortalUrl}</a>
    </div>

    <div class="signature">
      We look forward to supporting you on your international career journey.<br><br>
      Best regards,<br>
      <strong>Team Immigo</strong><br>
      Your Global Career Partner
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Immigo. All rights reserved. | Empowering People, Building Global Careers.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `Dear ${candidateName},

Congratulations!

We are pleased to inform you that your registration with Immigo has been approved. Your account is now active, and you can log in to your candidate portal to continue with the next steps.

What happens next?

1. Log in to your Immigo Candidate Portal using your registered email address and password.
2. Complete your candidate profile with the required personal, educational, and professional information.
3. Upload the required documents, including your resume and other documents requested by Immigo.
4. Wait for our team to review and verify your submitted documents.
5. Once your required documents are verified, you will be able to explore eligible job opportunities and apply for projects matching your skills and experience.

Please note that account approval does not guarantee job selection. Job application access depends on successful document verification and the eligibility requirements of each project.

We look forward to supporting you on your international career journey.

Best regards,  
Team Immigo  
Your Global Career Partner

Candidate Portal Login: ${finalPortalUrl}`;

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: "Congratulations! Your Immigo Account Has Been Approved",
    html: htmlContent,
    text: textContent,
  };

  logger.info(`[CANDIDATE APPROVAL EMAIL] Destination: ${to} | Candidate: ${candidateId} (${candidateName})`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated candidate approval email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Candidate approval email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send candidate approval email:", error);
    return { success: false, error: error.message };
  }
};

export const sendCandidateRejectionEmail = async ({
  to,
  candidateName = "Candidate",
  candidateId = "",
  reason = "Requirements not met",
}) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Immigo Registration Update</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .reason-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.6; color: #991b1b; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 26px; font-weight: 900; color: #0f2744;">immi</span><span style="font-size: 26px; font-weight: 900; color: #0284c7;">Go</span>
    </div>
    <div class="title">Immigo Registration Status Update</div>
    <div class="text">
      Dear <strong>${candidateName}</strong>,<br><br>
      Thank you for your interest in Immigo. Our administrative team has reviewed your registration application (${candidateId}).
      Unfortunately, we are unable to approve your account at this time.
    </div>

    <div class="reason-box">
      <strong>Reason for Decision:</strong><br>
      ${reason}
    </div>

    <div class="text">
      If you believe this decision was made in error or would like further information, you may contact our support desk.
    </div>

    <div class="text">
      Best regards,<br>
      <strong>Team Immigo</strong>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Immigo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: "Update Regarding Your Immigo Registration",
    html: htmlContent,
    text: `Dear ${candidateName},\n\nThank you for your interest in Immigo. Our administrative team has reviewed your registration application (${candidateId}). Unfortunately, we are unable to approve your account at this time.\n\nReason: ${reason}\n\nBest regards,\nTeam Immigo`,
  };

  logger.info(`[CANDIDATE REJECTION EMAIL] Destination: ${to} | Candidate: ${candidateId}`);

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated candidate rejection email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send candidate rejection email:", error);
    return { success: false, error: error.message };
  }
};

export const sendCandidateInterviewEmail = async ({
  to,
  candidateName = "Candidate",
  projectName = "",
  position = "",
  interview = {},
}) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interview Scheduled - Immigo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .title { font-size: 20px; font-weight: 800; color: #0f2744; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .details-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.8; color: #166534; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div style="margin-bottom: 20px;">
      <span style="font-size: 26px; font-weight: 900; color: #0f2744;">immi</span><span style="font-size: 26px; font-weight: 900; color: #0284c7;">Go</span>
    </div>
    <div class="title">Interview Scheduled for ${position || "Selected Position"}</div>
    <div class="text">
      Dear <strong>${candidateName}</strong>,<br><br>
      We are pleased to inform you that your interview for project <strong>${projectName}</strong> has been scheduled.
    </div>

    <div class="details-box">
      <strong>Position:</strong> ${position}<br>
      <strong>Date:</strong> ${interview.scheduledDate || "TBA"}<br>
      <strong>Time:</strong> ${interview.scheduledTime || "TBA"}<br>
      <strong>Interview Mode:</strong> ${interview.mode || "Online Video"}<br>
      <strong>Link / Venue:</strong> ${interview.locationOrLink || "Will be shared by recruiter"}<br>
      ${interview.remarks ? `<strong>Special Notes:</strong> ${interview.remarks}` : ""}
    </div>

    <div class="text">
      Please ensure you are available on time and have all relevant documents ready.<br><br>
      Best regards,<br>
      <strong>Team Immigo Recruitment</strong>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Immigo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: `Interview Scheduled: ${position || "Position"} - ${projectName}`,
    html: htmlContent,
    text: `Dear ${candidateName},\n\nYour interview for ${position} (${projectName}) is scheduled.\nDate: ${interview.scheduledDate}\nTime: ${interview.scheduledTime}\nMode: ${interview.mode}\nLink/Venue: ${interview.locationOrLink}\n\nBest regards,\nTeam Immigo`,
  };

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info("Transporter not active. Simulated interview email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send interview email:", error);
    return { success: false, error: error.message };
  }
};

export const sendCandidateSelectionEmail = async ({
  to,
  candidateName,
  projectName,
  position,
}) => {
  const candidateDashUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/candidate/dashboard`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0f172a; margin: 0;">🎉 Congratulations, ${escapeHtml(candidateName)}!</h2>
      <p style="color: #10b981; font-weight: bold; margin-top: 4px;">You have been officially SELECTED!</p>
    </div>
    <p>Dear <strong>${escapeHtml(candidateName)}</strong>,</p>
    <p>We are thrilled to inform you that you have been selected for the position of <strong>${escapeHtml(position || "Specialist")}</strong> on project <strong>${escapeHtml(projectName)}</strong>.</p>
    
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0f172a;">Next Steps &amp; Milestone Processing:</h4>
      <p style="margin: 4px 0; font-size: 14px;">• Your overseas deployment pipeline and processing milestones have been initiated.</p>
      <p style="margin: 4px 0; font-size: 14px;">• Step 1: Selection &amp; Document Clearance.</p>
      <p style="margin: 4px 0; font-size: 14px;">• Track all milestones, upload proofs, and manage payments directly in your Candidate Portal.</p>
    </div>

    <div style="text-align: center; margin: 25px 0;">
      <a href="${escapeHtml(candidateDashUrl)}" style="background: #0f2744; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
        View Process &amp; Milestones
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b;">If you have any questions, our recruitment desk is always available to support you.</p>
    <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 12px; font-size: 12px; color: #94a3b8; text-align: center;">
      &copy; ${new Date().getFullYear()} Immigo Overseas Careers. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: DEFAULT_FROM,
    to,
    subject: `🎉 Congratulations! Selected for ${projectName} (${position || "Role"})`,
    html: htmlContent,
    text: `Congratulations ${candidateName}! You have been selected for ${position} on ${projectName}. Please login to your Candidate Portal (${candidateDashUrl}) to view your processing milestones.`,
  };

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    logger.info(`Simulated selection email dispatched to ${to}`);
    return { success: true, simulated: true };
  }
  try {
    const info = await activeTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send selection email:", error);
    return { success: false, error: error.message };
  }
};

export const sendCandidateMilestoneUpdateEmail = async ({
  to,
  candidateName,
  projectName,
  milestoneName,
  stageName,
  stageStatus,
  remarks,
}) => {
  const candidateDashUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/candidate/dashboard`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px;">
    <h3 style="color: #0f2744; margin-top: 0;">Processing Stage Update 🚀</h3>
    <p>Dear <strong>${escapeHtml(candidateName)}</strong>,</p>
    <p>Your processing status for project <strong>${escapeHtml(projectName)}</strong> has progressed.</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Milestone:</strong> ${escapeHtml(milestoneName)}</p>
      <p style="margin: 4px 0;"><strong>Stage:</strong> ${escapeHtml(stageName)}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${escapeHtml(stageStatus)}</span></p>
      ${remarks ? `<p style="margin: 4px 0;"><strong>Remarks:</strong> ${escapeHtml(remarks)}</p>` : ""}
    </div>

    <p style="font-size: 14px;">Log in to your Candidate Portal to check your updated timeline and download clearance certificates.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${escapeHtml(candidateDashUrl)}" style="background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
        Open Candidate Portal
      </a>
    </div>
  </div>
</body>
</html>
  `;

  const activeTransporter = getTransporter();
  if (!activeTransporter) return { success: true, simulated: true };
  try {
    const info = await activeTransporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject: `Processing Update: ${stageName} is now ${stageStatus} - ${projectName}`,
      html: htmlContent,
      text: `Processing Update for ${candidateName}: ${stageName} is now ${stageStatus} on ${projectName}. Portal: ${candidateDashUrl}`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send milestone update email:", error);
    return { success: false, error: error.message };
  }
};

export const sendCandidatePaymentReceiptEmail = async ({
  to,
  candidateName,
  projectName,
  milestoneName,
  amount,
  receiptNumber,
  paymentMode,
}) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px;">
    <h3 style="color: #10b981; margin-top: 0;">Payment Receipt Confirmation ✅</h3>
    <p>Dear <strong>${escapeHtml(candidateName)}</strong>,</p>
    <p>We have successfully verified and received your payment for project <strong>${escapeHtml(projectName)}</strong>.</p>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Receipt #:</strong> ${escapeHtml(receiptNumber || "N/A")}</p>
      <p style="margin: 4px 0;"><strong>Milestone:</strong> ${escapeHtml(milestoneName)}</p>
      <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${Number(amount).toLocaleString()}</p>
      <p style="margin: 4px 0;"><strong>Payment Mode:</strong> ${escapeHtml(paymentMode || "Online Transfer")}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> Verified &amp; Approved</p>
    </div>

    <p style="font-size: 13px; color: #64748b;">The next processing stage for your overseas deployment has been unlocked.</p>
  </div>
</body>
</html>
  `;

  const activeTransporter = getTransporter();
  if (!activeTransporter) return { success: true, simulated: true };
  try {
    const info = await activeTransporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject: `Payment Receipt: ₹${Number(amount).toLocaleString()} for ${milestoneName}`,
      html: htmlContent,
      text: `Payment Receipt: ₹${amount} received for ${milestoneName} on ${projectName}.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send payment receipt email:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOtpEmail,
  sendVendorRegistrationConfirmationEmail,
  sendVendorRegistrationApprovedEmail,
  sendVendorDocCorrectionEmail,
  sendVendorDocsVerifiedAndMouIssuedEmail,
  sendVendorMouSignedConfirmationEmail,
  sendVendorMouCorrectionEmail,
  sendVendorActivationEmail,
  sendCredentialsEmail,
  sendStaffAccountCredentialsEmail,
  sendCandidateApprovalEmail,
  sendCandidateRejectionEmail,
  sendCandidateInterviewEmail,
  sendCandidateSelectionEmail,
  sendCandidateMilestoneUpdateEmail,
  sendCandidatePaymentReceiptEmail,
};

