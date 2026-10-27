import { sendEmail } from '../config/mailer.js';
import { ENV } from '../config/env.js';

/**
 * Base email layout wrapper with PulsePlan branding
 */
function createEmailLayout({ title, previewText, contentHtml, ctaText, ctaUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
      padding: 32px 36px 28px;
      text-align: left;
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      display: inline-block;
      width: 32px;
      height: 32px;
      background: #ffffff;
      border-radius: 8px;
      text-align: center;
      line-height: 32px;
      font-weight: 800;
      font-size: 18px;
      color: #4338ca;
    }
    .logo-text {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
    .content {
      padding: 36px;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }
    p {
      margin: 0 0 18px;
      font-size: 15px;
      color: #334155;
    }
    .meta-box {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 24px 0;
      border-left: 4px solid #4f46e5;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-value {
      color: #0f172a;
      font-weight: 600;
    }
    .cta-container {
      margin: 32px 0 16px;
      text-align: center;
    }
    .cta-btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
    }
    .footer {
      padding: 24px 36px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-container">
          <span class="logo-badge">P</span>
          <span class="logo-text">PulsePlan</span>
        </div>
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
        <p style="margin: 0 0 6px;">Plan clearly. Move faster. Ship together.</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} PulsePlan SaaS Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 1. Workspace Member Invitation Email
 */
export async function sendWorkspaceInviteEmail({
  to,
  recipientName,
  inviterName,
  workspaceName,
  role,
  joinUrl,
}) {
  const targetUrl = joinUrl || `${ENV.CLIENT_URL}/login`;
  const subject = `You've been invited to join ${workspaceName} on PulsePlan`;

  const contentHtml = `
    <h1>You're invited to collaborate!</h1>
    <p>Hi ${recipientName || 'there'},</p>
    <p>
      <strong>${inviterName || 'A team administrator'}</strong> has invited you to join the
      <strong>${workspaceName}</strong> workspace on PulsePlan.
    </p>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Workspace:</span>
        <span class="meta-value">${workspaceName}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Your Role:</span>
        <span class="meta-value">${role || 'Member'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Invited By:</span>
        <span class="meta-value">${inviterName || 'Workspace Admin'}</span>
      </div>
    </div>

    <p style="font-size: 14px; color: #64748b;">
      Click the button below to sign in or create your account using this email address (<span style="color: #0f172a; font-weight: 500;">${to}</span>) to access your projects.
    </p>
  `;

  return sendEmail({
    to,
    subject,
    html: createEmailLayout({
      title: subject,
      previewText: `Join ${workspaceName} on PulsePlan`,
      contentHtml,
      ctaText: 'Accept Invitation & Sign In',
      ctaUrl: targetUrl,
    }),
    text: `Hi ${recipientName},\n\n${inviterName} has invited you to join the "${workspaceName}" workspace as a ${role || 'Member'} on PulsePlan.\n\nSign in to accept your invitation: ${targetUrl}\n\nPulsePlan - Plan clearly. Move faster. Ship together.`,
  });
}

/**
 * 2. Task Assignment Notification Email
 */
export async function sendTaskAssignmentEmail({
  to,
  recipientName,
  taskTitle,
  projectName,
  priority = 'medium',
  dueDate,
  taskUrl,
}) {
  const targetUrl = taskUrl || `${ENV.CLIENT_URL}/kanban`;
  const subject = `[PulsePlan] New Task Assigned: ${taskTitle}`;

  const priorityColors = {
    urgent: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#16a34a',
  };
  const color = priorityColors[priority.toLowerCase()] || '#4f46e5';

  const contentHtml = `
    <h1>New Task Assigned</h1>
    <p>Hi ${recipientName || 'there'},</p>
    <p>You have been assigned to a task in <strong>${projectName || 'PulsePlan'}</strong>.</p>

    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Task:</span>
        <span class="meta-value">${taskTitle}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Project:</span>
        <span class="meta-value">${projectName || 'General Project'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Priority:</span>
        <span class="meta-value" style="color: ${color}; text-transform: capitalize;">${priority}</span>
      </div>
      ${
        dueDate
          ? `
      <div class="meta-row">
        <span class="meta-label">Due Date:</span>
        <span class="meta-value">${dueDate}</span>
      </div>
      `
          : ''
      }
    </div>

    <p style="font-size: 14px; color: #64748b;">
      Stay on top of updates, leave status comments, and track progress on the board.
    </p>
  `;

  return sendEmail({
    to,
    subject,
    html: createEmailLayout({
      title: subject,
      previewText: `Assigned task: ${taskTitle}`,
      contentHtml,
      ctaText: 'View Task in Kanban Board',
      ctaUrl: targetUrl,
    }),
    text: `Hi ${recipientName},\n\nYou have been assigned to task "${taskTitle}" in project "${projectName}".\nPriority: ${priority}\nDue Date: ${dueDate || 'None'}\n\nView task: ${targetUrl}`,
  });
}

/**
 * 3. Welcome Email on User Registration
 */
export async function sendWelcomeEmail({ to, recipientName, loginUrl }) {
  const targetUrl = loginUrl || `${ENV.CLIENT_URL}/dashboard`;
  const subject = `Welcome to PulsePlan, ${recipientName || 'Creator'}!`;

  const contentHtml = `
    <h1>Welcome to PulsePlan</h1>
    <p>Hi ${recipientName || 'there'},</p>
    <p>
      Thank you for signing up! PulsePlan is built to help modern software teams coordinate sprints, track tasks, and ship high-impact features.
    </p>

    <div style="margin: 24px 0; padding: 18px 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 12px; font-size: 15px; color: #0f172a;">Quick Start Guide:</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.8;">
        <li>Create or switch into your team's workspace</li>
        <li>Set up projects and populate your task backlog</li>
        <li>Invite your team members on the Team page</li>
      </ol>
    </div>

    <p style="font-size: 14px; color: #64748b;">
      Need any help getting started? Check your workspace settings or reply directly to this email.
    </p>
  `;

  return sendEmail({
    to,
    subject,
    html: createEmailLayout({
      title: subject,
      previewText: `Welcome to PulsePlan!`,
      contentHtml,
      ctaText: 'Go to Your Dashboard',
      ctaUrl: targetUrl,
    }),
    text: `Hi ${recipientName},\n\nWelcome to PulsePlan! We're excited to have you on board.\n\nGo to your dashboard: ${targetUrl}\n\nPulsePlan - Plan clearly. Move faster. Ship together.`,
  });
}
