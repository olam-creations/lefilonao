import { DceAgent } from './dce-agent';

/**
 * Orchestrateur central des agents.
 * Point d'entrée unique pour les futures fonctionnalités multi-agents.
 */
export class FilonOrchestrator {
  private static instance: FilonOrchestrator;
  
  public dceAgent: DceAgent;

  private constructor() {
    this.dceAgent = new DceAgent();
  }

  public static getInstance(): FilonOrchestrator {
    if (!FilonOrchestrator.instance) {
      FilonOrchestrator.instance = new FilonOrchestrator();
    }
    return FilonOrchestrator.instance;
  }
}

export const orchestrator = FilonOrchestrator.getInstance();
