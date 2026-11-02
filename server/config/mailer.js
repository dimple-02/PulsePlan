import nodemailer from 'nodemailer';
import { ENV } from './env.js';

let transporterPromise = null;
let isEthereal = false;

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_REQUEST_TIMEOUT_MS = 10000; // 10-second request timeout for Render

/**
 * Parses RFC 2822 sender string e.g. "PulsePlan <sender@domain.com>" or "sender@domain.com"
 */
export function parseSender(fromStr) {
  if (!fromStr || typeof fromStr !== 'string') {
    return { name: 'PulsePlan', email: 'no-reply@pulseplan.io' };
  }
  const trimmed = fromStr.trim();
  const match = trimmed.match(/^(?:"?([^"]*)"?\s+)?<?([^<>\s]+@[^<>\s]+)>?$/);
  if (match) {
    const name = match[1]?.trim() || 'PulsePlan';
    const email = match[2]?.trim() || 'no-reply@pulseplan.io';
    return { name, email };
  }
  return { name: 'PulsePlan', email: trimmed };
}

/**
 * Parses recipient parameter into Brevo-compliant array [{ email, name? }]
 */
export function parseRecipients(toInput) {
  if (!toInput) return [];
  const list = Array.isArray(toInput) ? toInput : [toInput];
  return list
    .map((item) => {
      if (typeof item === 'object' && item?.email) {
        return {
          email: item.email.trim(),
          ...(item.name ? { name: item.name.trim() } : {}),
        };
      }
      const str = String(item).trim();
      const match = str.match(/^(?:"?([^"]*)"?\s+)?<?([^<>\s]+@[^<>\s]+)>?$/);
      if (match && match[1]) {
        return { email: match[2].trim(), name: match[1].trim() };
      }
      const email = match ? match[2].trim() : str.replace(/[<>]/g, '').trim();
      return email ? { email } : null;
    })
    .filter(Boolean);
}

/**
 * Dispatches an email via Brevo Transactional Email HTTPS API (Port 443)
 * Overcomes Render Free outbound SMTP port blocking (ports 25, 465, 587).
 *
 * Security:
 * - Never logs BREVO_API_KEY, OTPs, or email body contents.
 * - Enforces 10-second timeout to prevent connection hangs.
 */
export async function sendBrevoApiEmail({ to, subject, html, text }) {
  const apiKey = ENV.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured in the environment.');
  }

  const sender = parseSender(ENV.EMAIL_FROM);
  const recipients = parseRecipients(to);

  if (recipients.length === 0) {
    throw new Error('No valid recipient email address provided.');
  }

  const payload = {
    sender,
    to: recipients,
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(BREVO_REQUEST_TIMEOUT_MS),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const rawError = data?.message || `HTTP ${response.status} (${response.statusText})`;
    // Redact any accidental API key patterns from error output
    const sanitizedError = String(rawError).replace(/xkeysib-[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]');
    const error = new Error(`Brevo API Error (${response.status}): ${sanitizedError}`);
    error.status = response.status;
    error.code = data?.code || 'BREVO_API_ERROR';
    throw error;
  }

  return {
    success: true,
    messageId: data?.messageId || `brevo-${Date.now()}`,
  };
}

/**
 * Initializes and returns the Nodemailer transporter singleton for local development.
 */
async function initializeTransporter() {
  // 1. Custom SMTP configured in local development
  if (ENV.SMTP_HOST && ENV.SMTP_USER) {
    return nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' && process.env.SMTP_IGNORE_TLS !== 'true',
      },
    });
  }

  // 2. Development: Attempt Ethereal test account with a 3-second timeout
  try {
    const testAccountPromise = nodemailer.createTestAccount();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Ethereal setup timed out')), 3000)
    );

    const testAccount = await Promise.race([testAccountPromise, timeoutPromise]);
    isEthereal = true;
    console.log(`[MailService] Initialized Ethereal test SMTP account: ${testAccount.user}`);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch {
    // 3. Offline / Sandboxed Fallback: JSON stream transporter
    console.log('[MailService] Running in offline/sandboxed mode. Using local simulated email transporter.');
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
}

export async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = initializeTransporter();
  }
  return transporterPromise;
}

/**
 * Main email dispatch helper.
 * - Uses Brevo HTTPS API whenever BREVO_API_KEY is configured (Primary for Production on Render).
 * - Falls back to local dev Ethereal / simulated transport when BREVO_API_KEY is absent.
 */
export async function sendEmail({ to, subject, html, text }) {
  // 1. Production / HTTPS API Mode: Brevo REST API over port 443
  if (ENV.BREVO_API_KEY) {
    try {
      const result = await sendBrevoApiEmail({ to, subject, html, text });
      console.log(`[MailService] Email successfully sent via Brevo HTTPS API to <${to}>: "${subject}" (Message ID: ${result.messageId})`);
      return result;
    } catch (error) {
      // Safe error logging without exposing secrets or OTPs
      console.error(`[MailService Error] Failed to send email via Brevo HTTPS API: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 2. Local Development Fallback: Nodemailer transport
  try {
    const transport = await getTransporter();

    const mailOptions = {
      from: ENV.EMAIL_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html,
    };

    const info = await transport.sendMail(mailOptions);

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[MailService] Email successfully sent to <${to}>`);
      console.log(`[MailService Preview URL]: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl };
    }

    if (info.message) {
      console.log(`[MailService Simulated] Email queued to <${to}>: "${subject}"`);
      return { success: true, messageId: 'simulated-' + Date.now() };
    }

    console.log(`[MailService] Email sent to <${to}>: "${subject}" (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MailService Error] Failed to send email to <${to}>:`, error.message);
    return { success: false, error: error.message };
  }
}
