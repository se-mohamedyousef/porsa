/**
 * API Route: Monitor Alerts
 * POST /api/agents/monitor-alerts
 */

import { alertSystemAgent } from '@/lib/agents/alertSystemAgent';
import { logAgentExecution } from '@/lib/agents/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, stocks, condition } = body;

    if (!userId) {
      return Response.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    let message;
    if (action === 'check-price' && stocks) {
      message = `Check if these stocks have hit price alert targets: ${stocks.join(', ')}`;
    } else if (action === 'check-portfolio') {
      message = 'Check my portfolio for all active alerts (drawdown, volatility, concentration, drift)';
    } else if (action === 'emergency' && condition) {
      message = `URGENT: Emergency market condition: ${condition}. Assess impact and execute critical alerts.`;
    } else {
      message = 'Monitor my portfolio and market for all active alerts';
    }

    const startTime = Date.now();
    const result = await alertSystemAgent.execute(message, { userId });
    const executionTime = Date.now() - startTime;

    // Log execution
    await logAgentExecution(userId, 'AlertSystemAgent', {
      success: result.success,
      executionTime
    });

    return Response.json({
      ...result,
      action: action || 'full-monitor',
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alert monitoring error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return Response.json({
    methods: ['POST'],
    description: 'Monitor portfolio and market for active alerts'
  });
}
