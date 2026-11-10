import assert from 'node:assert';
import mongoose from 'mongoose';
import { areEmailsEqual, canonicalizeEmail, getEmailRegex, NORMALIZE_EMAIL_OPTS } from '../utils/emailUtils.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { linkPreexistingWorkspaces } from '../controllers/authController.js';
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
