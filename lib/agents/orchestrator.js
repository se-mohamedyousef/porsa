/**
 * Agent Orchestrator
 * Routes user queries to appropriate agent and manages responses
 */

import { AgentFactory } from '@/lib/agents/agentBase';
import { redis as kv } from '@/lib/kv';

/**
 * Determine which agent should handle the request
 */
export function detectAgentIntent(userMessage, endpoint = null) {
  const messageUpper = userMessage.toUpperCase();

  // If routed directly via endpoint, use that
  if (endpoint) {
    const intentMap = {
      'analyze-portfolio': 'portfolio',
      'research-stock': 'research',
      'monitor-alerts': 'alerts',
      'get-recommendations': 'advisor',
      'detect-anomalies': 'anomaly',
      'assess-risk': 'risk'
    };
    return intentMap[endpoint] || 'unknown';
  }

  // Natural language intent detection
  if (
    messageUpper.includes('PORTFOLIO') ||
    messageUpper.includes('REBALANCE') ||
    messageUpper.includes('ALLOCATION') ||
    messageUpper.includes('DRIFT') ||
    messageUpper.includes('HOLDINGS')
  ) {
    return 'portfolio';
  }

  if (
    messageUpper.includes('RESEARCH') ||
    messageUpper.includes('STOCK') ||
    messageUpper.includes('SYMBOL') ||
    messageUpper.includes('ANALYSIS') ||
    messageUpper.includes('TECHNICAL') ||
    messageUpper.includes('FUNDAMENTAL')
  ) {
    return 'research';
  }

  if (
    messageUpper.includes('ALERT') ||
    messageUpper.includes('MONITOR') ||
    messageUpper.includes('TRIGGER') ||
    messageUpper.includes('NOTIFY')
  ) {
    return 'alerts';
  }

  if (
    messageUpper.includes('RECOMMEND') ||
    messageUpper.includes('ADVICE') ||
    messageUpper.includes('SUGGEST') ||
    messageUpper.includes('BUY') ||
    messageUpper.includes('SELL')
  ) {
    return 'advisor';
  }

  if (
    messageUpper.includes('ANOMAL') ||
    messageUpper.includes('UNUSUAL') ||
    messageUpper.includes('OPPORTUNITY') ||
    messageUpper.includes('PATTERN')
  ) {
    return 'anomaly';
  }

  if (
    messageUpper.includes('RISK') ||
    messageUpper.includes('VOLATIL') ||
    messageUpper.includes('SHARPE') ||
    messageUpper.includes('HEDGE') ||
    messageUpper.includes('DRAWDOWN')
  ) {
    return 'risk';
  }

  return 'advisor'; // default agent
}

/**
 * Get appropriate agent instance
 */
export function getAgentForIntent(intent) {
  switch (intent) {
    case 'portfolio':
      return AgentFactory.createPortfolioAgent();
    case 'research':
      return AgentFactory.createStockResearchAgent();
    case 'alerts':
      return AgentFactory.createAlertSystemAgent();
    case 'advisor':
      return AgentFactory.createAdvisorAgent();
    case 'anomaly':
      return AgentFactory.createAnomalyDetectorAgent();
    case 'risk':
      return AgentFactory.createRiskManagementAgent();
    default:
      return AgentFactory.createAdvisorAgent();
  }
}

/**
 * Main orchestration function
 * Handles caching, agent selection, and response formatting
 */
export async function orchestrateAgentRequest(userMessage, context = {}) {
  try {
    const { userId, endpoint = null, useCache = true, cacheTTL = 300 } = context;

    const intent = detectAgentIntent(userMessage, endpoint);

    const messageFingerprint = (() => {
      let h = 5381;
      const s = String(userMessage || "");
      for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
      return (h >>> 0).toString(36);
    })();

    let cacheKey = null;
    if (useCache && userId) {
      cacheKey = `agent:${intent}:${userId}:${messageFingerprint}`;
      const cached = await kv.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }
    }

    // Get and execute agent
    const agent = getAgentForIntent(intent);
    const result = await agent.execute(userMessage, { userId, additionalContext: context.additionalContext });

    // Cache result if successful
    if (useCache && cacheKey && result.success) {
      await kv.set(cacheKey, result, { ex: cacheTTL });
    }

    return {
      ...result,
      intent,
      agent: agent.name,
      fromCache: false
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: null
    };
  }
}

/**
 * Execute specific agent by endpoint
 */
export async function executeAgentEndpoint(endpoint, userMessage, context = {}) {
  return orchestrateAgentRequest(userMessage, { ...context, endpoint });
}

/**
 * Batch process multiple agent requests
 */
export async function processBatchAgentRequests(requests) {
  const results = await Promise.all(
    requests.map(req =>
      orchestrateAgentRequest(req.message, {
        userId: req.userId,
        endpoint: req.endpoint,
        useCache: req.useCache !== false
      })
    )
  );
  return results;
}

/**
 * Get agent execution logs for a user
 */
export async function getAgentExecutionLogs(userId, limit = 10) {
  try {
    const logsKey = `agent:logs:${userId}`;
    const logs = await kv.lrange(logsKey, 0, limit - 1);
    return logs || [];
  } catch (error) {
    return [];
  }
}

/**
 * Log agent execution
 */
export async function logAgentExecution(userId, agentName, result) {
  try {
    const logsKey = `agent:logs:${userId}`;
    const logEntry = {
      agent: agentName,
      success: result.success,
      timestamp: new Date().toISOString(),
      executionTime: result.executionTime || 0
    };
    await kv.lpush(logsKey, JSON.stringify(logEntry));
    // Keep only last 100 logs per user
    await kv.ltrim(logsKey, 0, 99);
  } catch (error) {
    console.error('Failed to log agent execution:', error);
  }
}
