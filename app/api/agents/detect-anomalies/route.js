/**
 * API Route: Detect Anomalies
 * GET/POST /api/agents/detect-anomalies
 */

import { anomalyDetectorAgent } from '@/lib/agents/anomalyDetectorAgent';
import { logAgentExecution } from '@/lib/agents/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    let message;
    if (action === 'find-opportunities') {
      message = 'Find market opportunities created by price/volume/sentiment anomalies. Rank by risk/reward.';
    } else if (action === 'systemic-risk') {
      message = 'Assess the market for systemic risk: correlations, volatility, liquidity, sector issues.';
    } else if (action === 'portfolio-anomalies' && userId) {
      message = 'Scan for anomalies affecting my portfolio. Are any holdings showing unusual patterns?';
    } else {
      message = 'Scan the EGX market for anomalies (price gaps, volume spikes, sentiment shifts, systemic risks).';
    }

    const startTime = Date.now();
    const result = await anomalyDetectorAgent.execute(message, {
      userId: userId || 'anonymous'
    });
    const executionTime = Date.now() - startTime;

    // Log execution
    if (userId) {
      await logAgentExecution(userId, 'AnomalyDetectorAgent', {
        success: result.success,
        executionTime
      });
    }

    return Response.json({
      ...result,
      action: action || 'full-scan',
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    const result = await anomalyDetectorAgent.execute(
      'Scan the EGX market for anomalies and opportunities',
      { userId: userId || 'anonymous' }
    );

    return Response.json({
      ...result,
      action: action || 'scan',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return Response.json({
    methods: ['POST', 'GET'],
    description: 'Detect market anomalies, opportunities, and systemic risks'
  });
}
