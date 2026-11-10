import assert from 'node:assert';
import mongoose from 'mongoose';
import { areEmailsEqual, canonicalizeEmail, getEmailRegex, NORMALIZE_EMAIL_OPTS } from '../utils/emailUtils.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Message } from '../models/Message.js';
import { linkPreexistingWorkspaces, login } from '../controllers/authController.js';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { ENV } from '../config/env.js';

let passCount = 0;
let failCount = 0;

function testAssert(condition, message) {
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
  console.log('      PulsePlan — Gmail Canonical Email & Dot-Equivalence Suite  ');
  console.log('================================================================');

  // --- UNIT TESTS: canonicalizeEmail ---
  console.log('\n--- SECTION 1: Unit Tests for canonicalizeEmail ---');
  testAssert(
    canonicalizeEmail('bajaj.dimple42@gmail.com') === 'bajajdimple42@gmail.com',
    'canonicalizeEmail removes dots from gmail.com'
  );
  testAssert(
    canonicalizeEmail('ba.jaj.dim.ple.42@gmail.com') === 'bajajdimple42@gmail.com',
    'canonicalizeEmail removes multiple dots from gmail.com'
  );
  testAssert(
    canonicalizeEmail('bajajdimple42@googlemail.com') === 'bajajdimple42@gmail.com',
    'canonicalizeEmail normalizes googlemail.com to gmail.com'
  );
  testAssert(
    canonicalizeEmail('bajaj.dimple42+newsletter@googlemail.com') === 'bajajdimple42@gmail.com',
    'canonicalizeEmail removes subaddress (+tag) from googlemail.com'
  );
  testAssert(
    canonicalizeEmail('user.name@enterprise.org') === 'user.name@enterprise.org',
    'canonicalizeEmail preserves dots for non-Gmail domains'
  );
  testAssert(
    canonicalizeEmail('') === '',
    'canonicalizeEmail handles empty string safely'
  );
  testAssert(
    canonicalizeEmail(null) === '',
    'canonicalizeEmail handles null safely'
  );

  // --- UNIT TESTS: areEmailsEqual ---
  console.log('\n--- SECTION 2: Unit Tests for areEmailsEqual ---');
  testAssert(
    areEmailsEqual('bajaj.dimple42@gmail.com', 'bajajdimple42@gmail.com') === true,
    'areEmailsEqual equates bajaj.dimple42@gmail.com and bajajdimple42@gmail.com'
  );
  testAssert(
    areEmailsEqual('BAJAJ.DIMPLE42@GMAIL.COM', 'bajajdimple42@gmail.com') === true,
    'areEmailsEqual is case-insensitive for Gmail with dots'
  );
  testAssert(
    areEmailsEqual('bajaj.dimple42+collab@gmail.com', 'bajajdimple42@gmail.com') === true,
    'areEmailsEqual matches Gmail subaddresses (+tag)'
  );
  testAssert(
    areEmailsEqual('bajaj.dimple42@googlemail.com', 'bajajdimple42@gmail.com') === true,
    'areEmailsEqual equates @googlemail.com and @gmail.com'
  );
  testAssert(
    areEmailsEqual('bajajdimple42@gmail.com', 'otherperson@gmail.com') === false,
    'areEmailsEqual distinguishes different Gmail accounts'
  );
  testAssert(
    areEmailsEqual('john.doe@company.com', 'johndoe@company.com') === false,
    'areEmailsEqual preserves dot sensitivity for corporate domains'
  );
  testAssert(
    areEmailsEqual('john.doe@company.com', 'JOHN.DOE@company.com') === true,
    'areEmailsEqual is case-insensitive for non-Gmail domains'
  );
  testAssert(
    areEmailsEqual(null, 'test@gmail.com') === false,
    'areEmailsEqual returns false on null first argument'
  );
  testAssert(
    areEmailsEqual('test@gmail.com', undefined) === false,
    'areEmailsEqual returns false on undefined second argument'
  );

  // --- UNIT TESTS: getEmailRegex ---
  console.log('\n--- SECTION 3: Unit Tests for getEmailRegex ---');
  const regex = getEmailRegex('bajaj.dimple42@gmail.com');
  testAssert(
    regex.test('bajajdimple42@gmail.com') === true,
    'Regex matches plain lowercase without dots'
  );
  testAssert(
    regex.test('bajaj.dimple42@gmail.com') === true,
    'Regex matches original address with dot'
  );
  testAssert(
    regex.test('ba.jaj.dim.ple.42@gmail.com') === true,
    'Regex matches arbitrary dot permutations'
  );
  testAssert(
    regex.test('bajajdimple42@googlemail.com') === true,
    'Regex matches googlemail.com'
  );
  testAssert(
    regex.test('bajajdimple42+extra@gmail.com') === true,
    'Regex matches plus-subaddress'
  );
  testAssert(
    regex.test('bajajdimple429@gmail.com') === false,
    'Regex does not match extra characters at end'
  );
  testAssert(
    regex.test('notbajajdimple42@gmail.com') === false,
    'Regex does not match prefix characters'
  );

  // --- SECTION 4: NORMALIZE_EMAIL_OPTS Configuration ---
  console.log('\n--- SECTION 4: Validator Configuration ---');
  testAssert(
    NORMALIZE_EMAIL_OPTS.gmail_remove_dots === false,
    'NORMALIZE_EMAIL_OPTS explicitly sets gmail_remove_dots: false'
  );
  testAssert(
    NORMALIZE_EMAIL_OPTS.all_lowercase === true,
    'NORMALIZE_EMAIL_OPTS ensures lowercasing'
  );

  // --- SECTION 5: MongoDB Integration with linkPreexistingWorkspaces ---
  console.log('\n--- SECTION 5: Database Integration: linkPreexistingWorkspaces with Dot Variance ---');
  await mongoose.connect(ENV.MONGODB_URI);

  const timestamp = Date.now();
  const emailWithDot = `test.user.${timestamp}@gmail.com`;
  const emailWithoutDot = `testuser${timestamp}@gmail.com`;

  // 1. Create a workspace with a pending member entry using emailWithDot
  const ws = await Workspace.create({
    name: `Test WS ${timestamp}`,
    slug: `test-ws-${timestamp}`,
    plan: 'Starter',
    currentUserRole: 'Owner',
    membersCount: 1,
    members: [
      {
        name: 'Invited Member',
        email: emailWithDot,
        role: 'Admin',
        avatar: 'IM',
        status: 'Offline',
      },
    ],
  });

  // 2. Create a project with collaborator using emailWithDot
  const proj = await Project.create({
    name: `Test Project ${timestamp}`,
    key: `TP${timestamp.toString().slice(-4)}`,
    workspaceId: ws._id,
    lead: 'Lead Admin',
    collaborators: [
      {
        name: 'Invited Collab',
        email: emailWithDot,
        role: 'Admin',
        avatar: 'IC',
      },
    ],
  });

  // 3. User registers with email WITHOUT dot
  const registeredUser = await User.create({
    name: 'Registered User',
    email: emailWithoutDot,
    password: 'Password123!',
    avatar: 'RU',
    isEmailVerified: true,
  });

  // 4. Run linkPreexistingWorkspaces
  await linkPreexistingWorkspaces(registeredUser);

  // 5. Verify the workspace member was updated with registeredUser._id and status Active
  const updatedWs = await Workspace.findById(ws._id);
  const matchedMember = updatedWs.members.find((m) => m.email === emailWithDot);
  testAssert(
    matchedMember && matchedMember.userId?.toString() === registeredUser._id.toString(),
    'Workspace member entry with dot linked to user registered without dot'
  );
  testAssert(
    matchedMember && matchedMember.status === 'Active',
    'Workspace member status updated to Active'
  );

  // 6. Verify user.workspaces contains ws._id with Admin role
  const freshUser = await User.findById(registeredUser._id);
  const userWsLink = freshUser.workspaces.find((w) => w.workspaceId.toString() === ws._id.toString());
  testAssert(
    Boolean(userWsLink),
    'User workspaces array contains the linked workspace'
  );
  testAssert(
    userWsLink?.role === 'Admin',
    'User received the correct Admin role from the member record'
  );

  // 7. Verify project collaborator was updated with registeredUser._id
  const updatedProj = await Project.findById(proj._id);
  const matchedCollab = updatedProj.collaborators.find((c) => c.email === emailWithDot);
  testAssert(
    matchedCollab && matchedCollab.userId?.toString() === registeredUser._id.toString(),
    'Project collaborator entry with dot linked to user registered without dot'
  );

  // --- SECTION 6: Auto-restoring OG Gmail with dot on login ---
  console.log('\n--- SECTION 6: Login Auto-restoration of OG Gmail with Dot ---');
  function createMockReqRes(options = {}) {
    let statusCode = 200;
    let payload = null;
    let cookieVal = null;
    const req = {
      body: options.body || {},
      params: options.params || {},
      query: options.query || {},
      user: options.user || null,
      cookies: options.cookies || {},
    };
    const res = {
      status(c) {
        statusCode = c;
        return this;
      },
      json(d) {
        payload = d;
        return this;
      },
      cookie(name, val) {
        cookieVal = val;
        return this;
      },
      _getStatus() {
        return statusCode;
      },
      _getData() {
        return payload;
      },
    };
    const next = (err) => {
      if (err) throw err;
    };
    return { req, res, next };
  }

  // Create dotless user in DB
  const dotlessEmail = `ogtestuser${timestamp}@gmail.com`;
  const ogEmailWithDot = `og.test.user.${timestamp}@gmail.com`;
  const legacyDotlessUser = await User.create({
    name: 'OG User',
    email: dotlessEmail,
    password: 'Password123!',
    avatar: 'OG',
    isEmailVerified: true,
  });

  // User logs in providing their original email with dots
  const loginCtx = createMockReqRes({
    body: {
      email: ogEmailWithDot,
      password: 'Password123!',
    },
  });
  await login(loginCtx.req, loginCtx.res, loginCtx.next);

  testAssert(loginCtx.res._getStatus() === 200, 'Login succeeded with HTTP 200');
  const loginData = loginCtx.res._getData();
  testAssert(
    loginData.data.user.email === ogEmailWithDot,
    'Returned user payload restores the original Gmail email containing dots'
  );

  const refreshedDbUser = await User.findById(legacyDotlessUser._id);
  testAssert(
    refreshedDbUser.email === ogEmailWithDot,
    'MongoDB user document email is permanently updated to original Gmail with dots'
  );

  // --- SECTION 7: Workspace Chat / Messaging with Dot Variance & Multi-Tenant Isolation ---
  console.log('\n--- SECTION 7: Workspace Chat & Direct Messaging ---');

  // Add refreshedDbUser as a member of ws
  await Workspace.updateOne(
    { _id: ws._id },
    {
      $push: {
        members: {
          name: refreshedDbUser.name,
          email: refreshedDbUser.email,
          role: 'Member',
          avatar: refreshedDbUser.avatar,
          status: 'Active',
          userId: refreshedDbUser._id,
        },
      },
    }
  );

  // User 1 sends message to User 2 (refreshedDbUser)
  const sendCtx1 = createMockReqRes({
    params: { id: ws._id.toString() },
    user: registeredUser,
    body: {
      content: 'Hello collaborator with dots!',
      recipientEmail: ogEmailWithDot,
      recipientName: refreshedDbUser.name,
      recipientAvatar: refreshedDbUser.avatar,
    },
  });
  await sendMessage(sendCtx1.req, sendCtx1.res, sendCtx1.next);

  testAssert(sendCtx1.res._getStatus() === 201, 'User 1 successfully posted direct message (HTTP 201)');
  const sentMsg = sendCtx1.res._getData()?.data;
  testAssert(
    sentMsg && sentMsg.content === 'Hello collaborator with dots!',
    'Message content matches input'
  );
  testAssert(
    sentMsg?.recipient?.email === ogEmailWithDot,
    'Recipient email preserved with dots'
  );

  // User 2 fetches messages with query ?recipientEmail=<registeredUser.email>
  const getCtx1 = createMockReqRes({
    params: { id: ws._id.toString() },
    user: refreshedDbUser,
    query: { recipientEmail: registeredUser.email },
  });
  await getMessages(getCtx1.req, getCtx1.res, getCtx1.next);

  testAssert(getCtx1.res._getStatus() === 200, 'User 2 fetched messages successfully (HTTP 200)');
  const messagesUser2 = getCtx1.res._getData()?.data || [];
  testAssert(
    messagesUser2.some((m) => m.content === 'Hello collaborator with dots!'),
    'Recipient User 2 retrieved the direct message across dot variants'
  );

  // Self-chat test: User 1 sends message to themselves
  const sendSelfCtx = createMockReqRes({
    params: { id: ws._id.toString() },
    user: registeredUser,
    body: {
      content: 'Self note for testing chat',
      recipientEmail: registeredUser.email,
    },
  });
  await sendMessage(sendSelfCtx.req, sendSelfCtx.res, sendSelfCtx.next);
  testAssert(sendSelfCtx.res._getStatus() === 201, 'Self message posted successfully');

  // User 1 queries self-messages
  const getSelfCtx = createMockReqRes({
    params: { id: ws._id.toString() },
    user: registeredUser,
    query: { recipientEmail: registeredUser.email },
  });
  await getMessages(getSelfCtx.req, getSelfCtx.res, getSelfCtx.next);
  const selfMessages = getSelfCtx.res._getData()?.data || [];
  testAssert(
    selfMessages.some((m) => m.content === 'Self note for testing chat'),
    'Self-chat messages retrieved correctly'
  );

  // IDOR check: Non-member is blocked from sending message
  const nonMemberUser = await User.create({
    name: 'Outsider',
    email: `outsider.${timestamp}@gmail.com`,
    password: 'Password123!',
    avatar: 'OS',
    isEmailVerified: true,
  });

  const sendBlockedCtx = createMockReqRes({
    params: { id: ws._id.toString() },
    user: nonMemberUser,
    body: {
      content: 'Intruder message',
      recipientEmail: ogEmailWithDot,
    },
  });
  await sendMessage(sendBlockedCtx.req, sendBlockedCtx.res, sendBlockedCtx.next);
  testAssert(
    sendBlockedCtx.res._getStatus() === 403,
    'Non-member posting to workspace is blocked with HTTP 403 Forbidden'
  );

  // Cleanup extra test data
  await Message.deleteMany({ workspaceId: ws._id });
  await User.deleteOne({ _id: legacyDotlessUser._id });
  await User.deleteOne({ _id: nonMemberUser._id });

  // Cleanup
  await Workspace.deleteOne({ _id: ws._id });
  await Project.deleteOne({ _id: proj._id });
  await User.deleteOne({ _id: registeredUser._id });

  await mongoose.connection.close();

  console.log('\n================================================================');
  console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================\n');

  process.exit(failCount === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
