import { BaseAgent } from '../core/BaseAgent';
import { RECOMMENDATION_TYPES, AGENT_STATUS } from '../core/AgentTypes';

/**
 * Technical Analysis Agent — Uses REAL indicators from MarketDataAdapter.
 * Analyzes RSI, MACD, moving averages, Bollinger Bands, support/resistance.
 */
export class TechnicalAgent extends BaseAgent {
  constructor() {
    super({ id: 'technical-analysis', displayName: '📉 Technical Analysis', version: '2.0' });
    this.capabilities = ['rsi', 'macd', 'moving-averages', 'bollinger', 'support-resistance'];
  }

  async analyze(context) {
    const { ticker, collectedData } = context;
    const startTime = Date.now();
    const tech = collectedData?.technical || {};

    if (!tech.available) {
      return this.handleError(new Error('No technical data available'));
    }

    try {
      const signals = [];
      let bullPoints = 0;
      let bearPoints = 0;

      // RSI Analysis
      if (tech.rsi != null) {
        signals.push({ label: 'RSI (14)', value: tech.rsi.toFixed(1), zone: tech.rsiZone });
        if (tech.rsi < 30) { bullPoints += 2; } // Oversold bounce potential
        else if (tech.rsi < 45) { bullPoints += 1; } // Approaching from low
        else if (tech.rsi > 70) { bearPoints += 2; } // Overbought
        else if (tech.rsi > 60 && tech.rsi <= 70) { bullPoints += 1; } // Healthy momentum
      }

      // MACD
      if (tech.macdCrossover) {
        signals.push({ label: 'MACD', value: tech.macdCrossover, histogram: tech.macdHistogram?.toFixed(2) });
        if (tech.macdCrossover === 'bullish') bullPoints += 2;
        else if (tech.macdCrossover === 'bearish') bearPoints += 2;
      }

      // Moving Average Alignment
      if (tech.maAlignment) {
        signals.push({ label: 'MA Trend', value: tech.maAlignment });
        if (tech.maAlignment.includes('bullish')) bullPoints += (tech.maAlignment === 'strong-bullish' ? 2 : 1);
        if (tech.maAlignment.includes('bearish')) bearPoints += (tech.maAlignment === 'strong-bearish' ? 2 : 1);
      }

      // Support/Resistance
      if (tech.support && tech.resistance) {
        const price = tech.price;
        const distToSupport = price > 0 ? ((price - tech.support) / price * 100).toFixed(1) : '?';
        const distToResist = price > 0 ? ((tech.resistance - price) / price * 100).toFixed(1) : '?';
        signals.push({ label: 'Support', value: `${tech.support.toFixed(2)} (-${distToSupport}%)` });
        signals.push({ label: 'Resistance', value: `${tech.resistance.toFixed(2)} (+${distToResist}%)` });
      }

      // Bollinger Bands
      if (tech.bollingerBands) {
        const bb = tech.bollingerBands;
        signals.push({ label: 'Bollinger %B', value: bb.percentB?.toFixed(2), width: bb.width?.toFixed(1) + '%' });
        if (bb.percentB < 0.2) bullPoints += 1; // Near lower band
        if (bb.percentB > 0.8) bearPoints += 1; // Near upper band
      }

      const total = bullPoints + bearPoints;
      const recommendation = bullPoints > bearPoints + 1 ? RECOMMENDATION_TYPES.BULLISH
        : bearPoints > bullPoints + 1 ? RECOMMENDATION_TYPES.BEARISH
        : RECOMMENDATION_TYPES.NEUTRAL;

      const confidence = total > 0
        ? Math.min(90, Math.round((Math.abs(bullPoints - bearPoints) / total) * 70 + 30))
        : 40;

      const risks = [];
      const opportunities = [];
      if (tech.rsiZone === 'overbought') risks.push('RSI in overbought territory — pullback risk');
      if (tech.rsiZone === 'oversold') opportunities.push('RSI oversold — potential bounce');
      if (tech.macdCrossover === 'bearish') risks.push('MACD bearish crossover — downward momentum');
      if (tech.macdCrossover === 'bullish') opportunities.push('MACD bullish crossover — upward momentum');
      if (tech.maAlignment?.includes('bearish')) risks.push(`Moving averages in ${tech.maAlignment} alignment`);
      if (tech.maAlignment?.includes('bullish')) opportunities.push(`Moving averages in ${tech.maAlignment} alignment`);

      return this.normalize({
        recommendation,
        confidence,
        summary: `Technical setup: RSI ${tech.rsi?.toFixed(0) || '?'}, MACD ${tech.macdCrossover || '?'}, MA ${tech.maAlignment || '?'}. Price at ${tech.price?.toFixed(2)} EGP.`,
        signals,
        risks: risks.length > 0 ? risks : ['Reversal from current levels possible'],
        opportunities: opportunities.length > 0 ? opportunities : ['Price holding above key support'],
        evidence: { rsi: tech.rsi, macd: tech.macd, maAlignment: tech.maAlignment, support: tech.support, resistance: tech.resistance, source: tech.source },
        assumptions: ['Technical indicators computed from 6-month daily OHLCV', `Data source: ${tech.source}`],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Momentum & Volume Agent — Analyzes price momentum across timeframes and volume patterns.
 * Uses REAL data: weekly/monthly/quarterly returns, volume ratio, accumulation/distribution.
 */
export class MomentumAgent extends BaseAgent {
  constructor() {
    super({ id: 'momentum-volume', displayName: '🚀 Momentum & Volume', version: '2.0' });
    this.capabilities = ['price-momentum', 'volume-analysis', 'trend-strength'];
  }

  async analyze(context) {
    const { ticker, collectedData } = context;
    const startTime = Date.now();
    const tech = collectedData?.technical || {};

    if (!tech.available) {
      return this.handleError(new Error('No market data available'));
    }

    try {
      const signals = [];
      let bullPoints = 0;
      let bearPoints = 0;

      // Multi-timeframe momentum
      if (tech.dailyChangePercent != null) {
        signals.push({ label: 'Today', value: `${tech.dailyChangePercent > 0 ? '+' : ''}${tech.dailyChangePercent.toFixed(2)}%` });
      }
      if (tech.weekChange != null) {
        signals.push({ label: '1 Week', value: `${tech.weekChange > 0 ? '+' : ''}${tech.weekChange.toFixed(2)}%` });
        if (tech.weekChange > 5) bullPoints += 2;
        else if (tech.weekChange > 2) bullPoints += 1;
        else if (tech.weekChange < -5) bearPoints += 2;
        else if (tech.weekChange < -2) bearPoints += 1;
      }
      if (tech.monthChange != null) {
        signals.push({ label: '1 Month', value: `${tech.monthChange > 0 ? '+' : ''}${tech.monthChange.toFixed(2)}%` });
        if (tech.monthChange > 10) bullPoints += 2;
        else if (tech.monthChange > 3) bullPoints += 1;
        else if (tech.monthChange < -10) bearPoints += 2;
        else if (tech.monthChange < -3) bearPoints += 1;
      }
      if (tech.threeMonthChange != null) {
        signals.push({ label: '3 Months', value: `${tech.threeMonthChange > 0 ? '+' : ''}${tech.threeMonthChange.toFixed(2)}%` });
        if (tech.threeMonthChange > 20) bullPoints += 1;
        else if (tech.threeMonthChange < -20) bearPoints += 1;
      }

      // Trend consistency
      const trendConsistent = tech.weekChange > 0 && tech.monthChange > 0 && tech.threeMonthChange > 0;
      const downTrendConsistent = tech.weekChange < 0 && tech.monthChange < 0 && tech.threeMonthChange < 0;
      if (trendConsistent) { bullPoints += 1; signals.push({ label: 'Trend', value: 'Consistent uptrend ✅' }); }
      if (downTrendConsistent) { bearPoints += 1; signals.push({ label: 'Trend', value: 'Consistent downtrend ⚠️' }); }

      // Volume analysis
      const vol = tech.volume || {};
      if (vol.ratio) {
        signals.push({ label: 'Volume Ratio', value: `${vol.ratio.toFixed(1)}x avg` });
        if (vol.ratio > 2.0) {
          signals.push({ label: 'Volume Signal', value: 'Breakout volume 🔥' });
          bullPoints += 1;
        }
      }
      if (vol.accumulation) { bullPoints += 1; signals.push({ label: 'Pattern', value: 'Accumulation (high vol + price up)' }); }
      if (vol.distribution) { bearPoints += 1; signals.push({ label: 'Pattern', value: 'Distribution (high vol + price down)' }); }

      // Liquidity check
      if (vol.avg20 > 0 && vol.avg20 < 50000) {
        signals.push({ label: 'Liquidity', value: 'Low ⚠️' });
      }

      const total = bullPoints + bearPoints;
      const recommendation = bullPoints > bearPoints + 1 ? RECOMMENDATION_TYPES.BULLISH
        : bearPoints > bullPoints + 1 ? RECOMMENDATION_TYPES.BEARISH
        : RECOMMENDATION_TYPES.NEUTRAL;

      const confidence = total > 0
        ? Math.min(85, Math.round((Math.abs(bullPoints - bearPoints) / total) * 65 + 30))
        : 40;

      const risks = [];
      const opportunities = [];
      if (downTrendConsistent) risks.push('Consistent downtrend across all timeframes');
      if (vol.distribution) risks.push('Distribution pattern — institutions may be selling');
      if (trendConsistent) opportunities.push('Strong multi-timeframe uptrend');
      if (vol.accumulation) opportunities.push('Accumulation pattern — smart money buying signal');

      return this.normalize({
        recommendation,
        confidence,
        summary: `${ticker} shows ${trendConsistent ? 'consistent uptrend' : downTrendConsistent ? 'consistent downtrend' : 'mixed momentum'}. Volume ${vol.ratio?.toFixed(1) || '?'}x average.`,
        signals,
        risks: risks.length > 0 ? risks : ['Momentum could reverse'],
        opportunities: opportunities.length > 0 ? opportunities : ['Potential trend continuation'],
        evidence: { weekChange: tech.weekChange, monthChange: tech.monthChange, threeMonthChange: tech.threeMonthChange, volumeRatio: vol.ratio, source: tech.source },
        assumptions: ['Returns calculated from Yahoo/TradingView daily closes', `Data source: ${tech.source}`],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Value & Fundamentals Agent — Uses REAL P/E from TradingView, market cap, 52W range.
 * No fabricated data — fields are null when unavailable.
 */
export class ValueAgent extends BaseAgent {
  constructor() {
    super({ id: 'value-fundamentals', displayName: '💰 Value & Fundamentals', version: '2.0' });
    this.capabilities = ['pe-ratio', 'market-cap', '52-week-analysis', 'sector'];
  }

  async analyze(context) {
    const { ticker, collectedData } = context;
    const startTime = Date.now();
    const fund = collectedData?.fundamental || {};
    const tech = collectedData?.technical || {};

    try {
      const signals = [];
      let bullPoints = 0;
      let bearPoints = 0;

      // P/E Ratio (from TradingView)
      if (fund.pe != null) {
        signals.push({ label: 'P/E Ratio', value: fund.pe.toFixed(1), source: 'TradingView' });
        // EGX average P/E is roughly 8-15
        if (fund.pe < 8) { bullPoints += 2; signals.push({ label: 'Valuation', value: 'Undervalued vs EGX avg' }); }
        else if (fund.pe < 12) { bullPoints += 1; signals.push({ label: 'Valuation', value: 'Fair value' }); }
        else if (fund.pe > 25) { bearPoints += 2; signals.push({ label: 'Valuation', value: 'Expensive ⚠️' }); }
        else if (fund.pe > 18) { bearPoints += 1; }
      } else {
        signals.push({ label: 'P/E Ratio', value: 'Not available' });
      }

      // Market Cap
      if (fund.marketCap) {
        const capLabel = fund.marketCap >= 50e9 ? `${(fund.marketCap / 1e9).toFixed(1)}B EGP (Large Cap)`
          : fund.marketCap >= 10e9 ? `${(fund.marketCap / 1e9).toFixed(1)}B EGP (Mid Cap)`
          : fund.marketCap >= 1e9 ? `${(fund.marketCap / 1e9).toFixed(1)}B EGP (Small Cap)`
          : `${(fund.marketCap / 1e6).toFixed(0)}M EGP (Micro Cap)`;
        signals.push({ label: 'Market Cap', value: capLabel, source: 'TradingView' });
        // Larger cap = more stable
        if (fund.marketCap > 10e9) bullPoints += 1;
      }

      // Sector
      if (fund.sector && fund.sector !== 'Unknown') {
        signals.push({ label: 'Sector', value: fund.sector, source: 'TradingView' });
      }

      // 52-Week Position
      if (tech.fiftyTwoWeekHigh && tech.fiftyTwoWeekLow && tech.price) {
        const range = tech.fiftyTwoWeekHigh - tech.fiftyTwoWeekLow;
        const position = tech.fiftyTwoWeekPosition;
        signals.push({
          label: '52W Range',
          value: `${tech.fiftyTwoWeekLow?.toFixed(2)} — ${tech.fiftyTwoWeekHigh?.toFixed(2)} (${position}% from low)`,
        });

        if (position != null) {
          if (position < 25) {
            bullPoints += 1; // Near 52W low — potential value
            signals.push({ label: '52W Position', value: 'Near yearly low — potential value entry' });
          } else if (position > 85) {
            bearPoints += 1; // Near 52W high — stretched
            signals.push({ label: '52W Position', value: 'Near yearly high — limited upside' });
          }
        }
      }

      // Volatility as a risk factor
      if (tech.volatility != null) {
        const riskLevel = tech.volatility > 40 ? 'HIGH' : tech.volatility > 25 ? 'MEDIUM' : 'LOW';
        signals.push({ label: 'Risk Level', value: `${riskLevel} (${tech.volatility.toFixed(0)}% annualized vol)` });
        if (tech.volatility > 40) bearPoints += 1;
      }

      // Max drawdown
      if (tech.maxDrawdown != null && tech.maxDrawdown > 25) {
        signals.push({ label: 'Max Drawdown', value: `${tech.maxDrawdown.toFixed(1)}% ⚠️` });
        bearPoints += 1;
      }

      const total = bullPoints + bearPoints;
      const recommendation = bullPoints > bearPoints + 1 ? RECOMMENDATION_TYPES.BULLISH
        : bearPoints > bullPoints + 1 ? RECOMMENDATION_TYPES.BEARISH
        : RECOMMENDATION_TYPES.NEUTRAL;

      const confidence = total > 0
        ? Math.min(80, Math.round((Math.abs(bullPoints - bearPoints) / total) * 60 + 25))
        : 35;

      const risks = [];
      const opportunities = [];
      if (fund.pe > 20) risks.push(`High P/E (${fund.pe?.toFixed(1)}) suggests stock is expensive`);
      if (tech.volatility > 35) risks.push(`High volatility (${tech.volatility?.toFixed(0)}%) increases risk`);
      if (fund.pe && fund.pe < 10) opportunities.push(`Low P/E (${fund.pe.toFixed(1)}) — potential value play`);
      if (tech.fiftyTwoWeekPosition < 30) opportunities.push('Near 52-week low — potential recovery upside');
      if (fund.marketCap > 20e9) opportunities.push('Large cap — institutional grade, more stable');

      return this.normalize({
        recommendation,
        confidence,
        summary: `${ticker}: P/E ${fund.pe?.toFixed(1) || 'N/A'}, ${fund.marketCapTier || 'unknown'} cap, 52W position ${tech.fiftyTwoWeekPosition || '?'}%. ${fund.sector || 'Unknown'} sector.`,
        signals,
        risks: risks.length > 0 ? risks : ['Limited fundamental data for EGX stocks'],
        opportunities: opportunities.length > 0 ? opportunities : ['Further research recommended'],
        evidence: { pe: fund.pe, marketCap: fund.marketCap, sector: fund.sector, fiftyTwoWeekPosition: tech.fiftyTwoWeekPosition, source: fund.source },
        assumptions: ['P/E from TradingView trailing TTM', 'Market cap from TradingView', `Fundamental data source: ${fund.source}`],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * News & Sentiment Agent — Fetches REAL headlines from Google News RSS.
 * Keyword-based sentiment analysis. No fabricated sentiment.
 */
export class NewsAgent extends BaseAgent {
  constructor() {
    super({ id: 'news-sentiment', displayName: '📰 Deep News Research', version: '3.0' });
    this.capabilities = ['multi-source-news', 'llm-news-analysis', 'sentiment-analysis', 'event-detection'];
  }

  async analyze(context) {
    const { ticker, collectedData } = context;
    const startTime = Date.now();
    const news = collectedData?.news || {};

    try {
      const signals = [];
      let bullPoints = 0;
      let bearPoints = 0;

      // Multi-source coverage
      const sources = news.sources || {};
      signals.push({
        label: 'News Coverage',
        value: `${news.count || 0} articles from ${Object.keys(sources).filter(k => sources[k] > 0).length} sources`,
        detail: `EN: ${sources.en || 0}, AR: ${sources.ar || 0}, Sector: ${sources.sector || 0}`,
      });

      if (news.recentCount != null) {
        signals.push({ label: 'Last 7 Days', value: `${news.recentCount} articles` });
        if (news.recentCount > 10) { bullPoints += 1; } // High attention
        if (news.recentCount === 0) { bearPoints += 1; } // No coverage
      }

      // Keyword-based sentiment
      if (news.count > 0) {
        const breakdown = news.sentimentBreakdown || {};
        signals.push({
          label: 'Keyword Sentiment',
          value: news.sentiment || 'neutral',
          score: news.sentimentScore?.toFixed(2),
          detail: `+${breakdown.positive || 0} positive / -${breakdown.negative || 0} negative / ${breakdown.neutral || 0} neutral`,
        });

        if (news.sentimentScore > 0.3) { bullPoints += 2; }
        else if (news.sentimentScore > 0.1) { bullPoints += 1; }
        else if (news.sentimentScore < -0.3) { bearPoints += 2; }
        else if (news.sentimentScore < -0.1) { bearPoints += 1; }
      }

      // LLM-generated deep insights
      const llm = news.llmInsights;
      if (llm) {
        signals.push({
          label: 'AI News Analysis',
          value: llm.sentiment || 'neutral',
          impact: llm.impactLevel || 'medium',
        });

        if (llm.summary) {
          signals.push({ label: 'News Summary', value: llm.summary });
        }

        // Key events
        if (llm.keyEvents?.length > 0) {
          llm.keyEvents.forEach((event, i) => {
            signals.push({ label: `Key Event ${i + 1}`, value: event });
          });
        }

        // LLM sentiment weighting (stronger than keyword)
        if (llm.sentiment === 'bullish') { bullPoints += 3; }
        else if (llm.sentiment === 'bearish') { bearPoints += 3; }
        else if (llm.sentiment === 'mixed') { bullPoints += 1; bearPoints += 1; }

        if (llm.impactLevel === 'high') {
          if (llm.sentiment === 'bullish') bullPoints += 1;
          if (llm.sentiment === 'bearish') bearPoints += 1;
        }
      }

      // News categories analysis
      const categories = news.categories || {};
      if (categories.earnings?.length > 0) {
        signals.push({ label: 'Earnings News', value: `${categories.earnings.length} articles`, category: 'earnings' });
      }
      if (categories.deals?.length > 0) {
        signals.push({ label: 'Deals & Partnerships', value: `${categories.deals.length} articles`, category: 'deals' });
        bullPoints += 1; // Deals are generally positive
      }
      if (categories.regulatory?.length > 0) {
        signals.push({ label: 'Regulatory News', value: `${categories.regulatory.length} articles`, category: 'regulatory' });
      }
      if (categories.management?.length > 0) {
        signals.push({ label: 'Management Changes', value: `${categories.management.length} articles`, category: 'management' });
      }

      // Top headlines as signals
      const topHeadlines = (news.headlines || []).filter(h => !h.isGeneral).slice(0, 5);
      topHeadlines.forEach((h, i) => {
        signals.push({
          label: `${h.lang === 'ar' ? '🇪🇬' : '🌍'} Headline`,
          value: h.title.length > 100 ? h.title.substring(0, 100) + '...' : h.title,
          date: h.date,
          source: h.source,
        });
      });

      const recommendation = bullPoints > bearPoints + 2 ? RECOMMENDATION_TYPES.BULLISH
        : bearPoints > bullPoints + 2 ? RECOMMENDATION_TYPES.BEARISH
        : RECOMMENDATION_TYPES.NEUTRAL;

      const confidence = llm
        ? Math.min(80, Math.round(Math.abs(news.sentimentScore || 0) * 40 + 35))
        : news.count > 0
          ? Math.min(60, Math.round(Math.abs(news.sentimentScore || 0) * 40 + 20))
          : 15;

      const risks = [];
      const opportunities = [];

      // From LLM insights
      if (llm?.risks) risks.push(...llm.risks);
      if (llm?.opportunities) opportunities.push(...llm.opportunities);

      // Fallback signals
      if (news.sentiment === 'negative' && risks.length === 0) risks.push('Negative news coverage — sentiment headwinds');
      if (news.count === 0) risks.push('No recent news coverage — limited market visibility');
      if (news.sentiment === 'positive' && opportunities.length === 0) opportunities.push('Positive news coverage — sentiment tailwind');
      if (news.recentCount > 10) opportunities.push('High media attention — potential catalyst forming');

      return this.normalize({
        recommendation,
        confidence,
        summary: llm?.summary || `${news.count} news articles from ${Object.keys(sources).filter(k => sources[k] > 0).length} sources. Sentiment: ${news.sentiment || 'neutral'} (score: ${news.sentimentScore?.toFixed(2) || '0'}). ${news.recentCount || 0} articles in last 7 days.`,
        signals,
        risks: risks.length > 0 ? risks : ['News sentiment can shift rapidly'],
        opportunities: opportunities.length > 0 ? opportunities : ['Monitor for emerging catalysts'],
        evidence: {
          articleCount: news.count,
          recentCount: news.recentCount,
          sources: news.sources,
          sentiment: news.sentiment,
          sentimentScore: news.sentimentScore,
          sentimentBreakdown: news.sentimentBreakdown,
          llmSentiment: llm?.sentiment || null,
          llmImpact: llm?.impactLevel || null,
          keyEvents: llm?.keyEvents || [],
          categories: Object.fromEntries(
            Object.entries(categories).filter(([, v]) => v.length > 0).map(([k, v]) => [k, v.length])
          ),
          topHeadlines: topHeadlines.map(h => ({ title: h.title, lang: h.lang, date: h.date })),
        },
        assumptions: [
          'Headlines from Google News RSS (EN + AR)',
          llm ? 'Deep analysis via LLM (GPT-based)' : 'Keyword-based sentiment only (no LLM)',
          'Sector news included for broader context',
        ],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export all 4 agents
export {
  TechnicalAgent,
  MomentumAgent,
  ValueAgent,
  NewsAgent,
};
