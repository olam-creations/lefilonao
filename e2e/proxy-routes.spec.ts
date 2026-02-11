import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Journey: FastAPI Proxy Routes
//
// Verifies that the 15 proxy routes correctly forward to FastAPI and return
// valid JSON responses. In dev mode, requireAuth() bypasses auth and
// resolveEmail() maps to ALLOWED_EMAILS for FastAPI feature gating.
// ---------------------------------------------------------------------------

test.describe('FastAPI Proxy -- Market routes', () => {
  test('GET /api/market/competition returns competition data', async ({ request }) => {
    const res = await request.get('/api/market/competition?cpv=72');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('competition');
    expect(data.competition).toHaveProperty('hhi');
    expect(data.competition).toHaveProperty('concentration');
    expect(data.competition).toHaveProperty('topShareholders');

    const cacheControl = res.headers()['cache-control'];
    expect(cacheControl).toContain('s-maxage=3600');
  });

  test('GET /api/market/trends returns volume trend', async ({ request }) => {
    const res = await request.get('/api/market/trends?cpv=72');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('volumeTrend');
    expect(Array.isArray(data.volumeTrend)).toBe(true);
  });

  test('GET /api/market/attributions returns attributions list', async ({ request }) => {
    const res = await request.get('/api/market/attributions?cpv=72');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('attributions');
    expect(Array.isArray(data.attributions)).toBe(true);
  });

  test('GET /api/market/winner-profile requires name param', async ({ request }) => {
    const res = await request.get('/api/market/winner-profile');
    // FastAPI may return 400 or 422 for missing required param
    expect([400, 422]).toContain(res.status());
  });

  test('GET /api/market/buyer-profile requires name param', async ({ request }) => {
    const res = await request.get('/api/market/buyer-profile');
    expect([400, 422]).toContain(res.status());
  });

  test('GET /api/market/competitor requires siret or name', async ({ request }) => {
    const res = await request.get('/api/market/competitor');
    expect([400, 422]).toContain(res.status());
  });
});

test.describe('FastAPI Proxy -- Intel routes', () => {
  test('GET /api/intel/feed returns feed data', async ({ request }) => {
    const res = await request.get('/api/intel/feed');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('feed');

    const cacheControl = res.headers()['cache-control'];
    expect(cacheControl).toContain('s-maxage=300');
  });

  test('GET /api/intel/market-share returns market share data', async ({ request }) => {
    const res = await request.get('/api/intel/market-share?cpv=72');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('marketShare');
  });

  test('GET /api/intel/competitor-card requires name or siret', async ({ request }) => {
    const res = await request.get('/api/intel/competitor-card');
    expect([400, 422]).toContain(res.status());
  });

  test('GET /api/intel/buyer-preferences requires buyer_name', async ({ request }) => {
    const res = await request.get('/api/intel/buyer-preferences');
    expect([400, 422]).toContain(res.status());
  });

  test('GET /api/intel/price-benchmark requires cpv', async ({ request }) => {
    const res = await request.get('/api/intel/price-benchmark');
    expect([400, 422]).toContain(res.status());
  });

  test('GET /api/intel/win-patterns returns patterns data', async ({ request }) => {
    const res = await request.get('/api/intel/win-patterns?cpv=72');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    // May return null patterns if insufficient data
    expect(data).toHaveProperty('patterns');
  });
});

test.describe('FastAPI Proxy -- AI routes', () => {
  test('POST /api/ai/analyze-dce without file returns error', async ({ request }) => {
    const res = await request.post('/api/ai/analyze-dce');
    // 400, 422, or 500 (FastAPI returns 500 when body is not multipart)
    expect(res.ok()).toBe(false);
  });

  test('POST /api/ai/generate-section without body returns error', async ({ request }) => {
    const res = await request.post('/api/ai/generate-section', { data: {} });
    expect(res.ok()).toBe(false);
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /api/ai/coach without body returns error', async ({ request }) => {
    const res = await request.post('/api/ai/coach', { data: {} });
    expect(res.ok()).toBe(false);
    expect(res.status()).toBeLessThan(500);
  });
});
