import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { getSupabase } from '@/lib/supabase';
import { r2Download } from '@/lib/r2-client';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const authResult = await requireAuth(req);
  if (!authResult.ok) return authResult.response;

  const body = await req.json().catch(() => null);
  const noticeId = body?.notice_id;
  if (!noticeId || typeof noticeId !== 'string') {
    return NextResponse.json({ error: 'notice_id requis' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: docs, error } = await supabase
    .from('dce_documents')
    .select('id, filename, r2_key, original_url, mime_type')
    .eq('notice_id', noticeId)
    .not('r2_key', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: 'Aucun document en cache' }, { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const doc of docs) {
    if (!doc.r2_key) continue;

    try {
      const r2File = await r2Download(doc.r2_key);
      if (!r2File) continue;

      // Read the stream into a buffer
      const reader = r2File.body.getReader();
      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) chunks.push(result.value);
      }

      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
      const buffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Avoid duplicate filenames
      let name = doc.filename;
      if (usedNames.has(name)) {
        const ext = name.lastIndexOf('.');
        const base = ext > 0 ? name.slice(0, ext) : name;
        const extension = ext > 0 ? name.slice(ext) : '';
        let i = 2;
        while (usedNames.has(`${base}_${i}${extension}`)) i++;
        name = `${base}_${i}${extension}`;
      }
      usedNames.add(name);

      zip.file(name, buffer);
    } catch {
      // Skip failed files
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

  return new NextResponse(Buffer.from(zipBuffer) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="DCE_${noticeId}.zip"`,
    },
  });
}
