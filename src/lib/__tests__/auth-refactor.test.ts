import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from '../require-auth';
import { NextRequest } from 'next/server';

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

import { createClient } from '@/lib/supabase/server';

describe('requireAuth (Supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no session', async () => {
    const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    // @ts-ignore
    vi.mocked(createClient).mockResolvedValue({ auth: { getSession: mockGetSession } });

    const req = new NextRequest('http://localhost');
    const result = await requireAuth(req);

    expect(result.ok).toBe(false);
    if (!result.ok) {
       expect(result.response.status).toBe(401);
    }
  });

  it('should return auth context if session exists', async () => {
    const mockSession = {
      user: { email: 'test@test.com', id: '123' },
      access_token: 'token123'
    };
    const mockGetSession = vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null });
    // @ts-ignore
    vi.mocked(createClient).mockResolvedValue({ auth: { getSession: mockGetSession } });

    const req = new NextRequest('http://localhost');
    const result = await requireAuth(req);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.auth.email).toBe('test@test.com');
      expect(result.auth.accessToken).toBe('token123');
      expect(result.auth.id).toBe('123');
    }
  });
});
