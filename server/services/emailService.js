import { sendEmail } from '../config/mailer.js';
import { ENV } from '../config/env.js';

/**
 * PulsePlan Branded HTML Email Layout Wrapper
 *
 * Implements PulsePlan's visual identity:
 * - Obsidian Dark (#0B0A0F, #14121C)
 * - Cyber Lavender (#C9B8FF, #7C5CFC, #5935D6)
 * - Soft Pink (#FFD6E8)
 * - Clean high-contrast typography (#F8F6EF)
 * - Full responsive desktop & mobile support
 */
export function createBrandedEmailLayout({
  title,
  previewText,
  badgeText = 'SECURITY VERIFICATION',
  badgeColor = '#C9B8FF',
  badgeBg = 'rgba(201, 184, 255, 0.12)',
  contentHtml,
  ctaText,
  ctaUrl,
}) {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset & Base Styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0;
      padding: 0;
      background-color: #0B0A0F;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #F8F6EF;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #0B0A0F;
      padding: 32px 12px;
    }
    .card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #14121C;
      border-radius: 16px;
      border: 1px solid #272338;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 92, 252, 0.08);
      overflow: hidden;
    }
    .top-glow {
      height: 3px;
      background: linear-gradient(90deg, #7C5CFC 0%, #C9B8FF 50%, #FFD6E8 100%);
    }
    .header {
      padding: 32px 36px 24px;
      background: linear-gradient(180deg, #1A1626 0%, #14121C 100%);
      border-bottom: 1px solid #221E31;
    }
    .brand-table {
      width: 100%;
    }
    .logo-badge {
      display: inline-block;
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #5935D6 0%, #7C5CFC 100%);
      border: 1px solid rgba(201, 184, 255, 0.4);
      border-radius: 10px;
      text-align: center;
      line-height: 38px;
      font-weight: 800;
      font-size: 20px;
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(89, 53, 214, 0.4);
    }
    .logo-title {
      font-size: 20px;
      font-weight: 700;
      color: #F8F6EF;
      letter-spacing: -0.3px;
      margin: 0;
      line-height: 1.2;
    }
    .logo-sub {
      font-size: 11px;
      color: #A6A1B5;
      margin: 2px 0 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: ${badgeColor};
      background-color: ${badgeBg};
      border: 1px solid rgba(201, 184, 255, 0.25);
    }
    .content {
      padding: 36px 36px 32px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 22px;
      font-weight: 700;
      color: #F8F6EF;
      letter-spacing: -0.4px;
      line-height: 1.3;
    }
    p {
      margin: 0 0 18px;
      font-size: 15px;
      color: #D8D2E7;
      line-height: 1.6;
    }
    .otp-container {
      background: #0E0C17;
      border: 1px solid #362D50;
      border-radius: 12px;
      padding: 24px;
      margin: 28px 0;
      text-align: center;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
    }
    .otp-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #FFD6E8;
      text-shadow: 0 0 20px rgba(255, 214, 232, 0.35);
      margin: 8px 0;
      padding-left: 10px;
    }
    .otp-meta {
      font-size: 12px;
      color: #A6A1B5;
      margin-top: 8px;
    }
    .meta-box {
      background: #0E0C17;
      border: 1px solid #2B253E;
      border-radius: 10px;
      padding: 16px 20px;
      margin: 24px 0;
    }
    .meta-row {
      padding: 6px 0;
      font-size: 14px;
      border-bottom: 1px solid #1E1A2D;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-label {
      color: #A6A1B5;
      font-weight: 500;
    }
    .meta-value {
      color: #F8F6EF;
      font-weight: 600;
      float: right;
    }
    .cta-container {
      margin: 32px 0 16px;
      text-align: center;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #7C5CFC 0%, #5935D6 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 34px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 18px rgba(124, 92, 252, 0.4);
    }
    .alert-box {
      background: rgba(255, 214, 232, 0.06);
      border-left: 3px solid #FFD6E8;
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      margin: 22px 0;
      font-size: 13px;
      color: #D8D2E7;
    }
    .footer {
      padding: 24px 36px 32px;
      background-color: #0E0C16;
      border-top: 1px solid #1E1A2C;
      text-align: center;
      font-size: 12px;
      color: #79738E;
    }
    .footer a {
      color: #C9B8FF;
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .card { border-radius: 0; }
      .header { padding: 24px 20px 20px; }
      .content { padding: 26px 20px 24px; }
      .footer { padding: 20px 20px 28px; }
      .otp-code { font-size: 30px; letter-spacing: 6px; }
      .cta-btn { width: 100%; box-sizing: border-box; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #0B0A0F;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="card">
      <div class="top-glow"></div>
      <div class="header">
        <table class="brand-table" role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle; width: 48px;">
              <span class="logo-badge">P</span>
            </td>
            <td style="vertical-align: middle; padding-left: 8px;">
              <h2 class="logo-title">PulsePlan</h2>
              <p class="logo-sub">Multi-Tenant Platform</p>
            </td>
            <td style="vertical-align: middle; text-align: right;">
              <span class="badge">${badgeText}</span>
            </td>
          </tr>
        </table>
      </div>
      <div class="content">
        ${contentHtml}
        ${
          ctaText && ctaUrl
            ? `
          <div class="cta-container">
            <a href="${ctaUrl}" class="cta-btn" target="_blank">${ctaText}</a>
          </div>
        `
            : ''
        }
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px; color: #9A94AD;">Plan clearly. Move faster. Ship together.</p>
        <p style="margin: 0 0 10px;">&copy; ${new Date().getFullYear()} PulsePlan SaaS Inc. All rights reserved.</p>
        <p style="margin: 0; font-size: 11px; color: #625C73;">
          This is an automated security transmission. If you did not initiate this request, please secure your account immediately.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Dispatch 6-Digit Email OTP Verification Email
 */
export async function sendOtpEmail({
  to,
  recipientName,
  otp,
  purpose = 'Password Reset',
  expiryMinutes = 5,
}) {
  const subject = `[PulsePlan] ${otp} is your verification code`;

  const contentHtml = `
    <h1>Verify Your Identity</h1>
    <p>Hi ${recipientName || 'there'},</p>
    <p>
      We received a request for <strong>${purpose}</strong> associated with your PulsePlan account (<span style="color: #C9B8FF; font-weight: 500;">${to}</span>).
    </p>

    <div class="otp-container">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #A6A1B5; font-weight: 600;">
        One-Time Verification Code
      </div>
      <div class="otp-code">${otp}</div>
      <div class="otp-meta">
        Expires in <strong style="color: #F8F6EF;">${expiryMinutes} minutes</strong>
      </div>
    </div>

    <div class="alert-box">
      <strong>Security Notice:</strong> Never share this code with anyone. PulsePlan team members will never ask for your verification code.
    </div>

    <p style="font-size: 13px; color: #A6A1B5;">
      If you did not request this verification code, someone may have entered your email by mistake. Your account remains completely secure and no action is required.
    </p>
  `;

  return sendEmail({
    to,
    subject,
    html: createBrandedEmailLayout({
      title: subject,
      previewText: `Your PulsePlan verification code is ${otp} (expires in ${expiryMinutes} minutes)`,
      badgeText: 'SECURITY CODE',
      badgeColor: '#FFD6E8',
      badgeBg: 'rgba(255, 214, 232, 0.12)',
      contentHtml,
    }),
    text: `Hi ${recipientName || 'there'},\n\nYour PulsePlan verification code for ${purpose} is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes. Never share this code with anyone.\n\nIf you did not request this code, you can safely ignore this email.\n\nPulsePlan - Plan clearly. Move faster. Ship together.`,
  });
}

/**
 * 2. Dispatch Project Collaborator Invitation Email
 */
export async function sendProjectInviteEmail({
  to,
  recipientName,
  inviterName,
  projectName,
  workspaceName,
  role = 'Member',
  inviteUrl,
  expiryDays = 7,
}) {
  const targetUrl = inviteUrl || `${ENV.CLIENT_URL}/login`;
  const subject = `You've been invited to collaborate on "${projectName}" on PulsePlan`;

  const contentHtml = `
    <h1>Join "${projectName}"</h1>
    <p>Hi ${recipientName || 'there'},</p>
    <p>
      <strong>${inviterName || 'A team lead'}</strong> has invited you to collaborate on the project
      <strong style="color: #C9B8FF;">${projectName}</strong> inside the <strong style="color: #F8F6EF;">${workspaceName}</strong> workspace.
    </p>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Project:</span>
        <span class="meta-value">${projectName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Workspace:</span>
        <span class="meta-value">${workspaceName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Invited Role:</span>
        <span class="meta-value" style="color: #C9B8FF;">${role}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Invited By:</span>
        <span class="meta-value">${inviterName || 'Workspace Administrator'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Expires In:</span>
        <span class="meta-value">${expiryDays} days</span>
      </div>
    </div>

    <p style="font-size: 14px; color: #D8D2E7;">
      Click the button below to review and accept the invitation. If you don't have a PulsePlan account yet, you will be guided to set up your password with this email address (<span style="color: #C9B8FF; font-weight: 500;">${to}</span>).
    </p>
  `;

  return sendEmail({
    to,
    subject,
    html: createBrandedEmailLayout({
      title: subject,
      previewText: `${inviterName} invited you to collaborate on ${projectName}`,
      badgeText: 'PROJECT INVITATION',
      badgeColor: '#C9B8FF',
      badgeBg: 'rgba(201, 184, 255, 0.15)',
      contentHtml,
      ctaText: 'Accept Project Invitation',
      ctaUrl: targetUrl,
    }),
    text: `Hi ${recipientName || 'there'},\n\n${inviterName} has invited you to collaborate on "${projectName}" in workspace "${workspaceName}" as a ${role} on PulsePlan.\n\nAccept your invitation here:\n${targetUrl}\n\nThis invitation expires in ${expiryDays} days.\n\nPulsePlan - Plan clearly. Move faster. Ship together.`,
  });
}

/**
 * Re-export existing workspace and task mail helpers for backward compatibility
 */
export {
  sendWorkspaceInviteEmail,
  sendTaskAssignmentEmail,
  sendWelcomeEmail,
} from './mailService.js';
