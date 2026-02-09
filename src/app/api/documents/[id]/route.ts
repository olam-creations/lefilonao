import { NextRequest, NextResponse } from 'next/server';
import { r2Download, r2Delete } from '@/lib/r2-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const key = decodeURIComponent(id);
    const result = await r2Download(key);

    if (!result) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    return new NextResponse(result.body, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const key = decodeURIComponent(id);
    await r2Delete(key);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
