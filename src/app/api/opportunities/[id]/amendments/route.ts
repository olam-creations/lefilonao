import { NextRequest } from 'next/server';
import { proxyGet, CACHE_1H } from '@/lib/fastapi-client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyGet(req, `/api/opportunities/${encodeURIComponent(id)}/amendments`, CACHE_1H);
}
