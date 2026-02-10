// ─── Multi-Agent Pipeline Types ───

export type AgentName = 'parser' | 'intelligence' | 'analyst' | 'writer' | 'reviewer';

export interface ParsedDce {
  lots: { number: string; title: string; estimatedAmount?: number }[];
  criteria: { name: string; weight: number }[];
  documents: { name: string; isCritical: boolean }[];
  deadlines: { type: string; date: string }[];
  buyerName: string;
  buyerSiret?: string;
  cpvCodes: string[];
  procedureType: string;
  estimatedBudget?: number;
  executionDuration?: string;
}

export interface MarketIntelligence {
  buyerHistory: {
    totalContracts: number;
    avgAmount: number;
    topWinners: { name: string; count: number }[];
    recentContracts: { title: string; winner: string; amount: number }[];
  };
  competitors: {
    name: string;
    wins: number;
    marketShare: number;
  }[];
  sectorStats: {
    avgOffers: number;
    avgAmount: number;
    totalContracts: number;
  };
  hhi: number; // Herfindahl-Hirschman Index (0-10000)
  webIntel?: {
    buyerSummary?: string;
    buyerContacts?: string[];
    serpNews: { title: string; url: string; snippet: string }[];
  };
}

export interface AnalysisResult {
  recommendation: {
    verdict: 'go' | 'maybe' | 'pass';
    headline: string;
    reasons: string[];
    confidenceScore: number;
  };
  scoreCriteria: {
    label: string;
    score: number;
    icon: string;
    description: string;
  }[];
  vigilancePoints: {
    type: 'risk' | 'warning' | 'opportunity';
    title: string;
    description: string;
  }[];
  strategicAdvice: string;
}

export interface WrittenSection {
  sectionId: string;
  title: string;
  content: string;
  wordCount: number;
}

export interface ReviewResult {
  completenessScore: number;
  suggestions: {
    sectionId: string | null;
    type: 'tip' | 'warning' | 'missing';
    message: string;
  }[];
  overallAdvice: string;
}

export interface CompanyProfileInput {
  companyName: string;
  siret?: string;
  sectors: string[];
  caN1?: string;
  caN2?: string;
  caN3?: string;
  references?: { client: string; title: string; amount: string; period: string }[];
  team?: { name: string; role: string; certifications: string[]; experience: number }[];
}

export interface MultiAgentInput {
  pdfBuffer: Buffer;
  pdfText: string;
  profile: CompanyProfileInput;
  options?: {
    sections?: string[];
    tone?: 'formal' | 'standard';
    length?: 'short' | 'medium' | 'detailed';
  };
}

export interface MultiAgentContext {
  userEmail: string;
  plan: 'free' | 'pro';
  signal?: AbortSignal;
}

// ─── SSE Events ───

export type MultiAgentEvent =
  | { type: 'agent_start'; agent: AgentName; timestamp: number }
  | { type: 'agent_done'; agent: AgentName; durationMs: number; timestamp: number }
  | { type: 'agent_error'; agent: AgentName; error: string; timestamp: number }
  | { type: 'parser_result'; data: ParsedDce; timestamp: number }
  | { type: 'intelligence_result'; data: MarketIntelligence; timestamp: number }
  | { type: 'analysis_result'; data: AnalysisResult; timestamp: number }
  | { type: 'section_stream'; sectionId: string; text: string; timestamp: number }
  | { type: 'section_done'; section: WrittenSection; timestamp: number }
  | { type: 'review_result'; data: ReviewResult; timestamp: number }
  | { type: 'pipeline_done'; totalMs: number; timestamp: number }
  | { type: 'pipeline_error'; error: string; timestamp: number };
