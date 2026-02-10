/**
 * NAF code → CPV sector mapping.
 * Maps French NAF (Nomenclature d'Activités Française) 2-char prefixes
 * to CPV (Common Procurement Vocabulary) 2-digit sector codes.
 *
 * Used to auto-detect user preferences from SIRET onboarding.
 */

// NAF prefix (2 chars) → CPV sector codes
const NAF_PREFIX_TO_CPV: Record<string, string[]> = {
  // ── Construction & BTP ──
  '41': ['45'],       // Construction de bâtiments
  '42': ['45'],       // Génie civil
  '43': ['45'],       // Travaux de construction spécialisés

  // ── Informatique ──
  '62': ['72', '48'], // Programmation, conseil informatique
  '63': ['72', '48'], // Services d'information

  // ── Architecture & Ingénierie ──
  '71': ['71'],       // Architecture, ingénierie, contrôle technique

  // ── Conseil & Services aux entreprises ──
  '70': ['79'],       // Conseil de gestion
  '73': ['79'],       // Publicité, études de marché
  '78': ['79'],       // Emploi, recrutement

  // ── Nettoyage & Services ──
  '81': ['90'],       // Services relatifs aux bâtiments, nettoyage

  // ── Sécurité ──
  '80': ['79'],       // Enquêtes et sécurité

  // ── Formation & Éducation ──
  '85': ['80'],       // Enseignement

  // ── Télécommunications ──
  '61': ['64'],       // Télécommunications

  // ── Édition & Logiciels ──
  '58': ['48'],       // Édition (dont logiciels)

  // ── Transport ──
  '49': ['60'],       // Transports terrestres
  '50': ['60'],       // Transports par eau
  '51': ['60'],       // Transports aériens
  '52': ['63'],       // Entreposage, services auxiliaires transport

  // ── Alimentation & Restauration ──
  '10': ['15'],       // Industries alimentaires
  '56': ['55'],       // Restauration

  // ── Santé ──
  '86': ['85'],       // Activités pour la santé humaine

  // ── Services sociaux ──
  '87': ['85'],       // Hébergement médico-social
  '88': ['85'],       // Action sociale sans hébergement

  // ── Énergie ──
  '35': ['09', '65'], // Production et distribution d'énergie

  // ── Eau & Environnement ──
  '36': ['65'],       // Captage, traitement, distribution d'eau
  '37': ['90'],       // Collecte et traitement des eaux usées
  '38': ['90'],       // Collecte, traitement, élimination déchets
  '39': ['90'],       // Dépollution

  // ── Industrie ──
  '25': ['44'],       // Fabrication produits métalliques
  '26': ['30'],       // Fabrication produits informatiques/électroniques
  '27': ['31'],       // Fabrication équipements électriques
  '28': ['42'],       // Fabrication machines et équipements

  // ── Textile & Habillement ──
  '13': ['19'],       // Fabrication de textiles
  '14': ['18'],       // Industrie de l'habillement

  // ── Imprimerie ──
  '18': ['22'],       // Imprimerie, reproduction

  // ── Juridique & Comptabilité ──
  '69': ['79'],       // Activités juridiques et comptables

  // ── Recherche ──
  '72': ['73'],       // Recherche-développement scientifique

  // ── Arts & Spectacles ──
  '90': ['92'],       // Activités créatives, artistiques
  '93': ['92'],       // Activités sportives, récréatives
};

// More specific NAF codes (4 chars) → CPV sectors (overrides prefix)
const NAF_SPECIFIC_TO_CPV: Record<string, string[]> = {
  '4321': ['45'],     // Installation électrique
  '4322': ['45'],     // Plomberie, chauffage, climatisation
  '4329': ['45'],     // Autres travaux d'installation
  '4331': ['45'],     // Travaux de plâtrerie
  '4332': ['45'],     // Travaux de menuiserie
  '4333': ['45'],     // Travaux de revêtement sols/murs
  '4334': ['45'],     // Peinture, vitrerie
  '4339': ['45'],     // Autres travaux de finition
  '4391': ['45'],     // Travaux de couverture
  '4399': ['45'],     // Autres travaux de construction spécialisés
  '7111': ['71'],     // Activités d'architecture
  '7112': ['71'],     // Activités d'ingénierie
  '6201': ['72'],     // Programmation informatique
  '6202': ['72'],     // Conseil en systèmes informatiques
  '6203': ['72'],     // Gestion d'installations informatiques
  '6311': ['72'],     // Traitement de données, hébergement
  '8110': ['90'],     // Activités combinées de soutien lié aux bâtiments
  '8121': ['90'],     // Nettoyage courant des bâtiments
  '8122': ['90'],     // Autres activités de nettoyage
  '8129': ['90'],     // Autres activités de nettoyage
};

// NAF → human-readable sector labels (for display in onboarding)
const NAF_TO_SECTOR_LABEL: Record<string, string> = {
  '41': 'BTP & Travaux Publics',
  '42': 'Génie Civil',
  '43': 'BTP & Travaux Publics',
  '62': 'Développement Web & Logiciel',
  '63': 'Conseil IT & Digital',
  '71': 'Architecture & Urbanisme',
  '70': 'Études & Conseil',
  '73': 'Communication & Marketing',
  '78': 'Études & Conseil',
  '81': 'Nettoyage & Propreté',
  '80': 'Sécurité & Gardiennage',
  '85': 'Formation & Éducation',
  '61': 'Cloud & Infrastructure',
  '58': 'Développement Web & Logiciel',
  '49': 'Transport & Mobilité',
  '52': 'Logistique & Supply Chain',
  '56': 'Restauration & Traiteur',
  '86': 'Santé & Médical',
  '87': 'Services Sociaux',
  '88': 'Services Sociaux',
  '69': 'Comptabilité & Finance',
  '72': 'Intelligence Artificielle & ML',
  '35': 'Rénovation Énergétique',
  '38': 'Environnement & Déchets',
  '25': 'Ingénierie Industrielle',
  '27': 'Électronique & Électricité',
  '28': 'Mécanique & Maintenance',
};

// Department code → region name
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
  '04': 'Provence-Alpes-Côte d\'Azur', '05': 'Provence-Alpes-Côte d\'Azur',
  '06': 'Provence-Alpes-Côte d\'Azur', '13': 'Provence-Alpes-Côte d\'Azur',
  '83': 'Provence-Alpes-Côte d\'Azur', '84': 'Provence-Alpes-Côte d\'Azur',
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
  '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est', '68': 'Grand Est', '88': 'Grand Est',
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
  '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
  '72': 'Pays de la Loire', '85': 'Pays de la Loire',
  '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
  '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté',
  '39': 'Bourgogne-Franche-Comté', '58': 'Bourgogne-Franche-Comté',
  '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté',
  '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
  '20': 'Corse', '2A': 'Corse', '2B': 'Corse',
};

export interface NafMapping {
  cpvSectors: string[];
  sectorLabel: string;
  region: string | null;
}

/**
 * Map a NAF code + department to CPV sectors and region.
 * Tries specific 4-char match first, then 2-char prefix.
 */
export function mapNafToCpv(nafCode: string, department?: string): NafMapping {
  const naf4 = nafCode.replace(/[^0-9A-Za-z]/g, '').substring(0, 4);
  const naf2 = naf4.substring(0, 2);

  const cpvSectors = NAF_SPECIFIC_TO_CPV[naf4]
    ?? NAF_PREFIX_TO_CPV[naf2]
    ?? [];

  const sectorLabel = NAF_TO_SECTOR_LABEL[naf2] ?? '';

  const dept = department?.substring(0, 2) ?? '';
  const region = DEPT_TO_REGION[dept] ?? null;

  return { cpvSectors, sectorLabel, region };
}

/**
 * Get the region name from a department code.
 */
export function departmentToRegion(department: string): string | null {
  const dept = department.substring(0, 2);
  return DEPT_TO_REGION[dept] ?? null;
}
