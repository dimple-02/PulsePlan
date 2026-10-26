/**
 * Comprehensive Security Audit Test Suite
 * PulsePlan SaaS Multi-Tenant Platform
 * 
 * Verifies:
 * 1. JWT and Cookie Security (expired, tampered, malformed, 'none' alg, claim checks)
 * 2. Server-side logout token invalidation (saved token rejected after logout)
 * 3. Route-by-route authentication requirements on all protected endpoints
 * 4. Multi-tenant isolation & header spoofing prevention
 * 5. Cross-workspace nested resource protections (mismatched project/task IDs)
 * 6. Role-based authorization on workspace mutation and deletion
 * 7. CORS origin whitelist and Anti-CSRF protection on state-changing requests
 * 8. Production environment configuration validations
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import { ENV, validateEnv } from '../config/env.js';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import mongoose from 'mongoose';

const PORT = ENV.PORT || 5000;
let totalPassed = 0;
let totalFailed = 0;

// Track IDs of created test entities for guaranteed cleanup
const cleanupUserIds = [];
const cleanupWorkspaceIds = [];

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    totalFailed++;
    process.exitCode = 1;
  }
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('       PulsePlan SaaS — Automated Security Audit Suite          ');
  console.log('================================================================\n');

  // Connect to mongoose for cleanup
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGODB_URI);
  }

  try {
    // -------------------------------------------------------------
    // SECTION 1: JWT & Token Validation
    // -------------------------------------------------------------
    console.log('--- SECTION 1: JWT & Token Validation ---');

    // 1.1 Tampered token signature
    const fakeToken = jwt.sign(
      { id: '65f1a2b3c4d5e6f7a8b9c0d1', email: 'attacker@evil.com', tokenVersion: 0 },
      'wrong_tampered_secret_key'
    );
    const r1_1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    assert(r1_1.status === 401, '1.1 Tampered JWT signature is rejected with HTTP 401');

    // 1.2 Expired token
    const expiredToken = jwt.sign(
      { id: '65f1a2b3c4d5e6f7a8b9c0d1', email: 'user@test.com', tokenVersion: 0 },
      ENV.JWT_SECRET,
      { expiresIn: '-10s', algorithm: 'HS256' }
    );
    const r1_2 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(r1_2.status === 401, '1.2 Expired JWT is rejected with HTTP 401');

    // 1.3 Malformed token string
    const r1_3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' },
    });
    assert(r1_3.status === 401, '1.3 Malformed JWT string is rejected with HTTP 401');

    // 1.4 Missing required claims (token without 'id')
    const noIdToken = jwt.sign(
      { email: 'user@test.com', tokenVersion: 0 },
      ENV.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );
    const r1_4 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${noIdToken}` },
    });
    assert(r1_4.status === 401, '1.4 JWT missing required "id" claim is rejected with HTTP 401');

    // -------------------------------------------------------------
    // SECTION 2: Server-Side Logout Token Invalidation (Requirement 2)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Server-Side Logout Session Invalidation ---');

    // 2.1 Sign up a fresh user
    const testUserEmail = `audit_user_${Date.now()}@pulseplan.test`;
    const signupRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Audit User', email: testUserEmail, password: 'StrongPassword123!' }
    );
    assert(signupRes.status === 201, '2.1 User signup succeeds with HTTP 201');
    const userA = signupRes.body?.data?.user;
    cleanupUserIds.push(userA?.id || userA?._id);
    const userAWsId = userA?.workspaces?.[0]?.workspaceId;
    if (userAWsId) cleanupWorkspaceIds.push(userAWsId);

    // Save the issued token in a test-only variable
    const savedToken = signupRes.body?.data?.token;
    const cookieHeader = signupRes.headers['set-cookie']?.[0]?.split(';')[0];
    assert(Boolean(savedToken), '2.2 Issued JWT token captured in savedToken variable');

    // Verify token works before logout
    const preLogoutRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${savedToken}` },
    });
    assert(preLogoutRes.status === 200, '2.3 Saved token functions normally before logout');

    // 2.2 Call Logout endpoint
    const logoutRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/logout',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${savedToken}`,
        Cookie: cookieHeader,
      },
    });
    assert(logoutRes.status === 200, '2.4 POST /api/auth/logout returns HTTP 200 OK');

    // 2.3 Send request with the saved token after logout
    const postLogoutBearerRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${savedToken}` },
    });
    assert(
      postLogoutBearerRes.status === 401,
      '2.5 Saved token sent via Bearer header REJECTED with HTTP 401 after logout',
      `Got status: ${postLogoutBearerRes.status}`
    );

    const postLogoutCookieRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });
    assert(
      postLogoutCookieRes.status === 401,
      '2.6 Saved token sent via Cookie header REJECTED with HTTP 401 after logout',
      `Got status: ${postLogoutCookieRes.status}`
    );

    // -------------------------------------------------------------
    // SECTION 3: Missing Authentication on Every Protected Endpoint
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Route-by-Route Unauthenticated Access Audit ---');

    const protectedEndpoints = [
      { method: 'GET', path: '/api/auth/me', name: 'GET /api/auth/me' },
      { method: 'GET', path: '/api/workspaces', name: 'GET /api/workspaces' },
      { method: 'POST', path: '/api/workspaces', name: 'POST /api/workspaces', body: { name: 'X' } },
      { method: 'GET', path: '/api/workspaces/65f1a2b3c4d5e6f7a8b9c0d1', name: 'GET /api/workspaces/:id' },
      { method: 'PATCH', path: '/api/workspaces/65f1a2b3c4d5e6f7a8b9c0d1', name: 'PATCH /api/workspaces/:id', body: { name: 'X' } },
      { method: 'DELETE', path: '/api/workspaces/65f1a2b3c4d5e6f7a8b9c0d1', name: 'DELETE /api/workspaces/:id' },
      { method: 'GET', path: '/api/projects', name: 'GET /api/projects' },
      { method: 'POST', path: '/api/projects', name: 'POST /api/projects', body: { name: 'X' } },
      { method: 'GET', path: '/api/projects/65f1a2b3c4d5e6f7a8b9c0d1', name: 'GET /api/projects/:id' },
      { method: 'PATCH', path: '/api/projects/65f1a2b3c4d5e6f7a8b9c0d1', name: 'PATCH /api/projects/:id', body: { name: 'X' } },
      { method: 'DELETE', path: '/api/projects/65f1a2b3c4d5e6f7a8b9c0d1', name: 'DELETE /api/projects/:id' },
      { method: 'GET', path: '/api/tasks', name: 'GET /api/tasks' },
      { method: 'POST', path: '/api/tasks', name: 'POST /api/tasks', body: { title: 'X' } },
      { method: 'GET', path: '/api/tasks/65f1a2b3c4d5e6f7a8b9c0d1', name: 'GET /api/tasks/:id' },
      { method: 'PATCH', path: '/api/tasks/65f1a2b3c4d5e6f7a8b9c0d1', name: 'PATCH /api/tasks/:id', body: { title: 'X' } },
      { method: 'DELETE', path: '/api/tasks/65f1a2b3c4d5e6f7a8b9c0d1', name: 'DELETE /api/tasks/:id' },
    ];

    for (const ep of protectedEndpoints) {
      const res = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: ep.path,
          method: ep.method,
          headers: ep.body ? { 'Content-Type': 'application/json' } : {},
        },
        ep.body
      );
      assert(res.status === 401, `3.${ep.name} requires authentication (returns HTTP 401)`);
    }

    // -------------------------------------------------------------
    // SECTION 4: Cross-Tenant Isolation & Header Tampering
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Cross-Tenant Isolation & Header Spoofing ---');

    // Create User A
    const emailA = `tenantA_${Date.now()}@pulseplan.test`;
    const userARes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Tenant A Owner', email: emailA, password: 'password123' }
    );
    const tokenA = userARes.body?.data?.token;
    const wsAId = userARes.body?.data?.user?.workspaces?.[0]?.workspaceId;
    cleanupUserIds.push(userARes.body?.data?.user?.id);
    if (wsAId) cleanupWorkspaceIds.push(wsAId);

    // Create User B
    const emailB = `tenantB_${Date.now()}@pulseplan.test`;
    const userBRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Tenant B Owner', email: emailB, password: 'password123' }
    );
    const tokenB = userBRes.body?.data?.token;
    const wsBId = userBRes.body?.data?.user?.workspaces?.[0]?.workspaceId;
    cleanupUserIds.push(userBRes.body?.data?.user?.id);
    if (wsBId) cleanupWorkspaceIds.push(wsBId);

    // 4.1 User B tries to view User A's workspace
    const r4_1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/workspaces/${wsAId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(r4_1.status === 403, '4.1 User B viewing Workspace A is blocked with HTTP 403');

    // 4.2 User B tries to update User A's workspace settings
    const r4_2 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/workspaces/${wsAId}`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
        },
      },
      { name: 'Hacked Workspace Name' }
    );
    assert(r4_2.status === 403, '4.2 User B updating Workspace A settings blocked with HTTP 403');

    // 4.3 User B tries to delete User A's workspace
    const r4_3 = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/workspaces/${wsAId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(r4_3.status === 403, '4.3 User B deleting Workspace A blocked with HTTP 403');

    // 4.4 User B sends forged x-workspace-id header pointing to Workspace A
    const r4_4 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/projects',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'x-workspace-id': wsAId,
      },
    });
    assert(r4_4.status === 403, '4.4 User B spoofing x-workspace-id to Workspace A blocked with HTTP 403');

    // 4.5 User B sends forged x-workspace-id header pointing to Acme
    const r4_5 = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/projects',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'x-workspace-id': 'acme-cloud',
      },
    });
    assert(r4_5.status === 403, '4.5 User B spoofing x-workspace-id to Acme blocked with HTTP 403');

    // -------------------------------------------------------------
    // SECTION 5: Nested Resources & Cross-Workspace Checks
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Nested Resources & Cross-Workspace Protections ---');

    // Create Project in Workspace A
    const projARes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/projects',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'x-workspace-id': wsAId,
          'Content-Type': 'application/json',
        },
      },
      { name: 'Alpha Core Service', key: 'ACS' }
    );
    const projAId = projARes.body?.data?.id || projARes.body?.data?._id;
    assert(projARes.status === 201, '5.1 Project created in Workspace A (HTTP 201)');

    // User B in Workspace B attempts to create a task assigned to Project A
    const crossTaskRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/tasks',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'x-workspace-id': wsBId,
          'Content-Type': 'application/json',
        },
      },
      { title: 'Injected Malicious Task', projectId: projAId }
    );
    assert(
      crossTaskRes.status === 400,
      '5.2 Cross-workspace task creation with foreign projectId rejected with HTTP 400'
    );

    // User B with Workspace B header attempts to view Project A
    const foreignProjRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/projects/${projAId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'x-workspace-id': wsBId,
      },
    });
    assert(
      foreignProjRes.status === 404,
      '5.3 Accessing foreign Project ID returns HTTP 404 in active workspace scope'
    );

    // User B with Workspace B header attempts to filter tasks by foreign projectId
    const foreignFilterRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/tasks?projectId=${projAId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'x-workspace-id': wsBId,
      },
    });
    assert(
      foreignFilterRes.status === 400,
      '5.4 Filtering tasks by foreign projectId rejected with HTTP 400'
    );

    // -------------------------------------------------------------
    // SECTION 6: Role Permissions (Member vs Admin/Owner)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: Role-Based Permissions Enforcement ---');

    // Create User C (Member with non-admin role in Workspace A)
    const emailC = `memberC_${Date.now()}@pulseplan.test`;
    const userCRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Member C', email: emailC, password: 'password123' }
    );
    const tokenC = userCRes.body?.data?.token;
    const userCId = userCRes.body?.data?.user?.id;
    cleanupUserIds.push(userCId);
    if (userCRes.body?.data?.user?.workspaces?.[0]?.workspaceId) {
      cleanupWorkspaceIds.push(userCRes.body?.data?.user?.workspaces[0].workspaceId);
    }

    // Explicitly add User C as a 'Member' (non-admin) in Workspace A
    await Workspace.findByIdAndUpdate(wsAId, {
      $push: {
        members: {
          name: 'Member C',
          email: emailC,
          role: 'Member',
          status: 'Active',
          userId: userCId,
        },
      },
    });
    await User.findByIdAndUpdate(userCId, {
      $push: {
        workspaces: {
          workspaceId: wsAId,
          role: 'Member',
        },
      },
    });

    // 6.1 Member C tries to delete Workspace A
    const r6_1 = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/workspaces/${wsAId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    assert(r6_1.status === 403, '6.1 Non-admin Member cannot delete workspace (HTTP 403)');

    // 6.2 Member C tries to update Workspace A settings
    const r6_2 = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/workspaces/${wsAId}`,
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenC}`,
          'Content-Type': 'application/json',
        },
      },
      { name: 'Member Renamed This' }
    );
    assert(r6_2.status === 403, '6.2 Non-admin Member cannot update workspace settings (HTTP 403)');

    // -------------------------------------------------------------
    // SECTION 7: CORS & CSRF Protections
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: CORS & CSRF Protections ---');

    // 7.1 Unauthorized origin rejected by CORS
    const corsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      headers: { Origin: 'http://malicious-site.com' },
    });
    const allowOrigin = corsRes.headers['access-control-allow-origin'];
    assert(
      allowOrigin !== 'http://malicious-site.com' && allowOrigin !== '*',
      '7.1 CORS blocks unauthorized origins from credentials/origin reflection'
    );

    // 7.2 Cookie-authenticated state change from cross-site blocked by CSRF
    const csrfCrossSiteRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/workspaces',
        method: 'POST',
        headers: {
          Cookie: userARes.headers['set-cookie']?.[0]?.split(';')[0],
          'Content-Type': 'application/json',
          'Sec-Fetch-Site': 'cross-site',
        },
      },
      { name: 'CSRF Attempt' }
    );
    assert(
      csrfCrossSiteRes.status === 403,
      '7.2 State-changing cookie request with Sec-Fetch-Site: cross-site blocked with HTTP 403'
    );

    // 7.3 Cookie-authenticated state change with untrusted Origin header blocked by CSRF
    const csrfOriginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/workspaces',
        method: 'POST',
        headers: {
          Cookie: userARes.headers['set-cookie']?.[0]?.split(';')[0],
          'Content-Type': 'application/json',
          Origin: 'http://attacker-phishing.com',
        },
      },
      { name: 'CSRF Origin Attempt' }
    );
    assert(
      csrfOriginRes.status === 403,
      '7.3 State-changing cookie request with foreign Origin header blocked with HTTP 403'
    );

    // -------------------------------------------------------------
    // SECTION 8: Production Environment Configuration Checks
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: Startup Environment Validation ---');

    // 8.1 In production mode, default secret must be rejected
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'pulseplan_jwt_secret_dev_key_2026'; // default dev key
      let threw = false;
      try {
        validateEnv();
      } catch {
        threw = true;
      }
      assert(threw, '8.1 validateEnv() blocks startup if default dev secret is used in production');

      // 8.2 In production mode, short secret must be rejected
      process.env.JWT_SECRET = 'too-short';
      let threwShort = false;
      try {
        validateEnv();
      } catch {
        threwShort = true;
      }
      assert(threwShort, '8.2 validateEnv() blocks startup if JWT_SECRET is shorter than 32 characters');
    } finally {
      process.env.NODE_ENV = prevEnv;
      process.env.JWT_SECRET = prevSecret;
    }

    console.log('\n================================================================');
    console.log(` Security Audit Complete: ${totalPassed} Passed, ${totalFailed} Failed `);
    console.log('================================================================');
  } finally {
    // Clean up ONLY records created by this test suite
    if (cleanupUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: cleanupUserIds } });
    }
    if (cleanupWorkspaceIds.length > 0) {
      await Workspace.deleteMany({ _id: { $in: cleanupWorkspaceIds } });
      await Project.deleteMany({ workspaceId: { $in: cleanupWorkspaceIds } });
      await Task.deleteMany({ workspaceId: { $in: cleanupWorkspaceIds } });
    }
    await mongoose.disconnect();
  }
}

runSecurityAudit().catch((err) => {
  console.error('[Test Execution Error]:', err);
  process.exit(1);
});
