import { NextRequest } from 'next/server'
import { proxyGet } from '@/lib/fastapi-client'

export async function GET(req: NextRequest) {
  return proxyGet(req, '/api/intel/export-csv')
}
