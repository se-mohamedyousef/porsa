import { NextResponse } from 'next/server';
import { ParallelExecutor } from '@/lib/agents/v2/core/ParallelExecutor';
import { InvestmentDecisionAgent } from '@/lib/agents/v2/master/InvestmentDecisionAgent';
import { DataCollector } from '@/lib/agents/v2/core/DataCollector';
import {
  TechnicalAgent,
  MomentumAgent,
  ValueAgent,
  NewsAgent,
} from '@/lib/agents/v2/specialists/v2agents';

/**
 * POST /api/ai-workspace/analyze
 * v3 — Uses DataCollector for real data, 4 specialist agents, LLM-powered synthesis.
 */
export async function POST(request) {
  try {
    const { ticker, horizon = 'medium', portfolio } = await request.json();

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
    }

    const cleanTicker = ticker.toUpperCase().trim();

    // Step 1: Collect ALL real data via DataCollector
    let collectedData;
    try {
      collectedData = await DataCollector.collectAll(cleanTicker);
    } catch (fetchErr) {
      console.warn('[AI Workspace] DataCollector error:', fetchErr.message);
      collectedData = { ticker: cleanTicker, technical: { available: false }, fundamental: {}, news: {} };
    }

    // Step 2: Initialize 4 specialist agents (real data only)
    const specialistAgents = [
      new TechnicalAgent(),
      new MomentumAgent(),
      new ValueAgent(),
      new NewsAgent(),
    ];

    // Step 3: Run all agents in parallel with collected data
    const agentContext = {
      ticker: cleanTicker,
      collectedData,
      horizon,
      portfolio: portfolio || [],
    };

    const { findings, errors: executionErrors } = await ParallelExecutor.executeAgents(
      specialistAgents,
      agentContext,
      15000
    );

    // Need at least 2 agents to make a decision
    if (findings.length < 2) {
      return NextResponse.json(
        { error: 'Insufficient agent responses', details: `Only ${findings.length}/4 agents succeeded` },
        { status: 500 }
      );
    }

    // Step 4: Master agent synthesizes all findings + raw data
    const masterAgent = new InvestmentDecisionAgent();
    const finalDecision = await masterAgent.analyze({
      ticker: cleanTicker,
      specialistFindings: findings,
      collectedData,
      portfolio: portfolio || [],
    });

    const stats = ParallelExecutor.getStats(findings);

    return NextResponse.json({
      success: true,
      ticker: cleanTicker,
      timestamp: new Date().toISOString(),
      specialistFindings: findings,
      finalDecision,
      dataSources: finalDecision.dataSources,
      executionErrors: executionErrors.length > 0 ? executionErrors : null,
      summary: {
        totalAgents: specialistAgents.length,
        successfulAgents: stats.successfulAgents,
        failedAgents: stats.failedAgents,
        avgConfidence: stats.avgConfidence,
        recommendation: finalDecision.finalDecision,
        confidence: finalDecision.decisionConfidence,
        consensus: finalDecision.consensusScore,
        score: finalDecision.scorerResult?.score,
        category: finalDecision.scorerResult?.category,
      },
    });
  } catch (error) {
    console.error('[AI Workspace] Analysis error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-workspace/analyze
 * Return usage info
 */
export async function GET() {
  return NextResponse.json(
    {
      message: 'Use POST to analyze a stock',
      endpoint: '/api/ai-workspace/analyze',
      method: 'POST',
      example: {
        ticker: 'COMI',
        horizon: 'medium',
        portfolio: []
      }
    },
    { status: 200 }
  );
}
