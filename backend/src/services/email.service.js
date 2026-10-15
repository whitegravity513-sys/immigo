import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

const createTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
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

const transporter = createTransporter();

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
    <div class="brand-logo">VISTA SECURITY</div>
    <div class="heading">${purposeTitle}</div>
    <div class="description">
      Hello <strong>${name}</strong>,<br>
      We received a request for authentication. Please use the following One-Time Password (OTP) to proceed.
    </div>
    
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>
    
    <div class="warning-box">
      <strong>Important:</strong> This OTP is valid for <strong>${expiryMinutes} minutes</strong> and can only be used once. Never share this code with anyone.
    </div>
    
    <div class="footer">
      If you did not make this request, please secure your account immediately.<br>
      &copy; ${new Date().getFullYear()} Vista Enterprise Security. All rights reserved.
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
    from: process.env.EMAIL_FROM || '"Vista Security" <no-reply@vista.com>',
    to,
    subject: `[Vista Security] ${purposeTitle}: ${otp}`,
    html: htmlContent,
    text: `Your Vista Security verification code for ${purposeTitle} is: ${otp}. It will expire in ${expiryMinutes} minutes.`,
  };

  logger.info(`[OTP DISPATCH] Destination: ${to} | Purpose: ${purpose} | OTP: ${otp}`);

  if (!transporter) {
    logger.info("Transporter not active. Simulated email dispatch successful.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send email via SMTP:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Vendor Registration Approval Email
 */
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
  <title>Vendor Registration Approved - Vista</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .brand { font-size: 22px; font-weight: 800; color: #2563eb; margin-bottom: 20px; }
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
    <div class="brand">VISTA GLOBAL MANPOWER</div>
    <div class="badge">Registration Approved &bull; Documents Stage</div>
    <div class="title">Welcome, ${vendorName}!</div>
    <div class="text">
      Your vendor partner registration has been reviewed and approved by the Vista Admin team.
      Your initial account access is now enabled. Please log in to complete your compliance document submission.
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${vendorId}<br>
      <strong>Login Email:</strong> ${loginEmail || to}<br>
      <strong>Portal Access URL:</strong> <a href="${loginUrl}">${loginUrl}</a><br>
      <strong>Next Step:</strong> Upload required compliance documents (PAN, GST/Registration Certificate) in your onboarding portal.
    </div>

    <a href="${loginUrl}" class="btn">Access Vendor Portal</a>

    <div class="text" style="font-size: 12px; color: #64748b;">
      <em>Security Notice:</em> For your account security, passwords are encrypted and never sent via email. If you need to set or reset your password, please use the "Forgot Password" link on the portal login page.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Vista Global Manpower CRM. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  // Send to vendor, plus notify designated recipient if configured
  const recipients = [to];
  if (designatedRecipient && designatedRecipient !== to && !recipients.includes(designatedRecipient)) {
    recipients.push(designatedRecipient);
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Vista Partner Onboarding" <no-reply@vista.com>',
    to: recipients.join(", "),
    subject: `[Vista] Vendor Registration Approved: ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Hello ${vendorName}, your vendor registration has been approved. Login Email: ${loginEmail || to}. Access Portal: ${loginUrl}. Please upload required compliance documents.`,
  };

  logger.info(`[VENDOR APPROVAL EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId}`);

  if (!transporter) {
    logger.info("Transporter not active. Simulated vendor approval email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Vendor approval email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor approval email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Vendor Final Activation Email
 */
export const sendVendorActivationEmail = async ({
  to,
  vendorName = "Vendor Partner",
  vendorId = "",
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
  <title>Vendor Account Activated - Vista</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .brand { font-size: 22px; font-weight: 800; color: #2563eb; margin-bottom: 20px; }
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
    <div class="brand">VISTA GLOBAL MANPOWER</div>
    <div class="badge">&check; Fully Active Partner</div>
    <div class="title">Congratulations, ${vendorName}!</div>
    <div class="text">
      Your compliance documents have been verified and your signed Memorandum of Understanding (MOU) has been fully approved by Vista Admin.
      Your full operational dashboard is now <strong>Active</strong>!
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${vendorId}<br>
      <strong>Status:</strong> Active Partner &bull; Full Operational Privileges<br>
      <strong>Available Operations:</strong> Overseas Projects Access, Candidate Profile Submissions, Milestone Tracking & Payments.
    </div>

    <a href="${loginUrl}" class="btn">Launch Operational Dashboard</a>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Vista Global Manpower CRM. All rights reserved.
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
    from: process.env.EMAIL_FROM || '"Vista Partner Operations" <no-reply@vista.com>',
    to: recipients.join(", "),
    subject: `[Vista] Vendor Account Fully Activated: ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Congratulations ${vendorName}! Your vendor account (${vendorId}) is now fully active. Log in to access candidate submission and overseas projects: ${loginUrl}`,
  };

  logger.info(`[VENDOR ACTIVATION EMAIL] Recipients: ${mailOptions.to} | Vendor: ${vendorId}`);

  if (!transporter) {
    logger.info("Transporter not active. Simulated vendor activation email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Vendor activation email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send vendor activation email:", error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOtpEmail,
  sendVendorRegistrationApprovedEmail,
  sendVendorActivationEmail,
};

