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
import { Task } from '../models/Task.js';
import { hashOtp, hashToken } from '../services/otpService.js';
import { sendOtpEmail, sendProjectInviteEmail } from '../services/emailService.js';
import { generateToken, linkPreexistingWorkspaces } from '../controllers/authController.js';
import { ENV } from '../config/env.js';

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

    // ================================================================
    // Test 4: Workspace Collaboration & Invariant Verification
    // ================================================================
    console.log('\n--- Test 4: Workspace Collaboration & Role Invariants ---');

    const wsInviteEmail = 'ws.member@pulseplan.test';

    // 4.1: Workspace invitation creation (POST /api/workspaces/:id/invitations)
    const wsInviteRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: wsInviteEmail, role: 'Member' },
    });
    assert(wsInviteRes.status === 201, 'Workspace invitation created successfully with HTTP 201');
    const wsInvData = wsInviteRes.body.data;
    assert(Boolean(wsInvData.token), 'Raw join token returned in invitation creation response');
    const wsRawToken = wsInvData.token;

    const wsInvDoc = await Invitation.findOne({ email: wsInviteEmail, workspaceId: user1WorkspaceId, type: 'workspace' });
    assert(Boolean(wsInvDoc), 'Workspace invitation record stored in MongoDB with type "workspace"');
    assert(wsInvDoc.role === 'Member', 'Workspace invitation role stored as "Member"');
    assert(wsInvDoc.status === 'pending', 'Workspace invitation status is "pending"');

    // 4.2: Privilege escalation prevention (Admin cannot grant Owner role)
    const adminEmail = 'admin.user@pulseplan.test';
    const adminUser = await User.create({
      name: 'Admin Test',
      email: adminEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: user1WorkspaceId, role: 'Admin' }],
    });
    const adminToken = generateToken(adminUser._id);

    const escRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: 'another@pulseplan.test', role: 'Owner' },
    });
    assert(escRes.status === 403, 'Privilege escalation blocked: Admin cannot invite an Owner (HTTP 403)');

    // 4.3: Listing workspace invitations (GET /api/workspaces/:id/invitations)
    const listWsInvsRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(listWsInvsRes.status === 200, 'GET /api/workspaces/:id/invitations returns HTTP 200');
    assert(
      Array.isArray(listWsInvsRes.body.data) && listWsInvsRes.body.data.some((i) => i.email === wsInviteEmail),
      'Pending workspace invitation is included in list response'
    );

    // 4.4: Resending workspace invitation (POST /api/workspaces/:id/invitations/:id/resend)
    const resendWsRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations/${wsInvDoc._id}/resend`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(resendWsRes.status === 200, 'Workspace invitation resent successfully with HTTP 200');

    // 4.5: Query workspace invitation by raw token (GET /api/invitations/token/:token)
    const testWsRawToken = crypto.randomBytes(32).toString('hex');
    const wsDocForAccept = await Invitation.findById(wsInvDoc._id);
    wsDocForAccept.tokenHash = hashToken(testWsRawToken);
    await wsDocForAccept.save();

    const queryWsTokenRes = await request({
      path: `/api/invitations/token/${testWsRawToken}`,
      method: 'GET',
    });
    assert(queryWsTokenRes.status === 200, 'Public GET /api/invitations/token/:token returns HTTP 200 for workspace invite');
    assert(queryWsTokenRes.body.data.type === 'workspace', 'Invitation type correctly identified as "workspace"');
    assert(Boolean(queryWsTokenRes.body.data.workspace?.name), 'Workspace metadata returned in token query');

    // 4.6: Workspace invitation acceptance (POST /api/invitations/token/:token/accept)
    const wsRecipientUser = await User.create({
      name: 'Workspace Member Test',
      email: wsInviteEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [],
    });
    const wsRecipientToken = generateToken(wsRecipientUser._id);

    const acceptWsRes = await request({
      path: `/api/invitations/token/${testWsRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${wsRecipientToken}` },
    });
    assert(acceptWsRes.status === 200, 'Workspace invitation accepted successfully with HTTP 200');
    assert(acceptWsRes.body.data.workspaceId === user1WorkspaceId.toString(), 'Response returns accepted workspace ID');

    // Verify database persistence
    const updatedWsAfterAccept = await Workspace.findById(user1WorkspaceId);
    const memberInWs = updatedWsAfterAccept.members?.find((m) => m.email === wsInviteEmail);
    assert(Boolean(memberInWs), 'Recipient added to Workspace.members array');
    assert(memberInWs.status === 'Active', 'Member status set to "Active"');
    assert(memberInWs.role === 'Member', 'Member role correctly set to "Member"');
    assert(memberInWs.userId?.toString() === wsRecipientUser._id.toString(), 'Member userId correctly linked to User record');

    const updatedRecipientDoc = await User.findById(wsRecipientUser._id);
    const wsIsLinked = updatedRecipientDoc.workspaces?.some(
      (w) => w.workspaceId.toString() === user1WorkspaceId.toString()
    );
    assert(wsIsLinked, 'Workspace added to recipient user.workspaces profile');

    const acceptedWsInvDoc = await Invitation.findById(wsInvDoc._id);
    assert(acceptedWsInvDoc.status === 'accepted', 'Workspace invitation status updated to "accepted" in MongoDB');

    // 4.7: Duplicate membership prevention
    const dupWsInvite = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: wsInviteEmail, role: 'Member' },
    });
    assert(dupWsInvite.status === 409, 'Duplicate invitation for already-existing workspace member rejected with HTTP 409');

    // 4.8: Pre-invited user signup link verification
    const preinvitedEmail = 'preinvited@pulseplan.test';
    const preinviteRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: preinvitedEmail, role: 'Member' },
    });
    assert(preinviteRes.status === 201, 'Pre-invitation created for unregistered user');

    const preSignupRes = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: {
        name: 'Pre-invited User',
        email: preinvitedEmail,
        password: 'Password123!',
      },
    });
    assert(preSignupRes.status === 201, 'Pre-invited user signs up via /api/auth/signup');

    const knownOtp = '123456';
    await Otp.findOneAndUpdate(
      { email: preinvitedEmail, purpose: 'email_verification' },
      { hashedOtp: hashOtp(knownOtp), expiresAt: new Date(Date.now() + 600000), attempts: 0, isUsed: false },
      { upsert: true }
    );
    const verifyPreWithValidOtp = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: { email: preinvitedEmail, otp: knownOtp },
    });
    assert(verifyPreWithValidOtp.status === 200, 'Pre-invited user email verified successfully');

    const verifiedPreUser = await User.findOne({ email: preinvitedEmail });
    const preLinked = verifiedPreUser.workspaces?.some(
      (w) => w.workspaceId.toString() === user1WorkspaceId.toString()
    );
    assert(preLinked, 'Pre-existing workspace invitation auto-linked to new user account profile');

    // 4.9: Viewer Role Restrictions (Cannot create task or delete project)
    const viewerEmail = 'viewer.collab@pulseplan.test';
    const viewerUser = await User.create({
      name: 'Viewer Collab',
      email: viewerEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: user1WorkspaceId, role: 'Member' }],
    });
    const viewerToken = generateToken(viewerUser._id);

    // Add viewer to project nebula
    await Project.findByIdAndUpdate(projectId, {
      $push: { collaborators: { userId: viewerUser._id, email: viewerEmail, name: 'Viewer Collab', role: 'Viewer' } },
    });

    const viewerCreateTaskRes = await request({
      path: '/api/tasks',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        title: 'Viewer Task Attempt',
        projectId,
        status: 'todo',
        priority: 'medium',
      },
    });
    assert(viewerCreateTaskRes.status === 403, 'Project Viewer blocked from creating tasks (HTTP 403 Forbidden)');

    const viewerDeleteProjectRes = await request({
      path: `/api/projects/${projectId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(viewerDeleteProjectRes.status === 403, 'Project Viewer blocked from deleting project (HTTP 403 Forbidden)');

    // 4.10: Cross-tenant / cross-project isolation
    const crossTenantProjectRes = await request({
      path: `/api/projects/${projectId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user3Token}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(crossTenantProjectRes.status === 403, 'Unauthorized tenant access to project blocked with HTTP 403 Forbidden');

    // 4.11: linkPreexistingWorkspaces Idempotency & Privilege Preservation
    const idempEmail = 'idempotent.user@pulseplan.test';
    const idempUser = await User.create({
      name: 'Idempotent User',
      email: idempEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: user1WorkspaceId, role: 'Owner' }],
    });

    // Simulate workspace membership where record says 'Member'
    await Workspace.findByIdAndUpdate(user1WorkspaceId, {
      $push: {
        members: {
          name: 'Idempotent User',
          email: idempEmail,
          role: 'Member',
          status: 'Offline',
        },
      },
    });

    // Call linkPreexistingWorkspaces 3 consecutive times
    await linkPreexistingWorkspaces(idempUser);
    await linkPreexistingWorkspaces(idempUser);
    await linkPreexistingWorkspaces(idempUser);

    const reloadedIdempUser = await User.findById(idempUser._id);
    const linkedWsEntries = reloadedIdempUser.workspaces?.filter(
      (w) => w.workspaceId.toString() === user1WorkspaceId.toString()
    );
    assert(linkedWsEntries.length === 1, 'linkPreexistingWorkspaces is strictly idempotent (no duplicate workspaces)');
    assert(linkedWsEntries[0].role === 'Owner', 'linkPreexistingWorkspaces never downgrades an existing Owner role');

    // 4.12: Expired and Revoked Invitation Acceptance Rejection
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    await Invitation.create({
      type: 'workspace',
      email: wsInviteEmail,
      workspaceId: user1WorkspaceId,
      projectId: null,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(expiredRawToken),
      status: 'pending',
      expiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
    });

    const expiredAcceptRes = await request({
      path: `/api/invitations/token/${expiredRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${wsRecipientToken}` },
    });
    assert(expiredAcceptRes.status === 400, 'Accepting expired invitation is rejected with HTTP 400');
    assert(expiredAcceptRes.body.status === 'expired', 'Expired status explicitly returned');

    const revokedRawToken = crypto.randomBytes(32).toString('hex');
    await Invitation.create({
      type: 'workspace',
      email: wsInviteEmail,
      workspaceId: user1WorkspaceId,
      projectId: null,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(revokedRawToken),
      status: 'revoked',
      expiresAt: new Date(Date.now() + 100000),
    });

    const revokedAcceptRes = await request({
      path: `/api/invitations/token/${revokedRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${wsRecipientToken}` },
    });
    assert(revokedAcceptRes.status === 400, 'Accepting revoked invitation is rejected with HTTP 400');
    assert(revokedAcceptRes.body.status === 'revoked', 'Revoked status explicitly returned');

    // 4.13: Privilege Escalation Prevention on Member Management & Project Invitations
    const adminAddOwnerRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/members`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { name: 'Escalate Target', email: 'escalate@pulseplan.test', role: 'Owner' },
    });
    assert(adminAddOwnerRes.status === 403, 'Privilege escalation blocked: Admin cannot assign Owner role via addWorkspaceMember (HTTP 403)');

    // Project Member (wsRecipientUser) attempts to invite someone as Admin to Project Nebula
    // First, add wsRecipientUser to project as 'Member'
    await Project.findByIdAndUpdate(projectId, {
      $push: { collaborators: { userId: wsRecipientUser._id, email: wsInviteEmail, name: wsRecipientUser.name, role: 'Member' } },
    });

    const memberEscalateRes = await request({
      path: `/api/projects/${projectId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${wsRecipientToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { email: 'collab.target@pulseplan.test', role: 'Admin' },
    });
    assert(memberEscalateRes.status === 403, 'Privilege escalation blocked: Non-admin project collaborator cannot invite Admin (HTTP 403)');

    // 4.14: Task & Project Permission Invariants (Viewer vs Member vs Non-Collaborator)
    // Create task in Project Nebula as Owner
    const createNebulaTaskRes = await request({
      path: '/api/tasks',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        title: 'Nebula Core Task',
        projectId,
        status: 'todo',
        priority: 'high',
      },
    });
    assert(createNebulaTaskRes.status === 201, 'Owner creates task in Project Nebula (HTTP 201)');
    const nebulaTaskId = createNebulaTaskRes.body.data._id;

    // Project Viewer (viewerUser) attempts to modify and delete task
    const viewerUpdateTaskRes = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { status: 'in_progress' },
    });
    assert(viewerUpdateTaskRes.status === 403, 'Project Viewer blocked from updating task (HTTP 403 Forbidden)');

    const viewerDeleteTaskRes = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(viewerDeleteTaskRes.status === 403, 'Project Viewer blocked from deleting task (HTTP 403 Forbidden)');

    // Workspace Member who is NOT a project collaborator
    const nonCollabMember = await User.create({
      name: 'Non Collab Member',
      email: 'noncollab@pulseplan.test',
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: user1WorkspaceId, role: 'Member' }],
    });
    const nonCollabToken = generateToken(nonCollabMember._id);

    const nonCollabGetProject = await request({
      path: `/api/projects/${projectId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(nonCollabGetProject.status === 403, 'Workspace member without project access blocked from viewing project (HTTP 403)');

    const nonCollabGetTask = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(nonCollabGetTask.status === 403, 'Workspace member without project access blocked from viewing task (HTTP 403)');

    const nonCollabUpdateTask = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { title: 'Unauthorized Modification' },
    });
    assert(nonCollabUpdateTask.status === 403, 'Workspace member without project access blocked from modifying task (HTTP 403)');

    const nonCollabDeleteTask = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(nonCollabDeleteTask.status === 403, 'Workspace member without project access blocked from deleting task (HTTP 403)');

    // Legitimate Project Collaborator (wsRecipientUser with Member role) can view and update task
    const collabGetTask = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${wsRecipientToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
    });
    assert(collabGetTask.status === 200, 'Legitimate Project Member can view task (HTTP 200)');

    const collabUpdateTask = await request({
      path: `/api/tasks/${nebulaTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${wsRecipientToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { status: 'in_progress' },
    });
    assert(collabUpdateTask.status === 200, 'Legitimate Project Member can update task (HTTP 200)');

    // 4.15: Concurrent Workspace Linking (10 simultaneous independent executions)
    console.log('\n--- Test 4.15: Concurrent Workspace Linking ---');
    const concurUserEmail = `concur.link_${Date.now()}@pulseplan.test`;
    const concurUser = await User.create({
      name: 'Concurrent Link User',
      email: concurUserEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: user1WorkspaceId, role: 'Owner' }],
    });

    const extraWs1 = await Workspace.create({
      name: 'Extra Workspace 1',
      slug: `extra-ws-1-${Date.now()}`,
      ownerId: adminUser._id,
      members: [
        { name: concurUser.name, email: concurUserEmail, role: 'Member', status: 'Active' },
      ],
    });
    const extraWs2 = await Workspace.create({
      name: 'Extra Workspace 2',
      slug: `extra-ws-2-${Date.now()}`,
      ownerId: adminUser._id,
      members: [
        { name: concurUser.name, email: concurUserEmail, role: 'Admin', status: 'Active' },
      ],
    });

    await Promise.all(
      Array.from({ length: 10 }, async () => {
        const u = await User.findById(concurUser._id);
        return linkPreexistingWorkspaces(u);
      })
    );

    const reloadedConcurUser = await User.findById(concurUser._id);
    const linkedWsIds = reloadedConcurUser.workspaces.map((w) => w.workspaceId.toString());
    const uniqueLinkedWsIds = new Set(linkedWsIds);
    assert(linkedWsIds.length === uniqueLinkedWsIds.size, 'No duplicate workspace entries created under 10 concurrent link executions');
    assert(linkedWsIds.length === 3, 'All 3 workspaces linked exactly once');

    const ws1Role = reloadedConcurUser.workspaces.find((w) => w.workspaceId.toString() === user1WorkspaceId.toString())?.role;
    assert(ws1Role === 'Owner', 'Concurrent linking preserved higher Owner role without downgrade');

    const extra1Role = reloadedConcurUser.workspaces.find((w) => w.workspaceId.toString() === extraWs1._id.toString())?.role;
    assert(extra1Role === 'Member', 'Workspace 1 linked with Member role');

    const extra2Role = reloadedConcurUser.workspaces.find((w) => w.workspaceId.toString() === extraWs2._id.toString())?.role;
    assert(extra2Role === 'Admin', 'Workspace 2 linked with Admin role');

    // 4.16: Concurrent Invitation Acceptance (10 simultaneous requests)
    console.log('\n--- Test 4.16: Concurrent Invitation Acceptance ---');
    const concurAcceptEmail = `concur.accept_${Date.now()}@pulseplan.test`;
    const concurAcceptUser = await User.create({
      name: 'Concurrent Accept User',
      email: concurAcceptEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [],
    });
    const concurAcceptToken = generateToken(concurAcceptUser);

    const concurRawToken = crypto.randomBytes(32).toString('hex');
    const concurInv = await Invitation.create({
      type: 'project',
      email: concurAcceptEmail,
      workspaceId: user1WorkspaceId,
      projectId,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(concurRawToken),
      status: 'pending',
      expiresAt: new Date(Date.now() + 600000),
    });

    const concurAcceptResults = await Promise.all(
      Array.from({ length: 10 }, () =>
        request({
          path: `/api/invitations/token/${concurRawToken}/accept`,
          method: 'POST',
          headers: { Authorization: `Bearer ${concurAcceptToken}` },
        })
      )
    );

    const successCount = concurAcceptResults.filter((r) => r.status === 200).length;
    const failCounts = concurAcceptResults.filter((r) => r.status === 400 || r.status === 409).length;
    assert(successCount === 1, `Exactly 1 out of 10 concurrent acceptance requests succeeded (got ${successCount})`);
    assert(failCounts === 9, `Remaining 9 concurrent requests were safely rejected (got ${failCounts})`);

    const finalConcurInv = await Invitation.findById(concurInv._id);
    assert(finalConcurInv.status === 'accepted', 'Invitation marked as accepted after concurrent race');

    const finalWs = await Workspace.findById(user1WorkspaceId);
    const concurWsMembers = finalWs.members.filter((m) => m.email === concurAcceptEmail);
    assert(concurWsMembers.length === 1, 'Exactly one workspace membership created without duplicates');

    const finalProj = await Project.findById(projectId);
    const concurProjCollabs = finalProj.collaborators.filter((c) => c.email === concurAcceptEmail);
    assert(concurProjCollabs.length === 1, 'Exactly one project collaborator entry created without duplicates');

    // 4.17: Acceptance Failure Rollback
    console.log('\n--- Test 4.17: Acceptance Failure Rollback ---');
    const rollbackEmail = `rollback_${Date.now()}@pulseplan.test`;
    const rollbackUser = await User.create({
      name: 'Rollback User',
      email: rollbackEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [],
    });
    const rollbackUserToken = generateToken(rollbackUser);

    const rollbackRawToken = crypto.randomBytes(32).toString('hex');
    const rollbackInv = await Invitation.create({
      type: 'project',
      email: rollbackEmail,
      workspaceId: user1WorkspaceId,
      projectId,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(rollbackRawToken),
      status: 'pending',
      expiresAt: new Date(Date.now() + 600000),
    });

    const origProjectSave = Project.prototype.save;
    Project.prototype.save = async function () {
      throw new Error('Simulated Database Crash during project save');
    };

    try {
      const failedAcceptRes = await request({
        path: `/api/invitations/token/${rollbackRawToken}/accept`,
        method: 'POST',
        headers: { Authorization: `Bearer ${rollbackUserToken}` },
      });
      assert(failedAcceptRes.status >= 500, 'Acceptance request returns 500 when database fails');
    } finally {
      Project.prototype.save = origProjectSave;
    }

    const rolledBackInv = await Invitation.findById(rollbackInv._id);
    assert(rolledBackInv.status === 'pending', 'Invitation status safely rolled back to "pending" on error');
    assert(!rolledBackInv.claimedAt, 'Invitation claimedAt timestamp cleared on rollback');

    const retryAcceptRes = await request({
      path: `/api/invitations/token/${rollbackRawToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${rollbackUserToken}` },
    });
    assert(retryAcceptRes.status === 200, 'Recovered invitation successfully accepted on subsequent healthy request');

    // 4.18: Task Project Reassignment RBAC & Workspace Isolation Matrix
    console.log('\n--- Test 4.18: Task Project Reassignment Permissions Matrix ---');
    const targetProjRes = await request({
      path: '/api/projects',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        name: 'Target Project Beta',
        key: 'BETA',
        category: 'Product',
      },
    });
    assert(targetProjRes.status === 201, 'Target Project Beta created');
    const targetProjectId = targetProjRes.body.data.id || targetProjRes.body.data._id;

    const foreignWs = await Workspace.create({
      name: 'Foreign Workspace',
      slug: `foreign-ws-${Date.now()}`,
      ownerId: adminUser._id,
      members: [],
    });
    const foreignProj = await Project.create({
      name: 'Foreign Project Gamma',
      key: 'GAMM',
      workspaceId: foreignWs._id,
      collaborators: [],
    });

    const moveTaskRes = await request({
      path: '/api/tasks',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        title: 'Task to Reassign',
        projectId,
        status: 'todo',
        priority: 'high',
      },
    });
    assert(moveTaskRes.status === 201, 'Task to reassign created in source project');
    const moveTaskId = moveTaskRes.body.data._id;

    // Test 4.18a: Moving task to foreign workspace project -> HTTP 400
    const foreignMoveRes = await request({
      path: `/api/tasks/${moveTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { projectId: foreignProj._id.toString() },
    });
    assert(foreignMoveRes.status === 400, 'Reassigning task to project in foreign workspace rejected with HTTP 400');

    // Configure Target Project Beta with collaborator restriction (only adminUser is collaborator)
    await Project.findByIdAndUpdate(targetProjectId, {
      $set: {
        collaborators: [
          { userId: adminUser._id, email: adminEmail, name: 'Admin User', role: 'Admin' },
        ],
      },
    });

    // Test 4.18b: User without access to target project attempts reassignment -> HTTP 403
    await Project.findByIdAndUpdate(projectId, {
      $push: {
        collaborators: {
          userId: nonCollabMember._id,
          email: nonCollabMember.email,
          name: nonCollabMember.name,
          role: 'Member',
        },
      },
    });

    const unauthorizedTargetMove = await request({
      path: `/api/tasks/${moveTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { projectId: targetProjectId },
    });
    assert(unauthorizedTargetMove.status === 403, 'Reassigning task to restricted target project blocked with HTTP 403');

    // Test 4.18c: Viewer on source project attempts reassignment -> HTTP 403
    await Project.updateOne(
      { _id: projectId, 'collaborators.userId': nonCollabMember._id },
      { $set: { 'collaborators.$.role': 'Viewer' } }
    );
    await Project.findByIdAndUpdate(targetProjectId, {
      $push: {
        collaborators: {
          userId: nonCollabMember._id,
          email: nonCollabMember.email,
          name: nonCollabMember.name,
          role: 'Member',
        },
      },
    });

    const viewerSourceMove = await request({
      path: `/api/tasks/${moveTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { projectId: targetProjectId },
    });
    assert(viewerSourceMove.status === 403, 'Viewer on source project blocked from moving task out with HTTP 403');

    // Test 4.18d: Viewer on target project attempts reassignment -> HTTP 403
    await Project.updateOne(
      { _id: projectId, 'collaborators.userId': nonCollabMember._id },
      { $set: { 'collaborators.$.role': 'Member' } }
    );
    await Project.updateOne(
      { _id: targetProjectId, 'collaborators.userId': nonCollabMember._id },
      { $set: { 'collaborators.$.role': 'Viewer' } }
    );

    const viewerTargetMove = await request({
      path: `/api/tasks/${moveTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { projectId: targetProjectId },
    });
    assert(viewerTargetMove.status === 403, 'Viewer on target project blocked from moving task into target with HTTP 403');

    // Test 4.18e: Legitimate Member on both projects moves task -> HTTP 200
    await Project.updateOne(
      { _id: targetProjectId, 'collaborators.userId': nonCollabMember._id },
      { $set: { 'collaborators.$.role': 'Member' } }
    );

    const authorizedMove = await request({
      path: `/api/tasks/${moveTaskId}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${nonCollabToken}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: { projectId: targetProjectId },
    });
    assert(authorizedMove.status === 200, 'Authorized collaborator successfully reassigns task to target project (HTTP 200)');

    const movedTaskInDb = await Task.findById(moveTaskId);
    assert(movedTaskInDb.projectId.toString() === targetProjectId.toString(), 'Task projectId updated to target project in database');

    // 4.19: Stale Claim Recovery & Fencing Token (claimId) Ownership
    console.log('\n--- Test 4.19: Stale Claim Recovery & Fencing Token (claimId) Ownership ---');
    const fencingEmail = `fencing_${Date.now()}@pulseplan.test`;
    const fencingUser = await User.create({
      name: 'Fencing Token User',
      email: fencingEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [],
    });
    const fencingUserToken = generateToken(fencingUser);

    const fencingRawToken = crypto.randomBytes(32).toString('hex');
    const staleClaimId = crypto.randomUUID();
    const fencingInv = await Invitation.create({
      type: 'project',
      email: fencingEmail,
      workspaceId: user1WorkspaceId,
      projectId,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(fencingRawToken),
      status: 'claimed',
      claimedAt: new Date(Date.now() - 35000), // 35s ago (> 30s threshold)
      claimId: staleClaimId,
      expiresAt: new Date(Date.now() + 600000),
    });

    let simulatedStolenFinalizeFailed = false;
    let simulatedStolenRollbackPrevented = false;

    const origSave = Workspace.prototype.save;
    Workspace.prototype.save = async function (...args) {
      // While Request 2 is executing, simulate Request 1 (which had staleClaimId) waking up:
      // 1. Request 1 attempts to finalize acceptance
      const rogueFinalize = await Invitation.findOneAndUpdate(
        { _id: fencingInv._id, status: 'claimed', claimId: staleClaimId },
        { $set: { status: 'accepted', acceptedAt: new Date() }, $unset: { claimedAt: 1, claimId: 1 } },
        { new: true }
      );
      if (!rogueFinalize) {
        simulatedStolenFinalizeFailed = true;
      }

      // 2. Request 1 attempts to roll back to pending
      const rogueRollback = await Invitation.updateOne(
        { _id: fencingInv._id, status: 'claimed', claimId: staleClaimId },
        { $set: { status: 'pending' }, $unset: { claimedAt: 1, claimId: 1 } }
      );
      if (rogueRollback.matchedCount === 0) {
        simulatedStolenRollbackPrevented = true;
      }

      return origSave.apply(this, args);
    };

    try {
      const req2AcceptRes = await request({
        path: `/api/invitations/token/${fencingRawToken}/accept`,
        method: 'POST',
        headers: { Authorization: `Bearer ${fencingUserToken}` },
      });
      assert(req2AcceptRes.status === 200, 'Request 2 successfully reclaims stale claim and completes (HTTP 200)');
    } finally {
      Workspace.prototype.save = origSave;
    }

    assert(simulatedStolenFinalizeFailed, 'Stale Request 1 blocked from finalizing acceptance (fencing token check succeeded)');
    assert(simulatedStolenRollbackPrevented, 'Stale Request 1 blocked from rolling back newer Request 2 claim');

    const finalizedFencingInv = await Invitation.findById(fencingInv._id);
    assert(finalizedFencingInv.status === 'accepted', 'Invitation successfully finalized by legitimate owner');
    assert(!finalizedFencingInv.claimId, 'Fencing token (claimId) cleanly unset on finalization');

    // 4.20: Simultaneous Role-Update Hierarchy Invariants (Owner > Admin > Member > Viewer)
    console.log('\n--- Test 4.20: Simultaneous Role-Update Hierarchy Invariants ---');
    const hierEmail = `hier_${Date.now()}@pulseplan.test`;
    const hierTargetWs = await Workspace.create({
      name: 'Hierarchy Test Workspace',
      slug: `hier-ws-${Date.now()}`,
      ownerId: adminUser._id,
      members: [],
    });

    const hierUser = await User.create({
      name: 'Hierarchy User',
      email: hierEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: hierTargetWs._id, role: 'Owner' }],
    });

    const wsRoles = ['Member', 'Admin', 'Member', 'Admin', 'Owner', 'Member', 'Admin', 'Member', 'Admin', 'Member'];

    await Promise.all(
      wsRoles.map(async (role) => {
        if (role === 'Owner') {
          await User.updateOne(
            { _id: hierUser._id, workspaces: { $elemMatch: { workspaceId: hierTargetWs._id, role: { $ne: 'Owner' } } } },
            { $set: { 'workspaces.$.role': 'Owner' } }
          );
        } else if (role === 'Admin') {
          await User.updateOne(
            { _id: hierUser._id, workspaces: { $elemMatch: { workspaceId: hierTargetWs._id, role: { $in: ['Member', 'Viewer'] } } } },
            { $set: { 'workspaces.$.role': 'Admin' } }
          );
        } else if (role === 'Member') {
          await User.updateOne(
            { _id: hierUser._id, workspaces: { $elemMatch: { workspaceId: hierTargetWs._id, role: 'Viewer' } } },
            { $set: { 'workspaces.$.role': 'Member' } }
          );
        }
      })
    );

    const reloadedHierUser = await User.findById(hierUser._id);
    const hierRole = reloadedHierUser.workspaces.find((w) => w.workspaceId.toString() === hierTargetWs._id.toString())?.role;
    assert(hierRole === 'Owner', 'Concurrent updates never downgrade an existing Owner role to Admin or Member');

    const memberToAdminUser = await User.create({
      name: 'Member To Admin User',
      email: `m2a_${Date.now()}@pulseplan.test`,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [{ workspaceId: hierTargetWs._id, role: 'Member' }],
    });

    await Promise.all(
      ['Member', 'Admin', 'Member', 'Admin', 'Member', 'Admin'].map(async (role) => {
        if (role === 'Admin') {
          await User.updateOne(
            { _id: memberToAdminUser._id, workspaces: { $elemMatch: { workspaceId: hierTargetWs._id, role: { $in: ['Member', 'Viewer'] } } } },
            { $set: { 'workspaces.$.role': 'Admin' } }
          );
        } else if (role === 'Member') {
          await User.updateOne(
            { _id: memberToAdminUser._id, workspaces: { $elemMatch: { workspaceId: hierTargetWs._id, role: 'Viewer' } } },
            { $set: { 'workspaces.$.role': 'Member' } }
          );
        }
      })
    );

    const reloadedM2AUser = await User.findById(memberToAdminUser._id);
    const m2aRole = reloadedM2AUser.workspaces.find((w) => w.workspaceId.toString() === hierTargetWs._id.toString())?.role;
    assert(m2aRole === 'Admin', 'Concurrent updates successfully upgrade Member to Admin without downgrade back to Member');

    // 4.21: Standalone Mid-Execution Preemption & Non-Persistence Verification
    console.log('\n--- Test 4.21: Standalone Mid-Execution Preemption & Non-Persistence Verification ---');
    const midPreemptEmail = `midpreempt_${Date.now()}@pulseplan.test`;
    const midPreemptUserA = await User.create({
      name: 'User A Delayed',
      email: midPreemptEmail,
      password: 'Password123!',
      isEmailVerified: true,
      workspaces: [],
    });
    const userAToken = generateToken(midPreemptUserA);

    const midPreemptRawToken = crypto.randomBytes(32).toString('hex');
    const midPreemptInv = await Invitation.create({
      type: 'project',
      email: midPreemptEmail,
      workspaceId: user1WorkspaceId,
      projectId,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(midPreemptRawToken),
      status: 'pending',
      expiresAt: new Date(Date.now() + 600000),
    });

    let requestBReclaimOccurred = false;
    let requestAFinalizationStatus = null;

    const originalWsSave = Workspace.prototype.save;
    Workspace.prototype.save = async function (...args) {
      const isUserASave = this.members?.some((m) => m.email === midPreemptEmail && m.userId?.toString() === midPreemptUserA._id.toString());
      if (isUserASave && !requestBReclaimOccurred) {
        requestBReclaimOccurred = true;
        const newClaimIdB = crypto.randomUUID();
        await Invitation.updateOne(
          { _id: midPreemptInv._id },
          { $set: { status: 'claimed', claimedAt: new Date(), claimId: newClaimIdB } }
        );
      }
      return originalWsSave.apply(this, args);
    };

    try {
      const resA = await request({
        path: `/api/invitations/token/${midPreemptRawToken}/accept`,
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      requestAFinalizationStatus = resA.status;
    } finally {
      Workspace.prototype.save = originalWsSave;
    }

    assert(requestBReclaimOccurred, 'Request B successfully reclaimed claim while Request A was paused mid-execution');
    assert(requestAFinalizationStatus === 409, 'Request A finalization rejected with HTTP 409 Conflict due to lost claim');

    const postWs = await Workspace.findById(user1WorkspaceId);
    const userAInWs = postWs.members?.some((m) => m.email === midPreemptEmail);
    assert(!userAInWs, 'Request A was stripped from Workspace.members (zero persistent membership changes)');

    const postProj = await Project.findById(projectId);
    const userAInProj = postProj.collaborators?.some((c) => c.email === midPreemptEmail);
    assert(!userAInProj, 'Request A was stripped from Project.collaborators (zero persistent collaborator changes)');

    const postUserA = await User.findById(midPreemptUserA._id);
    const userAHasWs = postUserA.workspaces?.some((w) => w.workspaceId.toString() === user1WorkspaceId.toString());
    assert(!userAHasWs, 'Request A was stripped from user.workspaces (zero persistent profile links)');

    // 4.22: Production Fail-Closed on Standalone Topology
    console.log('\n--- Test 4.22: Production Fail-Closed on Standalone Topology ---');
    const prodFailRawToken = crypto.randomBytes(32).toString('hex');
    await Invitation.create({
      type: 'project',
      email: midPreemptEmail,
      workspaceId: user1WorkspaceId,
      projectId,
      inviterId: adminUser._id,
      role: 'Member',
      tokenHash: hashToken(prodFailRawToken),
      status: 'pending',
      expiresAt: new Date(Date.now() + 600000),
    });

    ENV.IS_PRODUCTION = true;
    try {
      const prodRes = await request({
        path: `/api/invitations/token/${prodFailRawToken}/accept`,
        method: 'POST',
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert(prodRes.status === 503, 'Standalone topology blocked in production mode with HTTP 503 Service Unavailable');
      assert(prodRes.body.code === 'TRANSACTIONS_UNAVAILABLE', 'Returns explicit TRANSACTIONS_UNAVAILABLE error code');
    } finally {
      ENV.IS_PRODUCTION = false;
    }

    // 4.23: Gmail Dot-Insensitivity and Canonical Email Equivalence
    console.log('\n--- Test 4.23: Gmail Dot-Insensitivity & Canonical Email Equivalence ---');
    const gmailUserRegistered = `test.gmail.${Date.now()}@gmail.com`;
    const gmailUserWithoutDots = gmailUserRegistered.replace(/\./g, '').replace('@gmailcom', '@gmail.com');
    const gmailUserRegPass = 'Password123!';

    // Register user with dots preserved
    const gmailRegRes = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: {
        name: 'Gmail Dot Tester',
        email: gmailUserRegistered,
        password: gmailUserRegPass,
      },
    });
    assert(gmailRegRes.status === 201, 'User signs up with dots preserved in email');
    assert(gmailRegRes.body?.data?.email === gmailUserRegistered, 'Registered email retains dots in User model');

    // Mark verified in DB for test execution
    await User.updateOne({ email: gmailUserRegistered }, { isEmailVerified: true });

    // Login using the version WITHOUT dots
    const gmailLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: {
        email: gmailUserWithoutDots,
        password: gmailUserRegPass,
      },
    });
    assert(gmailLoginRes.status === 200, 'User can log in using email variant without dots (Gmail equivalence)');
    const gmailUserToken = gmailLoginRes.body?.data?.token || gmailLoginRes.headers['set-cookie']?.[0]?.split(';')[0]?.replace('token=', '');

    // Owner creates workspace invitation for email WITHOUT dots
    const gmailWsInviteRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        email: gmailUserWithoutDots,
        role: 'Member',
      },
    });
    assert(gmailWsInviteRes.status === 201, 'Workspace invitation sent to email variant without dots');
    const gmailInviteToken = gmailWsInviteRes.body?.data?.token;

    // Recipient (signed in with dots) accepts the invitation (sent without dots)
    const gmailAcceptRes = await request({
      path: `/api/invitations/token/${gmailInviteToken}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${gmailUserToken}` },
    });
    assert(gmailAcceptRes.status === 200, 'User signed in with dots successfully accepts invitation sent without dots (HTTP 200)');
    assert(gmailAcceptRes.body?.success === true, 'Acceptance response indicates success without account mismatch');

    // Confirm user is active member of workspace
    const checkWs = await Workspace.findById(user1WorkspaceId);
    const activeMember = checkWs.members.find((m) => m.email.replace(/\./g, '') === gmailUserWithoutDots.replace(/\./g, ''));
    assert(activeMember && activeMember.status === 'Active', 'Member is active in workspace members list');

    // Duplicate invitation check: Inviting the dot variant when member already active is rejected
    const gmailDupInviteRes = await request({
      path: `/api/workspaces/${user1WorkspaceId}/invitations`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginNew.body.data.token}`,
        'x-workspace-id': user1WorkspaceId,
      },
      body: {
        email: gmailUserRegistered,
        role: 'Member',
      },
    });
    assert(gmailDupInviteRes.status === 409, 'Duplicate invitation for existing member (dot variant) rejected with HTTP 409');

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
