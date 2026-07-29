#!/usr/bin/env node
/**
 * Post-Deploy Isolation Smoke Test
 * =================================
 * Verifies that session isolation is correctly configured in the live
 * production environment — not just in the development test suite.
 *
 * Checks:
 *   1. User A registers and creates a conversation.
 *   2. User B gets 404 when fetching User A's conversation (per-user scoping).
 *   3. Admin can fetch User A's conversation (admin bypass).
 *   4. Unauthenticated access to admin-only endpoints returns 401.
 *   5. Non-admin authenticated access to admin-only endpoints returns 403.
 *
 * Usage:
 *   BASE_URL=https://intelligent-supply-chain.replit.app \
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD=secret \
 *   node artifacts/api-server/scripts/smoke-isolation.mjs
 *
 * Exit codes: 0 = all assertions passed, 1 = one or more assertions failed.
 *
 * NOTE: Two throwaway user accounts are created in the production database.
 * Their emails are timestamped so they are unique per run. There is currently
 * no public API to delete user accounts; remove them manually via the database
 * console if required (SELECT id FROM users WHERE email LIKE 'smoke-%').
 */

const BASE_URL   = process.env.BASE_URL   ?? 'https://intelligent-supply-chain.replit.app';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ── Minimal cookie jar for session management ─────────────────────────────────

function makeCookieJar() {
  /** @type {Map<string, string>} */
  const store = new Map();

  /** Absorb Set-Cookie headers from a Response into the jar. */
  function absorb(response) {
    const raw = response.headers.getSetCookie?.() ?? [];
    for (const line of raw) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const name  = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value) store.set(name, value);
      else        store.delete(name);
    }
  }

  /** Build a Cookie header string from the current jar. */
  function header() {
    return [...store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  return { absorb, header };
}

// ── Low-level request helper ──────────────────────────────────────────────────

async function req(jar, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const cookie = jar.header();
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
    redirect: 'follow',
  });

  jar.absorb(res);
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, body: json };
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

let failures = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓  ${label}: ${actual}`);
  } else {
    console.error(`  ✗  ${label}: expected ${expected}, got ${actual}`);
    failures++;
  }
}

function assertNotEqual(label, actual, unexpected) {
  if (actual !== unexpected) {
    console.log(`  ✓  ${label}: ${actual} (not ${unexpected})`);
  } else {
    console.error(`  ✗  ${label}: expected anything except ${unexpected}, got ${actual}`);
    failures++;
  }
}

// ── Main smoke test ───────────────────────────────────────────────────────────

async function run() {
  const ts       = Date.now();
  const emailA   = `smoke-user-a-${ts}@test.invalid`;
  const emailB   = `smoke-user-b-${ts}@test.invalid`;
  const password = `SmokePass${ts}!`;

  console.log(`\n🔍  Isolation smoke test — ${new Date().toISOString()}`);
  console.log(`    Target: ${BASE_URL}\n`);

  // ── Step 1: Register User A ────────────────────────────────────────────────
  console.log('── Step 1: Register test accounts');
  const jarA = makeCookieJar();
  const regA = await req(jarA, 'POST', '/api/auth/register', {
    email: emailA, fullName: 'Smoke User A', password,
  });
  assert('Register User A', regA.status, 200);

  const jarB = makeCookieJar();
  const regB = await req(jarB, 'POST', '/api/auth/register', {
    email: emailB, fullName: 'Smoke User B', password,
  });
  assert('Register User B', regB.status, 200);

  if (regA.status !== 200 || regB.status !== 200) {
    console.error('\n  Registration failed — aborting further steps.\n');
    process.exit(1);
  }

  // ── Step 2: User A creates a conversation ─────────────────────────────────
  console.log('\n── Step 2: User A creates a conversation');
  const loginA = await req(jarA, 'POST', '/api/auth/login', { email: emailA, password });
  assert('User A login', loginA.status, 200);

  if (loginA.status !== 200) {
    console.error('\n  User A login failed — aborting.\n');
    process.exit(1);
  }

  const createConv = await req(jarA, 'POST', '/api/openai/conversations', {
    title: `Smoke test conversation ${ts}`,
  });
  assert('User A: create conversation', createConv.status, 201);

  const convId = createConv.body?.id;
  if (!convId) {
    console.error('\n  Failed to obtain conversation ID — aborting.\n');
    failures++;
    process.exit(1);
  }
  console.log(`    conversation id: ${convId}`);

  // User A can read their own conversation.
  const readByA = await req(jarA, 'GET', `/api/openai/conversations/${convId}`, null);
  assert('User A: read own conversation', readByA.status, 200);

  // ── Step 3: User B must NOT see User A's conversation ─────────────────────
  console.log('\n── Step 3: User B cannot access User A\'s conversation');
  const loginB = await req(jarB, 'POST', '/api/auth/login', { email: emailB, password });
  assert('User B login', loginB.status, 200);

  const readByB = await req(jarB, 'GET', `/api/openai/conversations/${convId}`, null);
  assert('User B: conversation returns 404', readByB.status, 404);

  // ── Step 4: Admin can see User A's conversation ────────────────────────────
  console.log('\n── Step 4: Admin can access User A\'s conversation');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('  ⚠  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin assertions');
  } else {
    const jarAdmin = makeCookieJar();
    const adminLogin = await req(jarAdmin, 'POST', '/api/auth/admin-login', {
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    });
    assert('Admin login', adminLogin.status, 200);
    assert('Admin role confirmed', adminLogin.body?.user?.role, 'admin');

    if (adminLogin.status === 200) {
      const readByAdmin = await req(jarAdmin, 'GET', `/api/openai/conversations/${convId}`, null);
      assert('Admin: read User A\'s conversation', readByAdmin.status, 200);

      // Admin can also see all conversations.
      const listByAdmin = await req(jarAdmin, 'GET', '/api/openai/conversations', null);
      assert('Admin: list conversations returns 200', listByAdmin.status, 200);

      const foundInList = Array.isArray(listByAdmin.body) &&
        listByAdmin.body.some((c) => c.id === convId);
      assert('Admin: User A\'s conversation appears in list', foundInList ? 200 : 404, 200);
    }
  }

  // ── Step 5: Unauthenticated requests to admin-only endpoints return 401 ────
  console.log('\n── Step 5: Unauthenticated access to admin-only endpoint');
  const jarAnon = makeCookieJar();
  const anonSub = await req(jarAnon, 'GET', '/api/submissions', null);
  assert('Unauthenticated GET /submissions → 401', anonSub.status, 401);

  // ── Step 6: Non-admin authenticated access to admin-only endpoint → 403 ───
  console.log('\n── Step 6: Non-admin user cannot access admin-only endpoint');
  const userBSub = await req(jarB, 'GET', '/api/submissions', null);
  assert('Non-admin GET /submissions → 403', userBSub.status, 403);

  // ── Cleanup: delete the test conversation ─────────────────────────────────
  console.log('\n── Cleanup: delete test conversation');
  const delConv = await req(jarA, 'DELETE', `/api/openai/conversations/${convId}`, null);
  assertNotEqual('Delete test conversation', delConv.status, 500);
  console.log(`    DELETE /api/openai/conversations/${convId} → ${delConv.status}`);
  console.log(`    ⚠  Test user accounts (${emailA}, ${emailB}) remain in the DB.`);
  console.log(`       Remove with: DELETE FROM users WHERE email LIKE 'smoke-%@test.invalid';`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  if (failures === 0) {
    console.log(`✅  All isolation assertions passed.\n`);
    process.exit(0);
  } else {
    console.error(`❌  ${failures} assertion(s) FAILED. Isolation may be misconfigured.\n`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\n  Fatal error:', err.message ?? err);
  process.exit(1);
});
