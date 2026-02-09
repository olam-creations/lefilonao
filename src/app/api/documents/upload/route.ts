import { NextRequest, NextResponse } from 'next/server';
import { r2Upload } from '@/lib/r2-client';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 });
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const key = `uploads/${category}/${id}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2Upload(key, buffer, file.type);

    return NextResponse.json({
      id: key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
