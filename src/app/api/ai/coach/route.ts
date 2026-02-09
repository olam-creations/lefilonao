import { NextRequest, NextResponse } from 'next/server';
import { hasApiKey, hasGeminiKey, getGeminiModel, getAnthropicClient } from '@/lib/ai-client';

interface CoachBody {
  sections: { id: string; title: string; aiDraft: string; buyerExpectation: string }[];
  profile: {
    companyName: string;
    sectors: string[];
    references: { client: string; title: string; amount: string; period: string }[];
    team: { name: string; role: string; certifications: string[]; experience: number }[];
    caN1: string;
    caN2: string;
    caN3: string;
  };
  dceContext: string;
  selectionCriteria: { name: string; weight: number }[];
}

export async function POST(request: NextRequest) {
  try {
    if (!hasApiKey()) {
      return NextResponse.json(
        { success: false, error: 'Aucune cle API configuree (GEMINI_API_KEY ou ANTHROPIC_API_KEY)' },
        { status: 503 },
      );
    }

    const body: CoachBody = await request.json();
    const { sections, profile, dceContext, selectionCriteria } = body;

    if (!sections || !profile) {
      return NextResponse.json(
        { success: false, error: 'Parametres manquants' },
        { status: 400 },
      );
    }

    const criteriaText = selectionCriteria
      .map((c) => `- ${c.name}: ${c.weight}%`)
      .join('\n');

    const sectionsText = sections
      .map((s) => `### ${s.title} (${s.id})\nAttente acheteur: ${s.buyerExpectation}\nContenu actuel:\n${s.aiDraft.slice(0, 500)}`)
      .join('\n\n');

    const referencesText = profile.references
      .map((r) => `- ${r.title} pour ${r.client} (${r.amount})`)
      .join('\n');

    const teamText = profile.team
      .map((t) => `- ${t.name}: ${t.role}, certifications: ${t.certifications.join(', ')}`)
      .join('\n');

    const prompt = `Tu es un coach expert en marches publics francais. Analyse ce memoire technique et donne des conseils d'amelioration.

**Contexte du marche (DCE):**
${dceContext}

**Criteres de selection:**
${criteriaText}

**Profil entreprise:**
- Nom: ${profile.companyName}
- Secteurs: ${profile.sectors.join(', ')}
- CA: ${profile.caN1} (N-1)
- References:
${referencesText}
- Equipe:
${teamText}

**Sections du memoire:**
${sectionsText}

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

    let rawText: string;

    if (hasGeminiKey()) {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      rawText = result.response.text();
    } else {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });
      const textBlock = message.content.find((b) => b.type === 'text');
      rawText = textBlock?.type === 'text' ? textBlock.text : '';
    }

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Reponse IA vide' },
        { status: 500 },
      );
    }

    let parsed;
    try {
      const jsonStr = rawText.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Reponse IA mal formatee' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        completenessScore: parsed.completenessScore ?? 50,
        suggestions: parsed.suggestions ?? [],
        overallAdvice: parsed.overallAdvice ?? '',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
