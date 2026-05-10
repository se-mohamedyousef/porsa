import * as cheerio from "cheerio";
import { fetchYahooEgxChart } from "@/lib/egx/yahooChart";
import { scraperLogger } from "@/lib/logger";
import { scraperCache } from "@/lib/scraper/cache";
import { retryWithBackoff, CircuitBreaker } from "@/lib/scraper/resilience";

const TV_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Circuit breaker for TradingView API
const tvCircuitBreaker = new CircuitBreaker("TradingView", {
  failureThreshold: 3,
  successThreshold: 1,
  timeout: 300000, // 5 minutes
});

/** Leading Latin ticker token (EGX symbols are typically 2–5 chars, e.g. COMI, SWDY). */
export function parseEgxTicker(cellText) {
  const t = String(cellText || "").trim();
  const m = t.match(/^([A-Z][A-Z0-9]{1,10})/);
  if (m) {
    const symbol = m[1];
    const rest = t.slice(symbol.length).trim();
    return { symbol, name: rest || symbol };
  }
  const first = t.split(/\s+/)[0] || t;
  return { symbol: first, name: t };
}

function calculateSma(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRsi(prices, period = 14) {
  if (prices.length < period + 1) return null;

  const deltas = [];
  for (let i = 1; i < prices.length; i++) deltas.push(prices[i] - prices[i - 1]);

  let seed = deltas.slice(0, period);
  let up = seed.filter((x) => x > 0).reduce((a, b) => a + b, 0) / period;
  let down = -seed.filter((x) => x < 0).reduce((a, b) => a + b, 0) / period;

  const rsList = new Array(deltas.length).fill(0);
  rsList[period - 1] = down !== 0 ? up / down : 100;

  for (let i = period; i < deltas.length; i++) {
    const u = deltas[i] > 0 ? deltas[i] : 0;
    const d = deltas[i] < 0 ? -deltas[i] : 0;
    up = (up * (period - 1) + u) / period;
    down = (down * (period - 1) + d) / period;
    rsList[i] = down !== 0 ? up / down : 100;
  }

  const rs = rsList[rsList.length - 1];
  return rs > 0 ? 100 - 100 / (1 + rs) : 50;
}

function calculateEma(prices, period) {
  if (prices.length < period)
    return prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }
  return ema;
}

function calculateMacd(prices, fast = 12, slow = 26) {
  if (prices.length < slow) return null;
  const fastEma =
    prices.length === fast ? prices[prices.length - 1] : calculateEma(prices.slice(-slow), fast);
  const slowEma = calculateEma(prices.slice(-slow), slow);
  const macdLine = fastEma - slowEma;
  return { macd: Number(macdLine.toFixed(4)), signal: Number(macdLine.toFixed(4)) };
}

function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    const mid = prices[prices.length - 1] || 0;
    return { upper: mid, middle: mid, lower: mid };
  }
  const sma = calculateSma(prices, period);
  const slice = prices.slice(-period);
  const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: Number((sma + stdDev * std).toFixed(2)),
    middle: Number(sma.toFixed(2)),
    lower: Number((sma - stdDev * std).toFixed(2)),
  };
}

function calculateTechnicalIndicators(priceHistory) {
  if (!priceHistory || priceHistory.length < 5) return {};

  const closePrices = priceHistory.map((h) => h.close);
  const rsiVal = calculateRsi(closePrices, 14);

  return {
    sma_20: Number(calculateSma(closePrices, 20).toFixed(2)),
    sma_50: closePrices.length >= 50 ? Number(calculateSma(closePrices, 50).toFixed(2)) : null,
    sma_200: closePrices.length >= 200 ? Number(calculateSma(closePrices, 200).toFixed(2)) : null,
    rsi_14: rsiVal != null ? Number(rsiVal.toFixed(2)) : null,
    bollinger_bands: calculateBollingerBands(closePrices, 20),
    macd: calculateMacd(closePrices),
  };
}

function fundamentalsFromHistory(stockData, priceHistory, meta) {
  const price = stockData.price;
  const closePrices = priceHistory.map((h) => h.close);
  const week52High =
    meta?.fiftyTwoWeekHigh ?? (closePrices.length ? Math.max(...closePrices) : price);
  const week52Low = meta?.fiftyTwoWeekLow ?? (closePrices.length ? Math.min(...closePrices) : price);
  const week52Change =
    week52Low > 0 ? Number((((price - week52Low) / week52Low) * 100).toFixed(2)) : 0;

  const volumes = priceHistory.slice(-30).map((h) => h.volume).filter((v) => v > 0);
  const avgVolume30d = volumes.length
    ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
    : null;

  return {
    week_52_high: Number(Number(week52High).toFixed(2)),
    week_52_low: Number(Number(week52Low).toFixed(2)),
    week_52_change_percent: week52Change,
    avg_volume_30d: avgVolume30d,
  };
}

async function mapPool(items, concurrency, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {(msg:string)=>void} log
 * @param {string[]} columns
 */
async function fetchEgxScannerRowsWithColumns(log, columns) {
  const url = "https://scanner.tradingview.com/egypt/scan";
  const pageSize = 500;
  const seen = new Set();
  const out = [];
  let from = 0;
  let totalCount = 1;
  const hasExt = columns.length > 4;

  while (from < totalCount) {
    const body = {
      filter: [],
      options: { lang: "en" },
      markets: ["egypt"],
      columns,
      range: [from, from + pageSize],
    };

    let res;
    let lastErr;

    // Use retry mechanism for resilience
    try {
      res = await retryWithBackoff(
        async () => {
          return await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "User-Agent": TV_UA,
              Origin: "https://www.tradingview.com",
              Referer: "https://www.tradingview.com/",
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(28_000),
          });
        },
        {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          jitter: true,
          context: `TradingView Scanner Page ${Math.floor(from / pageSize)}`,
        }
      );
    } catch (e) {
      lastErr = e;
      log(`⚠️ TradingView scanner failed after retries: ${e.message}`);
      throw lastErr;
    }

    if (!res?.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.error) {
      throw new Error(String(json.error));
    }

    totalCount = Number(json.totalCount) || 0;
    const data = json.data || [];

    for (const row of data) {
      const id = row.s || "";
      const parts = id.split(":");
      const symbol = parts.length >= 2 ? parts.slice(1).join(":") : id;
      if (!symbol || seen.has(symbol)) continue;
      seen.add(symbol);

      const d = row.d || [];
      const label = d[0] != null ? String(d[0]) : symbol;
      const price = d[1] != null ? Number(d[1]) : 0;
      const change = d[2] != null ? Number(d[2]) : 0;
      const vol = d[3];

      let market_cap = null;
      let sector = "Unknown";
      let pe = null;
      if (hasExt) {
        const mc = d[4];
        if (typeof mc === "number" && mc > 0) market_cap = mc;
        if (d[5] != null && String(d[5]).trim()) sector = String(d[5]);
        const peRaw = d[6];
        if (typeof peRaw === "number" && peRaw > 0) pe = peRaw;
      }

      if (!(price > 0)) continue;

      out.push({
        symbol,
        name: label,
        price,
        change,
        volume: typeof vol === "number" && vol > 0 ? vol : "N/A",
        market_cap,
        sector,
        pe,
        index_membership: null,
        source: "TradingView-scanner",
      });
    }

    if (data.length === 0) break;
    from += pageSize;
  }

  log(`✅ TradingView Egypt scanner: ${out.length} symbols (columns: ${columns.join(",")})`);
  return out;
}

async function fetchEgxScannerRows(log) {
  const extended = [
    "name",
    "close",
    "change",
    "volume",
    "market_cap_basic",
    "sector",
    "price_earnings_ttm",
  ];
  const basic = ["name", "close", "change", "volume"];

  try {
    return await fetchEgxScannerRowsWithColumns(log, extended);
  } catch (e) {
    log(`⚠️ Extended scanner columns failed (${e.message}); retrying basic set…`);
    return fetchEgxScannerRowsWithColumns(log, basic);
  }
}

/** Legacy: HTML market movers page only includes ~100 rows in SSR; used as fallback. */
async function fetchMarketMoversHtmlFallback(log) {
  log("📊 Fallback: TradingView market movers HTML…");
  const url = "https://ar.tradingview.com/markets/stocks-egypt/market-movers-all-stocks/";

  const response = await fetch(url, {
    headers: {
      "User-Agent": TV_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.tradingview.com",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from TradingView HTML: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rawRows = [];
  let rows = $("tr.js-screener-item");
  if (!rows.length) rows = $("tr");

  rows.each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 3) return;

    const firstCol = $(cols[0]).text().trim();
    const { symbol, name } = parseEgxTicker(firstCol);
    let priceVal = 0;
    let changeVal = 0;

    cols.each((j, col) => {
      const colText = $(col).text().trim();
      if (j > 0 && colText && !colText.includes("%")) {
        const val = parseFloat(colText.replace(/,/g, "").replace(/ج\.م/g, "").trim());
        if (!isNaN(val) && val > 0 && priceVal === 0) priceVal = val;
      }
      if (colText.includes("%") && changeVal === 0) {
        const val = parseFloat(colText.replace(/%/g, "").replace(/\+/g, "").trim());
        if (!isNaN(val)) changeVal = val;
      }
    });

    if (!symbol || priceVal <= 0) return;

    rawRows.push({
      symbol,
      name,
      price: priceVal,
      change: changeVal,
      volume: "N/A",
      market_cap: null,
      sector: "Unknown",
      index_membership: null,
      source: "TradingView-html",
    });
  });

  log(`✅ HTML fallback: ${rawRows.length} rows`);
  return rawRows;
}

/**
 * Scrape snapshot from TradingView (full screener universe), enrich with Yahoo OHLCV when available.
 * Now with intelligent caching and circuit breaker protection.
 */
export async function scrapeEgxStocks(options = {}) {
  const concurrency = options.yahooConcurrency ?? 4;
  const log = options.log ?? console.log.bind(console);
  const useCache = options.useCache !== false; // default true
  const forceFresh = options.forceFresh === true; // default false

  try {
    // Check cache first unless forceFresh is set
    if (useCache && !forceFresh) {
      const cached = await scraperCache.getStocks(false);
      if (cached.data) {
        log(`📦 Using cached stocks (age: ${cached.timestamp}s)`);
        return cached.data;
      }
    }

    log("🔄 Starting fresh scrape...");
    let rawRows;

    // Use circuit breaker for TradingView API
    try {
      rawRows = await tvCircuitBreaker.execute(
        async () => {
          return await fetchEgxScannerRows(log);
        },
        async () => {
          // Fallback: try to use cached data even if it's stale
          const cachedFallback = await scraperCache.getStocks(false);
          if (cachedFallback.data) {
            log("⚠️ Using stale cached data due to circuit breaker");
            return cachedFallback.data;
          }
          throw new Error("Circuit breaker open and no cache available");
        }
      );

      if (rawRows.length < 80) {
        throw new Error(`Scanner returned only ${rawRows.length} rows`);
      }
    } catch (err) {
      log("⚠️ TV scanner failed:", err.message);
      scraperLogger.warn("TradingView scanner failed", "scrapeEgxStocks", {
        error: err.message,
        circuitBreakerStatus: tvCircuitBreaker.getStatus(),
      });

      rawRows = await fetchMarketMoversHtmlFallback(log);
    }

    if (rawRows.length === 0) {
      const fallbackCached = await scraperCache.getStocks(false);
      if (fallbackCached.data) {
        log("⚠️ No new data, returning cache");
        return fallbackCached.data;
      }
      throw new Error("Failed to fetch any stocks from TradingView.");
    }

    log(`📈 Enriching with Yahoo (≤${concurrency} concurrent)…`);

    const enhancedStocks = await mapPool(rawRows, concurrency, async (stock) => {
      try {
        const chart = await fetchYahooEgxChart(stock.symbol, "6mo", "1d");
        if (!chart?.history?.length) {
          return {
            ...stock,
            name: stock.name,
            yahoo_symbol: `${stock.symbol}.CA`,
            yahoo_status: "unavailable",
            history_90d: [],
            last_updated: new Date().toISOString(),
          };
        }

        const { meta, history, yahooSymbol } = chart;
        const historyTrim = history.slice(-90);
        const price =
          meta.regularMarketPrice != null && !Number.isNaN(meta.regularMarketPrice)
            ? Number(meta.regularMarketPrice)
            : stock.price;

        const prevBar = historyTrim.length >= 2 ? historyTrim[historyTrim.length - 2] : null;
        const previousClose =
          meta.chartPreviousClose != null && !Number.isNaN(Number(meta.chartPreviousClose))
            ? Number(meta.chartPreviousClose)
            : prevBar?.close != null
              ? Number(prevBar.close)
              : null;

        const mc =
          stock.market_cap != null
            ? stock.market_cap
            : meta.marketCap != null && !Number.isNaN(Number(meta.marketCap))
              ? Number(meta.marketCap)
              : null;

        const fundamentals = fundamentalsFromHistory({ ...stock, price, market_cap: mc }, historyTrim, meta);
        const technicals = calculateTechnicalIndicators(historyTrim);
        const lastBar = historyTrim[historyTrim.length - 1];
        const vol = lastBar?.volume;

        return {
          ...stock,
          price,
          previousClose,
          market_cap: mc,
          pe: stock.pe,
          name: meta.longName || stock.name,
          volume: typeof vol === "number" && vol > 0 ? vol : stock.volume,
          ...fundamentals,
          ...technicals,
          history_90d: historyTrim,
          yahoo_symbol: yahooSymbol,
          yahoo_status: "ok",
          last_updated: new Date().toISOString(),
        };
      } catch (err) {
        // Handle individual stock enrichment failures gracefully
        log(`⚠️ Failed to enrich ${stock.symbol}: ${err.message}`);
        return {
          ...stock,
          yahoo_status: "error",
          history_90d: [],
          last_updated: new Date().toISOString(),
        };
      }
    });

    const successCount = enhancedStocks.filter((s) => s.yahoo_status === "ok").length;
    log(`✅ Enrichment done (Yahoo ok: ${successCount}/${enhancedStocks.length})`);

    // Cache the results
    if (useCache) {
      await scraperCache.setStocks(enhancedStocks, false);
    }

    return enhancedStocks;
  } catch (error) {
    scraperLogger.error("Fatal scraper error", "scrapeEgxStocks", { error: error.message });
    await scraperCache.trackError(error, "scrapeEgxStocks");

    // Return cached data as last resort
    const fallback = await scraperCache.getStocks(false);
    if (fallback.data) {
      log("⚠️ Using cached data as fallback");
      return fallback.data;
    }

    throw error;
  }
}

/** @deprecated Index membership is not inferred; use null or a future live index feed. */
export function getStockIndex() {
  return null;
}
