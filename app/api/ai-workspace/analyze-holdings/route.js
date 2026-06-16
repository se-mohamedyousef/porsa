import { NextResponse } from 'next/server';
import { MarketDataAdapter } from '@/lib/agents/v2/core/MarketDataAdapter';
import { ParallelExecutor } from '@/lib/agents/v2/core/ParallelExecutor';
import { InvestmentDecisionAgent } from '@/lib/agents/v2/master/InvestmentDecisionAgent';
import {
  MarketIntelligenceAgent,
  TechnicalAnalysisAgent,
  RiskManagementAgent,
} from '@/lib/agents/v2/specialists/index';

/**
 * POST /api/ai-workspace/analyze-holdings
 * Analyze all stocks in user's portfolio and recommend KEEP/SELL/ADD for each
 */
export async function POST(request) {
  try {
    const { portfolio } = await request.json();

    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json({ error: 'Portfolio is empty' }, { status: 400 });
    }

    // Limit to 15 stocks to avoid excessive API calls
    const stocks = portfolio.slice(0, 15);
    const results = [];

    // Analyze each stock (sequentially to respect Yahoo rate limits)
    for (const stock of stocks) {
      try {
        const ticker = stock.symbol;
        if (!ticker) continue;

        // Fetch real market data
        const marketData = await MarketDataAdapter.fetchMarketContext(ticker);
        if (!marketData || !marketData.price) {
          results.push({
            ticker,
            action: 'KEEP',
            confidence: 0,
            reason: 'Unable to fetch market data — no recommendation',
            currentPrice: stock.currentPrice || 0,
            buyPrice: stock.buyPrice || 0,
            profitPercent: stock.profitPercent || 0,
            error: true
          });
          continue;
        }

        // Use lightweight agent set (3 key agents for speed)
        const agents = [
          new MarketIntelligenceAgent(),
          new TechnicalAnalysisAgent(),
          new RiskManagementAgent(),
        ];

        const agentContext = {
          ticker,
          marketData,
          horizon: stock.investmentType === 'short-term' ? 'short' : 'medium',
          portfolio: stocks
        };

        const { findings } = await ParallelExecutor.executeAgents(agents, agentContext, 10000);

        // Quick decision from master agent
        const masterAgent = new InvestmentDecisionAgent();
        const decision = await masterAgent.analyze({
          ticker,
          specialistFindings: findings,
          marketData,
          portfolio: stocks
        });

        // Map BUY/HOLD/SELL to KEEP/SELL/ADD for holdings context
        const currentPrice = marketData.price;
        const buyPrice = stock.buyPrice || 0;
        const profitPercent = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

        let holdingAction = 'KEEP';
        let holdingReason = '';

        if (decision.finalDecision === 'SELL') {
          holdingAction = 'SELL';
          holdingReason = `Bearish outlook — ${decision.actionCard?.topReason || 'agents recommend selling'}`;
        } else if (decision.finalDecision === 'BUY') {
          holdingAction = 'ADD';
          holdingReason = `Bullish outlook — ${decision.actionCard?.topReason || 'agents recommend buying more'}`;
        } else {
          // HOLD — but check P&L conditions
          if (profitPercent > 40) {
            holdingAction = 'SELL';
            holdingReason = `Up ${profitPercent.toFixed(1)}% — consider taking profits`;
          } else if (profitPercent < -20) {
            holdingAction = 'SELL';
            holdingReason = `Down ${Math.abs(profitPercent).toFixed(1)}% — cut losses if thesis is broken`;
          } else {
            holdingAction = 'KEEP';
            holdingReason = `Hold position — ${decision.actionCard?.topReason || 'mixed signals, no action needed'}`;
          }
        }

        // Check stop-loss breach
        if (stock.stopLoss && stock.stopLoss > 0 && currentPrice <= stock.stopLoss) {
          holdingAction = 'SELL';
          holdingReason = `⚠️ Stop-loss breached (${stock.stopLoss} EGP) — exit position`;
        }

        // Check target hit
        if (stock.targetPrice && stock.targetPrice > 0 && currentPrice >= stock.targetPrice) {
          holdingAction = 'SELL';
          holdingReason = `🎯 Target price reached (${stock.targetPrice} EGP) — take profits`;
        }

        results.push({
          ticker,
          stockId: stock.id,
          action: holdingAction,
          confidence: decision.decisionConfidence || 0,
          reason: holdingReason,
          currentPrice: Math.round(currentPrice * 100) / 100,
          buyPrice: Math.round(buyPrice * 100) / 100,
          profitPercent: Math.round(profitPercent * 10) / 10,
          quantity: stock.quantity,
          targetPrice: decision.actionCard?.targetPrice || stock.targetPrice || 0,
          stopLoss: decision.actionCard?.stopLoss || stock.stopLoss || 0,
          riskLevel: decision.actionCard?.riskLevel || 'MEDIUM',
          agentDecision: decision.finalDecision
        });
      } catch (stockError) {
        console.error(`[analyze-holdings] Error analyzing ${stock.symbol}:`, stockError);
        results.push({
          ticker: stock.symbol,
          stockId: stock.id,
          action: 'KEEP',
          confidence: 0,
          reason: 'Analysis failed — keeping position',
          currentPrice: stock.currentPrice || 0,
          buyPrice: stock.buyPrice || 0,
          profitPercent: stock.profitPercent || 0,
          error: true
        });
      }
    }

    // Portfolio summary
    const sellCount = results.filter(r => r.action === 'SELL').length;
    const addCount = results.filter(r => r.action === 'ADD').length;
    const keepCount = results.filter(r => r.action === 'KEEP').length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      holdings: results,
      summary: {
        total: results.length,
        sell: sellCount,
        add: addCount,
        keep: keepCount,
        message: sellCount > 0
          ? `${sellCount} stock${sellCount > 1 ? 's' : ''} recommended to sell`
          : 'All holdings look OK for now'
      }
    });
  } catch (error) {
    console.error('[analyze-holdings] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
