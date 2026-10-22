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
const DEFAULT_FROM = process.env.EMAIL_FROM || '"ImmiGo" <abhishekyadav36219@gmail.com>';

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
    <div class="title">Congratulations, ${vendorName}!</div>
    <div class="text">
      Your compliance documents have been verified and your signed Memorandum of Understanding (MOU) has been fully approved by the ImmiGo Administration Team.
      Your vendor partner account is now <strong>Fully Active</strong> with complete operational access.
    </div>

    <div class="info-box">
      <strong>Vendor ID:</strong> ${vendorId}<br>
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

  const recipients = [to];
  if (designatedRecipient && designatedRecipient !== to && !recipients.includes(designatedRecipient)) {
    recipients.push(designatedRecipient);
  }

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Vendor Account Activated: ${vendorName} (${vendorId})`,
    html: htmlContent,
    text: `Dear ${vendorName},\n\nCongratulations! Your vendor partner account (${vendorId}) has been fully activated by ImmiGo Admin. You now have complete access to candidate deployment, overseas projects, and milestone management.\n\nPortal Access: ${loginUrl}\n\nBest regards,\nImmiGo Operations Team`,
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


export const sendCredentialsEmail = async ({
  to,
  name = "Team Member",
  role = "User",
  loginId = "",
  email = "",
  password = "",
  portalUrl = "",
  loginType = "Enterprise Portal",
}) => {
  const finalPortalUrl = portalUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/employee/login`;
  const designatedRecipient = process.env.VENDOR_NOTIFICATION_EMAIL || "abhishekyadav36219@gmail.com";
  const isEmployee = loginType.toLowerCase().includes("employee");

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Credentials - ImmiGo</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
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
            Workforce & Global Operations
          </div>
        </td>
      </tr>
    </table>

    <div class="title">Welcome, ${name}!</div>
    <div class="text">
      Your official account for the <strong>${loginType}</strong> (${role}) has been created successfully. Please find your sign-in credentials and portal access link below:
    </div>

    <div class="creds-box">
      <div class="cred-row">
        <span class="cred-label">${isEmployee ? "Employee ID (Login ID):" : "Login ID:"}</span>
        <span class="cred-value" style="color: #2563eb;">${loginId || to}</span>
      </div>
      ${email ? `
      <div class="cred-row">
        <span class="cred-label">Company Email:</span>
        <span class="cred-value" style="font-family: inherit; font-weight: 600;">${email}</span>
      </div>` : ""}
      <div class="cred-row">
        <span class="cred-label">Password:</span>
        <span class="cred-value">${password}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Portal URL:</span>
        <span class="cred-value"><a href="${finalPortalUrl}" style="color: #2563eb; text-decoration: underline;">${finalPortalUrl}</a></span>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${finalPortalUrl}" class="btn">Sign In to Portal</a>
    </div>

    <div class="text" style="font-size: 12px; color: #64748b;">
      <em>Security Notice:</em> For your account security, we recommend logging in promptly and updating your password under Account Settings. Please keep your credentials strictly confidential.
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ImmiGo. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const recipients = Array.isArray(to) ? to : [to];
  if (designatedRecipient && !recipients.includes(designatedRecipient)) {
    recipients.push(designatedRecipient);
  }

  const mailOptions = {
    from: DEFAULT_FROM,
    to: recipients.join(", "),
    subject: `[ImmiGo] Official Account Credentials & Access Details (${loginType})`,
    html: htmlContent,
    text: `Dear ${name},\n\nYour official account for ${loginType} (${role}) has been created successfully.\n\n${isEmployee ? "Employee ID (Login ID)" : "Login ID"}: ${loginId || to}\n${email ? `Company Email: ${email}\n` : ""}Password: ${password}\nPortal URL: ${finalPortalUrl}\n\nPlease keep your credentials confidential.\n\nBest regards,\nImmiGo Team`,
  };

  logger.info(`[CREDENTIALS EMAIL DISPATCH] Destination: ${mailOptions.to} | LoginId: ${loginId}`);

  if (!transporter) {
    logger.info("Transporter not active. Simulated credentials email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Credentials email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send credentials email:", error);
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

  if (!transporter) {
    logger.info("Transporter not active. Simulated candidate approval email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
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

  if (!transporter) {
    logger.info("Transporter not active. Simulated candidate rejection email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
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

  if (!transporter) {
    logger.info("Transporter not active. Simulated interview email dispatched.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
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
  totalAmount = 40000,
}) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0f172a; margin: 0;">🎉 Congratulations, ${candidateName}!</h2>
      <p style="color: #10b981; font-weight: bold; margin-top: 4px;">You have been officially SELECTED!</p>
    </div>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>We are thrilled to inform you that you have been selected for the position of <strong>${position || "Specialist"}</strong> on project <strong>${projectName}</strong>.</p>
    
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0f172a;">Next Steps & Milestone Processing:</h4>
      <p style="margin: 4px 0; font-size: 14px;">• Your overseas deployment pipeline and processing milestones have been initiated.</p>
      <p style="margin: 4px 0; font-size: 14px;">• Step 1: Selection & Document Clearance.</p>
      <p style="margin: 4px 0; font-size: 14px;">• Track all milestones, upload proofs, and manage payments directly in your Candidate Portal.</p>
    </div>

    <div style="text-align: center; margin: 25px 0;">
      <a href="http://localhost:5173/candidate/dashboard" style="background: #0f2744; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
        View Process & Milestones
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
    text: `Congratulations ${candidateName}! You have been selected for ${position} on ${projectName}. Please login to your Candidate Portal to view your processing milestones.`,
  };

  if (!transporter) {
    logger.info(`Simulated selection email dispatched to ${to}`);
    return { success: true, simulated: true };
  }
  try {
    const info = await transporter.sendMail(mailOptions);
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
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px;">
    <h3 style="color: #0f2744; margin-top: 0;">Processing Stage Update 🚀</h3>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>Your processing status for project <strong>${projectName}</strong> has progressed.</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Milestone:</strong> ${milestoneName}</p>
      <p style="margin: 4px 0;"><strong>Stage:</strong> ${stageName}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${stageStatus}</span></p>
      ${remarks ? `<p style="margin: 4px 0;"><strong>Remarks:</strong> ${remarks}</p>` : ""}
    </div>

    <p style="font-size: 14px;">Log in to your Candidate Portal to check your updated timeline and download clearance certificates.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="http://localhost:5173/candidate/dashboard" style="background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
        Open Candidate Portal
      </a>
    </div>
  </div>
</body>
</html>
  `;

  if (!transporter) return { success: true, simulated: true };
  try {
    const info = await transporter.sendMail({
      from: DEFAULT_FROM,
      to,
      subject: `Processing Update: ${stageName} is now ${stageStatus} - ${projectName}`,
      html: htmlContent,
      text: `Processing Update for ${candidateName}: ${stageName} is now ${stageStatus} on ${projectName}.`,
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
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>We have successfully verified and received your payment for project <strong>${projectName}</strong>.</p>
    
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Receipt #:</strong> ${receiptNumber || "N/A"}</p>
      <p style="margin: 4px 0;"><strong>Milestone:</strong> ${milestoneName}</p>
      <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${Number(amount).toLocaleString()}</p>
      <p style="margin: 4px 0;"><strong>Payment Mode:</strong> ${paymentMode || "Online Transfer"}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> Verified & Approved</p>
    </div>

    <p style="font-size: 13px; color: #64748b;">The next processing stage for your overseas deployment has been unlocked.</p>
  </div>
</body>
</html>
  `;

  if (!transporter) return { success: true, simulated: true };
  try {
    const info = await transporter.sendMail({
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
  sendVendorRegistrationApprovedEmail,
  sendVendorActivationEmail,
  sendCredentialsEmail,
  sendCandidateApprovalEmail,
  sendCandidateRejectionEmail,
  sendCandidateInterviewEmail,
  sendCandidateSelectionEmail,
  sendCandidateMilestoneUpdateEmail,
  sendCandidatePaymentReceiptEmail,
};

