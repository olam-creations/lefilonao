import { NextRequest } from 'next/server'
import { proxyFormData } from '@/lib/fastapi-client'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  return proxyFormData(req, '/api/ai/analyze-dce')
}
