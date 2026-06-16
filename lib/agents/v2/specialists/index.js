import { BaseAgent } from '../core/BaseAgent';
import { RECOMMENDATION_TYPES, AGENT_STATUS } from '../core/AgentTypes';

/**
 * Market Intelligence Agent
 * Analyzes market trends, sector performance, momentum, and volume
 */
export class MarketIntelligenceAgent extends BaseAgent {
  constructor() {
    super({
      id: 'market-intelligence',
      displayName: '📊 Market Intelligence',
      version: '1.0'
    });
    this.capabilities = ['market-trends', 'sector-analysis', 'momentum', 'volume-analysis'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      // Simulated market analysis (replace with real API calls)
      const trends = this.analyzeMarketTrends(ticker, marketData);
      const momentum = this.analyzeMomentum(marketData);
      const volumeSignal = this.analyzeVolume(marketData);

      const signals = [
        { label: 'Trend Direction', value: trends.direction },
        { label: 'Momentum Score', value: momentum.score },
        { label: 'Volume Signal', value: volumeSignal.signal }
      ];

      const recommendation =
        momentum.score > 60 && volumeSignal.bullish
          ? RECOMMENDATION_TYPES.BULLISH
          : momentum.score < 40
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      const confidence =
        momentum.score > 60 && volumeSignal.bullish ? 75 : momentum.score < 40 ? 65 : 50;

      return this.normalize({
        recommendation,
        confidence,
        summary: `Market shows ${trends.direction} trend with ${momentum.score}% momentum`,
        signals,
        risks: ['Market volatility', 'Sector rotation risk'],
        opportunities: ['Breakout potential', 'Volume confirmation'],
        evidence: { trends, momentum, volumeSignal },
        assumptions: ['Market data is current', 'Volume trends are meaningful'],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  analyzeMarketTrends(ticker, marketData) {
    const direction = marketData?.trend > 0 ? 'bullish' : 'bearish';
    return { direction, strength: Math.abs(marketData?.trend || 0) };
  }

  analyzeMomentum(marketData) {
    const score = marketData?.momentum || 50;
    return { score, strength: 'moderate' };
  }

  analyzeVolume(marketData) {
    const bullish = marketData?.volume > 1000000;
    return { signal: bullish ? 'strong' : 'weak', bullish };
  }
}

/**
 * Fundamental Analysis Agent
 * Analyzes financials: P/E, revenue growth, debt, cash flow, valuation
 */
export class FundamentalAnalysisAgent extends BaseAgent {
  constructor() {
    super({
      id: 'fundamental-analysis',
      displayName: '📈 Fundamental Analysis',
      version: '1.0'
    });
    this.capabilities = ['financial-metrics', 'valuation', 'growth-analysis'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      const metrics = this.calculateMetrics(marketData);
      const valuation = this.assessValuation(metrics);
      const growth = this.analyzeGrowth(marketData);

      const signals = [
        { label: 'P/E Ratio', value: metrics.pe?.toFixed(1) || 'N/A' },
        { label: 'Revenue Growth', value: growth.revenueGrowth?.toFixed(1) + '%' },
        { label: 'Debt/Equity', value: metrics.debtEquity?.toFixed(2) || 'N/A' },
        { label: 'Free Cash Flow', value: valuation.fcf ? 'Positive' : 'Negative' }
      ];

      const recommendation =
        valuation.score > 70 && growth.score > 60
          ? RECOMMENDATION_TYPES.BULLISH
          : valuation.score < 40
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      return this.normalize({
        recommendation,
        confidence: valuation.score,
        summary: `Company fundamentals show ${valuation.assessment} valuation with ${growth.assessment} growth`,
        signals,
        risks: ['Valuation concern', 'Growth slowdown', 'High debt levels'],
        opportunities: ['Strong cash flow', 'Earnings expansion'],
        evidence: { metrics, valuation, growth },
        assumptions: [
          'Financial data is accurate',
          'Growth rates are sustainable',
          'Debt ratios are manageable'
        ],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  calculateMetrics(marketData) {
    return {
      pe: marketData?.pe || 20,
      ps: marketData?.ps || 2.5,
      pb: marketData?.pb || 1.2,
      debtEquity: marketData?.debtEquity || 0.5,
      roe: marketData?.roe || 15
    };
  }

  assessValuation(metrics) {
    const score = 100 - Math.min(100, (metrics.pe || 20) * 2);
    return {
      score: Math.max(0, score),
      assessment: score > 70 ? 'attractive' : score < 40 ? 'expensive' : 'fair',
      fcf: true
    };
  }

  analyzeGrowth(marketData) {
    const revenueGrowth = marketData?.revenueGrowth || 8;
    const earningsGrowth = marketData?.earningsGrowth || 12;
    return {
      revenueGrowth,
      earningsGrowth,
      score: Math.min(100, (earningsGrowth * 5)),
      assessment: earningsGrowth > 15 ? 'strong' : 'moderate'
    };
  }
}

/**
 * Technical Analysis Agent
 * Analyzes RSI, MACD, moving averages, support/resistance, entry/exit
 */
export class TechnicalAnalysisAgent extends BaseAgent {
  constructor() {
    super({
      id: 'technical-analysis',
      displayName: '📉 Technical Analysis',
      version: '1.0'
    });
    this.capabilities = ['rsi', 'macd', 'moving-averages', 'support-resistance'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      const rsi = this.calculateRSI(marketData);
      const macd = this.calculateMACD(marketData);
      const moving = this.analyzeMovingAverages(marketData);
      const levels = this.identifyLevels(marketData);

      const signals = [
        { label: 'RSI', value: rsi.toFixed(1) },
        { label: 'MACD', value: macd.bullish ? 'Bullish' : 'Bearish' },
        { label: 'MA Trend', value: moving.trend },
        { label: 'Support', value: levels.support?.toFixed(2) }
      ];

      const recommendation =
        rsi > 60 && macd.bullish && moving.trend === 'up'
          ? RECOMMENDATION_TYPES.BULLISH
          : rsi < 40 && !macd.bullish
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      const confidence = Math.abs(50 - rsi); // Distance from midpoint

      return this.normalize({
        recommendation,
        confidence: Math.min(100, confidence + 20),
        summary: `Technical setup shows ${moving.trend} trend with ${rsi > 60 ? 'overbought' : rsi < 40 ? 'oversold' : 'neutral'} levels`,
        signals,
        risks: ['Reversal risk', 'Resistance at key level'],
        opportunities: ['Breakout setup', 'Support bounce'],
        evidence: { rsi, macd, moving, levels },
        assumptions: ['Price action is meaningful', 'Levels are valid'],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  calculateRSI(marketData) {
    return marketData?.rsi || 50; // 0-100 scale
  }

  calculateMACD(marketData) {
    return {
      value: marketData?.macd || 0,
      bullish: (marketData?.macd || 0) > 0
    };
  }

  analyzeMovingAverages(marketData) {
    const price = marketData?.price || 100;
    const ma20 = marketData?.ma20 || price * 0.98;
    const ma50 = marketData?.ma50 || price * 0.95;
    const trend = price > ma20 && ma20 > ma50 ? 'up' : price < ma20 ? 'down' : 'sideways';
    return { trend, ma20, ma50 };
  }

  identifyLevels(marketData) {
    return {
      resistance: marketData?.price * 1.05,
      support: marketData?.price * 0.95,
      pivot: (marketData?.price * 1.05 + marketData?.price * 0.95) / 2
    };
  }
}

/**
 * News & Sentiment Agent
 * Analyzes financial news, sentiment, social media, earnings
 */
export class NewsSentimentAgent extends BaseAgent {
  constructor() {
    super({
      id: 'news-sentiment',
      displayName: '💬 News & Sentiment',
      version: '1.0'
    });
    this.capabilities = ['sentiment-analysis', 'news-monitoring', 'earnings-events'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      const sentiment = this.analyzeSentiment(marketData);
      const events = this.identifyEvents(marketData);
      const socialSentiment = this.analyzeSocialMedia(marketData);

      const signals = [
        { label: 'Sentiment Score', value: sentiment.score },
        { label: 'News Tone', value: sentiment.tone },
        { label: 'Recent Events', value: events.count },
        { label: 'Social Buzz', value: socialSentiment }
      ];

      const recommendation =
        sentiment.score > 60
          ? RECOMMENDATION_TYPES.BULLISH
          : sentiment.score < 40
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      return this.normalize({
        recommendation,
        confidence: Math.abs(sentiment.score - 50) + 20,
        summary: `Market sentiment is ${sentiment.tone} with ${events.count} recent news events`,
        signals,
        risks: ['Negative news potential', 'Earnings risk'],
        opportunities: ['Positive sentiment building'],
        evidence: { sentiment, events, socialSentiment },
        assumptions: ['News sentiment is current', 'Social data is representative'],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  analyzeSentiment(marketData) {
    const score = (marketData?.sentiment || 0) * 50 + 50; // Normalize to 0-100
    return {
      score: Math.max(0, Math.min(100, score)),
      tone: score > 60 ? 'positive' : score < 40 ? 'negative' : 'neutral'
    };
  }

  identifyEvents(marketData) {
    return {
      count: marketData?.newsCount || 0,
      types: ['earnings', 'product-launch', 'partnership']
    };
  }

  analyzeSocialMedia(marketData) {
    return marketData?.socialBuzz ? 'high' : 'moderate';
  }
}

/**
 * Risk Management Agent
 * Calculates volatility, drawdown, Sharpe ratio, beta, position sizing
 */
export class RiskManagementAgent extends BaseAgent {
  constructor() {
    super({
      id: 'risk-management',
      displayName: '⚠️ Risk Management',
      version: '1.0'
    });
    this.capabilities = ['volatility', 'drawdown', 'sharpe-ratio', 'position-sizing'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      const volatility = this.calculateVolatility(marketData);
      const drawdown = this.estimateDrawdown(marketData);
      const sharpe = this.calculateSharpeRatio(marketData);
      const beta = this.calculateBeta(marketData);
      const positionSize = this.recommendPositionSize(volatility);

      const signals = [
        { label: 'Volatility', value: volatility.toFixed(1) + '%' },
        { label: 'Max Drawdown', value: drawdown.toFixed(1) + '%' },
        { label: 'Sharpe Ratio', value: sharpe.toFixed(2) },
        { label: 'Beta', value: beta.toFixed(2) }
      ];

      const riskLevel =
        volatility > 35
          ? 'HIGH'
          : volatility > 20
          ? 'MEDIUM'
          : 'LOW';

      const recommendation =
        riskLevel === 'LOW'
          ? RECOMMENDATION_TYPES.BULLISH
          : riskLevel === 'HIGH'
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      return this.normalize({
        recommendation,
        confidence: Math.max(40, 100 - volatility),
        summary: `Risk profile is ${riskLevel} with ${volatility.toFixed(1)}% volatility. Position size: ${positionSize}%`,
        signals,
        risks: ['High volatility', 'Drawdown potential', `Max drawdown: ${drawdown.toFixed(1)}%`],
        opportunities: ['Risk/reward attractive', 'Diversification benefit'],
        evidence: { volatility, drawdown, sharpe, beta, positionSize },
        assumptions: ['Historical volatility is predictive', 'Beta is stable'],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  calculateVolatility(marketData) {
    return marketData?.volatility || 20; // Annual volatility percentage
  }

  estimateDrawdown(marketData) {
    return marketData?.maxDrawdown || 15; // Expected max drawdown
  }

  calculateSharpeRatio(marketData) {
    return (marketData?.return || 10) / (marketData?.volatility || 20);
  }

  calculateBeta(marketData) {
    return marketData?.beta || 1.0;
  }

  recommendPositionSize(volatility) {
    // Position size inversely related to volatility
    if (volatility > 35) return 2; // 2% of portfolio
    if (volatility > 20) return 3; // 3% of portfolio
    return 5; // 5% of portfolio
  }
}

/**
 * Insider & Smart Money Agent
 * Tracks insider buying/selling, institutional ownership, smart money flows
 */
export class InsiderSmartMoneyAgent extends BaseAgent {
  constructor() {
    super({
      id: 'insider-smart-money',
      displayName: '🎯 Insider & Smart Money',
      version: '1.0'
    });
    this.capabilities = ['insider-activity', 'institutional-ownership', 'smart-money-flows'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      const insiderActivity = this.analyzeInsiderActivity(marketData);
      const institutional = this.analyzeInstitutional(marketData);
      const smartMoney = this.analyzeSmartMoneyFlows(marketData);

      const signals = [
        { label: 'Insider Buying', value: insiderActivity.buying ? 'Yes' : 'No' },
        { label: 'Institutional %', value: institutional.ownership.toFixed(1) + '%' },
        { label: 'Smart Money', value: smartMoney.trend },
        { label: 'Ownership Trend', value: institutional.trend }
      ];

      const recommendation =
        insiderActivity.buying && smartMoney.bullish
          ? RECOMMENDATION_TYPES.BULLISH
          : insiderActivity.selling && !smartMoney.bullish
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      return this.normalize({
        recommendation,
        confidence: insiderActivity.buying || smartMoney.bullish ? 70 : 50,
        summary: `${insiderActivity.buying ? 'Insider buying' : insiderActivity.selling ? 'Insider selling' : 'No significant insider activity'} with ${smartMoney.trend} smart money flow`,
        signals,
        risks: ['Insider selling pressure', 'Institutional outflow'],
        opportunities: ['Strong insider buying', 'Institutional accumulation'],
        evidence: { insiderActivity, institutional, smartMoney },
        assumptions: ['Insider data is recent', 'Institutional flows are significant'],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  analyzeInsiderActivity(marketData) {
    return {
      buying: (marketData?.insiderBuying || 0) > (marketData?.insiderSelling || 0),
      selling: (marketData?.insiderSelling || 0) > (marketData?.insiderBuying || 0),
      ratio: (marketData?.insiderBuying || 0) / Math.max(1, marketData?.insiderSelling || 1)
    };
  }

  analyzeInstitutional(marketData) {
    return {
      ownership: marketData?.institutionalOwnership || 45,
      trend: marketData?.institutionalTrend || 'stable',
      buyers: marketData?.institutionalBuyers || 0
    };
  }

  analyzeSmartMoneyFlows(marketData) {
    return {
      bullish: (marketData?.smartMoneyFlow || 0) > 0,
      trend: (marketData?.smartMoneyFlow || 0) > 0 ? 'positive' : 'negative',
      volume: Math.abs(marketData?.smartMoneyFlow || 0)
    };
  }
}

/**
 * Macro Economics Agent
 * Analyzes interest rates, inflation, economic indicators, currency impact
 */
export class MacroEconomicsAgent extends BaseAgent {
  constructor() {
    super({
      id: 'macro-economics',
      displayName: '🌍 Macro Economics',
      version: '1.0'
    });
    this.capabilities = ['interest-rates', 'inflation', 'economic-indicators', 'currency-impact'];
  }

  async analyze(context) {
    const { ticker, marketData } = context;
    const startTime = Date.now();

    try {
      const rates = this.analyzeRates(marketData);
      const inflation = this.analyzeInflation(marketData);
      const economicHealth = this.assessEconomicHealth(marketData);
      const currencyImpact = this.analyzeCurrencyImpact(marketData);

      const signals = [
        { label: 'Fed Rate', value: rates.fedRate + '%' },
        { label: 'Inflation', value: inflation.rate.toFixed(1) + '%' },
        { label: 'Economic Health', value: economicHealth.status },
        { label: 'Currency Impact', value: currencyImpact.impact }
      ];

      const macroScore =
        (!rates.rising ? 30 : 0) + (inflation.rate < 3 ? 30 : 0) + (economicHealth.gdp > 2 ? 30 : 0);

      const recommendation =
        macroScore > 70
          ? RECOMMENDATION_TYPES.BULLISH
          : macroScore < 40
          ? RECOMMENDATION_TYPES.BEARISH
          : RECOMMENDATION_TYPES.NEUTRAL;

      return this.normalize({
        recommendation,
        confidence: Math.min(100, Math.abs(macroScore)),
        summary: `Macro environment is ${economicHealth.status} with ${inflation.rate.toFixed(1)}% inflation and ${rates.fedRate}% rates`,
        signals,
        risks: [
          rates.rising ? 'Rising rates' : '',
          inflation.rate > 4 ? 'High inflation' : '',
          economicHealth.gdp < 2 ? 'Slow growth' : ''
        ].filter(Boolean),
        opportunities: [rates.rising ? 'Sector rotation' : '', 'Value opportunities'],
        evidence: { rates, inflation, economicHealth, currencyImpact },
        assumptions: ['Economic data is accurate', 'Trends will continue'],
        latencyMs: Date.now() - startTime,
        status: AGENT_STATUS.SUCCESS
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  analyzeRates(marketData) {
    return {
      fedRate: marketData?.fedRate || 4.5,
      rising: (marketData?.rateDirection || 0) > 0,
      yield10Y: marketData?.yield10Y || 4.2
    };
  }

  analyzeInflation(marketData) {
    return {
      rate: marketData?.inflation || 2.8,
      trend: marketData?.inflationTrend || 'stable'
    };
  }

  assessEconomicHealth(marketData) {
    return {
      gdp: marketData?.gdpGrowth || 2.1,
      status: (marketData?.gdpGrowth || 2) > 2 ? 'strong' : 'moderate',
      unemployment: marketData?.unemployment || 4.0
    };
  }

  analyzeCurrencyImpact(marketData) {
    return {
      usdStrength: marketData?.usdIndex || 100,
      impact: (marketData?.usdIndex || 100) > 102 ? 'negative' : 'positive'
    };
  }
}

export default {
  MarketIntelligenceAgent,
  FundamentalAnalysisAgent,
  TechnicalAnalysisAgent,
  NewsSentimentAgent,
  RiskManagementAgent,
  InsiderSmartMoneyAgent,
  MacroEconomicsAgent
};
