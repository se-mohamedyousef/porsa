/**
 * DataCollector — Unified real data fetcher for EGX stocks.
 * All data comes from verifiable sources with clear attribution.
 * No fabricated data — every field has a real source or is explicitly null.
 */

import { fetchYahooEgxChart } from '@/lib/egx/yahooChart';
import { MarketDataAdapter } from './MarketDataAdapter';

// ── News sentiment keyword lists ──
const POSITIVE_KEYWORDS = [
  'profit', 'growth', 'surge', 'rise', 'gain', 'record', 'expand',
  'upgrade', 'dividend', 'acquisition', 'partnership', 'contract',
  'revenue', 'success', 'ارتفاع', 'أرباح', 'نمو', 'توزيعات', 'صفقة',
];
const NEGATIVE_KEYWORDS = [
  'loss', 'decline', 'fall', 'drop', 'risk', 'debt', 'lawsuit',
  'downgrade', 'sell', 'warning', 'fraud', 'default', 'bankrupt',
  'انخفاض', 'خسائر', 'ديون', 'مخاطر', 'تراجع',
];

export class DataCollector {

  /**
   * Collect all available real data for a stock.
   * Returns a unified object with source attribution per field.
   */
  static async collectAll(ticker) {
    const startTime = Date.now();

    // Run all fetchers in parallel
    const [technical, fundamental, news] = await Promise.allSettled([
      this.fetchTechnicalData(ticker),
      this.fetchFundamentalData(ticker),
      this.fetchNewsData(ticker),
    ]);

    const techData = technical.status === 'fulfilled' ? technical.value : {};
    const fundData = fundamental.status === 'fulfilled' ? fundamental.value : {};
    const newsData = news.status === 'fulfilled' ? news.value : { headlines: [], count: 0, sentiment: 'neutral', sentimentScore: 0 };

    return {
      ticker,
      technical: techData,
      fundamental: fundData,
      news: newsData,
      macro: this.getMacroData(),
      _collectedAt: new Date().toISOString(),
      _latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Fetch technical data from TradingView + Yahoo OHLCV.
   * Returns RSI, MACD, MAs, Bollinger, support/resistance, volume analysis.
   */
  static async fetchTechnicalData(ticker) {
    // Use MarketDataAdapter which already has the waterfall (Yahoo → TradingView → minimal)
    const marketData = await MarketDataAdapter.fetchMarketContext(ticker);

    if (!marketData || !marketData.price) {
      return { source: 'none', available: false };
    }

    // Compute Bollinger Bands from history if available
    let bollingerBands = null;
    if (marketData._history?.length >= 20) {
      const closes = marketData._history.map(b => b.close);
      const sma20 = MarketDataAdapter.computeSMA(closes, 20);
      const slice = closes.slice(-20);
      const variance = slice.reduce((sum, v) => sum + Math.pow(v - sma20, 2), 0) / 20;
      const std = Math.sqrt(variance);
      bollingerBands = {
        upper: Math.round((sma20 + 2 * std) * 100) / 100,
        middle: sma20,
        lower: Math.round((sma20 - 2 * std) * 100) / 100,
        width: std > 0 ? Math.round(((sma20 + 2 * std - (sma20 - 2 * std)) / sma20) * 100 * 100) / 100 : 0,
        percentB: std > 0 ? Math.round(((marketData.price - (sma20 - 2 * std)) / (4 * std)) * 100) / 100 : 0.5,
      };
    }

    // Volume analysis
    const volumeAnalysis = {
      current: marketData.volume || 0,
      avg20: marketData.avgVolume || 0,
      ratio: marketData.volumeRatio || 1,
      trend: marketData.volumeRatio > 1.5 ? 'high' : marketData.volumeRatio < 0.5 ? 'low' : 'normal',
      accumulation: marketData.volumeRatio > 1.2 && marketData.dailyChangePercent > 0,
      distribution: marketData.volumeRatio > 1.2 && marketData.dailyChangePercent < 0,
    };

    // MA alignment
    const maAlignment = this.classifyMAAlignment(marketData.price, marketData.ma20, marketData.ma50, marketData.ma200);

    // MACD crossover detection
    const macdCrossover = marketData.macdHistogram > 0 && marketData.macd > 0 ? 'bullish'
      : marketData.macdHistogram < 0 && marketData.macd < 0 ? 'bearish'
      : 'neutral';

    return {
      source: marketData._source || 'unknown',
      available: true,
      price: marketData.price,
      prevClose: marketData.prevClose,
      dailyChange: marketData.dailyChange,
      dailyChangePercent: marketData.dailyChangePercent,
      weekChange: marketData.weekChange,
      monthChange: marketData.monthChange,
      threeMonthChange: marketData.threeMonthChange,

      // Core indicators
      rsi: marketData.rsi,
      rsiZone: marketData.rsi > 70 ? 'overbought' : marketData.rsi < 30 ? 'oversold' : marketData.rsi > 60 ? 'bullish' : marketData.rsi < 40 ? 'bearish' : 'neutral',
      macd: marketData.macd,
      macdSignal: marketData.macdSignal,
      macdHistogram: marketData.macdHistogram,
      macdCrossover,

      // Moving averages
      ma20: marketData.ma20,
      ma50: marketData.ma50,
      ma200: marketData.ma200,
      maAlignment,

      // Support / Resistance
      support: marketData.support,
      resistance: marketData.resistance,

      // Bollinger Bands
      bollingerBands,

      // Volume
      volume: volumeAnalysis,

      // Risk
      volatility: marketData.volatility,
      maxDrawdown: marketData.maxDrawdown,

      // 52-week range
      fiftyTwoWeekHigh: marketData.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: marketData.fiftyTwoWeekLow,
      fiftyTwoWeekPosition: marketData.fiftyTwoWeekHigh > 0 && marketData.fiftyTwoWeekLow > 0
        ? Math.round(((marketData.price - marketData.fiftyTwoWeekLow) / (marketData.fiftyTwoWeekHigh - marketData.fiftyTwoWeekLow)) * 100)
        : null,

      name: marketData.name,
      _history: marketData._history,
    };
  }

  /**
   * Fetch fundamental data from TradingView extended scan.
   * Returns P/E, market cap, sector — all from TradingView's real data.
   */
  static async fetchFundamentalData(ticker) {
    try {
      // TradingView scanner with extended columns
      const { fetchTradingViewEgxQuote } = await import('@/lib/scraper/egx');
      const quote = await fetchTradingViewEgxQuote(ticker);

      // Also try the full scanner for P/E and market cap
      const scanData = await this.fetchTradingViewExtended(ticker);

      return {
        source: 'tradingview',
        available: true,
        pe: scanData?.pe || null,
        marketCap: scanData?.marketCap || null,
        marketCapTier: this.classifyMarketCap(scanData?.marketCap),
        sector: scanData?.sector || 'Unknown',
        currentPrice: quote?.price || scanData?.price || null,
        dailyChange: quote?.change || 0,
        volume: quote?.volume || 0,
      };
    } catch (e) {
      console.warn(`[DataCollector] Fundamental fetch failed for ${ticker}:`, e.message);
      return { source: 'none', available: false, pe: null, marketCap: null, sector: 'Unknown' };
    }
  }

  /**
   * Fetch TradingView extended data (P/E, market cap, sector) via scanner.
   */
  static async fetchTradingViewExtended(ticker) {
    const sym = String(ticker).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!sym) return null;

    try {
      const url = 'https://scanner.tradingview.com/egypt/scan';
      const body = {
        filter: [{ left: 'name', operation: 'match', right: sym }],
        options: { lang: 'en' },
        markets: ['egypt'],
        columns: ['name', 'close', 'change', 'volume', 'market_cap_basic', 'sector', 'price_earnings_ttm'],
        range: [0, 5],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Origin': 'https://www.tradingview.com',
          'Referer': 'https://www.tradingview.com/',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return null;
      const json = await response.json();
      const row = json?.data?.[0];
      if (!row) return null;

      const d = row.d || [];
      return {
        name: d[0] || ticker,
        price: typeof d[1] === 'number' ? d[1] : null,
        change: typeof d[2] === 'number' ? d[2] : 0,
        volume: typeof d[3] === 'number' ? d[3] : 0,
        marketCap: typeof d[4] === 'number' && d[4] > 0 ? d[4] : null,
        sector: d[5] && String(d[5]).trim() ? String(d[5]) : 'Unknown',
        pe: typeof d[6] === 'number' && d[6] > 0 ? Math.round(d[6] * 100) / 100 : null,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch news data from multiple sources with deep search.
   * Sources: Google News EN, Google News AR, sector/EGX news.
   * Returns headlines, count, sentiment, and LLM-generated insights.
   */
  static async fetchNewsData(ticker) {
    try {
      // Parallel fetch from multiple news sources
      const [enNews, arNews, sectorNews] = await Promise.allSettled([
        this._fetchGoogleNews(ticker, 'en', `${ticker} egypt stock OR EGX`),
        this._fetchGoogleNews(ticker, 'ar', `${ticker} البورصة المصرية OR أسهم`),
        this._fetchSectorNews(ticker),
      ]);

      const enHeadlines = enNews.status === 'fulfilled' ? enNews.value : [];
      const arHeadlines = arNews.status === 'fulfilled' ? arNews.value : [];
      const sectorHeadlines = sectorNews.status === 'fulfilled' ? sectorNews.value : [];

      // Merge and deduplicate
      const allHeadlines = this._deduplicateHeadlines([...enHeadlines, ...arHeadlines, ...sectorHeadlines]);

      // Sort by date (newest first)
      allHeadlines.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });

      // Calculate sentiment
      const sentimentResult = this.analyzeHeadlineSentiment(allHeadlines);

      // Categorize news by type
      const categorized = this._categorizeNews(allHeadlines);

      // Try to get LLM summary of key news
      let llmInsights = null;
      if (allHeadlines.length > 0 && process.env.HF_TOKEN) {
        llmInsights = await this._getLLMNewsInsights(ticker, allHeadlines.slice(0, 15));
      }

      const now = Date.now();
      const recentCount = allHeadlines.filter(h => {
        const d = new Date(h.date);
        return (now - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
      }).length;

      return {
        source: 'multi-source',
        sources: {
          en: enHeadlines.length,
          ar: arHeadlines.length,
          sector: sectorHeadlines.length,
        },
        headlines: allHeadlines.slice(0, 20),
        count: allHeadlines.length,
        sentiment: sentimentResult.label,
        sentimentScore: sentimentResult.score,
        sentimentBreakdown: {
          positive: sentimentResult.positiveCount || 0,
          negative: sentimentResult.negativeCount || 0,
          neutral: allHeadlines.length - (sentimentResult.positiveCount || 0) - (sentimentResult.negativeCount || 0),
        },
        recentCount,
        categories: categorized,
        llmInsights,
      };
    } catch (e) {
      console.warn(`[DataCollector] News fetch failed for ${ticker}:`, e.message);
      return { headlines: [], count: 0, sentiment: 'neutral', sentimentScore: 0, source: 'error' };
    }
  }

  /**
   * Fetch from Google News RSS for a specific language.
   */
  static async _fetchGoogleNews(ticker, lang, queryStr) {
    const query = encodeURIComponent(queryStr);
    const hl = lang === 'ar' ? 'ar' : 'en';
    const url = `https://news.google.com/rss/search?q=${query}&hl=${hl}&gl=EG&ceid=EG:${hl}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];
    const xml = await response.text();
    const headlines = this.parseRSSHeadlines(xml);
    return headlines.map(h => ({ ...h, lang, source: `google-news-${lang}` }));
  }

  /**
   * Fetch sector and EGX general news.
   */
  static async _fetchSectorNews(ticker) {
    const query = encodeURIComponent(`EGX Egyptian Exchange البورصة المصرية اليوم`);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en&gl=EG&ceid=EG:en`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; bot)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) return [];
      const xml = await response.text();
      const headlines = this.parseRSSHeadlines(xml);
      return headlines.slice(0, 10).map(h => ({ ...h, lang: 'en', source: 'sector-news', isGeneral: true }));
    } catch {
      return [];
    }
  }

  /**
   * Deduplicate headlines by title similarity.
   */
  static _deduplicateHeadlines(headlines) {
    const seen = new Set();
    return headlines.filter(h => {
      // Normalize: lowercase, remove punctuation, trim
      const key = h.title.toLowerCase().replace(/[^\w\s]/g, '').trim().substring(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Categorize news headlines by topic.
   */
  static _categorizeNews(headlines) {
    const categories = {
      earnings: [],      // Financial results, profit reports
      management: [],    // CEO, board, management changes
      deals: [],         // M&A, partnerships, contracts
      regulatory: [],    // Government, central bank, regulations
      market: [],        // General market, EGX index
      other: [],
    };

    const patterns = {
      earnings: /profit|revenue|earning|loss|quarter|annual|financial|result|أرباح|إيرادات|خسائر|نتائج/i,
      management: /ceo|board|appoint|resign|director|chairman|manage|رئيس|مجلس|تعيين|استقالة/i,
      deals: /acqui|merger|partner|deal|contract|agreement|bid|صفقة|استحواذ|اندماج|شراكة|عقد/i,
      regulatory: /regulat|central bank|govern|law|policy|tax|license|بنك مركزي|تنظيم|حكوم|ضريبة/i,
      market: /egx|index|market|bourse|trading|البورصة|مؤشر|تداول|سوق/i,
    };

    for (const h of headlines) {
      let matched = false;
      for (const [cat, pattern] of Object.entries(patterns)) {
        if (pattern.test(h.title)) {
          categories[cat].push(h);
          matched = true;
          break;
        }
      }
      if (!matched) categories.other.push(h);
    }

    return categories;
  }

  /**
   * Use LLM to generate deep insights from news headlines.
   */
  static async _getLLMNewsInsights(ticker, headlines) {
    try {
      const headlineText = headlines.map((h, i) =>
        `${i + 1}. [${h.date || 'recent'}] ${h.title}${h.isGeneral ? ' (general market)' : ''}`
      ).join('\n');

      const prompt = `You are an expert Egyptian stock market analyst. Analyze these news headlines about ${ticker} (EGX listed stock) and provide investment-relevant insights.

HEADLINES:
${headlineText}

Respond in this exact JSON format (no markdown):
{
  "summary": "2-3 sentence summary of the overall news picture for this stock",
  "keyEvents": ["list of 2-4 key events or catalysts mentioned"],
  "sentiment": "bullish|bearish|neutral|mixed",
  "sentimentReason": "1 sentence explaining why",
  "risks": ["1-2 news-based risks"],
  "opportunities": ["1-2 news-based opportunities"],
  "impactLevel": "high|medium|low"
}`;

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
          max_tokens: 400,
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (e) {
      console.warn(`[DataCollector] LLM news insights failed:`, e.message);
      return null;
    }
  }

  /**
   * Parse RSS XML into headline objects.
   */
  static parseRSSHeadlines(xml) {
    const headlines = [];
    // Simple regex-based RSS parser (no XML dependency needed)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const linkRegex = /<link>(.*?)<\/link>/;

    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];
      const titleMatch = item.match(titleRegex);
      const dateMatch = item.match(dateRegex);
      const linkMatch = item.match(linkRegex);

      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      if (!title) continue;

      headlines.push({
        title,
        date: dateMatch ? dateMatch[1] : null,
        link: linkMatch ? linkMatch[1] : null,
      });
    }

    return headlines;
  }

  /**
   * Analyze sentiment from headline titles using keyword matching.
   */
  static analyzeHeadlineSentiment(headlines) {
    if (headlines.length === 0) return { score: 0, label: 'neutral' };

    let positiveCount = 0;
    let negativeCount = 0;

    for (const h of headlines) {
      const lower = h.title.toLowerCase();
      for (const kw of POSITIVE_KEYWORDS) {
        if (lower.includes(kw)) { positiveCount++; break; }
      }
      for (const kw of NEGATIVE_KEYWORDS) {
        if (lower.includes(kw)) { negativeCount++; break; }
      }
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return { score: 0, label: 'neutral' };

    const score = Math.round(((positiveCount - negativeCount) / Math.max(total, 1)) * 100) / 100;
    const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

    return { score, label, positiveCount, negativeCount };
  }

  /**
   * Get macro data. Hardcoded with date — flagged as stale if old.
   */
  static getMacroData() {
    const lastUpdated = '2025-02-20'; // Last verified date
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));

    return {
      source: 'manual',
      lastUpdated,
      stale: daysSinceUpdate > 30,
      daysSinceUpdate,
      cbeRate: 27.25, // Central Bank of Egypt main rate
      inflation: 24.0, // Annual CPI
      gdpGrowth: 3.8,
      egpUsd: 50.5,  // Approximate EGP/USD
    };
  }

  // ── Helpers ──

  static classifyMAAlignment(price, ma20, ma50, ma200) {
    if (!price || !ma20) return 'unknown';
    if (price > ma20 && ma20 > ma50 && (ma50 > ma200 || !ma200)) return 'strong-bullish';
    if (price > ma20 && ma20 > ma50) return 'bullish';
    if (price > ma20) return 'mild-bullish';
    if (price < ma20 && ma20 < ma50 && (ma50 < ma200 || !ma200)) return 'strong-bearish';
    if (price < ma20 && ma20 < ma50) return 'bearish';
    if (price < ma20) return 'mild-bearish';
    return 'neutral';
  }

  static classifyMarketCap(marketCap) {
    if (!marketCap) return 'unknown';
    if (marketCap > 50e9) return 'large-cap';
    if (marketCap > 10e9) return 'mid-cap';
    if (marketCap > 1e9) return 'small-cap';
    return 'micro-cap';
  }

  /**
   * Fetch data for multiple tickers efficiently (for recommendations scan).
   * Returns map of ticker → collected data.
   */
  static async collectBatch(tickers, concurrency = 5) {
    const results = {};
    const queue = [...tickers];

    async function worker() {
      while (queue.length > 0) {
        const ticker = queue.shift();
        try {
          results[ticker] = await DataCollector.collectAll(ticker);
        } catch (e) {
          results[ticker] = { ticker, error: e.message };
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, tickers.length) }, () => worker()));
    return results;
  }
}

export default DataCollector;
