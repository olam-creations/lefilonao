import { NextRequest, NextResponse } from 'next/server';
import { analyzePdfBuffer } from '@/lib/dce-analyzer';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, AI_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers PDF sont acceptes' },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Le fichier ne doit pas depasser 20 Mo' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const detail = await analyzePdfBuffer(buffer, request.signal);

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    const isKeyError = error instanceof Error && error.message.includes('cle API');
    return NextResponse.json(
      { success: false, error: isKeyError ? 'Service IA temporairement indisponible' : 'Une erreur est survenue' },
      { status: isKeyError ? 503 : 500 },
    );
  }
}
