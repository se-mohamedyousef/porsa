import { AGENT_STATUS } from './AgentTypes';

/**
 * Parallel Executor
 * Runs multiple agents concurrently with timeout handling
 */
export class ParallelExecutor {
  /**
   * Execute multiple agents in parallel with timeout protection
   */
  static async executeAgents(agents, context, timeoutMs = 30000) {
    const promises = agents.map(agent =>
      this.executeWithTimeout(agent.analyze(context), timeoutMs, agent.id)
        .catch(error => {
          // Return normalized error finding
          return agent.normalize({
            recommendation: 'neutral',
            confidence: 0,
            summary: `${agent.displayName} failed to complete analysis`,
            errors: [error.message],
            status: AGENT_STATUS.FAILED
          });
        })
    );

    const results = await Promise.all(promises);
    const findings = results.filter(r => r && r.agentId);
    const errors = findings
      .filter(f => f.errors && f.errors.length > 0)
      .map(f => ({ agentId: f.agentId, errors: f.errors }));

    return { findings, errors };
  }

  /**
   * Execute single promise with timeout
   */
  static executeWithTimeout(promise, timeoutMs, agentId) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Agent ${agentId} timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Get execution statistics
   */
  static getStats(findings) {
    return {
      totalAgents: findings.length,
      successfulAgents: findings.filter(f => f.status === AGENT_STATUS.SUCCESS).length,
      failedAgents: findings.filter(f => f.status === AGENT_STATUS.FAILED).length,
      avgConfidence: Math.round(
        findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
      )
    };
  }
}
