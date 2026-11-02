/**
 * PulsePlan Automated Test Suite:
 * Brevo Transactional Email HTTPS API & Workflow Verification
 *
 * Verifies:
 * 1. Brevo HTTPS API Request Construction & Header Formatting
 * 2. Successful Dispatch (HTTP 201 Created from Brevo API)
 * 3. Provider Rejection Handling (HTTP 401 / 400 with API Key Redaction)
 * 4. Request Timeout & Network Failure Handling (AbortSignal timeout)
 * 5. Workflow 1: Signup Email Verification OTP dispatch via Brevo HTTPS API
 * 6. Workflow 2: Password Reset OTP dispatch via Brevo HTTPS API
 * 7. Workflow 3: Project Collaboration Invitation dispatch via Brevo HTTPS API
 * 8. Fallback to Development Transport when BREVO_API_KEY is not set
 */

import { ENV } from '../config/env.js';
import { sendEmail, sendBrevoApiEmail, parseSender, parseRecipients } from '../config/mailer.js';
import { sendOtpEmail, sendProjectInviteEmail } from '../services/emailService.js';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runBrevoApiTests() {
  console.log('================================================================');
  console.log(' PulsePlan Test Suite: Brevo HTTPS Email API & Workflows        ');
  console.log('================================================================\n');

  // Preserve original globals
  const originalFetch = globalThis.fetch;
  const originalApiKey = ENV.BREVO_API_KEY;
  const originalEmailFrom = ENV.EMAIL_FROM;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Sender & Recipient Parsing
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Sender & Recipient Parsing ---');
    const parsedSender1 = parseSender('PulsePlan <verified@pulseplan.io>');
    assert(
      parsedSender1.name === 'PulsePlan' && parsedSender1.email === 'verified@pulseplan.io',
      'Parses "Name <email>" sender format correctly'
    );

    const parsedSender2 = parseSender('security@mycompany.com');
    assert(
      parsedSender2.email === 'security@mycompany.com' && parsedSender2.name === 'PulsePlan',
      'Parses bare email address with default name fallback'
    );

    const parsedRecipients = parseRecipients([
      'alex@example.com',
      'Sarah Connor <sarah@example.com>',
    ]);
    assert(parsedRecipients.length === 2, 'Parses multiple recipient formats');
    assert(parsedRecipients[0].email === 'alex@example.com', 'Recipient 1 email parsed');
    assert(
      parsedRecipients[1].email === 'sarah@example.com' && parsedRecipients[1].name === 'Sarah Connor',
      'Recipient 2 name and email parsed'
    );

    // -------------------------------------------------------------------------
    // TEST 2: Successful Brevo HTTPS API Dispatch (HTTP 201 Created)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Successful Brevo API Dispatch (Mocked HTTP 201) ---');
    ENV.BREVO_API_KEY = 'xkeysib-test-mock-api-key-1234567890';
    ENV.EMAIL_FROM = 'PulsePlan <noreply@pulseplan.io>';

    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => ({
          messageId: '<20261102.brevo.test.success.123@smtp-relay.mailin.fr>',
        }),
      };
    };

    const successResult = await sendBrevoApiEmail({
      to: 'tester@example.com',
      subject: 'Security Alert: New Sign-in',
      html: '<h1>New Login</h1><p>A new device accessed your account.</p>',
      text: 'New device accessed your account.',
    });

    assert(successResult.success === true, 'sendBrevoApiEmail reports success: true');
    assert(
      successResult.messageId === '<20261102.brevo.test.success.123@smtp-relay.mailin.fr>',
      'Returns Brevo messageId from API response'
    );
    assert(
      capturedUrl === 'https://api.brevo.com/v3/smtp/email',
      'Requests official Brevo Transactional Email endpoint over HTTPS'
    );
    assert(
      capturedOptions.headers['api-key'] === 'xkeysib-test-mock-api-key-1234567890',
      'Attaches api-key header in HTTPS request'
    );
    assert(
      capturedOptions.headers['content-type'] === 'application/json',
      'Specifies application/json content-type'
    );

    const capturedBody = JSON.parse(capturedOptions.body);
    assert(capturedBody.sender.email === 'noreply@pulseplan.io', 'Payload contains verified sender email');
    assert(capturedBody.to[0].email === 'tester@example.com', 'Payload contains recipient email');
    assert(capturedBody.subject === 'Security Alert: New Sign-in', 'Payload contains correct subject');

    // -------------------------------------------------------------------------
    // TEST 3: Provider Rejection Handling (HTTP 401 Unauthorized / 400 Bad Request)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Provider Rejection with API Key Redaction ---');
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        code: 'unauthorized',
        message: 'Key not found: xkeysib-test-mock-api-key-1234567890 is invalid',
      }),
    });

    let rejectionError = null;
    try {
      await sendBrevoApiEmail({
        to: 'invalid@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });
    } catch (err) {
      rejectionError = err;
    }

    assert(Boolean(rejectionError), 'Brevo API HTTP error throws descriptive Error');
    assert(rejectionError.status === 401, 'Error captures HTTP status 401');
    assert(
      !rejectionError.message.includes('xkeysib-test-mock-api-key-1234567890'),
      'Sensitive API key pattern is sanitized and redacted from error message'
    );
    assert(
      rejectionError.message.includes('[REDACTED_API_KEY]'),
      'Redacted placeholder displayed in error output'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Timeout & Network Error Handling
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Timeout & Network Error Handling ---');
    globalThis.fetch = async () => {
      const abortErr = new Error('The operation was aborted due to timeout.');
      abortErr.name = 'TimeoutError';
      throw abortErr;
    };

    const timeoutRes = await sendEmail({
      to: 'timeout@example.com',
      subject: 'Timeout Test',
      html: '<p>Content</p>',
    });

    assert(timeoutRes.success === false, 'sendEmail catches timeout error and returns success: false');
    assert(
      timeoutRes.error.includes('aborted') || timeoutRes.error.includes('timeout'),
      'Reports graceful timeout error without crashing process'
    );

    // -------------------------------------------------------------------------
    // TEST 5: Workflow 1 — Signup Email Verification OTP via Brevo API
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Workflow 1 — Signup Email Verification OTP via Brevo API ---');
    let capturedWorkflowPayload = null;

    globalThis.fetch = async (url, options) => {
      capturedWorkflowPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 201,
        json: async () => ({ messageId: '<brevo-signup-otp-msg-1>' }),
      };
    };

    const signupOtpResult = await sendOtpEmail({
      to: 'newuser@pulseplan.test',
      recipientName: 'Diana Prince',
      otp: '739201',
      purpose: 'Email Verification',
      expiryMinutes: 5,
    });

    assert(signupOtpResult.success === true, 'Signup verification OTP dispatched successfully via Brevo API');
    assert(signupOtpResult.messageId === '<brevo-signup-otp-msg-1>', 'Returns valid messageId');
    assert(
      capturedWorkflowPayload.subject.includes('739201'),
      'Email subject contains the 6-digit OTP code'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('739201'),
      'Email HTML contains the 6-digit OTP code'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('Email Verification'),
      'Email HTML specifies "Email Verification" purpose'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('#0B0A0F') &&
        capturedWorkflowPayload.htmlContent.includes('#C9B8FF'),
      'Email HTML preserves PulsePlan dark/lavender/pink branding'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Workflow 2 — Password Reset OTP via Brevo API
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Workflow 2 — Password Reset OTP via Brevo API ---');
    const resetOtpResult = await sendOtpEmail({
      to: 'existinguser@pulseplan.test',
      recipientName: 'Bruce Wayne',
      otp: '482019',
      purpose: 'Password Reset',
      expiryMinutes: 5,
    });

    assert(resetOtpResult.success === true, 'Password reset OTP dispatched successfully via Brevo API');
    assert(
      capturedWorkflowPayload.subject.includes('482019'),
      'Email subject contains the 6-digit reset OTP'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('Password Reset'),
      'Email HTML specifies "Password Reset" purpose'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Workflow 3 — Project Collaboration Invitation via Brevo API
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Workflow 3 — Project Collaboration Invitation via Brevo API ---');
    const inviteResult = await sendProjectInviteEmail({
      to: 'collaborator@pulseplan.test',
      recipientName: 'Clark Kent',
      inviterName: 'Lead Architect',
      projectName: 'Alpha Distributed Engine',
      workspaceName: 'Acme SaaS Studio',
      role: 'Admin',
      inviteUrl: 'https://pulse-plan.vercel.app/invitations/secure-token-12345',
      expiryDays: 7,
    });

    assert(inviteResult.success === true, 'Project invitation dispatched successfully via Brevo API');
    assert(
      capturedWorkflowPayload.subject.includes('Alpha Distributed Engine'),
      'Invitation subject includes project name'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('Alpha Distributed Engine'),
      'Invitation HTML includes project name'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('Acme SaaS Studio'),
      'Invitation HTML includes workspace name'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('Admin'),
      'Invitation HTML includes assigned role'
    );
    assert(
      capturedWorkflowPayload.htmlContent.includes('https://pulse-plan.vercel.app/invitations/secure-token-12345'),
      'Invitation HTML includes secure invitation URL'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Fallback to Development Transport when BREVO_API_KEY is not set
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Development Transport Fallback when BREVO_API_KEY is Unset ---');
    ENV.BREVO_API_KEY = ''; // Simulate local dev without Brevo key

    let brevoApiCalled = false;
    globalThis.fetch = async () => {
      brevoApiCalled = true;
      return { ok: true, json: async () => ({}) };
    };

    const devResult = await sendEmail({
      to: 'devtester@pulseplan.test',
      subject: 'Local Dev Notification',
      html: '<p>Testing dev fallback</p>',
    });

    assert(
      !brevoApiCalled,
      'When BREVO_API_KEY is omitted, Brevo HTTPS API is NOT called'
    );
    assert(
      devResult.success === true,
      'sendEmail falls back cleanly to development transport with success: true'
    );

    console.log('\n================================================================');
    console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('================================================================\n');

    process.exit(failCount === 0 ? 0 : 1);
  } finally {
    // Restore original environment and globals
    globalThis.fetch = originalFetch;
    ENV.BREVO_API_KEY = originalApiKey;
    ENV.EMAIL_FROM = originalEmailFrom;
  }
}

runBrevoApiTests().catch((err) => {
  console.error('Fatal test exception:', err);
  process.exit(1);
});
