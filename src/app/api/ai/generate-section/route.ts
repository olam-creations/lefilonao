import { NextRequest } from 'next/server'
import { proxyPostStream } from '@/lib/fastapi-client'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  return proxyPostStream(req, '/api/ai/generate-section')
}
