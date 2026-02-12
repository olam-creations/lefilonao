import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractHighFidelityText } from '../pdf-engine';
import { resilientCascade } from '../ai-resilience';
import { orchestrator } from '../agents/orchestrator';

// Mock pdfjs-dist legacy
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockReturnValue(Promise.resolve({
        getTextContent: vi.fn().mockReturnValue(Promise.resolve({
          items: [
            { str: 'Table Title', transform: [0, 0, 0, 0, 10, 100] },
            { str: 'Price', transform: [0, 0, 0, 0, 10, 80] },
            { str: '100€', transform: [0, 0, 0, 0, 50, 80] },
          ]
        }))
      })),
      getMetadata: vi.fn().mockReturnValue(Promise.resolve({}))
    })
  }),
  GlobalWorkerOptions: { workerSrc: '' }
}));

// We also need to mock it for the require inside the engine if any, but since we use ESM imports...
// Let's also polyfill DOMMatrix just in case
if (typeof global !== 'undefined' && !global.DOMMatrix) {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {
    m42 = 0;
  } as any;
}

describe('AI Engine Battle Test', () => {
  
  describe('PDF High Fidelity Engine', () => {
    it('should extract text preserving spatial layout (rows)', async () => {
      const buffer = Buffer.from('dummy pdf');
      const result = await extractHighFidelityText(buffer);
      
      expect(result.text).toContain('Table Title');
      expect(result.text).toMatch(/Price\s+100€/);
      expect(result.numPages).toBe(1);
    });

    it('should handle multiple pages correctly', async () => {
      const buffer = Buffer.from('multi page pdf');
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      // @ts-ignore
      vi.mocked(pdfjs.getDocument).mockReturnValueOnce({
        promise: Promise.resolve({
          numPages: 2,
          getPage: vi.fn().mockReturnValue(Promise.resolve({
            getTextContent: vi.fn().mockReturnValue(Promise.resolve({ items: [{ str: 'Page Content', transform: [0,0,0,0,0,0] }] }))
          })),
          getMetadata: vi.fn().mockReturnValue(Promise.resolve({}))
        } as any)
      } as any);
      const result = await extractHighFidelityText(buffer);
      expect(result.text).toContain('--- PAGE 1 ---');
      expect(result.text).toContain('--- PAGE 2 ---');
      expect(result.numPages).toBe(2);
    });
  });

  describe('Resilience Cascade', () => {
    it('should fallback through multiple providers', async () => {
      const p1 = { name: 'gemini', available: () => true, execute: vi.fn().mockRejectedValue(new Error('E1')) };
      const p2 = { name: 'ollama', available: () => true, execute: vi.fn().mockRejectedValue(new Error('E2')) };
      const p3 = { name: 'nvidia', available: () => true, execute: vi.fn().mockResolvedValue('Success at 3') };

      const result = await resilientCascade([p1, p2, p3]);
      expect(result).toBe('Success at 3');
      expect(p1.execute).toHaveBeenCalled();
      expect(p2.execute).toHaveBeenCalled();
      expect(p3.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw exhaustive error when all providers fail', async () => {
      const p1 = { name: 'gemini', available: () => true, execute: vi.fn().mockRejectedValue(new Error('Service Down')) };
      
      await expect(resilientCascade([p1])).rejects.toThrow('Tous les providers IA ont echoue');
    });
  });

  describe('Agent Orchestration & Context', () => {
    it('should initialize the orchestrator with specialized agents', () => {
      expect(orchestrator.dceAgent).toBeDefined();
      expect(orchestrator.dceAgent.name).toBe('DCE-Analyzer');
    });

    it('should correctly process input through the agent', async () => {
      const dummyBuffer = Buffer.from('%PDF-1.4');
      // Mock dce-analyzer partially to avoid network
      vi.mock('../dce-analyzer', () => ({
        analyzePdfBuffer: vi.fn().mockResolvedValue({ executiveSummary: 'Test Success' })
      }));

      const context = { userId: 'user_123', plan: 'pro' as const };
      const result = await orchestrator.dceAgent.run({ pdfBuffer: dummyBuffer }, context);
      
      expect(result.success).toBe(true);
      expect(result.data?.executiveSummary).toBe('Test Success');
      expect(result.usage.latencyMs).toBeGreaterThan(-1);
    });
  });

});
