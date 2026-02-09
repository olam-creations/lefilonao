import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const DECP_API = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records';

const DEPT_TO_REGION: Record<string, string> = {
  '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
  '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
  '94': 'Île-de-France', '95': 'Île-de-France',
  '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
  '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
  '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
  '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
  '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
  '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
  '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
  '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
  '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
  '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
  '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
  '62': 'Hauts-de-France', '80': 'Hauts-de-France',
  '04': "Provence-Alpes-Côte d'Azur", '05': "Provence-Alpes-Côte d'Azur",
  '06': "Provence-Alpes-Côte d'Azur", '13': "Provence-Alpes-Côte d'Azur",
  '83': "Provence-Alpes-Côte d'Azur", '84': "Provence-Alpes-Côte d'Azur",
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
  '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est', '68': 'Grand Est', '88': 'Grand Est',
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
  '72': 'Pays de la Loire', '85': 'Pays de la Loire',
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
  '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
  '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté',
  '58': 'Bourgogne-Franche-Comté', '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
  '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
  '2A': 'Corse', '2B': 'Corse', '20': 'Corse',
};

function resolveRegion(postalCode?: string | null): string {
  if (!postalCode) return '';
  const dept = String(postalCode).substring(0, 2);
  return DEPT_TO_REGION[dept] ?? '';
}

interface DecpRecord {
  id?: string;
  objet?: string;
  acheteur_nom?: string | null;
  acheteur_id?: string | null;
  titulaire_id_1?: number | string | null;
  montant?: number | null;
  codecpv?: string | null;
  datenotification?: string | null;
  lieuexecution_code?: string | null;
  lieuexecution_nom?: string | null;
  nature?: string | null;
  procedure?: string | null;
}

function mapRecord(r: DecpRecord) {
  const cpvRaw = r.codecpv ?? '';
  const cpvCode = cpvRaw.split('-')[0];
  const winnerSiret = r.titulaire_id_1 != null ? String(r.titulaire_id_1) : '';
  const buyerSiret = r.acheteur_id ?? '';

  return {
    id: r.id ?? '',
    title: r.objet ?? '',
    buyer_name: r.acheteur_nom || buyerSiret,
    buyer_siret: buyerSiret,
    winner_name: winnerSiret,
    winner_siret: winnerSiret,
    amount: r.montant ?? 0,
    cpv_code: cpvCode,
    cpv_sector: cpvCode.substring(0, 2),
    notification_date: r.datenotification ?? null,
    region: resolveRegion(r.lieuexecution_code),
    lieu_execution: r.lieuexecution_nom ?? '',
    nature: r.nature ?? '',
    procedure_type: r.procedure ?? '',
    synced_at: new Date().toISOString(),
  };
}

async function fetchPage(offset: number, limit: number, sinceStr: string) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    order_by: 'datenotification desc',
    where: `datenotification >= '${sinceStr}'`,
  });

  const res = await fetch(`${DECP_API}?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`DECP API returned ${res.status}`);
  }

  const json = await res.json();
  return {
    records: (json.results ?? []) as DecpRecord[],
    totalCount: json.total_count ?? 0,
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 3);
    const sinceStr = since.toISOString().split('T')[0];

    const PAGE_SIZE = 100;
    const MAX_PAGES = 20;
    let totalSynced = 0;
    let totalRecords = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      const { records, totalCount } = await fetchPage(page * PAGE_SIZE, PAGE_SIZE, sinceStr);
      totalRecords = totalCount;

      const mapped = records.filter((r) => r.id).map(mapRecord);
      const seen = new Set<string>();
      const rows = mapped.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      if (rows.length === 0) break;

      const supabase = getSupabase();
      const { error } = await supabase
        .from('decp_attributions')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        return NextResponse.json(
          { error: error.message, synced: totalSynced },
          { status: 500 },
        );
      }

      totalSynced += rows.length;
      if (records.length < PAGE_SIZE) break;
    }

    return NextResponse.json({ synced: totalSynced, available: totalRecords });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
