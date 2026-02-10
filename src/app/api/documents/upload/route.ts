import { NextRequest, NextResponse } from 'next/server';
import { r2Upload } from '@/lib/r2-client';
import { requireAuth } from '@/lib/require-auth';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const ALLOWED_CATEGORIES = ['general', 'dce', 'memoire', 'candidature', 'cachet', 'logo'] as const;
type Category = typeof ALLOWED_CATEGORIES[number];

const MAX_FILENAME_LENGTH = 100;

/** Sanitize filename: keep only alphanumeric, dots, dashes, underscores. Truncate to limit. */
function sanitizeFilename(raw: string): string {
  const sanitized = raw.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  if (sanitized.length <= MAX_FILENAME_LENGTH) return sanitized;
  const ext = sanitized.includes('.') ? sanitized.slice(sanitized.lastIndexOf('.')) : '';
  const base = sanitized.slice(0, MAX_FILENAME_LENGTH - ext.length);
  return base + ext;
}

function isAllowedCategory(value: string): value is Category {
  return (ALLOWED_CATEGORIES as readonly string[]).includes(value);
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, STANDARD_LIMIT);
  if (rl) return rl;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawCategory = (formData.get('category') as string) || 'general';

    if (!isAllowedCategory(rawCategory)) {
      return NextResponse.json(
        { error: `Categorie invalide. Valeurs acceptees : ${ALLOWED_CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name);
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const emailSlug = auth.auth.email.replace(/[^a-zA-Z0-9]/g, '_');
    const key = `uploads/${emailSlug}/${rawCategory}/${id}-${safeName}`;

    if (key.includes('..')) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2Upload(key, buffer, file.type);

    return NextResponse.json({
      id: key,
      fileName: safeName,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
