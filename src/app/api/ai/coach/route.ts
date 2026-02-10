import { NextRequest, NextResponse } from 'next/server';
import { hasApiKey, hasGeminiKey, getGeminiModel, hasAnthropicKey, getAnthropicClient, hasNvidiaKey, nvidiaGenerate } from '@/lib/ai-client';
import { resilientCascade } from '@/lib/ai-resilience';
import { measureAiCall } from '@/lib/ai-audit';
import { jsonToToon } from '@/lib/toon';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, AI_LIMIT } from '@/lib/rate-limit';

import { coachSchema, parseBody } from '@/lib/validators';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, AI_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const gated = await requireFeature(auth.auth.email, 'ai-coach');
  if (gated) return gated;

  try {
    if (!hasApiKey()) {
      return NextResponse.json(
        { success: false, error: 'Aucune cle API configuree (GEMINI_API_KEY ou ANTHROPIC_API_KEY)' },
        { status: 503 },
      );
    }

    const raw = await request.json();
    const parsed = parseBody(coachSchema, raw);
    if (!parsed.ok) return new Response(parsed.response.body, { status: 400, headers: { 'Content-Type': 'application/json' } });
    const { sections, profile, dceContext, selectionCriteria } = parsed.data;

    const safeDceContext = dceContext.slice(0, 15000);
    const safeCriteria = selectionCriteria;

    const criteriaToon = jsonToToon(safeCriteria.map((c) => ({ critere: c.name, poids: `${c.weight}%` })));

    const profileToon = jsonToToon({
      nom: profile.companyName,
      secteurs: profile.sectors.join(', '),
      ca: profile.caN1,
      references: (profile.references ?? []).map((r) => ({
        titre: r.title, client: r.client, montant: r.amount,
      })),
      equipe: (profile.team ?? []).map((t) => ({
        nom: t.name, role: t.role, certifications: (t.certifications ?? []).join(' / '),
      })),
    });

    const sectionsToon = jsonToToon(sections.slice(0, 15).map((s) => ({
      id: s.id,
      titre: s.title,
      attente: s.buyerExpectation,
      contenu: (s.aiDraft ?? '').slice(0, 1000),
    })));

    const prompt = `Tu es un coach expert en marches publics francais. Analyse ce memoire technique et donne des conseils d'amelioration.
Les donnees structurees sont en format TOON (tabulaire compact).

**Contexte du marche (DCE):**
${safeDceContext}

**Criteres de selection:**
${criteriaToon}

**Profil entreprise:**
${profileToon}

**Sections du memoire:**
${sectionsToon}

Reponds UNIQUEMENT avec un JSON valide (pas de markdown) suivant cette structure:
{
  "completenessScore": 72,
  "suggestions": [
    { "sectionId": "sec-1", "type": "tip", "message": "Conseil specifique..." },
    { "sectionId": "sec-3", "type": "warning", "message": "Attention..." },
    { "sectionId": null, "type": "missing", "message": "Element manquant..." }
  ],
  "overallAdvice": "Conseil global en 2-3 phrases..."
}

Regles:
- completenessScore entre 0 et 100
- types: "tip" (conseil positif), "warning" (attention), "missing" (element absent)
- sectionId: l'id de la section concernee ou null si conseil global
- 5-8 suggestions maximum
- Sois specifique: cite les certifications, references, chiffres du profil
- Adapte les conseils aux poids des criteres de selection`;

    const { signal } = request;
    const audit = measureAiCall('coach_review', 'cascade', 'mixed');

    let rawText: string;
    try {
      rawText = await resilientCascade<string>(
        [
          {
            name: 'gemini',
            available: hasGeminiKey,
            execute: async () => {
              const model = getGeminiModel();
              const result = await model.generateContent(prompt, { signal });
              return result.response.text();
            },
          },
          {
            name: 'anthropic',
            available: hasAnthropicKey,
            execute: async () => {
              const client = getAnthropicClient();
              const message = await client.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }],
              }, { signal });
              const textBlock = message.content.find((b) => b.type === 'text');
              return textBlock?.type === 'text' ? textBlock.text : '';
            },
          },
          {
            name: 'nvidia',
            available: hasNvidiaKey,
            execute: () => nvidiaGenerate(prompt, signal),
          },
        ],
        signal,
      );
      audit.finish({ success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tous les providers IA ont echoue';
      audit.finish({ success: false, error: msg });
      rawText = '';
    }

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Reponse IA vide' },
        { status: 500 },
      );
    }

    let aiResult;
    try {
      const jsonStr = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      aiResult = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Reponse IA mal formatee' },
        { status: 500 },
      );
    }

    const completenessScore = Math.max(0, Math.min(100, Number(aiResult.completenessScore) || 50));

    const validTypes = ['tip', 'warning', 'missing'] as const;
    const sectionIds = new Set(sections.map((s) => s.id));
    const suggestions = (aiResult.suggestions ?? [])
      .filter((s: { type?: string; message?: string; sectionId?: string | null }) =>
        typeof s.message === 'string' &&
        s.message.length > 0 &&
        validTypes.includes(s.type as typeof validTypes[number]),
      )
      .map((s: { type: string; message: string; sectionId?: string | null }) => ({
        type: s.type,
        message: s.message,
        sectionId: s.sectionId && sectionIds.has(s.sectionId) ? s.sectionId : null,
      }))
      .slice(0, 10);

    const overallAdvice = typeof aiResult.overallAdvice === 'string' ? aiResult.overallAdvice.slice(0, 500) : '';

    return NextResponse.json({
      success: true,
      data: {
        completenessScore,
        suggestions,
        overallAdvice,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 },
    );
  }
}
