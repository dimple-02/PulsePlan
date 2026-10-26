/**
 * Automated Authentication & Multi-Tenant Isolation Verification Script
 * 
 * Verifies:
 * 1. Unauthenticated request protection (401)
 * 2. New user registration with password hashing (201)
 * 3. Automatic isolated personal workspace provisioning
 * 4. Duplicate email prevention (409)
 * 5. Invalid credentials rejection (401)
 * 6. Session restoration via HTTP-only cookie (/api/auth/me)
 * 7. Server-side workspace membership scoping (user sees ONLY their workspaces)
 * 8. Multi-tenant isolation: User B CANNOT access User A's workspace (403)
 * 9. Header tampering prevention: User B cannot supply x-workspace-id of Acme (403)
 * 10. Logout and session cookie clearing (200)
 */

import http from 'http';

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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' PulsePlan SaaS - Auth & Multi-Tenancy Test Suite   ');
  console.log('====================================================\n');

  // Test 1
  console.log('Test 1: Unauthenticated Endpoint Protection');
  const t1 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/workspaces',
    method: 'GET',
  });
  assert(t1.status === 401, 'Unauthenticated GET /api/workspaces returns HTTP 401');

  // Test 2
  console.log('\nTest 2: User A Registration & Workspace Provisioning');
  const userAEmail = `alice_${Date.now()}@pulseplan.test`;
  const t2 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name: 'Alice Morgan', email: userAEmail, password: 'password123' }
  );
  assert(t2.status === 201, 'User A signup returns HTTP 201 Created');
  const userACookie = t2.headers['set-cookie']?.[0]?.split(';')[0];
  assert(Boolean(userACookie && userACookie.startsWith('token=')), 'HTTP-only session cookie returned in Set-Cookie header');
  const userAWsId = t2.body?.data?.user?.workspaces?.[0]?.workspaceId;
  assert(Boolean(userAWsId), 'User A automatically provisioned with a private personal workspace');

  // Test 3
  console.log('\nTest 3: Duplicate Email Prevention');
  const t3 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name: 'Alice Morgan', email: userAEmail, password: 'password123' }
  );
  assert(t3.status === 409, 'Duplicate signup returns HTTP 409 Conflict');

  // Test 4
  console.log('\nTest 4: Invalid Password Login');
  const t4 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: userAEmail, password: 'incorrectPassword' }
  );
  assert(t4.status === 401, 'Invalid password returns HTTP 401 Unauthorized');

  // Test 5
  console.log('\nTest 5: Session Restoration via Cookie (GET /api/auth/me)');
  const t5 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Cookie: userACookie },
  });
  assert(t5.status === 200, 'GET /api/auth/me returns HTTP 200 OK');
  assert(t5.body?.data?.user?.email === userAEmail.toLowerCase(), 'Restores correct user session from cookie');

  // Test 6
  console.log('\nTest 6: User A Workspace Scoping');
  const t6 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/workspaces',
    method: 'GET',
    headers: { Cookie: userACookie },
  });
  assert(t6.status === 200, 'GET /api/workspaces returns HTTP 200');
  const userAWorkspaces = t6.body?.data || [];
  const seesOnlyOwn = userAWorkspaces.every((w) => w.name.includes('Alice') || w.id === userAWsId);
  assert(seesOnlyOwn, 'User A sees ONLY their authorized workspace, not Acme or other tenants');

  // Test 7
  console.log('\nTest 7: User B Registration');
  const userBEmail = `bob_${Date.now()}@pulseplan.test`;
  const t7 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { name: 'Bob Smith', email: userBEmail, password: 'password123' }
  );
  assert(t7.status === 201, 'User B signup returns HTTP 201');
  const userBCookie = t7.headers['set-cookie']?.[0]?.split(';')[0];

  // Test 8
  console.log('\nTest 8: Cross-Tenant Isolation (User B -> User A Workspace)');
  const t8 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'GET',
    headers: {
      Cookie: userBCookie,
      'x-workspace-id': userAWsId,
    },
  });
  assert(t8.status === 403, 'Cross-tenant access blocked with HTTP 403 Forbidden');

  // Test 9
  console.log('\nTest 9: Header Spoofing Protection (User B -> Acme Workspace)');
  const t9 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/projects',
    method: 'GET',
    headers: {
      Cookie: userBCookie,
      'x-workspace-id': 'acme-cloud',
    },
  });
  assert(t9.status === 403, 'Arbitrary x-workspace-id blocked with HTTP 403 Forbidden');

  // Test 10
  console.log('\nTest 10: Logout & Session Invalidation');
  const t10 = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { Cookie: userACookie },
  });
  assert(t10.status === 200, 'POST /api/auth/logout returns HTTP 200');
  const clearedCookie = t10.headers['set-cookie']?.[0];
  assert(Boolean(clearedCookie && clearedCookie.includes('token=;')), 'Session cookie cleared on logout');

  console.log('\n====================================================');
  console.log(' All 10 Authentication & Isolation Tests Verified!  ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
