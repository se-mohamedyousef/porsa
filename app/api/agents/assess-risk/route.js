/**
 * API Route: Assess Risk
 * POST /api/agents/assess-risk
 */

import { riskManagementAgent } from '@/lib/agents/riskManagementAgent';
import { logAgentExecution } from '@/lib/agents/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, scenario } = body;

    if (!userId) {
      return Response.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    let message;
    if (action === 'stress-test' && scenario) {
      message = `Stress test my portfolio against this scenario: ${scenario}. Calculate potential losses and recovery time.`;
    } else if (action === 'correlation-risks') {
      message = 'Analyze my portfolio for correlation risks and recommend diversification improvements.';
    } else if (action === 'suggest-hedges') {
      message = 'Suggest hedging strategies for my portfolio. What should I hedge? What\'s the cost vs benefit?';
    } else if (action === 'stop-losses') {
      message = 'Recommend stop-loss levels for each position in my portfolio.';
    } else {
      message = 'Conduct a comprehensive risk assessment of my portfolio.';
    }

    const startTime = Date.now();
    const result = await riskManagementAgent.execute(message, { userId });
    const executionTime = Date.now() - startTime;

    // Log execution
    await logAgentExecution(userId, 'RiskManagementAgent', {
      success: result.success,
      executionTime
    });

    return Response.json({
      ...result,
      action: action || 'assessment',
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return Response.json({
    methods: ['POST'],
    description: 'Assess portfolio risk and get mitigation recommendations'
  });
}
