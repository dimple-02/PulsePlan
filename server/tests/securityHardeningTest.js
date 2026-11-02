import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`  [PASS] ${message}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('    PulsePlan SaaS — Targeted Security Hardening Test Suite     ');
  console.log('================================================================\n');

  // 1. Verify HTTP Security Headers
  console.log('--- SECTION 1: HTTP Security Headers & Information Disclosure ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is "nosniff"');
  assert(healthRes.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is "DENY"');
  assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin');
  assert(!healthRes.headers.get('x-powered-by'), 'X-Powered-By header is removed (no framework fingerprinting)');

  // 2. Register User A and User B
  console.log('\n--- SECTION 2: User Provisioning for IDOR & Privilege Tests ---');
  const timestamp = Date.now();
  const userA_email = `victim_owner_${timestamp}@pulseplan.test`;
  const userB_email = `attacker_${timestamp}@pulseplan.test`;
  const password = 'StrongPassword123!';

  await connectDB();

  // User A Signup
  const resA = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Victim Owner', email: userA_email, password }),
  });
  const dataA = await resA.json();
  const workspaceA_id = dataA.data.user.activeWorkspaceId;
  assert(workspaceA_id, 'User A registered and activeWorkspaceId created');
  await User.updateOne({ email: userA_email }, { $set: { isEmailVerified: true } });
  const loginResA = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userA_email, password }),
  });
  const cookieA = loginResA.headers.get('set-cookie');

  // User B Signup
  const resB = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Attacker User', email: userB_email, password }),
  });
  const dataB = await resB.json();
  await User.updateOne({ email: userB_email }, { $set: { isEmailVerified: true } });
  const loginResB = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userB_email, password }),
  });
  const cookieB = loginResB.headers.get('set-cookie');
  assert(cookieB, 'User B registered with session cookie');

  // 3. IDOR Protection on Chat Messages
  console.log('\n--- SECTION 3: IDOR Protection on Workspace Chat Messages ---');
  // Attacker B attempts to read Workspace A messages
  const getMsgRes = await fetch(`${BASE_URL}/workspaces/${workspaceA_id}/messages`, {
    headers: { 'Cookie': cookieB },
  });
  assert(getMsgRes.status === 403, 'User B reading Workspace A messages is blocked with HTTP 403 Forbidden');

  // Attacker B attempts to post message to Workspace A
  const postMsgRes = await fetch(`${BASE_URL}/workspaces/${workspaceA_id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieB,
    },
    body: JSON.stringify({ content: 'Malicious injected message from non-member' }),
  });
  assert(postMsgRes.status === 403, 'User B posting message into Workspace A is blocked with HTTP 403 Forbidden');

  // 4. Role Authorization on Member Management
  console.log('\n--- SECTION 4: Role-Based Access Control on Member Management ---');
  // Attacker B attempts to inject a member into Workspace A
  const addMemRes = await fetch(`${BASE_URL}/workspaces/${workspaceA_id}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieB,
    },
    body: JSON.stringify({ name: 'Unauthorized Intruder', email: 'intruder@test.com', role: 'Admin' }),
  });
  assert(addMemRes.status === 403, 'Non-member adding members to Workspace A blocked with HTTP 403 Forbidden');

  // Attacker B attempts to remove owner from Workspace A
  const delMemRes = await fetch(`${BASE_URL}/workspaces/${workspaceA_id}/members/${dataA.data.user._id}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookieB },
  });
  assert(delMemRes.status === 403, 'Non-member removing members from Workspace A blocked with HTTP 403 Forbidden');

  // 5. Nonexistent API Route Handling
  console.log('\n--- SECTION 5: Nonexistent API Endpoints Route Guard ---');
  const unknownApiRes = await fetch(`${BASE_URL}/some/random/missing/endpoint`);
  assert(unknownApiRes.status === 404, 'Nonexistent API endpoint returns HTTP 404');
  const unknownApiJson = await unknownApiRes.json();
  assert(unknownApiJson.success === false, 'Nonexistent API endpoint returns structured JSON error');

  console.log('\n================================================================');
  console.log(' All Security Hardening Assertions Passed Successfully! ');
  console.log('================================================================\n');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
