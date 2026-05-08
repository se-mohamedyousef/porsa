/**
 * API Route: Analyze Portfolio
 * POST /api/agents/analyze-portfolio
 */

import { portfolioAgent } from '@/lib/agents/portfolioAgent';
import { logAgentExecution } from '@/lib/agents/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId) {
      return Response.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = await portfolioAgent.execute(
      message || 'Analyze my portfolio comprehensively',
      { userId }
    );
    const executionTime = Date.now() - startTime;

    // Log execution
    await logAgentExecution(userId, 'PortfolioAgent', {
      success: result.success,
      executionTime
    });

    return Response.json({
      ...result,
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return Response.json({
    methods: ['POST'],
    description: 'Analyze portfolio for allocation, risks, and rebalancing recommendations'
  });
}
