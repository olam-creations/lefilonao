/**
 * Base de l'architecture agentique du Filon AO.
 * Inspire par Mastra.ai et Vercel AI SDK.
 */

export interface AgentContext {
  userId: string;
  plan: 'free' | 'pro' | 'founder';
  history?: any[];
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  usage: {
    tokens: number;
    latencyMs: number;
    model: string;
  };
}

export abstract class BaseAgent<T_Input, T_Output> {
  abstract name: string;
  abstract description: string;

  abstract run(input: T_Input, context: AgentContext): Promise<AgentResult<T_Output>>;

  protected log(message: string) {
    console.log(`[Agent:${this.name}] ${message}`);
  }
}
