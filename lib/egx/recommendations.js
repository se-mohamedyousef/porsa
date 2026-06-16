import { StockScorer } from '@/lib/agents/v2/core/StockScorer';
import { DataCollector } from '@/lib/agents/v2/core/DataCollector';

/**
 * Smart recommendation engine v3.
 * Scores all EGX stocks using multi-factor analysis on real data.
 * Returns top picks ranked by composite score with real evidence.
 */

// Category assignment based on which factor is strongest
function assignCategory(factors) {
  if (!factors) return 'General';
  const scores = {
    'Value Pick': factors.risk?.score || 0,
    'Strong Momentum': factors.momentum?.score || 0,
    'Technical Breakout': factors.technical?.score || 0,
  };
  // Find highest factor
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] > 65) return best[0];
  return 'Balanced';
}

/**
 * Build smart recommendations from pre-scraped stock data.
 * @param {Array} stocks — output of scrapeEgxStocks (enriched with technicals)
 * @returns {Object} recommendation payload with scored picks
 */
export function buildEgxRecommendationsPayload(stocks) {
  if (!stocks?.length) {
    return {
      timestamp: new Date().toISOString(),
      stocks_analyzed: 0,
      recommendations: {
        short_term_buy: [],
        short_term_sell: [],
        long_term_buy: [],
        scored_picks: [],
        market_analysis: 'No live listings returned from the scanner.',
      },
    };
  }

  const advancers = stocks.filter(s => s.change > 0).length;
  const decliners = stocks.filter(s => s.change < 0).length;
  const unchanged = stocks.length - advancers - decliners;

  // Score all stocks that have enough data
  const scoredStocks = [];

  for (const s of stocks) {
    // Filter: need price, volume, and some history
    if (!s.price || s.price <= 0) continue;
    const vol = typeof s.volume === 'number' ? s.volume : 0;
    if (vol < 50000) continue; // Skip very low volume stocks

    // Build a mock "collected data" from scraper data for scoring
    const collectedData = {
      ticker: s.symbol,
      technical: {
        available: true,
        source: s.source || 'tradingview',
        price: s.price,
        dailyChangePercent: s.change || 0,
        weekChange: null, // Not available from single scrape
        monthChange: null,
        threeMonthChange: null,
        rsi: s.rsi_14 || null,
        rsiZone: s.rsi_14 ? (s.rsi_14 > 70 ? 'overbought' : s.rsi_14 < 30 ? 'oversold' : s.rsi_14 > 60 ? 'bullish' : s.rsi_14 < 40 ? 'bearish' : 'neutral') : null,
        macd: s.macd?.macd || null,
        macdSignal: s.macd?.signal || null,
        macdHistogram: s.macd ? (s.macd.macd - s.macd.signal) : null,
        macdCrossover: s.macd ? (s.macd.macd > s.macd.signal ? 'bullish' : 'bearish') : null,
        ma20: s.sma_20 || null,
        ma50: s.sma_50 || null,
        ma200: s.sma_200 || null,
        maAlignment: s.sma_20 && s.price > s.sma_20 ? (s.sma_50 && s.sma_20 > s.sma_50 ? 'bullish' : 'mild-bullish') : s.sma_20 && s.price < s.sma_20 ? 'bearish' : 'neutral',
        support: s.week_52_low || s.price * 0.95,
        resistance: s.week_52_high || s.price * 1.10,
        bollingerBands: s.bollinger_bands || null,
        volume: {
          current: vol,
          avg20: s.avg_volume_30d || vol,
          ratio: s.avg_volume_30d ? vol / s.avg_volume_30d : 1,
          trend: s.avg_volume_30d && vol > s.avg_volume_30d * 1.5 ? 'high' : 'normal',
          accumulation: s.avg_volume_30d && vol > s.avg_volume_30d * 1.2 && s.change > 0,
          distribution: s.avg_volume_30d && vol > s.avg_volume_30d * 1.2 && s.change < 0,
        },
        volatility: 25, // Default when not computed
        maxDrawdown: null,
        fiftyTwoWeekHigh: s.week_52_high || null,
        fiftyTwoWeekLow: s.week_52_low || null,
        fiftyTwoWeekPosition: s.week_52_high && s.week_52_low && s.week_52_high > s.week_52_low
          ? Math.round(((s.price - s.week_52_low) / (s.week_52_high - s.week_52_low)) * 100)
          : null,
      },
      fundamental: {
        source: 'tradingview',
        available: !!s.pe || !!s.market_cap,
        pe: s.pe || null,
        marketCap: s.market_cap || null,
        marketCapTier: s.market_cap ? (s.market_cap > 50e9 ? 'large-cap' : s.market_cap > 10e9 ? 'mid-cap' : s.market_cap > 1e9 ? 'small-cap' : 'micro-cap') : 'unknown',
        sector: s.sector || 'Unknown',
      },
      news: { count: 0, sentiment: 'neutral', sentimentScore: 0 },
    };

    const result = StockScorer.score(collectedData);

    scoredStocks.push({
      symbol: s.symbol,
      name: s.name || s.symbol,
      price: s.price,
      change: s.change,
      volume: vol,
      sector: s.sector || 'Unknown',
      pe: s.pe || null,
      market_cap: s.market_cap || null,
      rsi_14: s.rsi_14 || null,
      sma_20: s.sma_20 || null,
      week_52_high: s.week_52_high || null,
      week_52_low: s.week_52_low || null,
      // Scoring results
      score: result.score,
      category: result.category,
      factors: result.factors,
      topSignals: result.topSignals,
      targets: result.targets,
      tag: assignCategory(result.factors),
    });
  }

  // Sort by score descending
  scoredStocks.sort((a, b) => b.score - a.score);

  // Top 5 scored picks
  const scored_picks = scoredStocks.slice(0, 8);

  // Also generate legacy format for backwards compatibility
  const buyPicks = scored_picks.filter(s => s.category === 'STRONG_BUY' || s.category === 'BUY');
  const short_term_buy = buyPicks.slice(0, 3).map(s => ({
    symbol: s.symbol,
    current_price: s.price,
    sector: s.sector,
    reason: `Score ${s.score}/100 (${s.category}). ${s.topSignals?.map(t => t.text).join('. ') || ''}`,
    target_price: s.targets?.target || s.price * 1.08,
    expected_return_percent: s.targets?.expectedReturn || 8,
    risk: s.targets?.maxRisk ? (Math.abs(s.targets.maxRisk) > 7 ? 'HIGH' : 'MEDIUM') : 'MEDIUM',
    volume: s.volume,
    market_cap: s.market_cap,
    rsi_14: s.rsi_14,
    sma_20: s.sma_20,
    score: s.score,
  }));

  const long_term_buy = scored_picks
    .filter(s => s.score >= 55 && s.pe && s.pe < 15)
    .slice(0, 2)
    .map(s => ({
      symbol: s.symbol,
      current_price: s.price,
      sector: s.sector,
      reason: `Value play: P/E ${s.pe?.toFixed(1)}, Score ${s.score}/100. ${s.topSignals?.map(t => t.text).join('. ') || ''}`,
      target_price: s.targets?.target || s.price * 1.12,
      expected_return_percent: s.targets?.expectedReturn || 12,
      risk: 'LOW',
      volume: s.volume,
      market_cap: s.market_cap,
      rsi_14: s.rsi_14,
      sma_20: s.sma_20,
      score: s.score,
    }));

  const market_analysis = `EGX scan: ${advancers} up, ${decliners} down, ${unchanged} flat (n=${stocks.length}). Top score: ${scored_picks[0]?.score || 0}/100 (${scored_picks[0]?.symbol || '?'}). Stocks scored by technical (40%), momentum (20%), volume (20%), risk (20%).`;

  return {
    timestamp: new Date().toISOString(),
    stocks_analyzed: stocks.length,
    stocks_scored: scoredStocks.length,
    recommendations: {
      short_term_buy,
      short_term_sell: [], // We don't recommend selling stocks you don't own
      long_term_buy,
      scored_picks,
      market_analysis,
    },
  };
}

/**
 * Deep analysis for a small set of tickers (used by recommendations API).
 * Fetches full data from Yahoo + TradingView + Google News per stock.
 */
export async function deepAnalyzeStocks(tickers) {
  const collectedMap = await DataCollector.collectBatch(tickers, 3);
  return StockScorer.rankStocks(collectedMap);
}
