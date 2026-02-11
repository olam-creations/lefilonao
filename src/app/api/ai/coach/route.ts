import { NextRequest } from 'next/server'
import { proxyPost } from '@/lib/fastapi-client'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  return proxyPost(req, '/api/ai/coach')
}
