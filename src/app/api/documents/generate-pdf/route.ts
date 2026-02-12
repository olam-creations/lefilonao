import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import { generateDC1 } from '@/lib/pdf-dc1';
import { generateDC2 } from '@/lib/pdf-dc2';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { type, profile, issuer, title } = body;

    if (!type || !profile || !issuer || !title) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    let bytes: Uint8Array;
    let filename: string;

    if (type === 'dc1') {
      bytes = await generateDC1({ profile, issuer, title });
      filename = 'DC1_Lettre_candidature.pdf';
    } else if (type === 'dc2') {
      bytes = await generateDC2({ profile, issuer, title });
      filename = 'DC2_Declaration_candidat.pdf';
    } else {
      return NextResponse.json({ error: 'Type invalide (dc1 ou dc2)' }, { status: 400 });
    }

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur de génération PDF' }, { status: 500 });
  }
}
