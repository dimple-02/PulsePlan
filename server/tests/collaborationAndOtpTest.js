/**
 * PulsePlan Production Test Suite:
 * Email OTP Verification & Project Collaboration System
 *
 * Verifies all security constraints, RBAC, tenant isolation, and workflows.
 */

import http from 'http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { Invitation } from '../models/Invitation.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { hashOtp, hashToken } from '../services/otpService.js';
import { sendOtpEmail, sendProjectInviteEmail } from '../services/emailService.js';
import { generateToken } from '../controllers/authController.js';

let server;
const TEST_PORT = 5055;

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
    process.exitCode = 1;
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log(' PulsePlan Test Suite: Email OTP & Project Collaboration');
  console.log('================================================================\n');

  try {
    await connectDB();

    // Clean up test data from prior runs
    await User.deleteMany({ email: /@pulseplan\.test$/ });
    await Invitation.deleteMany({ email: /@pulseplan\.test$/ });
    await Otp.deleteMany({ email: /@pulseplan\.test$/ });
    await PasswordResetToken.deleteMany({ email: /@pulseplan\.test$/ });

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`Test server running on port ${TEST_PORT}\n`);
        resolve();
      });
    });

    // -------------------------------------------------------------------------
    // SECTION 1: EMAIL OTP INFRASTRUCTURE & TEMPLATES
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Email OTP Service & Templates ---');

    const otpMailRes = await sendOtpEmail({
      to: 'tester@pulseplan.test',
      recipientName: 'Security Tester',
      otp: '784912',
      purpose: 'Password Reset',
      expiryMinutes: 5,
    });
    assert(otpMailRes.success, 'OTP Verification Email rendered and sent via SMTP/Ethereal transport');

    const inviteMailRes = await sendProjectInviteEmail({
      to: 'collab@pulseplan.test',
      recipientName: 'Alex Collaborator',
      inviterName: 'Lead Architect',
      projectName: 'Alpha Cloud Core',
      workspaceName: 'Acme SaaS Studio',
      role: 'Member',
      inviteUrl: 'http://localhost:5173/invitations/sample-token',
      expiryDays: 7,
    });
    assert(inviteMailRes.success, 'Project Collaboration Invitation Email rendered and sent via SMTP/Ethereal transport');

    // -------------------------------------------------------------------------
    // SECTION 2: FORGOT PASSWORD & OTP FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Forgot Password & OTP Flow ---');

    // Setup Test User 1
    const user1Email = `user1_${Date.now()}@pulseplan.test`;
    const signup1 = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: { name: 'Dev One', email: user1Email, password: 'InitialPassword123' },
    });
    assert(signup1.status === 201, 'Test User 1 created successfully');
    await User.updateOne({ email: user1Email }, { $set: { isEmailVerified: true } });
    const user1Doc = await User.findOne({ email: user1Email });
    const user1Token = generateToken(user1Doc);
    const user1WorkspaceId = user1Doc.workspaces?.[0]?.workspaceId;

    // Test 2.1: Non-existent email generic response
    const nonExistentEmail = `ghost_${Date.now()}@nowhere.test`;
    const forgotGhost = await request({
      path: '/api/auth/forgot-password',
      method: 'POST',
      body: { email: nonExistentEmail },
    });
    assert(forgotGhost.status === 200, 'Non-existent email returns generic HTTP 200 without revealing registration');
    assert(
      forgotGhost.body.message.includes('If an account is associated with this email'),
      'Response message is generic and prevents user enumeration'
    );

    // Test 2.2: Existing user requests OTP
    const forgotUser1 = await request({
      path: '/api/auth/forgot-password',
      method: 'POST',
      body: { email: user1Email },
    });
    assert(forgotUser1.status === 200, 'Registered user requests OTP successfully');

    // Verify OTP record created in MongoDB
    const otpDoc = await Otp.findOne({ email: user1Email, purpose: 'password_reset' });
    assert(Boolean(otpDoc), 'Hashed OTP document found in MongoDB');
    assert(otpDoc.hashedOtp && otpDoc.hashedOtp.length === 64, 'Stored OTP is a 64-character cryptographic HMAC-SHA256 hash (never plaintext)');
    assert(otpDoc.attempts === 0, 'Initial OTP attempt count is 0');
    assert(new Date(otpDoc.expiresAt) > new Date(), 'OTP expiresAt set in the future (5 minutes)');

    // Test 2.3: 60-Second Resend Cooldown
    const cooldownTest = await request({
      path: '/api/auth/forgot-password',
      method: 'POST',
      body: { email: user1Email },
    });
    assert(cooldownTest.status === 429, 'Immediate resend within 60s blocked with HTTP 429 Too Many Requests');
    assert(cooldownTest.body.code === 'COOLDOWN_ACTIVE', 'Cooldown error code properly reported');
    assert(typeof cooldownTest.body.remainingSeconds === 'number', 'Remaining cooldown seconds returned');

    // Test 2.4: Incorrect OTP Verification & Attempt Tracking
    const wrongVerify = await request({
      path: '/api/auth/verify-reset-otp',
      method: 'POST',
      body: { email: user1Email, otp: '000000' },
    });
    assert(wrongVerify.status === 400, 'Incorrect OTP rejected with HTTP 400');
    assert(wrongVerify.body.code === 'INVALID_OTP', 'Invalid OTP error code returned');
    assert(wrongVerify.body.attemptsRemaining === 4, 'Remaining attempts accurately decremented to 4');

    // Test 2.5: Max 5 Attempts Lockout
    // Set attempts to 4 to test lockout on next failed attempt
    await Otp.updateOne({ email: user1Email, purpose: 'password_reset' }, { $set: { attempts: 4 } });
    const lockoutVerify = await request({
      path: '/api/auth/verify-reset-otp',
      method: 'POST',
      body: { email: user1Email, otp: '111111' },
    });
    assert(lockoutVerify.status === 400, '5th incorrect attempt blocked');
    assert(lockoutVerify.body.code === 'TOO_MANY_ATTEMPTS', 'Locked out with TOO_MANY_ATTEMPTS code');
    const deletedOtp = await Otp.findOne({ email: user1Email, purpose: 'password_reset' });
    assert(!deletedOtp, 'Exceeded OTP record permanently purged from database');

    // Test 2.6: Correct OTP verification & Reset Token Issuance
    // Reset cooldown to allow new OTP generation
    await Otp.deleteMany({ email: user1Email });
    await request({
      path: '/api/auth/forgot-password',
      method: 'POST',
      body: { email: user1Email },
    });

    // In a test environment, generate a known 6-digit code and store its hash
    const testOtpCode = '654321';
    await Otp.updateOne({ email: user1Email }, { $set: { hashedOtp: hashOtp(testOtpCode), attempts: 0 } });

    const correctVerify = await request({
      path: '/api/auth/verify-reset-otp',
      method: 'POST',
      body: { email: user1Email, otp: testOtpCode },
    });
    assert(correctVerify.status === 200, 'Correct 6-digit OTP verification returns HTTP 200');
    const resetToken = correctVerify.body?.data?.resetToken;
    assert(Boolean(resetToken && resetToken.length === 64), 'Cryptographically secure 32-byte (64 hex chars) resetToken returned');

    // Test 2.7: OTP Reuse Prevention
    const reuseVerify = await request({
      path: '/api/auth/verify-reset-otp',
      method: 'POST',
      body: { email: user1Email, otp: testOtpCode },
    });
    assert(reuseVerify.status === 400, 'Re-using the same OTP is strictly prevented (OTP consumed upon initial verification)');

    // Test 2.8: Reset Password with New Password & Session Invalidation
    const newPasswordString = 'NewStrongPassword456!';
    const resetRes = await request({
      path: '/api/auth/reset-password',
      method: 'POST',
      body: {
        email: user1Email,
        resetToken,
        newPassword: newPasswordString,
      },
    });
    assert(resetRes.status === 200, 'Password successfully reset with HTTP 200');

    // Verify User 1 can log in with new password
    const loginNew = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: user1Email, password: newPasswordString },
    });
    assert(loginNew.status === 200, 'User successfully authenticated with newly set password');

    // Verify old credentials rejected
    const loginOld = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: user1Email, password: 'InitialPassword123' },
    });
    assert(loginOld.status === 401, 'Old password rejected with HTTP 401');

    // Verify prior session token revoked via tokenVersion increment
    const staleSessionCheck = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(staleSessionCheck.status === 401, 'Pre-reset session token immediately revoked and blocked with HTTP 401');

    // -------------------------------------------------------------------------
    // SECTION 3: PROJECT COLLABORATION & EMAIL INVITATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Project Collaboration & Invitations ---');

    // Setup: Create a project in User 1's workspace
    const newProjRes = await request({
      path: '/api/projects',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        name: 'Project Nebula',
        key: 'NEBU',
        description: 'Next-gen distributed edge runtime',
        category: 'Product',
      },
    });
    assert(newProjRes.status === 201, 'Project Nebula created in User 1 workspace');
    const projectId = newProjRes.body.data.id || newProjRes.body.data._id;

    // Create User 2 (Existing PulsePlan user to be invited)
    const user2Email = `user2_${Date.now()}@pulseplan.test`;
    const signup2 = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: { name: 'Bob Collaborator', email: user2Email, password: 'PasswordBob123' },
    });
    assert(signup2.status === 201, 'User 2 (Bob) registered');
    await User.updateOne({ email: user2Email }, { $set: { isEmailVerified: true } });
    const user2Doc = await User.findOne({ email: user2Email });
    const user2Token = generateToken(user2Doc);

    // Create User 3 (Attacker / Unrelated User)
    const user3Email = `user3_${Date.now()}@pulseplan.test`;
    const signup3 = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: { name: 'Mallory Hacker', email: user3Email, password: 'PasswordMal123' },
    });
    assert(signup3.status === 201, 'User 3 (Mallory) registered');
    await User.updateOne({ email: user3Email }, { $set: { isEmailVerified: true } });
    const user3Doc = await User.findOne({ email: user3Email });
    const user3Token = generateToken(user3Doc);

    // Test 3.1: Unauthorized Inviter Blocked
    const unauthInvite = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user3Token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: 'somebody@pulseplan.test', role: 'Member' },
    });
    assert(unauthInvite.status === 403, 'Unauthorized outsider cannot invite collaborators to User 1 workspace (HTTP 403 Forbidden)');

    // Test 3.2: Workspace Owner invites User 2
    const validInvite = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: user2Email, role: 'Admin' },
    });
    assert(validInvite.status === 201, 'Project Owner successfully creates invitation for User 2 as Admin (HTTP 201)');

    const invDoc = await Invitation.findOne({ email: user2Email, projectId });
    assert(Boolean(invDoc), 'Invitation record stored in MongoDB');
    assert(invDoc.status === 'pending', 'Initial invitation status is "pending"');
    assert(Boolean(invDoc.tokenHash), 'Invitation token stored as SHA-256 hash');

    // Test 3.3: Duplicate Invitation Prevention
    const duplicateInvite = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: user2Email, role: 'Member' },
    });
    assert(duplicateInvite.status === 409, 'Duplicate invitation for same project and email rejected with HTTP 409 Conflict');

    // Test 3.4: Public Invitation Query (By Token)
    // Create a unique random 64-character hex token for acceptance testing
    const testRawToken = crypto.randomBytes(32).toString('hex');
    invDoc.tokenHash = hashToken(testRawToken);
    await invDoc.save();

    const queryTokenRes = await request({
      path: `/api/invitations/token/${testRawToken}`,
      method: 'GET',
    });
    assert(queryTokenRes.status === 200, 'Public GET /api/invitations/token/:token returns HTTP 200');
    assert(queryTokenRes.body.data.invitedEmail === user2Email, 'Invitation query contains invited email');
    assert(queryTokenRes.body.data.project.name === 'Project Nebula', 'Invitation query contains project details');

    // Test 3.5: Wrong User Email Attempting Acceptance
    const wrongUserAccept = await request({
      path: `/api/invitations/token/${testRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${user3Token}` }, // Logged in as User 3 (Mallory)
    });
    assert(wrongUserAccept.status === 403, 'Acceptance attempt with mismatched email blocked with HTTP 403 Forbidden');
    assert(
      wrongUserAccept.body.message.includes('You are signed in as') &&
        wrongUserAccept.body.message.includes('Please switch accounts'),
      'Clear, descriptive identity mismatch error message provided'
    );

    // Test 3.6: Correct User Accepts Invitation
    const correctAccept = await request({
      path: `/api/invitations/token/${testRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` }, // Logged in as User 2 (Bob)
    });
    assert(correctAccept.status === 200, 'User 2 accepts invitation successfully with HTTP 200');

    // Verify User 2 is now in Project.collaborators with role 'Admin'
    const updatedProject = await Project.findById(projectId);
    const bobCollab = updatedProject.collaborators?.find((c) => c.email === user2Email);
    assert(Boolean(bobCollab), 'User 2 added to Project collaborators');
    assert(bobCollab.role === 'Admin', 'User 2 received exact role assigned by inviter (Admin)');

    // Verify Tenant Isolation & Workspace Membership Synchronization
    const updatedWorkspace = await Workspace.findById(user1WorkspaceId);
    const bobInWs = updatedWorkspace.members?.find((m) => m.email === user2Email);
    assert(Boolean(bobInWs), 'User 2 added to Workspace members without bypassing tenant isolation');

    const updatedUser2 = await User.findOne({ email: user2Email });
    const user2LinkedWs = updatedUser2.workspaces?.some(
      (w) => w.workspaceId.toString() === user1WorkspaceId.toString()
    );
    assert(user2LinkedWs, 'User 2 workspaces array updated with link to Workspace 1');

    // Verify Invitation Status updated to 'accepted'
    const acceptedInvDoc = await Invitation.findById(invDoc._id);
    assert(acceptedInvDoc.status === 'accepted', 'Invitation marked as accepted in MongoDB');

    // Test 3.7: Prevent Duplicate Acceptance
    const reAccept = await request({
      path: `/api/invitations/token/${testRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(reAccept.status === 400, 'Attempting to re-accept an already accepted invitation rejected with HTTP 400');

    // Test 3.8: Prevent Duplicate Project Membership
    const inviteBobAgain = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: user2Email, role: 'Member' },
    });
    assert(inviteBobAgain.status === 409, 'Cannot invite an existing collaborator (HTTP 409 Conflict)');

    // Test 3.9: Invitation Revocation & Resend Workflow
    const user4Email = `user4_${Date.now()}@pulseplan.test`;
    const invite4 = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: user4Email, role: 'Viewer' },
    });
    assert(invite4.status === 201, 'Invitation sent to User 4');
    const inv4Id = invite4.body.data.id || invite4.body.data._id;

    // Revoke invitation
    const revokeRes = await request({
      path: `/api/projects/${projectId}/invitations/${inv4Id}/revoke`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(revokeRes.status === 200, 'Invitation for User 4 revoked with HTTP 200');
    const revokedDoc = await Invitation.findById(inv4Id);
    assert(revokedDoc.status === 'revoked', 'Invitation status updated to "revoked" in MongoDB');

    // Resend revoked invitation
    const resendRes = await request({
      path: `/api/projects/${projectId}/invitations/${inv4Id}/resend`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(resendRes.status === 200, 'Revoked invitation resent successfully with HTTP 200');
    const resentDoc = await Invitation.findById(inv4Id);
    assert(resentDoc.status === 'pending', 'Resent invitation reset to "pending" status');

    // Test 3.10: Collaborator Removal
    const removeRes = await request({
      path: `/api/projects/${projectId}/collaborators/${user2Email}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(removeRes.status === 200, 'Collaborator User 2 successfully removed from project');
    const projectAfterRemove = await Project.findById(projectId);
    const bobStillThere = projectAfterRemove.collaborators?.some((c) => c.email === user2Email);
    assert(!bobStillThere, 'User 2 confirmed removed from project collaborators');

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

runAllTests();
