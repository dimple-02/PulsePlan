import nodemailer from 'nodemailer';
import { ENV } from './env.js';

let transporterPromise = null;
let isEthereal = false;

/**
 * Initializes and returns the Nodemailer transporter singleton.
 * Supports:
 *  1. Custom SMTP credentials (via environment variables)
 *  2. Ethereal Email test accounts (for development with preview links)
 *  3. Local JSON/console fallback (for offline or firewalled environments)
 */
async function initializeTransporter() {
  // 1. Production / Custom SMTP configured
  if (ENV.SMTP_HOST && ENV.SMTP_USER) {
    console.log(`[MailService] Configuring custom SMTP transport (${ENV.SMTP_HOST}:${ENV.SMTP_PORT})...`);
    return nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_SECURE,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
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
  } catch (err) {
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
 * Sends an email using the initialized transporter.
 * Logs live preview URLs when running on Ethereal test accounts.
 */
export async function sendEmail({ to, subject, html, text }) {
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
      // Local JSON transport output
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
