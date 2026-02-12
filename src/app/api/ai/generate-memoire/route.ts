import { NextRequest } from 'next/server';
import { hasApiKey } from '@/lib/ai-client';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';
import { generateMemoireSchema, parseBody } from '@/lib/validators';
import { generateFullMemoire, type MemoireEvent } from '@/lib/memoire-orchestrator';

// Vercel Pro: allow up to 60s for batch memoire generation
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AI_LIMIT);
  if (limited) return new Response(JSON.stringify({ error: 'Trop de requêtes' }), { status: 429 });

  const auth = await requireAuth(request);
  if (!auth.ok) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });

  const gated = await requireFeature(auth.auth.email, 'generate-section');
  if (gated) return gated;

  try {
    if (!hasApiKey()) {
      return new Response(
        JSON.stringify({ error: 'Aucune cle API configuree (GEMINI_API_KEY ou ANTHROPIC_API_KEY)' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const raw = await request.json();
    const parsed = parseBody(generateMemoireSchema, raw);
    if (!parsed.ok) return parsed.response;

    const { sections, companyProfile, dceContext, options, noticeId } = parsed.data;
    const { signal } = request;

    const encoder = new TextEncoder();
    const sseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const events = generateFullMemoire(
            {
              noticeId,
              userEmail: auth.auth.email,
              sections,
              companyProfile,
              dceContext,
              options: {
                tone: options.tone ?? 'standard',
                length: options.length ?? 'medium',
              },
            },
            signal,
          );

          for await (const event of events) {
            if (signal.aborted) break;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          }
        } catch (err) {
          if (!signal.aborted) {
            const msg = err instanceof Error ? err.message : 'Erreur serveur';
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, { headers: sseHeaders });
  } catch {
    return new Response(JSON.stringify({ error: 'Une erreur est survenue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
