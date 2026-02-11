import { NextRequest } from 'next/server'
import { proxyGet, CACHE_5M } from '@/lib/fastapi-client'

export async function GET(req: NextRequest) {
  return proxyGet(req, '/api/intel/feed', CACHE_5M)
}
