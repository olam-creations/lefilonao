import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';
import { extractHighFidelityText } from '@/lib/pdf-engine';
import { executeMultiAgent } from '@/lib/agents/multi-agent-orchestrator';
import type { MultiAgentInput, MultiAgentContext, CompanyProfileInput } from '@/lib/agents/types';

// Vercel Pro: allow up to 60s for multi-agent analysis pipeline
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AI_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(request);
  if (!auth.ok) return new Response(JSON.stringify({ error: 'Non authentifie' }), { status: 401 });

  const gated = await requireFeature(auth.auth.email, 'dce-analysis');
  if (gated) return gated;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const profileRaw = formData.get('profile') as string | null;
    const optionsRaw = formData.get('options') as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'Aucun fichier fourni' }), { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return new Response(JSON.stringify({ error: 'Seuls les fichiers PDF sont acceptes' }), { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Le fichier ne doit pas depasser 20 Mo' }), { status: 400 });
    }
    if (!profileRaw) {
      return new Response(JSON.stringify({ error: 'Profil entreprise requis' }), { status: 400 });
    }

    let profile: CompanyProfileInput;
    try {
      profile = JSON.parse(profileRaw);
    } catch {
      return new Response(JSON.stringify({ error: 'Profil JSON invalide' }), { status: 400 });
    }

    const options = optionsRaw ? JSON.parse(optionsRaw) : undefined;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await extractHighFidelityText(buffer);

    const input: MultiAgentInput = {
      pdfBuffer: buffer,
      pdfText: parsed.text,
      profile,
      options,
    };

    const ctx: MultiAgentContext = {
      userEmail: auth.auth.email,
      plan: 'pro',
      signal: request.signal,
    };

    const encoder = new TextEncoder();
    const sseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    const readable = new ReadableStream({
      async start(controller) {
        try {
          await executeMultiAgent(input, ctx, (event) => {
            if (request.signal.aborted) return;
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Pipeline error';
          if (msg !== 'Aborted' && !request.signal.aborted) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'pipeline_error', error: msg, timestamp: Date.now() })}\n\n`),
            );
          }
        } finally {
          if (!request.signal.aborted) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
          controller.close();
        }
      },
    });

    return new Response(readable, { headers: sseHeaders });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
