import { BaseAgent } from '../core/BaseAgent';
import { RECOMMENDATION_TYPES, DECISION_TYPES, AGENT_STATUS } from '../core/AgentTypes';
import { StockScorer } from '../core/StockScorer';

/**
 * Investment Decision Agent (Master) v3.0
 * Aggregates specialist findings + real data → LLM-powered synthesis.
 * Falls back to StockScorer heuristic if LLM is unavailable.
 */
export class InvestmentDecisionAgent extends BaseAgent {
  constructor() {
    super({
      id: 'investment-decision',
      displayName: '🎯 Investment Decision',
      version: '3.0'
    });
  }

  async analyze(context) {
    const { ticker, specialistFindings, collectedData, portfolio } = context;
    const startTime = Date.now();

    try {
      const aggregation = this.aggregateFindings(specialistFindings);
      const scorerResult = StockScorer.score(collectedData);
      const tech = collectedData?.technical || {};
      const fund = collectedData?.fundamental || {};
      const news = collectedData?.news || {};

      // Try LLM synthesis for investment thesis
      let llmSynthesis = null;
      try {
        llmSynthesis = await this.callLLMSynthesis(ticker, aggregation, collectedData, scorerResult);
      } catch (e) {
        console.warn('[InvestmentDecisionAgent] LLM synthesis failed, using heuristic:', e.message);
      }

      // Use LLM output if available, else fall back to scorer + heuristic
      const decision = this.makeDecision(aggregation, tech, scorerResult);
      const targets = scorerResult.targets || this.computeFallbackTargets(tech);
      const portfolioWarnings = this.checkPortfolio(ticker, portfolio, tech);

      const investmentThesis = llmSynthesis?.thesis || this.buildHeuristicThesis(aggregation, tech, fund, scorerResult);
      const bullCase = llmSynthesis?.bullCase || this.buildBullCase(aggregation, scorerResult);
      const bearCase = llmSynthesis?.bearCase || this.buildBearCase(aggregation, scorerResult);

      const actionCard = this.buildActionCard(ticker, decision, targets, aggregation, tech, fund, portfolioWarnings, scorerResult);

      return {
        finalDecision: decision.action,
        decisionConfidence: decision.confidence,
        consensusScore: aggregation.consensus,
        executiveSummary: llmSynthesis?.summary || `${decision.action} ${ticker} — Score ${scorerResult.score}/100 (${scorerResult.category}). ${aggregation.breakdown.bullish}/${aggregation.breakdown.total} agents bullish.`,
        bullCase,
        bearCase,
        actionCard,
        targets,
        shortTermOutlook: `${decision.shortTermPotential > 0 ? '+' : ''}${decision.shortTermPotential.toFixed(1)}% within 30 days`,
        longTermOutlook: `${decision.longTermPotential > 0 ? '+' : ''}${decision.longTermPotential.toFixed(1)}% within 6 months`,
        investmentThesis,
        keyRisks: aggregation.topRisks,
        portfolioWarnings,
        scorerResult, // Include scorer details for UI
        dataSources: {
          technical: tech.source || 'none',
          fundamental: fund.source || 'none',
          news: news.source || 'none',
          llm: llmSynthesis ? 'huggingface' : 'fallback-heuristic',
        },
        agentBreakdown: specialistFindings.map(f => ({
          agent: f.displayName,
          recommendation: f.recommendation,
          confidence: f.confidence,
          summary: f.summary
        })),
        consensusBreakdown: aggregation.breakdown,
        timestamp: new Date(),
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      };
    } catch (error) {
      return {
        finalDecision: DECISION_TYPES.HOLD,
        decisionConfidence: 0,
        consensusScore: 0,
        executiveSummary: 'Unable to generate recommendation',
        actionCard: null,
        errors: [error.message],
        status: AGENT_STATUS.FAILED,
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Call LLM for intelligent synthesis of all real data.
   */
  async callLLMSynthesis(ticker, aggregation, collectedData, scorerResult) {
    if (!process.env.HF_TOKEN) return null;

    const tech = collectedData?.technical || {};
    const fund = collectedData?.fundamental || {};
    const news = collectedData?.news || {};

    // Build a structured prompt with ALL real data
    const prompt = `You are an expert EGX (Egyptian Exchange) stock analyst. Analyze ${ticker} using ONLY the real data provided below. Do NOT invent or fabricate any numbers.

## REAL MARKET DATA FOR ${ticker}
- Price: ${tech.price?.toFixed(2) || 'N/A'} EGP
- Daily Change: ${tech.dailyChangePercent?.toFixed(2) || '?'}%
- Weekly: ${tech.weekChange?.toFixed(2) || '?'}% | Monthly: ${tech.monthChange?.toFixed(2) || '?'}% | 3-Month: ${tech.threeMonthChange?.toFixed(2) || '?'}%

## TECHNICAL INDICATORS
- RSI(14): ${tech.rsi?.toFixed(1) || 'N/A'} (Zone: ${tech.rsiZone || '?'})
- MACD: ${tech.macd?.toFixed(2) || '?'} | Signal: ${tech.macdSignal?.toFixed(2) || '?'} | Crossover: ${tech.macdCrossover || '?'}
- MA Alignment: ${tech.maAlignment || '?'}
- Support: ${tech.support?.toFixed(2) || '?'} | Resistance: ${tech.resistance?.toFixed(2) || '?'}
- Volatility: ${tech.volatility?.toFixed(1) || '?'}% | Max Drawdown: ${tech.maxDrawdown?.toFixed(1) || '?'}%
- 52W Range: ${tech.fiftyTwoWeekLow?.toFixed(2) || '?'} — ${tech.fiftyTwoWeekHigh?.toFixed(2) || '?'} (Position: ${tech.fiftyTwoWeekPosition || '?'}%)

## FUNDAMENTALS
- P/E Ratio: ${fund.pe?.toFixed(1) || 'Not available'}
- Market Cap: ${fund.marketCap ? (fund.marketCap / 1e9).toFixed(2) + 'B EGP' : 'Not available'}
- Sector: ${fund.sector || 'Unknown'}

## NEWS (${news.count || 0} articles from ${news.sources ? Object.keys(news.sources).filter(k => news.sources[k] > 0).length : 1} sources)
- Keyword Sentiment: ${news.sentiment || 'neutral'} (Score: ${news.sentimentScore?.toFixed(2) || '0'})
- AI News Sentiment: ${news.llmInsights?.sentiment || 'not analyzed'}${news.llmInsights?.impactLevel ? ` (Impact: ${news.llmInsights.impactLevel})` : ''}
- AI News Summary: ${news.llmInsights?.summary || 'N/A'}
- Key Events: ${news.llmInsights?.keyEvents?.join('; ') || 'None detected'}
- Recent headlines: ${(news.headlines || []).slice(0, 5).map(h => h.title).join(' | ') || 'None'}

## AGENT CONSENSUS
- ${aggregation.breakdown.bullish}/${aggregation.breakdown.total} bullish, ${aggregation.breakdown.bearish}/${aggregation.breakdown.total} bearish
- Composite Score: ${scorerResult.score}/100 (${scorerResult.category})

Respond in this exact JSON format (no markdown, no explanation outside JSON):
{
  "summary": "1-2 sentence executive summary",
  "thesis": "2-3 sentence investment thesis explaining why to buy/hold/sell",
  "bullCase": "2-3 sentences on why the stock could go up",
  "bearCase": "2-3 sentences on risks and why it could go down"
}`;

    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b:fireworks-ai',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          max_tokens: 512,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || null,
          thesis: parsed.thesis || null,
          bullCase: parsed.bullCase || null,
          bearCase: parsed.bearCase || null,
        };
      }
    } catch (e) {
      console.warn('[InvestmentDecisionAgent] LLM call failed:', e.message);
    }
    return null;
  }

  /**
   * Aggregate findings from all specialist agents
   */
  aggregateFindings(findings) {
    const recommendations = {
      [RECOMMENDATION_TYPES.BULLISH]: 0,
      [RECOMMENDATION_TYPES.NEUTRAL]: 0,
      [RECOMMENDATION_TYPES.BEARISH]: 0
    };

    const confidences = [];
    const allRisks = [];
    const allOpportunities = [];

    findings.forEach(f => {
      if (f.recommendation) recommendations[f.recommendation]++;
      confidences.push(f.confidence || 50);
      allRisks.push(...(f.risks || []));
      allOpportunities.push(...(f.opportunities || []));
    });

    const total = findings.length;
    const bullCount = recommendations[RECOMMENDATION_TYPES.BULLISH];
    const bearCount = recommendations[RECOMMENDATION_TYPES.BEARISH];
    const neutralCount = recommendations[RECOMMENDATION_TYPES.NEUTRAL];

    const consensus = total > 0 ? (Math.max(bullCount, neutralCount, bearCount) / total) * 100 : 0;
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / Math.max(1, confidences.length);
    const conflictPenalty = consensus < 60 ? 10 : 0;
    const weightedConfidence = Math.max(0, Math.min(100, avgConfidence - conflictPenalty));

    return {
      breakdown: { bullish: bullCount, neutral: neutralCount, bearish: bearCount, total },
      bullScore: total > 0 ? bullCount / total : 0,
      bearScore: total > 0 ? bearCount / total : 0,
      avgConfidence,
      weightedConfidence,
      consensus,
      topRisks: this.deduplicateAndRank(allRisks).slice(0, 5),
      topOpportunities: this.deduplicateAndRank(allOpportunities).slice(0, 3)
    };
  }

  /**
   * Make decision based on agent consensus + scorer
   */
  makeDecision(aggregation, tech, scorerResult) {
    const { bullScore, bearScore, weightedConfidence } = aggregation;
    const score = scorerResult.score;

    // Combine agent consensus with scorer
    let action = DECISION_TYPES.HOLD;
    let confidence = weightedConfidence;

    // Weight both signals: agent consensus (60%) + scorer (40%)
    const combinedBull = bullScore * 0.6 + (score >= 60 ? 0.4 : score >= 45 ? 0.2 : 0);
    const combinedBear = bearScore * 0.6 + (score < 30 ? 0.4 : score < 45 ? 0.2 : 0);

    if (combinedBull > 0.5) {
      action = DECISION_TYPES.BUY;
      confidence = Math.round(Math.min(100, score * 0.5 + weightedConfidence * 0.5));
    } else if (combinedBear > 0.45) {
      action = DECISION_TYPES.SELL;
      confidence = Math.round(Math.min(100, (100 - score) * 0.5 + weightedConfidence * 0.5));
    }

    confidence = Math.min(100, Math.max(0, confidence));

    // Potential calculations
    const volatility = tech.volatility || 25;
    const rsi = tech.rsi || 50;
    const momentumFactor = action === DECISION_TYPES.BUY
      ? Math.max(0.5, (100 - rsi) / 50)
      : action === DECISION_TYPES.SELL
        ? Math.max(0.5, rsi / 50)
        : 0;

    const shortTermPotential = action === DECISION_TYPES.BUY
      ? Math.round(volatility * 0.3 * momentumFactor * 10) / 10
      : action === DECISION_TYPES.SELL
        ? -Math.round(volatility * 0.25 * momentumFactor * 10) / 10
        : 0;

    const longTermPotential = action === DECISION_TYPES.BUY
      ? Math.round(volatility * 0.8 * momentumFactor * 10) / 10
      : action === DECISION_TYPES.SELL
        ? -Math.round(volatility * 0.6 * momentumFactor * 10) / 10
        : 0;

    return { action, confidence, shortTermPotential, longTermPotential };
  }

  /**
   * Build actionable ActionCard
   */
  buildActionCard(ticker, decision, targets, aggregation, tech, fund, portfolioWarnings, scorerResult) {
    const price = tech.price || 0;
    const volatility = tech.volatility || 25;

    const expectedReturn = targets?.expectedReturn || 0;
    const maxRisk = targets?.maxRisk || 0;

    let positionSizeAdvice;
    if (volatility > 35) positionSizeAdvice = '2-3% of portfolio (high risk)';
    else if (volatility > 20) positionSizeAdvice = '3-5% of portfolio';
    else positionSizeAdvice = '5-10% of portfolio';

    if (portfolioWarnings.length > 0) {
      positionSizeAdvice += ' (reduce — already held)';
    }

    const riskLevel = volatility > 35 ? 'HIGH' : volatility > 20 ? 'MEDIUM' : 'LOW';

    return {
      action: decision.action,
      confidence: decision.confidence,
      ticker,
      stockName: tech.name || ticker,
      currentPrice: Math.round(price * 100) / 100,
      entryPrice: targets?.entry || Math.round(price * 100) / 100,
      targetPrice: targets?.target || Math.round(price * 1.1 * 100) / 100,
      stopLoss: targets?.stop || Math.round(price * 0.95 * 100) / 100,
      expectedReturn,
      maxRisk,
      riskReward: targets?.riskReward || 0,
      positionSizeAdvice,
      timeframe: targets?.timeframe || '1-3 months',
      topReason: scorerResult.topSignals?.[0]?.text || `Score ${scorerResult.score}/100`,
      bullPoints: aggregation.topOpportunities.slice(0, 3),
      bearPoints: aggregation.topRisks.slice(0, 3),
      riskLevel,
      consensusScore: Math.round(aggregation.consensus),
      score: scorerResult.score,
      category: scorerResult.category,
      pe: fund.pe || null,
      sector: fund.sector || 'Unknown',
    };
  }

  // ── Fallback heuristic methods (when LLM unavailable) ──

  buildHeuristicThesis(aggregation, tech, fund, scorerResult) {
    const { breakdown } = aggregation;
    const majorityView = aggregation.bullScore > aggregation.bearScore ? 'bullish' : aggregation.bearScore > aggregation.bullScore ? 'bearish' : 'neutral';
    let thesis = `Analysis by ${breakdown.total} agents shows ${majorityView} outlook. Composite score: ${scorerResult.score}/100 (${scorerResult.category}).`;
    if (tech.price) thesis += ` Current price: ${tech.price.toFixed(2)} EGP.`;
    if (tech.rsi) thesis += ` RSI: ${tech.rsi.toFixed(0)}.`;
    if (fund.pe) thesis += ` P/E: ${fund.pe.toFixed(1)}.`;
    return thesis;
  }

  buildBullCase(aggregation, scorerResult) {
    const reasons = [
      `${aggregation.breakdown.bullish} of ${aggregation.breakdown.total} agents bullish`,
      ...aggregation.topOpportunities.slice(0, 3),
      ...(scorerResult?.topSignals || []).filter(s => !s.text.includes('⚠️')).slice(0, 2).map(s => s.text),
    ].filter(Boolean);
    return reasons.join('. ') + '.';
  }

  buildBearCase(aggregation, scorerResult) {
    const reasons = [
      aggregation.breakdown.bearish > 0
        ? `${aggregation.breakdown.bearish} of ${aggregation.breakdown.total} agents bearish`
        : 'Limited bullish conviction across agents',
      ...aggregation.topRisks.slice(0, 3),
      ...(scorerResult?.topSignals || []).filter(s => s.text.includes('⚠️')).slice(0, 2).map(s => s.text),
    ].filter(Boolean);
    return reasons.join('. ') + '.';
  }

  computeFallbackTargets(tech) {
    const price = tech.price || 0;
    if (!price) return { entry: 0, target: 0, stop: 0, horizon: 'N/A' };
    return {
      entry: Math.round(price * 100) / 100,
      target: Math.round(price * 1.10 * 100) / 100,
      stop: Math.round(price * 0.95 * 100) / 100,
      expectedReturn: 10,
      maxRisk: -5,
      riskReward: 2,
      timeframe: '1-3 months',
    };
  }

  checkPortfolio(ticker, portfolio = [], tech) {
    const warnings = [];
    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) return warnings;

    const existingPosition = portfolio.find(s => s.symbol?.toUpperCase() === ticker.toUpperCase());

    if (existingPosition) {
      const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice || 0) * (s.quantity || 0), 0);
      const positionValue = (existingPosition.currentPrice || 0) * (existingPosition.quantity || 0);
      const weight = totalValue > 0 ? (positionValue / totalValue) * 100 : 0;

      if (weight > 25) {
        warnings.push(`⚠️ Already ${weight.toFixed(0)}% of your portfolio — high concentration risk`);
      } else if (weight > 15) {
        warnings.push(`ℹ️ Already ${weight.toFixed(0)}% of your portfolio — consider position size`);
      } else {
        warnings.push(`You already hold ${existingPosition.quantity} shares at avg ${existingPosition.buyPrice} EGP`);
      }

      const pnl = existingPosition.profitPercent || 0;
      if (pnl < -15) {
        warnings.push(`📉 Current position down ${Math.abs(pnl).toFixed(1)}% — assess if adding is averaging down or conviction`);
      } else if (pnl > 30) {
        warnings.push(`📈 Current position up ${pnl.toFixed(1)}% — consider taking partial profits`);
      }
    }

    return warnings;
  }

  deduplicateAndRank(items) {
    const counts = {};
    items.forEach(item => {
      if (item) counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);
  }
}

export default InvestmentDecisionAgent;
