import { NextRequest, NextResponse } from 'next/server';
import { r2Download, r2Delete } from '@/lib/r2-client';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

/** Validate key format strictly: uploads/{emailSlug}/{category}/{id}-{filename} */
function isValidKey(key: string): boolean {
  const pattern = /^uploads\/[a-zA-Z0-9_]+\/[a-z]+\/\d+-[a-zA-Z0-9]+-?.+$/;
  return pattern.test(key) && !key.includes('..');
}

/** Check that the key belongs to the requesting user. */
function isOwnedByUser(key: string, email: string): boolean {
  const emailSlug = email.replace(/[^a-zA-Z0-9]/g, '_');
  // Key format: uploads/{emailSlug}/{category}/{id}-{filename}
  // Also accept legacy format: uploads/{category}/{id}-{filename}
  return key.startsWith(`uploads/${emailSlug}/`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const key = decodeURIComponent(id);

    if (!isValidKey(key)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    if (!isOwnedByUser(key, auth.auth.email)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const result = await r2Download(key);

    if (!result) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    const filename = (key.split('/').pop() ?? 'file').replace(/[^a-zA-Z0-9._-]/g, '_');

    return new NextResponse(result.body, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const key = decodeURIComponent(id);

    if (!isValidKey(key)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    if (!isOwnedByUser(key, auth.auth.email)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    await r2Delete(key);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
