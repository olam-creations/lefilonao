import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeMultiAgent } from '../multi-agent-orchestrator';
import type {
  MultiAgentInput,
  MultiAgentContext,
  MultiAgentEvent,
  ParsedDce,
  MarketIntelligence,
  AnalysisResult,
  WrittenSection,
  ReviewResult,
  CompanyProfileInput,
} from '../types';

// Mock all agent modules
vi.mock('../parser-agent');
vi.mock('../intelligence-agent');
vi.mock('../analyst-agent');
vi.mock('../writer-agent');
vi.mock('../reviewer-agent');

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        not: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

vi.mock('@/lib/toon', () => ({
  jsonToToon: vi.fn((obj) => JSON.stringify(obj, null, 2)),
}));

// Import mocked modules to get their mock implementations
import * as parserAgent from '../parser-agent';
import * as intelligenceAgent from '../intelligence-agent';
import * as analystAgent from '../analyst-agent';
import * as writerAgent from '../writer-agent';
import * as reviewerAgent from '../reviewer-agent';

// Mock data
const mockParsedDce: ParsedDce = {
  lots: [{ number: '1', title: 'Lot 1', estimatedAmount: 50000 }],
  criteria: [
    { name: 'Prix', weight: 60 },
    { name: 'Technique', weight: 40 },
  ],
  documents: [{ name: 'Memoire technique', isCritical: true }],
  deadlines: [{ type: 'submission', date: '2026-03-01' }],
  buyerName: 'Ville de Paris',
  cpvCodes: ['72000000'],
  procedureType: 'MAPA',
};

const mockIntelligence: MarketIntelligence = {
  buyerHistory: {
    totalContracts: 10,
    avgAmount: 100000,
    topWinners: [{ name: 'Winner 1', count: 5 }],
    recentContracts: [{ title: 'Contract 1', winner: 'Winner 1', amount: 150000 }],
  },
  competitors: [{ name: 'Competitor 1', wins: 3, marketShare: 30 }],
  sectorStats: { avgOffers: 5, avgAmount: 120000, totalContracts: 20 },
  hhi: 1500,
};

const mockAnalysis: AnalysisResult = {
  recommendation: {
    verdict: 'go',
    headline: 'Excellent match',
    reasons: ['Good alignment', 'Strong profile'],
    confidenceScore: 85,
  },
  scoreCriteria: [
    { label: 'Eligibilite', score: 18, icon: 'Shield', description: 'Eligible' },
    { label: 'Alignement', score: 16, icon: 'Target', description: 'Well aligned' },
  ],
  vigilancePoints: [
    { type: 'opportunity', title: 'Good fit', description: 'Strong alignment with requirements' },
  ],
  strategicAdvice: 'Strategic advice for this opportunity',
};

const mockWrittenSection: WrittenSection = {
  sectionId: 'sec-1',
  title: 'Presentation de la societe',
  content: 'Generated content for presentation section',
  wordCount: 250,
};

const mockReview: ReviewResult = {
  completenessScore: 85,
  suggestions: [
    { sectionId: 'sec-1', type: 'tip', message: 'Good section' },
  ],
  overallAdvice: 'Overall solid proposal',
};

const mockProfile: CompanyProfileInput = {
  companyName: 'Test Corp',
  sectors: ['IT', 'Consulting'],
  caN1: '1000000',
  caN2: '900000',
};

const mockInput: MultiAgentInput = {
  pdfBuffer: Buffer.from('fake pdf'),
  pdfText: 'Texte DCE pour analyse...',
  profile: mockProfile,
};

const mockContext: MultiAgentContext = {
  userEmail: 'test@test.com',
  plan: 'pro',
};

describe('Multi-Agent Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(parserAgent.runParser).mockResolvedValue(mockParsedDce);
    vi.mocked(intelligenceAgent.runIntelligence).mockResolvedValue(mockIntelligence);
    vi.mocked(analystAgent.runAnalyst).mockResolvedValue(mockAnalysis);
    vi.mocked(writerAgent.runWriterStreaming).mockImplementation(async (input, onChunk) => {
      onChunk('Chunk 1');
      onChunk('Chunk 2');
      return { ...mockWrittenSection, sectionId: input.sectionId, title: input.sectionTitle };
    });
    vi.mocked(reviewerAgent.runReviewer).mockResolvedValue(mockReview);
  });

  it('emits events in correct order during successful pipeline', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    await executeMultiAgent(mockInput, mockContext, onEvent);

    // Verify event sequence
    const eventTypes = events.map((e) => e.type);

    expect(eventTypes).toContain('agent_start');
    expect(eventTypes).toContain('agent_done');
    expect(eventTypes).toContain('parser_result');
    expect(eventTypes).toContain('intelligence_result');
    expect(eventTypes).toContain('analysis_result');
    expect(eventTypes).toContain('section_stream');
    expect(eventTypes).toContain('section_done');
    expect(eventTypes).toContain('review_result');
    expect(eventTypes).toContain('pipeline_done');

    // Verify parser events come before intelligence
    const parserStartIdx = eventTypes.findIndex((t) => t === 'agent_start');
    const parserResultIdx = eventTypes.findIndex((t) => t === 'parser_result');
    const intelligenceResultIdx = eventTypes.findIndex((t) => t === 'intelligence_result');

    expect(parserStartIdx).toBeGreaterThanOrEqual(0);
    expect(parserResultIdx).toBeGreaterThan(parserStartIdx);
    expect(intelligenceResultIdx).toBeGreaterThan(parserResultIdx);
  });

  it('stops pipeline when parser fails', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    vi.mocked(parserAgent.runParser).mockRejectedValue(new Error('Parser failure'));

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const eventTypes = events.map((e) => e.type);

    expect(eventTypes).toContain('agent_error');
    expect(eventTypes).toContain('pipeline_error');
    expect(eventTypes).not.toContain('intelligence_result');
    expect(eventTypes).not.toContain('analysis_result');

    const errorEvent = events.find((e) => e.type === 'pipeline_error') as any;
    expect(errorEvent.error).toBe('Parser failure');
  });

  it('continues pipeline with fallback when intelligence fails', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    vi.mocked(intelligenceAgent.runIntelligence).mockRejectedValue(new Error('Intelligence failure'));

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const eventTypes = events.map((e) => e.type);

    // Pipeline should continue even without intelligence_result event
    expect(eventTypes).toContain('parser_result');
    expect(eventTypes).toContain('analysis_result');
    expect(eventTypes).toContain('pipeline_done');

    // Intelligence failure is caught by timedAgent, so we should see agent_error
    expect(eventTypes).toContain('agent_error');
    const errorEvent = events.find((e) => e.type === 'agent_error') as any;
    expect(errorEvent.agent).toBe('intelligence');

    // No intelligence_result event emitted when it fails (fallback is silent)
    expect(eventTypes).not.toContain('intelligence_result');
  });

  it('continues pipeline when writer fails', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    vi.mocked(writerAgent.runWriterStreaming).mockRejectedValue(new Error('Writer failure'));

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const eventTypes = events.map((e) => e.type);

    // Pipeline should complete even without sections
    expect(eventTypes).toContain('parser_result');
    expect(eventTypes).toContain('analysis_result');
    expect(eventTypes).toContain('pipeline_done');
    expect(eventTypes).not.toContain('section_done');
  });

  it('continues pipeline when reviewer fails', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    vi.mocked(reviewerAgent.runReviewer).mockRejectedValue(new Error('Reviewer failure'));

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const eventTypes = events.map((e) => e.type);

    // Pipeline should complete without review
    expect(eventTypes).toContain('parser_result');
    expect(eventTypes).toContain('section_done');
    expect(eventTypes).toContain('pipeline_done');
    expect(eventTypes).not.toContain('review_result');
  });

  it('stops pipeline when AbortSignal is triggered', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    const abortController = new AbortController();
    const contextWithSignal: MultiAgentContext = {
      ...mockContext,
      signal: abortController.signal,
    };

    // Abort after parser completes
    vi.mocked(parserAgent.runParser).mockImplementation(async () => {
      abortController.abort();
      return mockParsedDce;
    });

    await executeMultiAgent(mockInput, contextWithSignal, onEvent);

    const eventTypes = events.map((e) => e.type);

    // Should stop after parser
    expect(eventTypes).toContain('parser_result');
    expect(eventTypes).not.toContain('analysis_result');
    expect(eventTypes).not.toContain('pipeline_done');
    expect(eventTypes).not.toContain('pipeline_error');
  });

  it('emits section_stream events during writer execution', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const streamEvents = events.filter((e) => e.type === 'section_stream');
    expect(streamEvents.length).toBeGreaterThan(0);

    const firstStreamEvent = streamEvents[0] as any;
    expect(firstStreamEvent.sectionId).toBeDefined();
    expect(firstStreamEvent.text).toBeDefined();
  });

  it('processes multiple sections in parallel', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    let concurrentCalls = 0;
    let maxConcurrent = 0;

    vi.mocked(writerAgent.runWriterStreaming).mockImplementation(async (input, onChunk) => {
      concurrentCalls++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCalls);

      await new Promise((resolve) => setTimeout(resolve, 50));
      onChunk('Test content');

      concurrentCalls--;
      return { ...mockWrittenSection, sectionId: input.sectionId, title: input.sectionTitle };
    });

    await executeMultiAgent(mockInput, mockContext, onEvent);

    // Verify multiple sections were processed (default sections should create 5+)
    const sectionDoneEvents = events.filter((e) => e.type === 'section_done');
    expect(sectionDoneEvents.length).toBeGreaterThanOrEqual(5);

    // Verify parallel processing (max concurrent > 1 indicates parallel execution)
    expect(maxConcurrent).toBeGreaterThan(1);
  });

  it('respects section filter from options', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    const inputWithOptions: MultiAgentInput = {
      ...mockInput,
      options: {
        sections: ['sec-1', 'sec-2'],
      },
    };

    await executeMultiAgent(inputWithOptions, mockContext, onEvent);

    const sectionDoneEvents = events.filter((e) => e.type === 'section_done');
    expect(sectionDoneEvents.length).toBe(2);
  });

  it('passes tone and length options to writer', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    const inputWithOptions: MultiAgentInput = {
      ...mockInput,
      options: {
        tone: 'formal',
        length: 'detailed',
      },
    };

    await executeMultiAgent(inputWithOptions, mockContext, onEvent);

    // Verify writer was called with correct options
    expect(writerAgent.runWriterStreaming).toHaveBeenCalled();
    const firstCall = vi.mocked(writerAgent.runWriterStreaming).mock.calls[0];
    expect(firstCall[0].tone).toBe('formal');
    expect(firstCall[0].length).toBe('detailed');
  });

  it('skips reviewer when no sections were written', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    // Make all writers fail
    vi.mocked(writerAgent.runWriterStreaming).mockRejectedValue(new Error('Writer failure'));

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const eventTypes = events.map((e) => e.type);

    // Reviewer should not be called
    expect(eventTypes).not.toContain('review_result');
    expect(reviewerAgent.runReviewer).not.toHaveBeenCalled();
  });

  it('passes AbortSignal to all agent calls', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    const abortController = new AbortController();
    const contextWithSignal: MultiAgentContext = {
      ...mockContext,
      signal: abortController.signal,
    };

    await executeMultiAgent(mockInput, contextWithSignal, onEvent);

    // Verify signal was passed to each agent
    expect(parserAgent.runParser).toHaveBeenCalledWith(
      expect.any(String),
      abortController.signal
    );
    expect(analystAgent.runAnalyst).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.any(Object),
      abortController.signal
    );
    expect(writerAgent.runWriterStreaming).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Function),
      abortController.signal
    );
  });

  it('includes timestamps in all events', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    await executeMultiAgent(mockInput, mockContext, onEvent);

    // All events should have timestamps
    events.forEach((event) => {
      expect(event.timestamp).toBeTypeOf('number');
      expect(event.timestamp).toBeGreaterThan(0);
    });
  });

  it('includes duration in agent_done events', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const agentDoneEvents = events.filter((e) => e.type === 'agent_done') as any[];

    expect(agentDoneEvents.length).toBeGreaterThan(0);
    agentDoneEvents.forEach((event) => {
      expect(event.durationMs).toBeTypeOf('number');
      expect(event.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  it('includes total duration in pipeline_done event', async () => {
    const events: MultiAgentEvent[] = [];
    const onEvent = (event: MultiAgentEvent) => events.push(event);

    await executeMultiAgent(mockInput, mockContext, onEvent);

    const pipelineDoneEvent = events.find((e) => e.type === 'pipeline_done') as any;

    expect(pipelineDoneEvent).toBeDefined();
    expect(pipelineDoneEvent.totalMs).toBeTypeOf('number');
    expect(pipelineDoneEvent.totalMs).toBeGreaterThanOrEqual(0);
  });
});
