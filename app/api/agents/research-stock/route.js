/**
 * API Route: Research Stock
 * POST /api/agents/research-stock
 */

import { stockResearchAgent } from '@/lib/agents/stockResearchAgent';
import { logAgentExecution } from '@/lib/agents/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, symbol, compareWith, action } = body;

    if (!symbol) {
      return Response.json(
        { error: 'Stock symbol required' },
        { status: 400 }
      );
    }

    let message;
    if (action === 'compare' && compareWith) {
      message = `Compare and rank these stocks: ${[symbol, ...compareWith].join(', ')}`;
    } else if (action === 'screen') {
      message = `Find stocks matching these criteria: ${JSON.stringify(symbol)}`;
    } else {
      message = `Research ${symbol} comprehensively (technical, fundamental, sentiment analysis)`;
    }

    const startTime = Date.now();
    const result = await stockResearchAgent.execute(message, {
      userId: userId || 'anonymous',
      additionalContext: `Researching: ${symbol}`
    });
    const executionTime = Date.now() - startTime;

    // Log execution
    if (userId) {
      await logAgentExecution(userId, 'StockResearchAgent', {
        success: result.success,
        executionTime
      });
    }

    return Response.json({
      ...result,
      symbol,
      executionTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock research error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return Response.json(
      { error: 'Symbol query parameter required' },
      { status: 400 }
    );
  }

  try {
    const result = await stockResearchAgent.execute(
      `Research ${symbol}`,
      { additionalContext: `Researching: ${symbol}` }
    );

    return Response.json({
      ...result,
      symbol,
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
    description: 'Research stocks with technical, fundamental, and sentiment analysis'
  });
}
