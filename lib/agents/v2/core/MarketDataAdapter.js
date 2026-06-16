import { fetchYahooEgxChart } from '@/lib/egx/yahooChart';

/**
 * MarketDataAdapter
 * Transforms raw Yahoo Finance OHLCV data into the structured format
 * that specialist agents expect. Computes technical indicators from price history.
 * Falls back to TradingView via /api/stock-price when Yahoo is rate-limited.
 */
export class MarketDataAdapter {
  /**
   * Fetch and transform real market data for a ticker
   * @param {string} ticker - EGX stock ticker
   * @param {string} [baseUrl] - Base URL for internal API calls (server-side)
   * @returns {object} Structured market data for agents
   */
  static async fetchMarketContext(ticker, baseUrl) {
    try {
      // Fetch 6 months of daily data for technical analysis
      const chartData = await fetchYahooEgxChart(ticker, '6mo', '1d');

      if (chartData && chartData.history && chartData.history.length > 0) {
        return this.buildFromChartData(ticker, chartData);
      }

      // Yahoo failed — try shorter range
      const shortChart = await fetchYahooEgxChart(ticker, '3mo', '1d');
      if (shortChart && shortChart.history && shortChart.history.length > 0) {
        return this.buildFromChartData(ticker, shortChart);
      }

      // Yahoo completely unavailable — get at least current price via TradingView
      console.warn(`[MarketDataAdapter] Yahoo unavailable for ${ticker}, trying TradingView`);
      const tvData = await this.fetchTradingViewPrice(ticker, baseUrl);
      if (tvData) {
        return this.buildFromTradingView(ticker, tvData);
      }

      console.warn(`[MarketDataAdapter] All sources failed for ${ticker}, using minimal context`);
      return this.buildMinimalContext(ticker, chartData?.meta || shortChart?.meta);
    } catch (error) {
      console.error(`[MarketDataAdapter] Error fetching data for ${ticker}:`, error);
      return this.buildMinimalContext(ticker);
    }
  }

  /**
   * Fetch price from TradingView via internal API or direct import
   */
  static async fetchTradingViewPrice(ticker, baseUrl) {
    try {
      // Try direct import of TradingView fetcher (works server-side)
      const { fetchTradingViewEgxQuote } = await import('@/lib/scraper/egx');
      const quote = await fetchTradingViewEgxQuote(ticker);
      if (quote?.price) {
        return {
          price: Number(quote.price),
          changePercent: Number(quote.change) || 0,
          volume: Number(quote.volume) || 0,
        };
      }
    } catch (e) {
      console.warn(`[MarketDataAdapter] TradingView direct fetch failed for ${ticker}:`, e.message);
    }
    return null;
  }

  /**
   * Build full context from Yahoo chart data with OHLCV history
   */
  static buildFromChartData(ticker, chartData) {
      const { meta, history } = chartData;
      const closes = history.map(bar => bar.close);
      const volumes = history.map(bar => bar.volume);
      const highs = history.map(bar => bar.high);
      const lows = history.map(bar => bar.low);

      const currentPrice = meta?.regularMarketPrice || closes[closes.length - 1];
      const prevClose = meta?.chartPreviousClose || closes[closes.length - 2] || currentPrice;

      // Compute technical indicators
      const rsi = this.computeRSI(closes, 14);
      const macdResult = this.computeMACD(closes);
      const ma20 = this.computeSMA(closes, 20);
      const ma50 = this.computeSMA(closes, 50);
      const ma200 = this.computeSMA(closes, 200);
      const volatility = this.computeVolatility(closes, 30);
      const avgVolume = this.computeAverage(volumes.slice(-20));
      const currentVolume = volumes[volumes.length - 1] || 0;
      const support = this.computeSupport(lows.slice(-30));
      const resistance = this.computeResistance(highs.slice(-30));
      const maxDrawdown = this.computeMaxDrawdown(closes);

      // Price change metrics
      const dailyChange = currentPrice - prevClose;
      const dailyChangePercent = prevClose > 0 ? (dailyChange / prevClose) * 100 : 0;
      const weekAgoPrice = closes[Math.max(0, closes.length - 6)] || currentPrice;
      const monthAgoPrice = closes[Math.max(0, closes.length - 22)] || currentPrice;
      const threeMonthAgoPrice = closes[Math.max(0, closes.length - 66)] || currentPrice;

      // Trend detection
      const shortTrend = currentPrice > ma20 ? 1 : -1;
      const mediumTrend = ma20 > ma50 ? 1 : -1;
      const trend = shortTrend + mediumTrend > 0 ? 1 : -1;

      return {
        ticker,
        price: currentPrice,
        prevClose,
        dailyChange,
        dailyChangePercent,
        weekChange: prevClose > 0 ? ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100 : 0,
        monthChange: monthAgoPrice > 0 ? ((currentPrice - monthAgoPrice) / monthAgoPrice) * 100 : 0,
        threeMonthChange: threeMonthAgoPrice > 0 ? ((currentPrice - threeMonthAgoPrice) / threeMonthAgoPrice) * 100 : 0,

        // Yahoo meta
        fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh || Math.max(...highs),
        fiftyTwoWeekLow: meta?.fiftyTwoWeekLow || Math.min(...lows),
        marketCap: meta?.marketCap || null,
        name: meta?.longName || meta?.shortName || ticker,

        // Trend & momentum
        trend,
        momentum: rsi, // RSI as momentum proxy (0-100)

        // Technical indicators
        rsi,
        macd: macdResult.macd,
        macdSignal: macdResult.signal,
        macdHistogram: macdResult.histogram,
        ma20,
        ma50,
        ma200,
        support,
        resistance,

        // Volume
        volume: currentVolume,
        avgVolume,
        volumeRatio: avgVolume > 0 ? currentVolume / avgVolume : 1,

        // Risk metrics
        volatility,
        maxDrawdown,
        beta: 1.0, // Would need market index comparison for real beta

        // Valuation proxies (Yahoo doesn't provide fundamentals reliably)
        pe: meta?.trailingPE || null,
        ps: null,
        pb: null,
        debtEquity: null,
        roe: null,
        revenueGrowth: null,
        earningsGrowth: null,

        // Sentiment proxies (derived from price action)
        sentiment: dailyChangePercent > 1 ? 0.3 : dailyChangePercent < -1 ? -0.3 : 0,
        newsCount: 0,
        socialBuzz: false,

        // Macro defaults (EGX-specific)
        fedRate: 27.25, // CBE rate
        inflation: 13.5,
        gdpGrowth: 3.8,
        usdIndex: 50.5, // EGP/USD approximate

        // Insider proxies
        insiderBuying: 0,
        insiderSelling: 0,
        institutionalOwnership: null,
        institutionalTrend: 'stable',
        smartMoneyFlow: currentVolume > avgVolume * 1.5 && dailyChangePercent > 0 ? 0.3 : -0.1,

        // Raw data for advanced analysis
        _history: history.slice(-60), // Last 60 bars
        _source: 'yahoo-finance',
        _fetchedAt: new Date().toISOString()
      };
  }

  /**
   * Build context from TradingView data (price only, no history)
   */
  static buildFromTradingView(ticker, tvData) {
    const price = tvData.price || 0;
    return {
      ticker,
      price,
      prevClose: price,
      dailyChange: 0,
      dailyChangePercent: tvData.changePercent || 0,
      weekChange: 0,
      monthChange: 0,
      threeMonthChange: 0,
      fiftyTwoWeekHigh: price * 1.2,
      fiftyTwoWeekLow: price * 0.8,
      marketCap: null,
      name: ticker,
      trend: tvData.changePercent > 0 ? 1 : -1,
      momentum: 50,
      rsi: 50,
      macd: 0,
      macdSignal: 0,
      macdHistogram: 0,
      ma20: price,
      ma50: price,
      ma200: price,
      support: price * 0.95,
      resistance: price * 1.05,
      volume: tvData.volume || 0,
      avgVolume: tvData.volume || 0,
      volumeRatio: 1,
      volatility: 25,
      maxDrawdown: 10,
      beta: 1.0,
      pe: null, ps: null, pb: null, debtEquity: null, roe: null,
      revenueGrowth: null, earningsGrowth: null,
      sentiment: tvData.changePercent > 1 ? 0.3 : tvData.changePercent < -1 ? -0.3 : 0,
      newsCount: 0, socialBuzz: false,
      fedRate: 27.25, inflation: 13.5, gdpGrowth: 3.8, usdIndex: 50.5,
      insiderBuying: 0, insiderSelling: 0,
      institutionalOwnership: null, institutionalTrend: 'stable', smartMoneyFlow: 0,
      _history: [],
      _source: 'tradingview',
      _fetchedAt: new Date().toISOString()
    };
  }

  /**
   * Build minimal context when all data sources are unavailable
   */
  static buildMinimalContext(ticker, meta = {}) {
    return {
      ticker,
      price: meta?.regularMarketPrice || 0,
      trend: 0,
      momentum: 50,
      rsi: 50,
      macd: 0,
      ma20: 0,
      ma50: 0,
      volume: 0,
      avgVolume: 0,
      volatility: 25,
      maxDrawdown: 15,
      beta: 1.0,
      name: meta?.longName || meta?.shortName || ticker,
      fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta?.fiftyTwoWeekLow || 0,
      _source: 'minimal-fallback',
      _fetchedAt: new Date().toISOString()
    };
  }

  // ── Technical Indicator Calculations ──

  /**
   * Compute RSI (Relative Strength Index)
   */
  static computeRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Compute MACD (Moving Average Convergence Divergence)
   */
  static computeMACD(closes) {
    if (closes.length < 26) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    // Compute full EMA-12 and EMA-26 series to build MACD line series
    const multiplier12 = 2 / (12 + 1);
    const multiplier26 = 2 / (26 + 1);

    let ema12 = this.computeSMA(closes.slice(0, 12), 12);
    let ema26 = this.computeSMA(closes.slice(0, 26), 26);

    // Build MACD line series (starting from index 25)
    const macdSeries = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < 12) continue;
      if (i === 12) {
        ema12 = this.computeSMA(closes.slice(0, 12), 12);
      } else {
        ema12 = (closes[i] - ema12) * multiplier12 + ema12;
      }
      if (i < 26) continue;
      if (i === 26) {
        ema26 = this.computeSMA(closes.slice(0, 26), 26);
      } else {
        ema26 = (closes[i] - ema26) * multiplier26 + ema26;
      }
      macdSeries.push(ema12 - ema26);
    }

    const macd = macdSeries[macdSeries.length - 1] || 0;

    // Signal line = 9-period EMA of the MACD line series
    let signal = 0;
    if (macdSeries.length >= 9) {
      const multiplier9 = 2 / (9 + 1);
      signal = macdSeries.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
      for (let i = 9; i < macdSeries.length; i++) {
        signal = (macdSeries[i] - signal) * multiplier9 + signal;
      }
    }

    return {
      macd: Math.round(macd * 100) / 100,
      signal: Math.round(signal * 100) / 100,
      histogram: Math.round((macd - signal) * 100) / 100
    };
  }

  /**
   * Compute EMA (Exponential Moving Average) - returns current value
   */
  static computeEMA(data, period) {
    if (data.length === 0) return 0;
    if (data.length < period) return this.computeSMA(data, data.length);

    const multiplier = 2 / (period + 1);
    let ema = this.computeSMA(data.slice(0, period), period);

    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Compute SMA (Simple Moving Average) - returns current value
   */
  static computeSMA(data, period) {
    if (data.length === 0) return 0;
    const slice = data.slice(-period);
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
  }

  /**
   * Compute annualized volatility from daily returns
   */
  static computeVolatility(closes, period = 30) {
    if (closes.length < 2) return 20;

    const recent = closes.slice(-period);
    const returns = [];
    for (let i = 1; i < recent.length; i++) {
      if (recent[i - 1] > 0) {
        returns.push((recent[i] - recent[i - 1]) / recent[i - 1]);
      }
    }

    if (returns.length === 0) return 20;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const dailyVol = Math.sqrt(variance);

    // Annualize (252 trading days)
    return Math.round(dailyVol * Math.sqrt(252) * 100 * 100) / 100;
  }

  /**
   * Compute max drawdown from peak
   */
  static computeMaxDrawdown(closes) {
    if (closes.length < 2) return 0;

    let peak = closes[0];
    let maxDd = 0;

    for (const price of closes) {
      if (price > peak) peak = price;
      const dd = ((peak - price) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }

    return Math.round(maxDd * 100) / 100;
  }

  /**
   * Find support level from recent lows
   */
  static computeSupport(lows) {
    if (lows.length === 0) return 0;
    return Math.round(Math.min(...lows) * 100) / 100;
  }

  /**
   * Find resistance level from recent highs
   */
  static computeResistance(highs) {
    if (highs.length === 0) return 0;
    return Math.round(Math.max(...highs) * 100) / 100;
  }

  /**
   * Compute average of array
   */
  static computeAverage(arr) {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }
}

export default MarketDataAdapter;
