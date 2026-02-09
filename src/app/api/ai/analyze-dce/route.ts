import { NextRequest, NextResponse } from 'next/server';
import { hasApiKey, hasAnthropicKey, getAnthropicClient, hasGeminiKey, getGeminiModel, hasNvidiaKey, nvidiaGenerate } from '@/lib/ai-client';

const DCE_PROMPT = `Tu es un expert en marches publics francais. Analyse ce DCE (Dossier de Consultation des Entreprises) et extrais les informations au format JSON strict.

Texte du DCE :
---
{TEXT}
---

Reponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de commentaires) suivant cette structure exacte :
{
  "aiSummary": "Resume du marche en 3-4 phrases",
  "executiveSummary": "Resume executif pour la direction en 2 phrases",
  "selectionCriteria": [{"name": "Nom du critere", "weight": 60}],
  "scoreCriteria": [{"label": "Eligibilite", "score": 15, "icon": "Shield", "description": "Explication"}],
  "vigilancePoints": [{"type": "risk|warning|opportunity", "title": "Titre", "description": "Detail"}],
  "technicalPlanSections": [{"id": "sec-1", "title": "Titre section", "buyerExpectation": "Attente acheteur", "aiDraft": "Brouillon IA", "wordCount": 80}],
  "requiredDocumentsDetailed": [{"name": "Nom", "hint": "Conseil", "isCritical": true, "category": "profile|ao-specific"}],
  "complianceChecklist": ["Element 1", "Element 2"],
  "recommendation": {"verdict": "go|maybe|pass", "headline": "Titre", "reasons": ["Raison 1"]},
  "buyerHistory": [],
  "competitors": []
}

Regles :
- Les scores vont de 0 a 20
- Les poids (weight) totalisent 100
- Genere 5 scoreCriteria : Eligibilite, Alignement, Rentabilite, Concurrence, Delais
- Genere 5-7 technicalPlanSections avec aiDraft personnalise au contexte du DCE
- Les icons possibles : Shield, Target, TrendingUp, Users, Clock
- Adapte le verdict selon la qualite de l'alignement profil/besoin`;

export async function POST(request: NextRequest) {
  try {
    if (!hasApiKey()) {
      return NextResponse.json(
        { success: false, error: 'Aucune cle API configuree (GEMINI_API_KEY ou ANTHROPIC_API_KEY)' },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers PDF sont acceptes' },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Le fichier ne doit pas depasser 20 Mo' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText: string;
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const parsed = await parser.getText();
      pdfText = parsed.text;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Impossible de lire le contenu du PDF' },
        { status: 422 },
      );
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le PDF ne contient pas de texte extractible (scan ?)' },
        { status: 422 },
      );
    }

    const truncatedText = pdfText.slice(0, 80000);
    const prompt = DCE_PROMPT.replace('{TEXT}', truncatedText);

    let rawText: string;

    if (hasAnthropicKey()) {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });
      const textBlock = message.content.find((b) => b.type === 'text');
      rawText = textBlock?.type === 'text' ? textBlock.text : '';
    } else if (hasGeminiKey()) {
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      rawText = result.response.text();
    } else if (hasNvidiaKey()) {
      rawText = await nvidiaGenerate(prompt);
    } else {
      rawText = '';
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

    const detail = {
      scoreCriteria: parsed.scoreCriteria ?? [],
      selectionCriteria: parsed.selectionCriteria ?? [],
      requiredDocuments: (parsed.requiredDocumentsDetailed ?? []).map((d: { name: string }) => d.name),
      aiSummary: parsed.aiSummary ?? '',
      technicalPlan: (parsed.technicalPlanSections ?? []).map((s: { id: string; title: string }) => `${s.id.replace('sec-', '')}. ${s.title}`),
      executiveSummary: parsed.executiveSummary ?? '',
      complianceChecklist: parsed.complianceChecklist ?? [],
      buyerHistory: parsed.buyerHistory ?? [],
      competitors: parsed.competitors ?? [],
      recommendation: parsed.recommendation ?? { verdict: 'maybe', headline: 'A etudier', reasons: [] },
      vigilancePoints: parsed.vigilancePoints ?? [],
      technicalPlanSections: parsed.technicalPlanSections ?? [],
      requiredDocumentsDetailed: parsed.requiredDocumentsDetailed ?? [],
    };

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
