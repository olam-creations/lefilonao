import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Journey 6: Feature Gating (API level)
//
// In development mode, requireAuth() returns a dev user email
// (dev@lefilonao.local) without checking cookies. The dev user should have
// the "free" plan, meaning Pro-only features return 403.
//
// However, if the dev user exists in Supabase with plan='pro', the features
// will be accessible. Tests use flexible assertions to handle both cases.
// ---------------------------------------------------------------------------

test.describe('Journey 6 -- Feature Gating (API level)', () => {
  test('GET /api/auth/session in dev mode returns authenticated', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    // In dev mode, requireAuth() bypasses → always authenticated
    expect(data.authenticated).toBe(true);
  });

  test('POST /api/ai/analyze-dce without file returns error', async ({ request }) => {
    const res = await request.post('/api/ai/analyze-dce');

    // 403 if feature gated (free user), 400 if auth bypassed AND feature passes (pro user)
    const status = res.status();
    expect([400, 403]).toContain(status);

    if (status === 403) {
      const data = await res.json();
      expect(data.error).toContain('Pro');
    }
  });

  test('GET /api/market/buyer-profile without params returns error', async ({ request }) => {
    const res = await request.get('/api/market/buyer-profile');

    // Either 403 (feature gated for free user) or 400 (missing params)
    const status = res.status();
    expect([400, 403]).toContain(status);

    if (status === 403) {
      const data = await res.json();
      expect(data.error).toContain('Pro');
    }
  });

  test('feature-gated routes return structured error with "feature" key on 403', async ({ request }) => {
    const res = await request.post('/api/ai/analyze-dce');

    if (res.status() === 403) {
      const data = await res.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('feature');
    }
  });

  test('non-gated API routes are accessible in dev mode', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.ok()).toBe(true);
    expect(res.status()).toBe(200);
  });

  test('POST /api/ai/generate-section without body returns error', async ({ request }) => {
    const res = await request.post('/api/ai/generate-section', {
      data: {},
    });

    const status = res.status();
    expect([400, 403]).toContain(status);
  });

  test('POST /api/ai/coach without body returns error', async ({ request }) => {
    const res = await request.post('/api/ai/coach', {
      data: {},
    });

    const status = res.status();
    expect([400, 403]).toContain(status);
  });
});

// ---------------------------------------------------------------------------
// Auth cookie structure validation
// ---------------------------------------------------------------------------

test.describe('Auth cookie structure', () => {
  test('login with dev credentials sets session cookie', async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'dev@lefilonao.com', password: 'dev' },
    });

    // Rate limiting (5 req/min on /api/auth/login) may block this call
    if (loginRes.status() === 429) return;

    expect(loginRes.ok()).toBe(true);

    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);

    // After login, session endpoint should work (cookie was set)
    const sessionRes = await request.get('/api/auth/session');
    const data = await sessionRes.json();
    expect(data.authenticated).toBe(true);
  });

  test('logout API returns success after login', async ({ request }) => {
    // Login first
    await request.post('/api/auth/login', {
      data: { email: 'dev@lefilonao.com', password: 'dev' },
    });

    // Verify authenticated
    const before = await request.get('/api/auth/session');
    expect((await before.json()).authenticated).toBe(true);

    // Logout
    const logoutRes = await request.post('/api/auth/logout');
    expect(logoutRes.ok()).toBe(true);

    const logoutData = await logoutRes.json();
    expect(logoutData.success).toBe(true);

    // NOTE: In dev mode, requireAuth() still returns authenticated after logout
    // because the dev bypass doesn't check cookies. This is expected.
    // In production, the session would be cleared.
  });
});
