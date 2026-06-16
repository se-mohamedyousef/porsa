import { AGENT_STATUS, RECOMMENDATION_TYPES } from './AgentTypes';

/**
 * Base Agent Class
 * All specialist agents inherit from this and implement analyze()
 */
export class BaseAgent {
  constructor({ id, displayName, version = '1.0' }) {
    this.id = id;
    this.displayName = displayName;
    this.version = version;
    this.capabilities = [];
    this.requiredInputs = ['ticker'];
  }

  /**
   * Analyze method - must be implemented by subclasses
   */
  async analyze(context) {
    throw new Error(`analyze() must be implemented in ${this.displayName}`);
  }

  /**
   * Normalize result to standard AgentFinding format
   */
  normalize(result) {
    return {
      agentId: this.id,
      displayName: this.displayName,
      status: result.status || AGENT_STATUS.SUCCESS,
      recommendation: result.recommendation || RECOMMENDATION_TYPES.NEUTRAL,
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      summary: result.summary || '',
      keySignals: Array.isArray(result.signals) ? result.signals : [],
      risks: Array.isArray(result.risks) ? result.risks : [],
      opportunities: Array.isArray(result.opportunities) ? result.opportunities : [],
      evidence: result.evidence || {},
      assumptions: Array.isArray(result.assumptions) ? result.assumptions : [],
      latencyMs: result.latencyMs || 0,
      errors: Array.isArray(result.errors) ? result.errors : []
    };
  }

  /**
   * Validate result structure
   */
  async validate(result) {
    if (!result.recommendation) return false;
    if (typeof result.confidence !== 'number') return false;
    if (result.confidence < 0 || result.confidence > 100) return false;
    return true;
  }

  /**
   * Log agent execution
   */
  logExecution(message, data = {}) {
    console.log(`[${this.displayName}] ${message}`, data);
  }

  /**
   * Handle errors gracefully
   */
  handleError(error) {
    this.logExecution('Error', { error: error.message });
    return this.normalize({
      recommendation: RECOMMENDATION_TYPES.NEUTRAL,
      confidence: 0,
      summary: `${this.displayName} encountered an error`,
      errors: [error.message],
      status: AGENT_STATUS.FAILED
    });
  }
}
