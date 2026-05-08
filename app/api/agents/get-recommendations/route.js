/**
 * API Route: Get Recommendations
 * POST /api/agents/get-recommendations
 */

import { advisorAgent } from '@/lib/agents/advisorAgent';
import { logAgentExecution } from '@/lib/agents/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, goals } = body;

    if (!userId) {
      return Response.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    let message;
    if (action === 'goal-based' && goals) {
      message = `I have these investment goals: ${JSON.stringify(goals)}. Recommend specific stocks and allocation to achieve them.`;
    } else if (action === 'optimize') {
      message = 'Help me optimize my portfolio for better risk-adjusted returns';
    } else if (action === 'sector-rotation') {
      message = 'Based on current market conditions, which sectors should I rotate into or out of?';
    } else {
      message = 'Provide personalized investment recommendations based on my profile and market conditions';
    }

    const startTime = Date.now();
    const result = await advisorAgent.execute(message, { userId });
    const executionTime = Date.now() - startTime;

    // Log execution
    await logAgentExecution(userId, 'AdvisorAgent', {
      success: result.success,
      executionTime
    });

    return Response.json({
      ...result,
      action: action || 'standard',
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return Response.json({
    methods: ['POST'],
    description: 'Get personalized investment recommendations'
  });
}
