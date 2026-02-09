// ─── Dev Mode ───
// Fake JWT + mock data for local development

export interface ScoreCriteria {
  label: string;
  score: number;
  icon: string;
  description: string;
}

export interface SelectionCriteria {
  name: string;
  weight: number;
}

export interface Recommendation {
  verdict: 'go' | 'maybe' | 'pass';
  headline: string;
  reasons: string[];
}

export interface VigilancePoint {
  type: 'risk' | 'warning' | 'opportunity';
  title: string;
  description: string;
}

export interface CoachSuggestion {
  sectionId: string | null;
  type: 'tip' | 'warning' | 'missing';
  message: string;
}

export interface CoachResponse {
  completenessScore: number;
  suggestions: CoachSuggestion[];
  overallAdvice: string;
}

export interface TechnicalPlanSection {
  id: string;
  title: string;
  aiDraft: string;
  buyerExpectation: string;
  wordCount: number;
}

export interface RequiredDocumentDetailed {
  name: string;
  hint: string;
  isCritical: boolean;
  category: 'profile' | 'ao-specific';
}

export interface ProfileDocument {
  name: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiresAt: string | null;
  fileId: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
}

export interface AoUploadedFile {
  id: string;
  documentName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface TeamMember {
  name: string;
  role: string;
  certifications: string[];
  experience: number;
  cvFileId: string | null;
  cvFileName: string | null;
  cvFileSize: number | null;
  cvMimeType: string | null;
  cvUploadedAt: string | null;
}

export interface ProjectReference {
  client: string;
  title: string;
  amount: string;
  period: string;
}

export interface CompanyProfile {
  companyName: string;
  siret: string;
  legalForm: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  naf: string;
  tvaIntra: string;
  capitalSocial: string;
  effectifTotal: string;
  caN1: string;
  caN2: string;
  caN3: string;
  documents: ProfileDocument[];
  team: TeamMember[];
  references: ProjectReference[];
  sectors: string[];
  regions: string[];
  cachetBase64?: string;
}

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'Olam Creations',
  siret: '123 456 789 00012',
  legalForm: 'SAS',
  address: '42 rue de l\'Innovation',
  city: 'Paris',
  postalCode: '75011',
  phone: '01 23 45 67 89',
  email: 'contact@olam-creations.fr',
  website: 'https://olam-creations.fr',
  naf: '6201Z',
  tvaIntra: 'FR 12 345678901',
  capitalSocial: '50 000',
  effectifTotal: '15',
  caN1: '1 200 000',
  caN2: '980 000',
  caN3: '750 000',
  documents: [
    { name: 'Extrait KBIS', status: 'valid', expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
    { name: 'Attestation URSSAF', status: 'valid', expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
    { name: 'Attestation fiscale', status: 'expiring', expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
    { name: 'Assurance RC Pro', status: 'valid', expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
    { name: 'Certification ISO 9001', status: 'expired', expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
    { name: 'DC1 - Lettre de candidature', status: 'valid', expiresAt: null, fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
    { name: 'DC2 - Déclaration du candidat', status: 'valid', expiresAt: null, fileId: null, fileName: null, fileSize: null, mimeType: null, uploadedAt: null },
  ],
  team: [
    { name: 'Marie Dupont', role: 'Directrice Technique', certifications: ['PMP', 'AWS Solutions Architect'], experience: 12, cvFileId: null, cvFileName: null, cvFileSize: null, cvMimeType: null, cvUploadedAt: null },
    { name: 'Thomas Martin', role: 'Lead Développeur', certifications: ['Java OCA', 'Spring Professional'], experience: 8, cvFileId: null, cvFileName: null, cvFileSize: null, cvMimeType: null, cvUploadedAt: null },
    { name: 'Sophie Bernard', role: 'Architecte Cloud', certifications: ['Kubernetes CKA', 'Azure Expert'], experience: 10, cvFileId: null, cvFileName: null, cvFileSize: null, cvMimeType: null, cvUploadedAt: null },
  ],
  references: [
    { client: 'Région Île-de-France', title: 'Refonte SI Gestion des Aides', amount: '380 000€', period: '2023-2024' },
    { client: 'Ville de Lyon', title: 'Portail Citoyen Numérique', amount: '220 000€', period: '2022-2023' },
    { client: 'CNAF', title: 'Modernisation Applicative', amount: '450 000€', period: '2023-2024' },
  ],
  sectors: ['Développement logiciel', 'Cloud & Infrastructure', 'Cybersécurité', 'Data & IA'],
  regions: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie'],
};

export interface AoDetail {
  scoreCriteria: ScoreCriteria[];
  selectionCriteria: SelectionCriteria[];
  requiredDocuments: string[];
  aiSummary: string;
  technicalPlan: string[];
  executiveSummary: string;
  complianceChecklist: string[];
  buyerHistory: { title: string; amount: string; date: string; winner: string }[];
  competitors: { name: string; wins: number; avgBudget: string }[];
  recommendation: Recommendation;
  vigilancePoints: VigilancePoint[];
  technicalPlanSections: TechnicalPlanSection[];
  requiredDocumentsDetailed: RequiredDocumentDetailed[];
}

export function isDevMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/** Creates a fake JWT token valid for 30 days */
export function createDevToken(): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    sub: 'dev-user-001',
    email: 'dev@lefilonao.com',
    name: 'Olam',
    company: 'Olam Creations',
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
  }));
  return `${header}.${payload}.dev-signature`;
}

export const MOCK_RFPS = [
  {
    id: 'mock-001',
    title: 'Maintenance et évolution du système d\'information - Direction Générale des Finances Publiques',
    issuer: 'DGFiP - Ministère des Finances',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    score: 92,
    scoreLabel: 'GO' as const,
    budget: '450 000€',
    region: 'Île-de-France',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-001',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-002',
    title: 'Développement d\'une application web portail citoyen - Métropole de Bordeaux',
    issuer: 'Métropole de Bordeaux',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    score: 85,
    scoreLabel: 'GO' as const,
    budget: '180 000€',
    region: 'Nouvelle-Aquitaine',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-002',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-003',
    title: 'Audit de cybersécurité et tests d\'intrusion - CHU de Toulouse',
    issuer: 'CHU de Toulouse',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    score: 78,
    scoreLabel: 'GO' as const,
    budget: '95 000€',
    region: 'Occitanie',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-003',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-004',
    title: 'Infogérance et support niveau 2-3 - Conseil Départemental du Rhône',
    issuer: 'CD du Rhône',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    score: 64,
    scoreLabel: 'MAYBE' as const,
    budget: '320 000€',
    region: 'Auvergne-Rhône-Alpes',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-004',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-005',
    title: 'Migration cloud et conteneurisation des applications métier - Région Bretagne',
    issuer: 'Région Bretagne',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    score: 71,
    scoreLabel: 'GO' as const,
    budget: '210 000€',
    region: 'Bretagne',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-005',
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-006',
    title: 'Conception et développement d\'un portail open data - Ville de Nantes',
    issuer: 'Ville de Nantes',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    score: 88,
    scoreLabel: 'GO' as const,
    budget: '140 000€',
    region: 'Pays de la Loire',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-006',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-007',
    title: 'Fourniture de licences et services de support Oracle - CNRS',
    issuer: 'CNRS',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    score: 42,
    scoreLabel: 'PASS' as const,
    budget: '800 000€',
    region: 'Île-de-France',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-007',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-008',
    title: 'Mise en place d\'un SIEM et SOC mutualisé - Intercommunalité Grand Paris Sud',
    issuer: 'Grand Paris Sud',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    score: 56,
    scoreLabel: 'MAYBE' as const,
    budget: '250 000€',
    region: 'Île-de-France',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-008',
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-009',
    title: 'Refonte du site internet et intranet - Université de Strasbourg',
    issuer: 'Université de Strasbourg',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    score: 74,
    scoreLabel: 'GO' as const,
    budget: '120 000€',
    region: 'Grand Est',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-009',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-010',
    title: 'Formation aux outils numériques pour agents territoriaux - Département de la Gironde',
    issuer: 'Département de la Gironde',
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    score: 35,
    scoreLabel: 'PASS' as const,
    budget: '45 000€',
    region: 'Nouvelle-Aquitaine',
    source: 'BOAMP',
    url: 'https://www.boamp.fr/avis/detail/mock-010',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_TECHNICAL_SECTIONS: TechnicalPlanSection[] = [
  {
    id: 'sec-1', title: 'Présentation de l\'entreprise et références',
    buyerExpectation: 'L\'acheteur veut évaluer votre solidité financière, vos compétences et vos références similaires.',
    aiDraft: 'Fondée en [année], [Entreprise] est spécialisée dans [domaine]. Notre équipe de [X] collaborateurs accompagne les organisations publiques et privées dans leurs projets de transformation numérique.\n\nNos références les plus pertinentes pour ce marché incluent :\n- [Projet 1] : [description courte, budget, résultat]\n- [Projet 2] : [description courte, budget, résultat]\n- [Projet 3] : [description courte, budget, résultat]\n\nNotre chiffre d\'affaires de [X]M€ et notre trésorerie saine garantissent notre capacité à mener ce projet à son terme.',
    wordCount: 85,
  },
  {
    id: 'sec-2', title: 'Compréhension du besoin et enjeux',
    buyerExpectation: 'Démontrez que vous avez lu et compris le CCTP. Reformulez le besoin avec vos mots et identifiez les enjeux clés.',
    aiDraft: 'Le présent marché vise à [reformulation du besoin principal]. Les enjeux identifiés sont :\n\n1. **Enjeu opérationnel** : assurer la continuité de service tout au long de la transition\n2. **Enjeu technique** : moderniser l\'architecture tout en préservant l\'existant\n3. **Enjeu humain** : accompagner les équipes internes dans la montée en compétences\n\nNotre analyse du CCTP met en lumière [point d\'attention spécifique] qui nécessitera une attention particulière dans notre approche.',
    wordCount: 92,
  },
  {
    id: 'sec-3', title: 'Méthodologie et organisation proposée',
    buyerExpectation: 'Détaillez votre approche projet : méthodologie (agile/V/hybride), gouvernance, outils, communication.',
    aiDraft: 'Nous proposons une méthodologie agile adaptée au contexte de la commande publique, structurée en sprints de 3 semaines avec des comités de pilotage mensuels.\n\n**Gouvernance proposée :**\n- Comité de pilotage mensuel (décisions stratégiques)\n- Comité opérationnel hebdomadaire (suivi d\'avancement)\n- Points quotidiens (équipe projet)\n\n**Outils :** Jira pour le suivi, Confluence pour la documentation, GitLab pour le code, Teams/Slack pour la communication.\n\nCette organisation garantit transparence et réactivité tout au long du marché.',
    wordCount: 98,
  },
  {
    id: 'sec-4', title: 'Équipe projet et qualifications',
    buyerExpectation: 'Présentez les profils clés avec CV, certifications et expériences pertinentes.',
    aiDraft: '**Chef de projet** : [Nom], [X] ans d\'expérience, certifié PMP/PRINCE2. A piloté [X] projets similaires pour [clients publics].\n\n**Architecte technique** : [Nom], expert [technologies demandées], [X] ans d\'expérience. Certifié [certifications pertinentes].\n\n**Développeurs seniors** (x[N]) : profils expérimentés en [stack technique], moyenne de [X] ans d\'expérience.\n\n**Responsable qualité** : [Nom], garant du respect des engagements de service (SLA) et de la démarche qualité ISO 9001.',
    wordCount: 88,
  },
  {
    id: 'sec-5', title: 'Planning prévisionnel',
    buyerExpectation: 'Proposez un macro-planning réaliste avec les jalons clés, phases et livrables associés.',
    aiDraft: '**Phase 1 — Initialisation** (S1-S4) : cadrage, reprise de l\'existant, mise en place des environnements\n**Phase 2 — Réalisation** (S5-S20) : développement itératif en sprints de 3 semaines\n**Phase 3 — Recette** (S21-S24) : tests d\'intégration, recette utilisateur, corrections\n**Phase 4 — Mise en production** (S25-S26) : déploiement, bascule, hypercare\n**Phase 5 — Garantie** (S27-S38) : support post-déploiement, transfert de compétences\n\nChaque phase est ponctuée de livrables formels et de points de validation avec l\'acheteur.',
    wordCount: 95,
  },
  {
    id: 'sec-6', title: 'Démarche qualité et gestion des risques',
    buyerExpectation: 'Expliquez vos processus qualité, votre gestion des risques et vos engagements de service.',
    aiDraft: 'Notre démarche qualité s\'appuie sur notre certification ISO 9001 et comprend :\n\n**Qualité logicielle :** revues de code systématiques, couverture de tests > 80%, intégration continue (CI/CD), analyse statique (SonarQube).\n\n**Gestion des risques :** registre des risques maintenu et revu en comité de pilotage, avec plan de mitigation pour chaque risque identifié.\n\n**Engagements de service :**\n- Disponibilité : 99,5%\n- Temps de réponse incidents critiques : < 2h\n- Temps de résolution incidents critiques : < 8h',
    wordCount: 91,
  },
  {
    id: 'sec-7', title: 'Livrables et critères de réception',
    buyerExpectation: 'Listez tous les livrables avec leur format, fréquence et critères d\'acceptation.',
    aiDraft: '**Livrables documentaires :**\n- Plan de management de projet (PMP)\n- Dossier d\'architecture technique (DAT)\n- Cahier de recette\n- Documentation utilisateur et d\'exploitation\n- Rapports d\'activité mensuels\n\n**Livrables techniques :**\n- Code source versionné (GitLab)\n- Environnements de développement, recette et production\n- Scripts de déploiement automatisés\n\n**Critères de réception :** chaque livrable est soumis à un cycle de validation de 10 jours ouvrés. L\'absence de remarque vaut acceptation tacite.',
    wordCount: 87,
  },
];

const DEFAULT_DOCUMENTS_DETAILED: RequiredDocumentDetailed[] = [
  { name: 'DC1 - Lettre de candidature', hint: 'Formulaire CERFA téléchargeable sur economie.gouv.fr', isCritical: true, category: 'profile' },
  { name: 'DC2 - Déclaration du candidat', hint: 'Formulaire CERFA, renseigner CA des 3 dernières années', isCritical: true, category: 'profile' },
  { name: 'Extrait KBIS < 3 mois', hint: 'Téléchargeable gratuitement sur monidenum.fr (dirigeant)', isCritical: true, category: 'profile' },
  { name: 'Attestations fiscales et sociales', hint: 'URSSAF + impôts, demandables en ligne sur net-entreprises.fr', isCritical: true, category: 'profile' },
  { name: 'Mémoire technique', hint: 'Document principal — utilisez le builder ci-dessus', isCritical: true, category: 'ao-specific' },
  { name: 'Bordereau des prix unitaires (BPU)', hint: 'Remplir le document fourni par l\'acheteur dans le DCE', isCritical: false, category: 'ao-specific' },
  { name: 'Acte d\'engagement (AE)', hint: 'Document fourni dans le DCE, à signer par le représentant légal', isCritical: true, category: 'ao-specific' },
  { name: 'Références clients (3 dernières années)', hint: 'Tableau avec client, objet, montant, période, contact', isCritical: false, category: 'profile' },
];

function buildDetail(overrides: Partial<AoDetail> & Pick<AoDetail, 'scoreCriteria' | 'aiSummary'>): AoDetail {
  const avgScore = overrides.scoreCriteria
    ? Math.round(overrides.scoreCriteria.reduce((a, c) => a + c.score, 0) / overrides.scoreCriteria.length)
    : 10;
  const verdict: Recommendation['verdict'] = avgScore >= 14 ? 'go' : avgScore >= 10 ? 'maybe' : 'pass';
  const headlines: Record<Recommendation['verdict'], string> = {
    go: 'Nous recommandons de candidater',
    maybe: 'À étudier attentivement',
    pass: 'Ce marché ne correspond pas à votre profil',
  };

  return {
    selectionCriteria: [
      { name: 'Valeur technique', weight: 50 },
      { name: 'Prix', weight: 40 },
      { name: 'Délais', weight: 10 },
    ],
    requiredDocuments: DEFAULT_DOCUMENTS_DETAILED.map((d) => d.name),
    technicalPlan: DEFAULT_TECHNICAL_SECTIONS.map((s) => `${s.id.replace('sec-', '')}. ${s.title}`),
    executiveSummary: '',
    complianceChecklist: [
      'DC1 signé par le représentant légal',
      'DC2 complété avec chiffre d\'affaires',
      'KBIS de moins de 3 mois',
      'Attestations URSSAF et fiscales à jour',
      'Mémoire technique conforme au CCTP',
      'BPU complété sans rature',
      'Acte d\'engagement signé et daté',
      'Clé USB + exemplaire papier',
    ],
    buyerHistory: [],
    competitors: [],
    recommendation: {
      verdict,
      headline: headlines[verdict],
      reasons: overrides.scoreCriteria
        ? overrides.scoreCriteria
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((c) => `${c.label} : ${c.description} (${c.score}/20)`)
        : [],
    },
    vigilancePoints: [],
    technicalPlanSections: DEFAULT_TECHNICAL_SECTIONS,
    requiredDocumentsDetailed: DEFAULT_DOCUMENTS_DETAILED,
    ...overrides,
  };
}

export const MOCK_AO_DETAILS: Record<string, AoDetail> = {
  'mock-001': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 19, icon: 'Shield', description: 'Profil conforme aux exigences de la DGFiP' },
      { label: 'Alignement', score: 18, icon: 'Target', description: 'Maintenance SI et évolution — coeur de métier' },
      { label: 'Rentabilité', score: 19, icon: 'TrendingUp', description: 'Budget 450k€ avec marge confortable' },
      { label: 'Concurrence', score: 17, icon: 'Users', description: 'Estimé 4-6 candidats, profil différenciant' },
      { label: 'Délais', score: 19, icon: 'Clock', description: '12 jours restants, délai suffisant' },
    ],
    selectionCriteria: [
      { name: 'Valeur technique', weight: 60 },
      { name: 'Prix', weight: 30 },
      { name: 'Méthodologie projet', weight: 10 },
    ],
    aiSummary: 'Marché de maintenance corrective et évolutive du SI de la DGFiP. Le périmètre couvre 12 applications métier en Java/Spring et Angular. L\'acheteur valorise fortement l\'expertise technique et la réactivité. Le titulaire actuel (Sopra Steria) arrive en fin de marché, ce qui ouvre une fenêtre d\'opportunité.',
    executiveSummary: 'Fort de 8 années d\'expertise en maintenance de systèmes d\'information critiques pour le secteur public, [Entreprise] propose une approche alliant réactivité opérationnelle et innovation maîtrisée pour accompagner la DGFiP dans l\'évolution de son patrimoine applicatif.',
    buyerHistory: [
      { title: 'TMA applications fiscales - Lot 2', amount: '380 000€', date: '2024-03-15', winner: 'Sopra Steria' },
      { title: 'Développement portail agents', amount: '290 000€', date: '2023-11-20', winner: 'Capgemini' },
      { title: 'Migration infrastructure cloud', amount: '520 000€', date: '2023-06-10', winner: 'Atos' },
    ],
    competitors: [
      { name: 'Sopra Steria', wins: 12, avgBudget: '410 000€' },
      { name: 'Capgemini', wins: 8, avgBudget: '350 000€' },
      { name: 'Atos', wins: 6, avgBudget: '480 000€' },
      { name: 'CGI', wins: 4, avgBudget: '320 000€' },
    ],
    recommendation: {
      verdict: 'go',
      headline: 'Nous recommandons de candidater',
      reasons: [
        'Alignement fort avec votre expertise en maintenance SI (18/20)',
        'Budget confortable de 450k€ avec marge estimée à 25%',
        'Fenêtre d\'opportunité : Sopra Steria (titulaire actuel) en fin de marché',
      ],
    },
    vigilancePoints: [
      { type: 'opportunity', title: 'Titulaire sortant', description: 'Sopra Steria arrive en fin de marché. L\'acheteur cherche probablement à renouveler son prestataire — c\'est le moment idéal pour se positionner.' },
      { type: 'warning', title: 'Valeur technique pondérée à 60%', description: 'Le prix ne représente que 30% de la note. Investissez massivement dans la qualité du mémoire technique.' },
      { type: 'opportunity', title: 'Stack Java/Spring + Angular', description: 'Les technologies demandées correspondent exactement à votre stack. Mettez en avant vos certifications et projets similaires.' },
    ],
  }),
  'mock-002': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 17, icon: 'Shield', description: 'Références web collectivités requises' },
      { label: 'Alignement', score: 18, icon: 'Target', description: 'Application web portail citoyen — expertise forte' },
      { label: 'Rentabilité', score: 16, icon: 'TrendingUp', description: 'Budget 180k€, rentable avec équipe réduite' },
      { label: 'Concurrence', score: 17, icon: 'Users', description: 'Marché attractif, 5-8 candidats estimés' },
      { label: 'Délais', score: 17, icon: 'Clock', description: '18 jours restants, confortable' },
    ],
    aiSummary: 'Développement d\'un portail citoyen responsive pour la Métropole de Bordeaux. Fonctionnalités attendues : démarches en ligne, suivi de dossiers, paiement sécurisé, accessibilité RGAA. Stack technique libre mais compatibilité FranceConnect exigée.',
    executiveSummary: 'Spécialiste des portails citoyens avec 5 déploiements réussis pour des collectivités, [Entreprise] conçoit une plateforme centrée utilisateur, accessible RGAA AA, et intégrée nativement à FranceConnect.',
    buyerHistory: [
      { title: 'Refonte site métropolitain', amount: '220 000€', date: '2024-01-20', winner: 'Smile' },
      { title: 'Application mobile transports', amount: '150 000€', date: '2023-09-05', winner: 'Makina Corpus' },
    ],
    competitors: [
      { name: 'Smile', wins: 9, avgBudget: '200 000€' },
      { name: 'Makina Corpus', wins: 6, avgBudget: '160 000€' },
      { name: 'Blueway', wins: 4, avgBudget: '180 000€' },
    ],
  }),
  'mock-003': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 16, icon: 'Shield', description: 'Certification PASSI requise — vérifier éligibilité' },
      { label: 'Alignement', score: 17, icon: 'Target', description: 'Audit cybersécurité — domaine d\'expertise' },
      { label: 'Rentabilité', score: 15, icon: 'TrendingUp', description: 'Budget 95k€, marge modérée' },
      { label: 'Concurrence', score: 14, icon: 'Users', description: 'Peu de prestataires PASSI, avantage' },
      { label: 'Délais', score: 16, icon: 'Clock', description: '5 jours restants — urgent' },
    ],
    selectionCriteria: [
      { name: 'Qualifications et certifications', weight: 40 },
      { name: 'Méthodologie d\'audit', weight: 35 },
      { name: 'Prix', weight: 25 },
    ],
    aiSummary: 'Audit de sécurité complet du SI hospitalier du CHU de Toulouse : tests d\'intrusion internes/externes, audit de configuration, revue de code des applications critiques (DPI, GAM). Certification PASSI fortement valorisée. Contexte HDS (Hébergement Données de Santé).',
    executiveSummary: 'Prestataire certifié PASSI avec une expertise reconnue dans l\'audit de SI hospitaliers, [Entreprise] propose une méthodologie éprouvée couvrant l\'ensemble du périmètre technique et organisationnel du CHU.',
    buyerHistory: [
      { title: 'Audit sécurité SI hospitalier 2023', amount: '85 000€', date: '2023-12-01', winner: 'Wavestone' },
      { title: 'Mise en conformité HDS', amount: '120 000€', date: '2023-05-15', winner: 'Orange Cyberdefense' },
    ],
    competitors: [
      { name: 'Wavestone', wins: 7, avgBudget: '110 000€' },
      { name: 'Orange Cyberdefense', wins: 5, avgBudget: '130 000€' },
      { name: 'Intrinsec', wins: 3, avgBudget: '90 000€' },
    ],
  }),
  'mock-004': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 14, icon: 'Shield', description: 'Références infogérance collectivités nécessaires' },
      { label: 'Alignement', score: 12, icon: 'Target', description: 'Infogérance N2-N3, partiellement aligné' },
      { label: 'Rentabilité', score: 13, icon: 'TrendingUp', description: 'Budget 320k€ mais effort RH important' },
      { label: 'Concurrence', score: 12, icon: 'Users', description: '8-12 candidats estimés, très concurrentiel' },
      { label: 'Délais', score: 13, icon: 'Clock', description: '25 jours restants' },
    ],
    aiSummary: 'Marché d\'infogérance et support N2-N3 pour le parc informatique du Conseil Départemental du Rhône. 2000 postes de travail, 80 serveurs, réseau multi-sites. Astreintes 24/7 exigées. Reprise du personnel en place (clause Barnier).',
    executiveSummary: '[Entreprise] s\'appuie sur son centre de services certifié ISO 20000 et son expertise des environnements collectivités pour garantir un service de proximité et une continuité opérationnelle optimale.',
    buyerHistory: [
      { title: 'Infogérance poste de travail', amount: '280 000€', date: '2024-02-10', winner: 'SCC' },
      { title: 'Maintenance réseau multi-sites', amount: '190 000€', date: '2023-07-20', winner: 'Axians' },
    ],
    competitors: [
      { name: 'SCC', wins: 10, avgBudget: '300 000€' },
      { name: 'Axians', wins: 7, avgBudget: '250 000€' },
      { name: 'Spie ICS', wins: 5, avgBudget: '280 000€' },
    ],
    recommendation: {
      verdict: 'maybe',
      headline: 'À étudier attentivement',
      reasons: [
        'Alignement partiel : infogérance N2-N3 n\'est pas votre coeur de métier',
        'Clause Barnier : reprise du personnel obligatoire, impact financier à évaluer',
        'Marché très concurrentiel avec 8-12 candidats estimés',
      ],
    },
    vigilancePoints: [
      { type: 'risk', title: 'Clause Barnier — Reprise du personnel', description: 'Le marché impose la reprise des 8 techniciens en place. Évaluez l\'impact salarial et les obligations conventionnelles avant de candidater.' },
      { type: 'risk', title: 'Astreintes 24/7 exigées', description: 'L\'acheteur exige une astreinte 24h/24, 7j/7. Vérifiez votre capacité à tenir cet engagement avec votre effectif actuel.' },
      { type: 'warning', title: 'Concurrence forte', description: 'SCC et Axians sont solidement implantés chez cet acheteur. Votre proposition devra se différencier clairement sur la proximité et la réactivité.' },
    ],
  }),
  'mock-005': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 15, icon: 'Shield', description: 'Expertise Kubernetes/Docker requise' },
      { label: 'Alignement', score: 16, icon: 'Target', description: 'Migration cloud et conteneurisation — coeur d\'activité' },
      { label: 'Rentabilité', score: 14, icon: 'TrendingUp', description: 'Budget 210k€ correct pour le périmètre' },
      { label: 'Concurrence', score: 13, icon: 'Users', description: '6-10 candidats, marché Cloud très disputé' },
      { label: 'Délais', score: 13, icon: 'Clock', description: '30 jours restants, confortable' },
    ],
    aiSummary: 'Migration vers le cloud (stratégie hybride) et conteneurisation des 15 applications métier de la Région Bretagne. Technologies cibles : Kubernetes, Docker, CI/CD GitLab. Accompagnement au changement et formation des équipes internes inclus.',
    executiveSummary: 'Expert de la transformation cloud avec plus de 20 migrations réussies, [Entreprise] propose une approche progressive et sécurisée, minimisant les risques tout en accélérant la modernisation du SI régional.',
    buyerHistory: [
      { title: 'Hébergement cloud souverain', amount: '180 000€', date: '2024-01-05', winner: 'OVHcloud' },
      { title: 'Modernisation applications legacy', amount: '250 000€', date: '2023-08-12', winner: 'Devoteam' },
    ],
    competitors: [
      { name: 'Devoteam', wins: 8, avgBudget: '230 000€' },
      { name: 'Accenture', wins: 6, avgBudget: '350 000€' },
      { name: 'Claranet', wins: 5, avgBudget: '200 000€' },
    ],
  }),
  'mock-006': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 18, icon: 'Shield', description: 'Profil parfaitement adapté au besoin' },
      { label: 'Alignement', score: 19, icon: 'Target', description: 'Portail open data — expertise directe' },
      { label: 'Rentabilité', score: 17, icon: 'TrendingUp', description: 'Budget 140k€ avec bonne marge' },
      { label: 'Concurrence', score: 16, icon: 'Users', description: 'Niche open data, peu de spécialistes' },
      { label: 'Délais', score: 18, icon: 'Clock', description: '3 jours restants — très urgent' },
    ],
    aiSummary: 'Conception et développement d\'un portail open data conforme au SCDL (Socle Commun des Données Locales). Publication automatisée des jeux de données, API REST, visualisations interactives. Conformité RGPD et accessibilité RGAA niveau AA exigées.',
    executiveSummary: 'Pionnier des solutions open data pour les collectivités avec 8 déploiements, [Entreprise] propose un portail clé en main conforme SCDL, intégrant API REST, visualisations interactives et publication automatisée.',
    buyerHistory: [
      { title: 'Portail données ouvertes v2', amount: '110 000€', date: '2023-10-15', winner: 'OpenDataSoft' },
      { title: 'Refonte site nantes.fr', amount: '200 000€', date: '2023-04-20', winner: 'Emakina' },
    ],
    competitors: [
      { name: 'OpenDataSoft', wins: 15, avgBudget: '130 000€' },
      { name: 'Atol CD', wins: 4, avgBudget: '100 000€' },
      { name: 'Emakina', wins: 3, avgBudget: '170 000€' },
    ],
  }),
  'mock-007': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 8, icon: 'Shield', description: 'Partenariat Oracle requis — non éligible' },
      { label: 'Alignement', score: 9, icon: 'Target', description: 'Fourniture licences, hors coeur de métier' },
      { label: 'Rentabilité', score: 10, icon: 'TrendingUp', description: 'Marges faibles sur revente licences' },
      { label: 'Concurrence', score: 7, icon: 'Users', description: 'Marché dominé par les intégrateurs Oracle' },
      { label: 'Délais', score: 8, icon: 'Clock', description: '45 jours, mais préparation lourde' },
    ],
    aiSummary: 'Fourniture et renouvellement des licences Oracle (Database, Middleware, Cloud) pour le CNRS. Inclut support éditeur niveau Premium. Budget important mais marges très faibles sur la revente. Réservé aux partenaires Oracle certifiés.',
    executiveSummary: 'Non recommandé : ce marché de fourniture de licences Oracle nécessite un partenariat éditeur de niveau Gold minimum et offre des marges très limitées.',
    buyerHistory: [
      { title: 'Renouvellement licences Oracle 2023', amount: '750 000€', date: '2023-12-20', winner: 'DXC Technology' },
      { title: 'Support Oracle Database', amount: '420 000€', date: '2023-03-10', winner: 'Infogene' },
    ],
    competitors: [
      { name: 'DXC Technology', wins: 8, avgBudget: '600 000€' },
      { name: 'Infogene', wins: 5, avgBudget: '400 000€' },
    ],
    recommendation: {
      verdict: 'pass',
      headline: 'Ce marché ne correspond pas à votre profil',
      reasons: [
        'Partenariat Oracle Gold requis — vous n\'êtes pas éligible',
        'Fourniture de licences : hors de votre coeur de métier',
        'Marges très faibles sur la revente de licences éditeur',
      ],
    },
    vigilancePoints: [
      { type: 'risk', title: 'Partenariat Oracle Gold obligatoire', description: 'Sans statut de partenaire Oracle niveau Gold minimum, votre candidature sera déclarée irrecevable. L\'obtention de ce statut prend 6-12 mois.' },
      { type: 'risk', title: 'Marges quasi-nulles', description: 'La revente de licences Oracle impose des prix catalogue fixes. La marge nette sur ce type de marché est généralement inférieure à 5%.' },
      { type: 'warning', title: 'Concurrents historiques', description: 'DXC Technology et Infogene ont des accords-cadres existants avec Oracle et dominent ce segment depuis plusieurs années.' },
    ],
  }),
  'mock-008': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 12, icon: 'Shield', description: 'Compétences SIEM requises, à renforcer' },
      { label: 'Alignement', score: 11, icon: 'Target', description: 'SIEM/SOC, domaine connexe mais pas principal' },
      { label: 'Rentabilité', score: 11, icon: 'TrendingUp', description: 'Budget 250k€ mais investissement formation' },
      { label: 'Concurrence', score: 12, icon: 'Users', description: '5-7 candidats, marché spécialisé' },
      { label: 'Délais', score: 10, icon: 'Clock', description: '20 jours restants' },
    ],
    aiSummary: 'Mise en place d\'un SIEM mutualisé (Splunk ou ELK) et d\'un SOC pour l\'intercommunalité Grand Paris Sud. Surveillance 24/7, corrélation d\'événements, gestion des incidents. Formation des équipes internes incluse. Certification ISO 27001 valorisée.',
    executiveSummary: 'Avec son SOC opérationnel et sa maîtrise des solutions SIEM leaders, [Entreprise] propose une architecture mutualisée optimisant les coûts tout en garantissant une surveillance continue.',
    buyerHistory: [
      { title: 'Audit sécurité réseau', amount: '80 000€', date: '2024-02-28', winner: 'I-Tracing' },
      { title: 'Fourniture pare-feux Fortinet', amount: '150 000€', date: '2023-06-30', winner: 'Nomios' },
    ],
    competitors: [
      { name: 'I-Tracing', wins: 6, avgBudget: '220 000€' },
      { name: 'Nomios', wins: 4, avgBudget: '180 000€' },
      { name: 'Advens', wins: 5, avgBudget: '200 000€' },
    ],
  }),
  'mock-009': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 16, icon: 'Shield', description: 'Expérience refonte web secteur éducation' },
      { label: 'Alignement', score: 15, icon: 'Target', description: 'Refonte site + intranet, bien aligné' },
      { label: 'Rentabilité', score: 14, icon: 'TrendingUp', description: 'Budget 120k€, rentable en mode agile' },
      { label: 'Concurrence', score: 14, icon: 'Users', description: '6-8 candidats estimés' },
      { label: 'Délais', score: 15, icon: 'Clock', description: '15 jours restants' },
    ],
    aiSummary: 'Refonte complète du site internet et de l\'intranet de l\'Université de Strasbourg. CMS WordPress ou headless CMS, design responsive, espace étudiant/personnel, intégration ENT. Accessibilité RGAA et multilinguisme (FR/DE/EN) exigés.',
    executiveSummary: '[Entreprise] propose une approche headless CMS moderne couplée à un design system multilingue, garantissant une expérience utilisateur optimale pour les 50 000 utilisateurs de l\'Université.',
    buyerHistory: [
      { title: 'Refonte ENT universitaire', amount: '180 000€', date: '2023-11-10', winner: 'Kosmos' },
      { title: 'Application mobile étudiante', amount: '90 000€', date: '2023-02-28', winner: 'Sqli' },
    ],
    competitors: [
      { name: 'Kosmos', wins: 7, avgBudget: '150 000€' },
      { name: 'Sqli', wins: 5, avgBudget: '130 000€' },
      { name: 'Clever Age', wins: 4, avgBudget: '140 000€' },
    ],
  }),
  'mock-010': buildDetail({
    scoreCriteria: [
      { label: 'Éligibilité', score: 7, icon: 'Shield', description: 'Agrément formation requis — non détenu' },
      { label: 'Alignement', score: 6, icon: 'Target', description: 'Formation, hors domaine d\'activité' },
      { label: 'Rentabilité', score: 8, icon: 'TrendingUp', description: 'Budget 45k€ faible pour mobilisation' },
      { label: 'Concurrence', score: 7, icon: 'Users', description: 'Organismes de formation spécialisés' },
      { label: 'Délais', score: 7, icon: 'Clock', description: '8 jours restants' },
    ],
    aiSummary: 'Formation aux outils numériques (Suite Microsoft 365, outils collaboratifs, cybersécurité de base) pour 500 agents du Département de la Gironde. 30 sessions sur 6 mois. Agrément organisme de formation obligatoire (Qualiopi).',
    executiveSummary: 'Non recommandé : ce marché de formation nécessite la certification Qualiopi et une expertise pédagogique qui ne correspond pas au profil de [Entreprise].',
    buyerHistory: [
      { title: 'Formation bureautique agents', amount: '38 000€', date: '2023-09-15', winner: 'M2i Formation' },
      { title: 'Accompagnement transformation digitale', amount: '65 000€', date: '2023-04-10', winner: 'Cegos' },
    ],
    competitors: [
      { name: 'M2i Formation', wins: 12, avgBudget: '50 000€' },
      { name: 'Cegos', wins: 9, avgBudget: '60 000€' },
      { name: 'Orsys', wins: 7, avgBudget: '45 000€' },
    ],
  }),
};
