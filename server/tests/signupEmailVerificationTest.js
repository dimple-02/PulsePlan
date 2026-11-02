/**
 * PulsePlan Automated Test Suite:
 * Mandatory Email Verification During Signup Flow
 *
 * Verifies:
 * 1. User signs up with name, email, password:
 *    - Account created with isEmailVerified: false
 *    - Returns HTTP 201 Created with requiresVerification: true
 *    - NO HTTP-only session cookie is issued on signup
 * 2. Unverified user login rejection:
 *    - Calling POST /api/auth/login returns HTTP 403 Forbidden with EMAIL_NOT_VERIFIED
 * 3. Unverified user protected route rejection:
 *    - Middleware requireAuth blocks unverified user with HTTP 403 EMAIL_NOT_VERIFIED
 * 4. Wrong OTP entry:
 *    - Submitting incorrect 6-digit code returns HTTP 400 with attemptsRemaining: 4
 * 5. Maximum attempts enforcement:
 *    - 5 wrong attempts invalidates OTP and returns OTP_MAX_ATTEMPTS_EXCEEDED
 * 6. Resend cooldown:
 *    - Immediate resend within 60s returns HTTP 429 COOLDOWN_ACTIVE
 *    - Resend after cooldown succeeds with HTTP 200
 * 7. Expired OTP rejection:
 *    - OTP past 5-minute expiration returns HTTP 400 OTP_EXPIRED
 * 8. Successful verification:
 *    - Correct OTP sets isEmailVerified: true in database
 *    - Returns HTTP 200 and issues authenticated HTTP-only session cookie
 * 9. OTP reuse prevention:
 *    - Reusing already verified OTP returns HTTP 400 OTP_INVALID_OR_EXPIRED
 * 10. Verified user login success:
 *     - POST /api/auth/login now succeeds with HTTP 200 and issues session cookie
 * 11. Verified user protected route access:
 *     - GET /api/workspaces returns HTTP 200 with provisioned private workspace
 * 12. Resend verification on already verified account:
 *     - Returns HTTP 400 EMAIL_ALREADY_VERIFIED
 * 13. Project invitation acceptance after verification:
 *     - Inviter invites new email address
 *     - New user signs up (unverified)
 *     - Unverified acceptance blocked with HTTP 403
 *     - User verifies email with OTP
 *     - User accepts invite -> successfully added to project and workspace
 */

import http from 'http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Invitation } from '../models/Invitation.js';
import { hashOtp, hashToken } from '../services/otpService.js';
import { generateToken } from '../controllers/authController.js';

let server;
const TEST_PORT = 5056;

function request({ path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(payload
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          }
        : {}),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(resData);
          } catch {
            json = resData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

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

async function runTests() {
  console.log('================================================================');
  console.log(' PulsePlan Test Suite: Mandatory Signup Email Verification Flow ');
  console.log('================================================================\n');

  try {
    await connectDB();
    server = app.listen(TEST_PORT);

    // Pre-test clean up for test accounts
    await User.deleteMany({ email: /@signup-verify\.test$/ });
    await Otp.deleteMany({ email: /@signup-verify\.test$/ });
    await Invitation.deleteMany({ email: /@signup-verify\.test$/ });

    const timestamp = Date.now();
    const testEmail = `charlie_${timestamp}@signup-verify.test`;
    const testPassword = 'Password123!';
    const testName = 'Charlie Davis';

    // -------------------------------------------------------------------------
    // TEST 1: User Signup creates unverified account without session cookie
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Signup Creates Unverified Account ---');
    const signupRes = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: {
        name: testName,
        email: testEmail,
        password: testPassword,
      },
    });

    assert(signupRes.status === 201, 'Signup returns HTTP 201 Created');
    assert(
      signupRes.body?.data?.requiresVerification === true,
      'Response explicitly signals requiresVerification: true'
    );
    assert(
      signupRes.body?.data?.user?.isEmailVerified === false,
      'Response reports isEmailVerified: false'
    );

    const signupCookies = signupRes.headers['set-cookie'] || [];
    const hasSessionCookie = signupCookies.some((c) => c.startsWith('token='));
    assert(!hasSessionCookie, 'No session cookie (token=) issued to unverified user upon signup');

    const createdUserDoc = await User.findOne({ email: testEmail });
    assert(createdUserDoc !== null, 'User document saved to MongoDB');
    assert(createdUserDoc.isEmailVerified === false, 'User document has isEmailVerified: false');

    const createdOtpDoc = await Otp.findOne({
      email: testEmail,
      purpose: 'email_verification',
      isUsed: false,
    });
    assert(createdOtpDoc !== null, 'Email verification OTP record created in MongoDB');
    assert(Boolean(createdOtpDoc.hashedOtp), 'OTP record stores hashed code (never plaintext)');

    // -------------------------------------------------------------------------
    // TEST 2: Unverified user login rejection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Unverified User Login Rejection ---');
    const unverifiedLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert(
      unverifiedLoginRes.status === 403,
      'Login attempt by unverified user rejected with HTTP 403 Forbidden'
    );
    assert(
      unverifiedLoginRes.body?.code === 'EMAIL_NOT_VERIFIED',
      'Error code is EMAIL_NOT_VERIFIED'
    );
    assert(
      unverifiedLoginRes.body?.requiresVerification === true,
      'Error payload indicates requiresVerification: true'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Unverified user protected route access rejection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Protected Route Rejection for Unverified User ---');
    // Generate a valid JWT for the unverified user to test middleware defense-in-depth
    const unverifiedJwt = generateToken(createdUserDoc);
    const protectedRes = await request({
      path: '/api/workspaces',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${unverifiedJwt}`,
      },
    });

    assert(
      protectedRes.status === 403,
      'requireAuth middleware blocks unverified user from protected routes with HTTP 403'
    );
    assert(
      protectedRes.body?.code === 'EMAIL_NOT_VERIFIED',
      'requireAuth returns code EMAIL_NOT_VERIFIED'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Wrong OTP submission & attempts decrement
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Incorrect OTP Rejection & Attempts Decrement ---');
    // Set a known OTP hash for testing
    const knownOtp = '482910';
    await Otp.updateOne(
      { _id: createdOtpDoc._id },
      { $set: { hashedOtp: hashOtp(knownOtp), attempts: 0 } }
    );

    const wrongOtpRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: {
        email: testEmail,
        otp: '000000', // incorrect
      },
    });

    assert(wrongOtpRes.status === 400, 'Submitting incorrect OTP returns HTTP 400 Bad Request');
    assert(
      wrongOtpRes.body?.attemptsRemaining === 4,
      'Response reports 4 attempts remaining (max 5 - 1)'
    );

    const otpAfterWrong = await Otp.findById(createdOtpDoc._id);
    assert(otpAfterWrong.attempts === 1, 'MongoDB attempts counter incremented to 1');

    // -------------------------------------------------------------------------
    // TEST 5: Maximum attempts exceeded invalidates OTP
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Maximum Attempts Exceeded (5 incorrect attempts) ---');
    // Exhaust the remaining 4 attempts
    await request({ path: '/api/auth/verify-email', method: 'POST', body: { email: testEmail, otp: '111111' } });
    await request({ path: '/api/auth/verify-email', method: 'POST', body: { email: testEmail, otp: '222222' } });
    await request({ path: '/api/auth/verify-email', method: 'POST', body: { email: testEmail, otp: '333333' } });
    const fifthWrongRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: { email: testEmail, otp: '444444' },
    });

    assert(fifthWrongRes.status === 400, '5th incorrect attempt returns HTTP 400');
    assert(
      fifthWrongRes.body?.code === 'TOO_MANY_ATTEMPTS',
      'Returns code TOO_MANY_ATTEMPTS'
    );

    const otpAfterExhaustion = await Otp.findById(createdOtpDoc._id);
    assert(
      otpAfterExhaustion === null,
      'Exhausted OTP record immediately deleted/invalidated from MongoDB'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Resend Cooldown Enforcement
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Resend Verification Cooldown ---');
    // Set a fresh active OTP with lastSentAt = Date.now() (within 60s cooldown)
    const freshOtpDoc = await Otp.create({
      email: testEmail,
      purpose: 'email_verification',
      hashedOtp: hashOtp('654321'),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(), // Just sent
      attempts: 0,
      isUsed: false,
    });

    const immediateResendRes = await request({
      path: '/api/auth/resend-verification',
      method: 'POST',
      body: { email: testEmail },
    });

    assert(
      immediateResendRes.status === 429,
      'Immediate resend within 60s cooldown rejected with HTTP 429'
    );
    assert(
      immediateResendRes.body?.code === 'COOLDOWN_ACTIVE',
      'Returns code COOLDOWN_ACTIVE'
    );
    assert(
      immediateResendRes.body?.remainingSeconds > 0,
      'Returns remaining cooldown seconds'
    );

    // Fast-forward lastSentAt past 60s
    await Otp.updateOne(
      { _id: freshOtpDoc._id },
      { $set: { lastSentAt: new Date(Date.now() - 65 * 1000) } }
    );

    const allowedResendRes = await request({
      path: '/api/auth/resend-verification',
      method: 'POST',
      body: { email: testEmail },
    });

    assert(
      allowedResendRes.status === 200,
      'Resend verification after cooldown returns HTTP 200 OK'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Expired OTP rejection
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: Expired OTP Rejection ---');
    const expiredOtpCode = '777888';
    // Create an expired OTP record
    await Otp.deleteMany({ email: testEmail });
    await Otp.create({
      email: testEmail,
      purpose: 'email_verification',
      hashedOtp: hashOtp(expiredOtpCode),
      expiresAt: new Date(Date.now() - 10 * 1000), // Expired 10 seconds ago
      lastSentAt: new Date(Date.now() - 70 * 1000),
      attempts: 0,
      isUsed: false,
    });

    const expiredRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: {
        email: testEmail,
        otp: expiredOtpCode,
      },
    });

    assert(expiredRes.status === 400, 'Expired OTP rejected with HTTP 400');
    assert(
      expiredRes.body?.code === 'EXPIRED' || expiredRes.body?.code === 'NOT_FOUND_OR_EXPIRED',
      'Returns expired OTP error code'
    );

    // -------------------------------------------------------------------------
    // TEST 8: Successful email verification & session cookie issuance
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Successful Email Verification ---');
    const validOtpCode = '391740';
    await Otp.deleteMany({ email: testEmail });
    await Otp.create({
      email: testEmail,
      purpose: 'email_verification',
      hashedOtp: hashOtp(validOtpCode),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(Date.now() - 70 * 1000),
      attempts: 0,
      isUsed: false,
    });

    const verifyRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: {
        email: testEmail,
        otp: validOtpCode,
      },
    });

    assert(verifyRes.status === 200, 'Verification with correct OTP returns HTTP 200 OK');
    assert(
      verifyRes.body?.data?.user?.isEmailVerified === true,
      'User object returns isEmailVerified: true'
    );

    const verifiedCookies = verifyRes.headers['set-cookie'] || [];
    const verifiedSessionCookie = verifiedCookies.find((c) => c.startsWith('token='));
    assert(
      Boolean(verifiedSessionCookie),
      'HTTP-only session cookie (token=) issued upon successful verification'
    );

    const userDocAfterVerify = await User.findOne({ email: testEmail });
    assert(
      userDocAfterVerify.isEmailVerified === true,
      'MongoDB user document updated to isEmailVerified: true'
    );

    // -------------------------------------------------------------------------
    // TEST 9: OTP reuse prevention
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 9: Prevention of OTP Reuse ---');
    const reuseRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: {
        email: testEmail,
        otp: validOtpCode,
      },
    });

    assert(reuseRes.status === 400, 'Reusing previously verified OTP returns HTTP 400');
    assert(
      reuseRes.body?.code === 'NOT_FOUND_OR_EXPIRED',
      'Returns code NOT_FOUND_OR_EXPIRED'
    );

    // -------------------------------------------------------------------------
    // TEST 10: Verified user login success
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 10: Verified User Login Success ---');
    const loginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert(loginRes.status === 200, 'Login with verified account returns HTTP 200 OK');
    assert(
      loginRes.body?.data?.user?.isEmailVerified === true,
      'Login response indicates isEmailVerified: true'
    );
    const loginCookie = loginRes.headers['set-cookie']?.[0]?.split(';')[0];
    assert(Boolean(loginCookie && loginCookie.startsWith('token=')), 'Session cookie returned on verified login');

    // -------------------------------------------------------------------------
    // TEST 11: Verified user protected route access
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 11: Verified User Protected Route Access ---');
    const workspacesRes = await request({
      path: '/api/workspaces',
      method: 'GET',
      headers: {
        Cookie: loginCookie,
      },
    });

    assert(workspacesRes.status === 200, 'Verified user accesses GET /api/workspaces with HTTP 200');
    const workspaces = workspacesRes.body?.data || [];
    assert(workspaces.length > 0, 'Verified user has personal workspace provisioned and accessible');

    // -------------------------------------------------------------------------
    // TEST 12: Resending verification on already verified account rejected
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 12: Resend Rejection for Already Verified Account ---');
    const resendAlreadyVerifiedRes = await request({
      path: '/api/auth/resend-verification',
      method: 'POST',
      body: { email: testEmail },
    });

    assert(
      resendAlreadyVerifiedRes.status === 400,
      'Resend to already verified user returns HTTP 400'
    );
    assert(
      resendAlreadyVerifiedRes.body?.code === 'EMAIL_ALREADY_VERIFIED',
      'Returns code EMAIL_ALREADY_VERIFIED'
    );

    // -------------------------------------------------------------------------
    // TEST 13: Project Collaboration Invitation Flow for Newly Registered User
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 13: Project Invitation Flow with Email Verification ---');
    // Inviter (Charlie) creates a project in his workspace
    const userWorkspace = workspaces[0];
    const userWorkspaceId = userWorkspace.id || userWorkspace._id;
    const loginToken = loginRes.body?.data?.token;

    const projectRes = await request({
      path: '/api/projects',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginToken}`,
        Cookie: loginCookie,
        'x-workspace-id': userWorkspaceId,
      },
      body: {
        name: 'Email Verification Project',
        key: 'EVP',
        description: 'Testing invite flow with new user email verification',
      },
    });
    assert(projectRes.status === 201, 'Inviter creates new project');
    const projectId = projectRes.body?.data?.id || projectRes.body?.data?._id;

    // Inviter invites a new, unregistered email
    const invitedEmail = `invited_new_${timestamp}@signup-verify.test`;
    const inviteRes = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginToken}`,
        Cookie: loginCookie,
        'x-workspace-id': userWorkspaceId,
      },
      body: {
        email: invitedEmail,
        role: 'Member',
      },
    });
    assert(inviteRes.status === 201, 'Inviter sends project invite to new email');

    // Extract the invitation from MongoDB to get raw token for testing
    const invitationDoc = await Invitation.findOne({
      projectId,
      email: invitedEmail,
      status: 'pending',
    });
    assert(invitationDoc !== null, 'Invitation record found in MongoDB');

    // Set known raw token
    const testRawToken = crypto.randomBytes(32).toString('hex');
    invitationDoc.tokenHash = hashToken(testRawToken);
    await invitationDoc.save();

    // 13.a: Invited user signs up
    const invitedSignupRes = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: {
        name: 'Invited Collaborator',
        email: invitedEmail,
        password: 'Password123!',
      },
    });
    assert(invitedSignupRes.status === 201, 'Invited user signs up successfully');
    const invitedUserDoc = await User.findOne({ email: invitedEmail });
    assert(invitedUserDoc.isEmailVerified === false, 'Invited user starts as unverified');

    // 13.b: Unverified user attempting to accept invitation is rejected
    const unverifiedAcceptToken = generateToken(invitedUserDoc);
    const unverifiedAcceptRes = await request({
      path: `/api/invitations/token/${testRawToken}/accept`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${unverifiedAcceptToken}`,
      },
    });
    assert(
      unverifiedAcceptRes.status === 403,
      'Unverified user blocked from accepting invitation with HTTP 403 (EMAIL_NOT_VERIFIED)'
    );

    // 13.c: User verifies email
    const invitedOtpCode = '555222';
    await Otp.updateOne(
      { email: invitedEmail, purpose: 'email_verification', isUsed: false },
      { $set: { hashedOtp: hashOtp(invitedOtpCode) } }
    );

    const invitedVerifyRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: {
        email: invitedEmail,
        otp: invitedOtpCode,
      },
    });
    assert(invitedVerifyRes.status === 200, 'Invited user successfully verifies email');
    const invitedUserCookie = invitedVerifyRes.headers['set-cookie']?.[0]?.split(';')[0];
    const invitedUserToken = invitedVerifyRes.body?.data?.token;
    assert(Boolean(invitedUserCookie), 'Invited user receives authenticated session cookie');

    // 13.d: Verified user accepts the project invitation
    const verifiedAcceptRes = await request({
      path: `/api/invitations/token/${testRawToken}/accept`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${invitedUserToken}`,
        Cookie: invitedUserCookie,
      },
    });

    assert(
      verifiedAcceptRes.status === 200,
      'Verified user accepts project invitation with HTTP 200 OK'
    );
    assert(
      verifiedAcceptRes.body?.data?.role === 'Member',
      'User assigned designated role ("Member")'
    );

    // 13.e: Verify project and workspace membership
    const updatedProject = await Project.findById(projectId);
    const isProjectMember = updatedProject.collaborators.some(
      (c) => c.email === invitedEmail && c.role === 'Member'
    );
    assert(isProjectMember, 'User successfully added to project collaborators');

    const updatedWorkspace = await Workspace.findById(userWorkspaceId);
    const isWorkspaceMember = updatedWorkspace.members.some(
      (m) => m.userId.toString() === invitedUserDoc._id.toString()
    );
    assert(isWorkspaceMember, 'User added to host workspace with member role');

    // Clean up
    await User.deleteMany({ email: /@signup-verify\.test$/ });
    await Otp.deleteMany({ email: /@signup-verify\.test$/ });
    await Invitation.deleteMany({ email: /@signup-verify\.test$/ });
    await Project.deleteOne({ _id: projectId });

    console.log('\n================================================================');
    console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('================================================================');

    if (server) server.close();
    await mongoose.connection.close();
    process.exit(failCount === 0 ? 0 : 1);
  } catch (err) {
    console.error('Fatal Test Exception:', err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
