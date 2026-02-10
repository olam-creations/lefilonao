import { runParser } from './parser-agent';
import { runIntelligence } from './intelligence-agent';
import { runAnalyst } from './analyst-agent';
import { runWriterStreaming } from './writer-agent';
import { runReviewer } from './reviewer-agent';
import type {
  MultiAgentInput,
  MultiAgentContext,
  MultiAgentEvent,
  ParsedDce,
  MarketIntelligence,
  AnalysisResult,
  WrittenSection,
  AgentName,
} from './types';

type EventCallback = (event: MultiAgentEvent) => void;

function emit(onEvent: EventCallback, event: MultiAgentEvent): void {
  onEvent({ ...event, timestamp: Date.now() });
}

async function timedAgent<T>(
  name: AgentName,
  onEvent: EventCallback,
  fn: () => Promise<T>,
): Promise<T> {
  emit(onEvent, { type: 'agent_start', agent: name, timestamp: 0 });
  const start = Date.now();
  try {
    const result = await fn();
    emit(onEvent, { type: 'agent_done', agent: name, durationMs: Date.now() - start, timestamp: 0 });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    emit(onEvent, { type: 'agent_error', agent: name, error: msg, timestamp: 0 });
    throw err;
  }
}

/**
 * Default section definitions when parser doesn't find criteria.
 */
function defaultSections(parsed: ParsedDce): { id: string; title: string; buyerExpectation: string }[] {
  const baseSections = [
    { id: 'sec-1', title: 'Presentation de la societe', buyerExpectation: 'Connaitre le candidat, son experience et ses moyens' },
    { id: 'sec-2', title: 'Comprehension du besoin', buyerExpectation: 'Demontrer la bonne comprehension des enjeux du marche' },
    { id: 'sec-3', title: 'Methodologie et organisation', buyerExpectation: 'Plan de travail, organisation, calendrier, moyens' },
    { id: 'sec-4', title: 'Moyens humains et techniques', buyerExpectation: 'Equipe dediee, profils, certifications, outils' },
    { id: 'sec-5', title: 'References et retour d\'experience', buyerExpectation: 'Projets similaires realises avec succes' },
  ];

  // Add lot-specific sections if lots exist
  if (parsed.lots.length > 1) {
    return [
      ...baseSections,
      ...parsed.lots.slice(0, 3).map((lot, i) => ({
        id: `sec-lot-${lot.number}`,
        title: `Lot ${lot.number} — ${lot.title}`,
        buyerExpectation: `Reponse technique specifique au lot ${lot.number}`,
      })),
    ];
  }

  return baseSections;
}

/**
 * Execute the full multi-agent pipeline with progressive SSE events.
 *
 * Flow:
 *   Parser → Intelligence (sequential, intel needs parser)
 *   Analyst (needs parser + intel)
 *   Writers x N (parallel, need parser + analysis + profile)
 *   Reviewer (needs all sections)
 *
 * Each step is failure-isolated: Intelligence/Writers/Reviewer
 * can fail without killing the pipeline.
 */
export async function executeMultiAgent(
  input: MultiAgentInput,
  ctx: MultiAgentContext,
  onEvent: EventCallback,
): Promise<void> {
  const pipelineStart = Date.now();
  const { signal } = ctx;

  try {
    // ── Stage 1: Parser (required) ──
    const parsed = await timedAgent('parser', onEvent, () =>
      runParser(input.pdfText, signal),
    );
    emit(onEvent, { type: 'parser_result', data: parsed, timestamp: 0 });

    if (signal?.aborted) throw new Error('Aborted');

    // ── Stage 2: Intelligence (optional, DB-only) ──
    let intel: MarketIntelligence | null = null;
    try {
      intel = await timedAgent('intelligence', onEvent, () =>
        runIntelligence(parsed),
      );
      emit(onEvent, { type: 'intelligence_result', data: intel, timestamp: 0 });
    } catch {
      // Intelligence failure is non-critical
      intel = {
        buyerHistory: { totalContracts: 0, avgAmount: 0, topWinners: [], recentContracts: [] },
        competitors: [],
        sectorStats: { avgOffers: 0, avgAmount: 0, totalContracts: 0 },
        hhi: 0,
      };
    }

    if (signal?.aborted) throw new Error('Aborted');

    // ── Stage 3: Analyst (required) ──
    const analysis = await timedAgent('analyst', onEvent, () =>
      runAnalyst(parsed, intel!, input.profile, signal),
    );
    emit(onEvent, { type: 'analysis_result', data: analysis, timestamp: 0 });

    if (signal?.aborted) throw new Error('Aborted');

    // ── Stage 4: Writers (parallel, optional) ──
    const sections = input.options?.sections
      ? defaultSections(parsed).filter((s) => input.options!.sections!.includes(s.id))
      : defaultSections(parsed);

    const tone = input.options?.tone ?? 'standard';
    const length = input.options?.length ?? 'medium';

    let writtenSections: WrittenSection[] = [];
    try {
      const writerResults = await Promise.allSettled(
        sections.map((sec) =>
          runWriterStreaming(
            {
              sectionId: sec.id,
              sectionTitle: sec.title,
              buyerExpectation: sec.buyerExpectation,
              parsed,
              analysis,
              profile: input.profile,
              tone,
              length,
            },
            (text) => {
              emit(onEvent, { type: 'section_stream', sectionId: sec.id, text, timestamp: 0 });
            },
            signal,
          ),
        ),
      );

      for (const result of writerResults) {
        if (result.status === 'fulfilled') {
          writtenSections.push(result.value);
          emit(onEvent, { type: 'section_done', section: result.value, timestamp: 0 });
        }
      }
    } catch {
      // Writers failure is non-critical
    }

    if (signal?.aborted) throw new Error('Aborted');

    // ── Stage 5: Reviewer (optional) ──
    if (writtenSections.length > 0) {
      try {
        const review = await timedAgent('reviewer', onEvent, () =>
          runReviewer(parsed, writtenSections, signal),
        );
        emit(onEvent, { type: 'review_result', data: review, timestamp: 0 });
      } catch {
        // Reviewer failure is non-critical
      }
    }

    emit(onEvent, { type: 'pipeline_done', totalMs: Date.now() - pipelineStart, timestamp: 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Pipeline error';
    if (msg !== 'Aborted') {
      emit(onEvent, { type: 'pipeline_error', error: msg, timestamp: 0 });
    }
  }
}
