import { NextRequest } from 'next/server'
import { proxyGet, CACHE_1H } from '@/lib/fastapi-client'

export async function GET(req: NextRequest) {
  return proxyGet(req, '/api/market/competition', CACHE_1H)
}
