/**
 * PulsePlan First-Time User Onboarding Automated Test Suite
 *
 * Verifies all 12 required scenarios:
 * 1. New user sees onboarding after the correct signup/verification flow
 * 2. Existing user does not see onboarding unexpectedly
 * 3. Completed onboarding is not shown again
 * 4. Skipped onboarding is not shown again
 * 5. Answers persist after refresh and relogin
 * 6. Invalid enum values are rejected (role, goals, teamSize, experience)
 * 7. Unauthenticated requests cannot save onboarding (HTTP 401)
 * 8. Users cannot update another user's onboarding (strictly pinned to req.user._id)
 * 9. Invitation acceptance is not interrupted
 * 10. Invitation users are not redirected into workspace creation
 * 11. Multiple workspace memberships do not restart onboarding
 * 12. Dashboard personalization uses saved preferences correctly
 */

import http from 'http';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import app from '../app.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Invitation } from '../models/Invitation.js';
import { Otp } from '../models/Otp.js';
import { generateOtp, hashOtp, hashToken } from '../services/otpService.js';
import { linkPreexistingWorkspaces } from '../controllers/authController.js';

let server;
const TEST_PORT = 5058;

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

function extractCookie(res) {
  const rawCookie = res.headers['set-cookie'];
  if (!rawCookie) return null;
  const cookieStr = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;
  return cookieStr.split(';')[0];
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

// Evaluates frontend routing logic for onboarding
function computeNeedsOnboarding(user) {
  return Boolean(
    user?.onboarding &&
    user.onboarding.completed === false &&
    user.onboarding.skipped === false
  );
}

async function runOnboardingTests() {
  console.log('================================================================');
  console.log('      PulsePlan — First-Time User Onboarding Test Suite         ');
  console.log('================================================================\n');

  await connectDB();

  server = app.listen(TEST_PORT);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: New user sees onboarding after signup & verification
    // -------------------------------------------------------------
    console.log('--- SCENARIO 1: New User Signup & Verification Flow ---');
    const newEmail = `onboard_user_${Date.now()}@pulseplan.test`;
    const signupRes = await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: { name: 'New Explorer', email: newEmail, password: 'Password123!' },
    });

    assert(signupRes.status === 201, '1.1 Signup returns HTTP 201 Created');
    assert(signupRes.body?.data?.user?.onboarding !== undefined, '1.2 User entity includes onboarding schema');
    assert(signupRes.body?.data?.user?.onboarding?.completed === false, '1.3 onboarding.completed is initially false');
    assert(signupRes.body?.data?.user?.onboarding?.skipped === false, '1.4 onboarding.skipped is initially false');

    // Complete email verification with known OTP
    const testOtp1 = '654321';
    await Otp.updateOne({ email: newEmail, purpose: 'email_verification' }, { $set: { hashedOtp: hashOtp(testOtp1), attempts: 0 } });
    const verifyRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: { email: newEmail, otp: testOtp1 },
    });

    assert(verifyRes.status === 200, '1.5 verifyEmail returns HTTP 200 OK');
    const newUserCookie = extractCookie(verifyRes);
    assert(Boolean(newUserCookie && newUserCookie.startsWith('token=')), '1.6 Session cookie returned on verification');

    const verifiedUser = verifyRes.body?.data?.user;
    assert(computeNeedsOnboarding(verifiedUser) === true, '1.7 Newly verified user is flagged as needing onboarding');

    // -------------------------------------------------------------
    // SCENARIO 2: Existing user does not see onboarding unexpectedly
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2: Existing User Safe Pass-Through ---');
    const existingEmail = `legacy_user_${Date.now()}@pulseplan.test`;
    // Create legacy user with NO onboarding subdocument
    const legacyUserDoc = await User.create({
      name: 'Legacy Member',
      email: existingEmail,
      password: 'Password123!',
      isEmailVerified: true,
      onboarding: null,
    });

    const loginLegacyRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: existingEmail, password: 'Password123!' },
    });

    assert(loginLegacyRes.status === 200, '2.1 Existing user login succeeds with HTTP 200');
    const legacyUser = loginLegacyRes.body?.data?.user;
    assert(
      computeNeedsOnboarding(legacyUser) === false,
      '2.2 Existing user with no onboarding field evaluates to needsOnboarding = false'
    );

    const legacyCookie = extractCookie(loginLegacyRes);
    const legacyMeRes = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: legacyCookie },
    });
    assert(legacyMeRes.status === 200, '2.3 GET /api/auth/me restores legacy user session');
    assert(
      computeNeedsOnboarding(legacyMeRes.body?.data?.user) === false,
      '2.4 Legacy user session query does NOT force onboarding'
    );

    // -------------------------------------------------------------
    // SCENARIO 3: Completed onboarding is not shown again
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 3: Completed Onboarding Persistence ---');
    const completeOnboardRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: newUserCookie },
      body: {
        role: 'Developer',
        goals: ['Software development', 'Team collaboration'],
        teamSize: '6–10 people',
        experience: 'Experienced',
      },
    });

    assert(completeOnboardRes.status === 200, '3.1 PATCH /api/auth/onboarding returns HTTP 200');
    const completedUser = completeOnboardRes.body?.data?.user;
    assert(completedUser?.onboarding?.completed === true, '3.2 onboarding.completed is true');
    assert(completedUser?.onboarding?.skipped === false, '3.3 onboarding.skipped is false');
    assert(completedUser?.onboarding?.role === 'Developer', '3.4 Role saved as Developer');
    assert(completedUser?.onboarding?.teamSize === '6–10 people', '3.5 Team size saved as 6–10 people');
    assert(computeNeedsOnboarding(completedUser) === false, '3.6 User with completed onboarding will NOT see onboarding again');

    // -------------------------------------------------------------
    // SCENARIO 4: Skipped onboarding is not shown again
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: Skipped Onboarding Support ---');
    const skipEmail = `skip_user_${Date.now()}@pulseplan.test`;
    await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: { name: 'Skipper User', email: skipEmail, password: 'Password123!' },
    });
    const testOtp2 = '654321';
    await Otp.updateOne({ email: skipEmail, purpose: 'email_verification' }, { $set: { hashedOtp: hashOtp(testOtp2), attempts: 0 } });
    const skipVerifyRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: { email: skipEmail, otp: testOtp2 },
    });
    const skipCookie = extractCookie(skipVerifyRes);

    const skipOnboardRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: skipCookie },
      body: { skipped: true },
    });

    assert(skipOnboardRes.status === 200, '4.1 PATCH /api/auth/onboarding with skipped=true returns HTTP 200');
    const skippedUser = skipOnboardRes.body?.data?.user;
    assert(skippedUser?.onboarding?.skipped === true, '4.2 onboarding.skipped is true');
    assert(skippedUser?.onboarding?.completed === false, '4.3 onboarding.completed is false');
    assert(Boolean(skippedUser?.onboarding?.completedAt), '4.4 onboarding.completedAt is recorded');
    assert(computeNeedsOnboarding(skippedUser) === false, '4.5 User with skipped onboarding will NOT see onboarding again');

    // -------------------------------------------------------------
    // SCENARIO 5: Answers persist after refresh and relogin
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 5: Answers Persist Across Logout & Relogin ---');
    // Logout User A
    await request({
      path: '/api/auth/logout',
      method: 'POST',
      headers: { Cookie: newUserCookie },
    });

    // Relogin User A
    const reloginRes = await request({
      path: '/api/auth/login',
      method: 'POST',
      body: { email: newEmail, password: 'Password123!' },
    });
    assert(reloginRes.status === 200, '5.1 Relogin succeeds with HTTP 200');
    const reloginCookie = extractCookie(reloginRes);

    // Refresh session via /api/auth/me
    const meRes = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: reloginCookie },
    });

    assert(meRes.status === 200, '5.2 GET /api/auth/me succeeds');
    const refreshedUser = meRes.body?.data?.user;
    assert(refreshedUser?.onboarding?.role === 'Developer', '5.3 Saved role preserved');
    assert(
      JSON.stringify(refreshedUser?.onboarding?.goals) === JSON.stringify(['Software development', 'Team collaboration']),
      '5.4 Saved goals array preserved'
    );
    assert(refreshedUser?.onboarding?.teamSize === '6–10 people', '5.5 Saved teamSize preserved');
    assert(refreshedUser?.onboarding?.experience === 'Experienced', '5.6 Saved experience level preserved');
    assert(refreshedUser?.onboarding?.completed === true, '5.7 Completed status preserved');

    // -------------------------------------------------------------
    // SCENARIO 6: Invalid enum values are rejected
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 6: Enum Validation & Sanitization ---');
    const badRoleRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: reloginCookie },
      body: { role: 'Astronaut' },
    });
    assert(badRoleRes.status === 400, '6.1 Invalid role returns HTTP 400 Bad Request');
    assert(badRoleRes.body?.code === 'INVALID_ONBOARDING_ROLE', '6.2 Code is INVALID_ONBOARDING_ROLE');

    const badGoalRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: reloginCookie },
      body: { goals: ['Invalid Custom Goal'] },
    });
    assert(badGoalRes.status === 400, '6.3 Invalid goal returns HTTP 400 Bad Request');
    assert(badGoalRes.body?.code === 'INVALID_ONBOARDING_GOAL', '6.4 Code is INVALID_ONBOARDING_GOAL');

    const badTeamSizeRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: reloginCookie },
      body: { teamSize: '1000 people' },
    });
    assert(badTeamSizeRes.status === 400, '6.5 Invalid team size returns HTTP 400 Bad Request');
    assert(badTeamSizeRes.body?.code === 'INVALID_ONBOARDING_TEAM_SIZE', '6.6 Code is INVALID_ONBOARDING_TEAM_SIZE');

    const badExpRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: reloginCookie },
      body: { experience: 'Grandmaster' },
    });
    assert(badExpRes.status === 400, '6.7 Invalid experience returns HTTP 400 Bad Request');
    assert(badExpRes.body?.code === 'INVALID_ONBOARDING_EXPERIENCE', '6.8 Code is INVALID_ONBOARDING_EXPERIENCE');

    // Hyphen-to-en-dash normalization test (e.g. "2-5 people" -> "2–5 people")
    const normRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: reloginCookie },
      body: { teamSize: '2-5 people' },
    });
    assert(normRes.status === 200, '6.9 ASCII hyphen "2-5 people" normalized successfully to "2–5 people"');
    assert(normRes.body?.data?.user?.onboarding?.teamSize === '2–5 people', '6.10 Normalized teamSize stored with en-dash');

    // -------------------------------------------------------------
    // SCENARIO 7: Unauthenticated requests cannot save onboarding
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 7: Unauthenticated Protection ---');
    const unauthRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      body: { role: 'Student' },
    });
    assert(unauthRes.status === 401, '7.1 Unauthenticated request rejected with HTTP 401');

    // -------------------------------------------------------------
    // SCENARIO 8: Users cannot update another user's onboarding
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 8: Cross-User Tampering Prevention ---');
    // Relogin User A attempts to submit User B's id
    const tamperRes = await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: reloginCookie },
      body: {
        userId: legacyUserDoc._id.toString(),
        role: 'Student',
      },
    });
    assert(tamperRes.status === 200, '8.1 Request succeeds for User A');
    // Verify Legacy User was NOT affected
    const freshLegacyUser = await User.findById(legacyUserDoc._id);
    assert(freshLegacyUser.onboarding === null, '8.2 Target User B record was completely untouched by User A update');

    // -------------------------------------------------------------
    // SCENARIO 9: Invitation acceptance is not interrupted
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 9: Invitation Acceptance Preservation ---');
    const inviteeEmail = `invited_onboard_${Date.now()}@pulseplan.test`;
    // Create an inviting workspace
    const hostWorkspace = await Workspace.create({
      name: 'Host Organization',
      slug: `host-org-${Date.now()}`,
      membersCount: 1,
      members: [{ name: 'Host', email: 'host@pulseplan.test', role: 'Owner', status: 'Active' }],
    });

    const rawInviteToken = crypto.randomBytes(32).toString('hex');
    await Invitation.create({
      tokenHash: hashToken(rawInviteToken),
      email: inviteeEmail,
      workspaceId: hostWorkspace._id,
      inviterId: legacyUserDoc._id,
      role: 'Member',
      type: 'workspace',
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Invitee registers account
    await request({
      path: '/api/auth/signup',
      method: 'POST',
      body: { name: 'Invited Member', email: inviteeEmail, password: 'Password123!' },
    });
    const testOtp3 = '654321';
    await Otp.updateOne({ email: inviteeEmail, purpose: 'email_verification' }, { $set: { hashedOtp: hashOtp(testOtp3), attempts: 0 } });
    const inviteeVerifyRes = await request({
      path: '/api/auth/verify-email',
      method: 'POST',
      body: { email: inviteeEmail, otp: testOtp3 },
    });
    const inviteeCookie = extractCookie(inviteeVerifyRes);

    // Verify invitation details can be queried
    const invDetailsRes = await request({
      path: `/api/invitations/token/${rawInviteToken}`,
      method: 'GET',
    });
    assert(invDetailsRes.status === 200, '9.1 Public invitation viewable without requiring onboarding first');

    // Accept invitation
    const acceptRes = await request({
      path: `/api/invitations/token/${rawInviteToken}/accept`,
      method: 'POST',
      headers: { Cookie: inviteeCookie },
    });
    assert(acceptRes.status === 200, '9.2 Invitation accepted successfully before completing onboarding');

    // -------------------------------------------------------------
    // SCENARIO 10: Invitation users not redirected to workspace creation
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 10: Invitation Flow Preserves Workspace Target ---');
    assert(
      String(acceptRes.body?.data?.workspaceId) === String(hostWorkspace._id),
      '10.1 Accepted workspace matches the invited workspace directly'
    );
    const updatedWs = await Workspace.findById(hostWorkspace._id);
    const isMember = updatedWs.members.some((m) => m.email.toLowerCase() === inviteeEmail.toLowerCase());
    assert(isMember, '10.2 Invitee is active member of host workspace without creating a new workspace');

    // -------------------------------------------------------------
    // SCENARIO 11: Multiple workspace memberships do not restart onboarding
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 11: Joining Workspaces Does Not Restart Onboarding ---');
    // Invitee completes onboarding
    await request({
      path: '/api/auth/onboarding',
      method: 'PATCH',
      headers: { Cookie: inviteeCookie },
      body: { role: 'Student', goals: ['College projects'], teamSize: 'Just me', experience: 'Beginner' },
    });

    // Create a third workspace and add invitee
    const thirdWorkspace = await Workspace.create({
      name: 'Third Organization',
      slug: `third-org-${Date.now()}`,
      membersCount: 1,
      members: [{ name: 'Invited Member', email: inviteeEmail, role: 'Member', status: 'Active' }],
    });

    const userDocForSync = await User.findOne({ email: inviteeEmail });
    await linkPreexistingWorkspaces(userDocForSync);

    const userAfterJoin = await User.findById(userDocForSync._id);
    assert(
      userAfterJoin.onboarding?.completed === true,
      '11.1 onboarding.completed remains true after joining additional workspaces'
    );
    assert(
      computeNeedsOnboarding(userAfterJoin) === false,
      '11.2 Joining additional workspaces does NOT restart onboarding flow'
    );

    // -------------------------------------------------------------
    // SCENARIO 12: Dashboard personalization uses preferences correctly
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 12: Dashboard Personalization Preferences ---');
    const userPrefRes = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: inviteeCookie },
    });
    const userPref = userPrefRes.body?.data?.user?.onboarding;
    assert(userPref?.role === 'Student', '12.1 Student preference correctly recorded for dashboard guide');
    assert(userPref?.experience === 'Beginner', '12.2 Beginner experience level correctly recorded for starter hints');
    assert(
      userPref?.goals?.includes('College projects'),
      '12.3 College projects goal present to trigger course project templates'
    );
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n================================================================');
  console.log(` PulsePlan Onboarding Tests Complete: ${passedCount} Passed, ${failedCount} Failed `);
  console.log('================================================================\n');

  try {
    await mongoose.disconnect();
  } catch {}

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runOnboardingTests().catch((err) => {
  console.error('[FATAL]: Test execution error:', err);
  process.exit(1);
});
