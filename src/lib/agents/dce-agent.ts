import { BaseAgent, AgentContext, AgentResult } from './base-agent';
import { analyzePdfBuffer } from '../dce-analyzer';
import type { AoDetail } from '../dev';

export interface DceAgentInput {
  pdfBuffer: Buffer;
  aoTitle?: string;
}

/**
 * Agent specialise dans l'analyse de dossiers de consultation (DCE).
 * Utilise la cascade de resilience (Gemini -> Ollama -> Nvidia).
 */
export class DceAgent extends BaseAgent<DceAgentInput, AoDetail> {
  name = 'DCE-Analyzer';
  description = 'Analyse les documents PDF de marchés publics pour extraire des scores et des recommandations.';

  async run(input: DceAgentInput, context: AgentContext): Promise<AgentResult<AoDetail>> {
    const start = Date.now();
    this.log(`Démarrage de l'analyse pour: ${input.aoTitle || 'Sans titre'}`);

    try {
      const detail = await analyzePdfBuffer(input.pdfBuffer);
      
      return {
        success: true,
        data: detail,
        usage: {
          tokens: 0, // TODO: Implement token counting
          latencyMs: Date.now() - start,
          model: 'resilient-cascade'
        }
      };
    } catch (error) {
      this.log(`Erreur: ${error instanceof Error ? error.message : 'Inconnue'}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur fatale de l'agent",
        usage: {
          tokens: 0,
          latencyMs: Date.now() - start,
          model: 'none'
        }
      };
    }
  }
}
