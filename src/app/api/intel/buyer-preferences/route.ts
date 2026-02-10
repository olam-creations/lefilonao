import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/require-auth';
import { requireFeature } from '@/lib/require-plan';
import { rateLimit, STANDARD_LIMIT } from '@/lib/rate-limit';

const SIRET_RE = /^\d{9,14}$/;

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, STANDARD_LIMIT);
  if (limited) return limited;

  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const gated = await requireFeature(auth.auth.email, 'buyer-intelligence');
  if (gated) return gated;

  const params = req.nextUrl.searchParams;
  const buyerName = params.get('buyer_name') ?? '';

  if (!buyerName) {
    return NextResponse.json({ error: 'Parametre buyer_name requis' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Fetch buyer's awards with winner details
    const { data: awards, error } = await supabase
      .from('decp_attributions')
      .select('winner_name, winner_siret, amount, region, cpv_sector, notification_date')
      .eq('buyer_name', buyerName)
      .gte('notification_date', new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .limit(5000);

    if (error) throw error;
    if (!awards || awards.length === 0) {
      return NextResponse.json({ preferences: null });
    }

    // Try to enrich winner data from companies table
    const winnerSirets = [...new Set((awards ?? []).map((a) => a.winner_siret).filter(Boolean))];
    let companiesMap = new Map<string, { est_rge: boolean; effectif_tranche: string; region: string; date_creation: string }>();

    if (winnerSirets.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('siret, est_rge, effectif_tranche, region, date_creation')
        .in('siret', winnerSirets.slice(0, 100));

      for (const c of companies ?? []) {
        companiesMap.set(c.siret, {
          est_rge: c.est_rge ?? false,
          effectif_tranche: c.effectif_tranche ?? '',
          region: c.region ?? '',
          date_creation: c.date_creation ?? '',
        });
      }
    }

    // Compute preference signals
    let rgeCount = 0;
    let localCount = 0;
    let totalAmount = 0;
    const amounts: number[] = [];
    const teamSizes: string[] = [];
    const ages: number[] = [];
    const currentYear = new Date().getFullYear();

    for (const a of awards) {
      if (a.amount) {
        totalAmount += a.amount;
        amounts.push(a.amount);
      }

      const company = a.winner_siret ? companiesMap.get(a.winner_siret) : undefined;
      if (company) {
        if (company.est_rge) rgeCount++;
        if (company.region && a.region && company.region === a.region) localCount++;
        if (company.effectif_tranche) teamSizes.push(company.effectif_tranche);
        if (company.date_creation) {
          const year = parseInt(company.date_creation.substring(0, 4));
          if (year > 1900) ages.push(currentYear - year);
        }
      }
    }

    const total = awards.length;
    const avgAmount = total > 0 ? Math.round(totalAmount / total) : 0;

    // Price sensitivity: low std dev = price-driven
    const mean = avgAmount;
    const variance = amounts.length > 1
      ? amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / amounts.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const priceCoeff = mean > 0 ? stdDev / mean : 0; // coefficient of variation

    const preferences = {
      buyerName,
      totalContracts: total,
      signals: {
        certification: { label: 'Certifications (RGE/ISO)', score: total > 0 ? Math.round((rgeCount / total) * 100) : 0 },
        local: { label: 'Proximite geographique', score: total > 0 ? Math.round((localCount / total) * 100) : 0 },
        price: { label: 'Sensibilite prix', score: priceCoeff < 0.3 ? 80 : priceCoeff < 0.6 ? 50 : 20 },
        team: {
          label: 'Taille equipe',
          score: teamSizes.length > 0
            ? (teamSizes.filter((t) => parseInt(t) >= 10 || t.includes('10')).length / teamSizes.length) * 100
            : 0,
        },
        experience: {
          label: 'Experience (anciennete)',
          score: ages.length > 0
            ? Math.min(100, Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 5))
            : 0,
        },
      },
      avgAmount,
    };

    const res = NextResponse.json({ preferences });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res;
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 });
  }
}
