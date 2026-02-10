import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Auth mock ───

vi.mock('@/lib/require-auth', () => ({
  requireAuth: () => ({ ok: true, auth: { email: 'user@test.fr' } }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => null,
  STANDARD_LIMIT: { limit: 60, windowSeconds: 60 },
}));

// ─── Supabase mock ───

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({ from: mockFrom }),
}));

// Helper to build chainable query mock
function chainable(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const handler = () => chain;
  chain.select = handler;
  chain.insert = handler;
  chain.delete = handler;
  chain.eq = handler;
  chain.in = handler;
  chain.gte = handler;
  chain.order = handler;
  chain.limit = handler;
  chain.not = handler;
  chain.single = () => Promise.resolve(result);
  chain.maybeSingle = () => Promise.resolve(result);
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);
  return chain;
}

function makeReq(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost'), init as RequestInit & { signal?: AbortSignal });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/watchlist ───

describe('GET /api/watchlist', () => {
  it('returns entries for authenticated user', async () => {
    const entries = [
      { id: 'u1', buyer_name: 'Acme Corp', buyer_siret: null, added_at: '2026-01-15T00:00:00Z' },
    ];
    mockFrom.mockReturnValue(chainable({ data: entries, error: null }));

    const { GET } = await import('../route');
    const res = await GET(makeReq('/api/watchlist'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.watchlist).toEqual(entries);
  });

  it('returns 500 on supabase error', async () => {
    mockFrom.mockReturnValue(chainable({ data: null, error: { message: 'db down' } }));

    const { GET } = await import('../route');
    const res = await GET(makeReq('/api/watchlist'));
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/watchlist ───

describe('POST /api/watchlist', () => {
  it('returns 400 when buyerName is missing', async () => {
    const { POST } = await import('../route');
    const res = await POST(makeReq('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it('creates an entry successfully', async () => {
    const entry = { id: 'new-1', buyer_name: 'Mairie Paris', buyer_siret: null, added_at: '2026-02-10' };
    mockFrom.mockReturnValue(chainable({ data: entry, error: null }));

    const { POST } = await import('../route');
    const res = await POST(makeReq('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyer_name: 'Mairie Paris' }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.item.buyer_name).toBe('Mairie Paris');
  });

  it('returns 400 on duplicate', async () => {
    mockFrom.mockReturnValue(chainable({ data: null, error: { code: '23505', message: 'duplicate' } }));

    const { POST } = await import('../route');
    const res = await POST(makeReq('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyer_name: 'Mairie Paris' }),
    }));
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/watchlist/check ───

describe('GET /api/watchlist/check', () => {
  it('returns 400 when buyerName is missing', async () => {
    const { GET } = await import('../check/route');
    const res = await GET(makeReq('/api/watchlist/check'));
    expect(res.status).toBe(400);
  });

  it('returns watched:true when entry exists', async () => {
    mockFrom.mockReturnValue(chainable({ data: { id: 'abc' }, error: null }));

    const { GET } = await import('../check/route');
    const res = await GET(makeReq('/api/watchlist/check?buyerName=Acme'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.watched).toBe(true);
    expect(json.id).toBe('abc');
  });

  it('returns watched:false when entry does not exist', async () => {
    mockFrom.mockReturnValue(chainable({ data: null, error: null }));

    const { GET } = await import('../check/route');
    const res = await GET(makeReq('/api/watchlist/check?buyerName=Nobody'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.watched).toBe(false);
  });
});

// ─── DELETE /api/watchlist/[id] ───

describe('DELETE /api/watchlist/[id]', () => {
  it('returns 200 on successful delete', async () => {
    mockFrom.mockReturnValue(chainable({ data: null, error: null }));

    const { DELETE } = await import('../[id]/route');
    const res = await DELETE(makeReq('/api/watchlist/abc', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'abc' }),
    });
    expect(res.status).toBe(200);
  });

  it('returns 500 on supabase error', async () => {
    mockFrom.mockReturnValue(chainable({ data: null, error: { message: 'not found' } }));

    const { DELETE } = await import('../[id]/route');
    const res = await DELETE(makeReq('/api/watchlist/bad', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 'bad' }),
    });
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/watchlist/alerts ───

describe('GET /api/watchlist/alerts', () => {
  it('returns empty alerts when watchlist is empty', async () => {
    mockFrom.mockReturnValue(chainable({ data: [], error: null }));

    const { GET } = await import('../alerts/route');
    const res = await GET(makeReq('/api/watchlist/alerts'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alerts).toEqual([]);
  });

  it('returns alerts from watched buyers', async () => {
    const watchlist = [{ buyer_name: 'Mairie Paris' }];
    const attributions = [
      { id: '1', title: 'Marché IT', buyer_name: 'Mairie Paris', notification_date: '2026-02-05', amount: 50000, cpv_code: '72000000' },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable({ data: watchlist, error: null });
      return chainable({ data: attributions, error: null });
    });

    const { GET } = await import('../alerts/route');
    const res = await GET(makeReq('/api/watchlist/alerts'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.alerts).toHaveLength(1);
    expect(json.alerts[0].title).toBe('Marché IT');
    expect(json.alerts[0].amount).toBe(50000);
  });
});
