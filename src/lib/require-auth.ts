import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface AuthContext {
  email: string;
  id: string;
  accessToken: string;
}

type AuthResult =
  | { ok: true; auth: AuthContext }
  | { ok: false; response: NextResponse };

/** Extract and verify user from Supabase Auth. Returns auth context or 401. */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    };
  }

  // Get session for access token (needed by FastAPI proxy)
  const { data: { session } } = await supabase.auth.getSession();

  return {
    ok: true,
    auth: {
      email: user.email!,
      id: user.id,
      accessToken: session?.access_token ?? ''
    }
  };
}
