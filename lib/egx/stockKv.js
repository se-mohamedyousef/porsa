import { redis } from "@/lib/kv";
import { fetchYahooEgxChart } from "@/lib/egx/yahooChart";

const UNIVERSE_META_KEY = "egx:universe:meta";
const MARKET_INTRADAY_KEY = "market:status:intraday";

/** @param {string} s */
function simpleHash(s) {
  let h = 5381;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/**
 * Derive previous close when Yahoo meta is missing (TradingView `change` is % in our pipeline).
 */
function inferPreviousClose(price, changePercent) {
  const p = Number(price);
  const c = Number(changePercent);
  if (!(p > 0)) return null;
  if (!Number.isFinite(c) || c === -1) return null;
  return Number((p / (1 + c / 100)).toFixed(4));
}

/**
 * @param {object} stock — row from scrapeEgxStocks
 */
export function normalizeScrapedStockToKvRecord(stock) {
  const hist = stock.history_90d || [];
  const last = hist[hist.length - 1];
  const prevBar = hist.length >= 2 ? hist[hist.length - 2] : null;

  let previousClose =
    stock.previousClose != null && Number.isFinite(Number(stock.previousClose))
      ? Number(stock.previousClose)
      : prevBar?.close != null
        ? Number(prevBar.close)
        : inferPreviousClose(stock.price, stock.change);

  const price = Number(stock.price);
  const dayChange =
    previousClose != null && Number.isFinite(previousClose)
      ? price - previousClose
      : null;

  return {
    symbol: stock.symbol,
    name: stock.name,
    currentPrice: price,
    previousClose: previousClose ?? price,
    dayChange,
    dayChangePercent:
      previousClose != null && previousClose > 0 && dayChange != null
        ? Number(((dayChange / previousClose) * 100).toFixed(2))
        : stock.change != null
          ? Number(Number(stock.change).toFixed(2))
          : null,
    volume: stock.volume,
    marketCap: stock.market_cap,
    sector: stock.sector || "Unknown",
    pe: stock.pe ?? null,
    dividend: stock.dividend ?? null,
    rsi_14: stock.rsi_14 ?? null,
    sma_20: stock.sma_20 ?? null,
    sma_50: stock.sma_50 ?? null,
    yahoo_symbol: stock.yahoo_symbol,
    yahoo_status: stock.yahoo_status,
    history: hist,
    lastUpdated: stock.last_updated || new Date().toISOString(),
  };
}

function buildMarketSnapshot(stocks) {
  const advancers = stocks.filter((s) => Number(s.change) > 0).length;
  const decliners = stocks.filter((s) => Number(s.change) < 0).length;
  const n = stocks.length || 1;
  const breadthRatio = n > 0 ? advancers / n : 0.5;

  let sentiment = "neutral";
  if (breadthRatio >= 0.55) sentiment = "positive";
  if (breadthRatio <= 0.45) sentiment = "negative";

  const trend =
    advancers > decliners ? "up" : decliners > advancers ? "down" : "neutral";

  return {
    trend,
    trendStrength: breadthRatio > 0.6 || breadthRatio < 0.4 ? "strong" : "moderate",
    volatility: "normal",
    sentiment,
    advancers,
    decliners,
    unchanged: Math.max(0, n - advancers - decliners),
    breadthRatio: Number(breadthRatio.toFixed(3)),
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Persist per-symbol records + aggregate keys for agents / tools.
 * @param {Array<object>} stocks — output of scrapeEgxStocks
 * @param {{ ttlSec?: number }} [opts]
 */
export async function syncEgxUniverseToKv(stocks, opts = {}) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !stocks?.length) return;

  const ttlSec = opts.ttlSec ?? 6 * 60 * 60;
  const pipeline = redis.pipeline();

  for (const raw of stocks) {
    if (!raw?.symbol) continue;
    const sym = String(raw.symbol).trim().toUpperCase();
    const rec = normalizeScrapedStockToKvRecord({ ...raw, symbol: sym });
    pipeline.set(`stock:${sym}`, rec, { ex: ttlSec });
  }

  const snap = buildMarketSnapshot(stocks);
  pipeline.set(MARKET_INTRADAY_KEY, snap, { ex: ttlSec });
  pipeline.set(
    UNIVERSE_META_KEY,
    {
      count: stocks.length,
      updatedAt: new Date().toISOString(),
      symbolsHash: simpleHash(stocks.map((s) => s.symbol).sort().join(",")),
    },
    { ex: ttlSec }
  );

  try {
    await pipeline.exec();
  } catch (e) {
    console.error("[egx] syncEgxUniverseToKv failed:", e.message);
  }
}

/**
 * Live quote fallback when KV has not been warmed (e.g. cold start).
 * @param {string} symbol
 */
export async function fetchLiveStockRecordForKv(symbol) {
  const sym = String(symbol || "")
    .trim()
    .toUpperCase();
  if (!sym) return null;

  const chart = await fetchYahooEgxChart(sym, "6mo", "1d");
  if (!chart?.history?.length) {
    return {
      symbol: sym,
      name: sym,
      currentPrice: 0,
      previousClose: 0,
      volume: "N/A",
      marketCap: null,
      sector: "Unknown",
      yahoo_status: "unavailable",
      lastUpdated: new Date().toISOString(),
    };
  }

  const { meta, history, yahooSymbol } = chart;
  const last = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const price =
    meta.regularMarketPrice != null && !Number.isNaN(Number(meta.regularMarketPrice))
      ? Number(meta.regularMarketPrice)
      : Number(last.close);
  const previousClose =
    meta.chartPreviousClose != null
      ? Number(meta.chartPreviousClose)
      : prev?.close != null
        ? Number(prev.close)
        : price;
  const dayChange = price - previousClose;

  return {
    symbol: sym,
    name: meta.longName || meta.shortName || sym,
    currentPrice: price,
    previousClose,
    dayChange,
    dayChangePercent:
      previousClose > 0 ? Number(((dayChange / previousClose) * 100).toFixed(2)) : null,
    volume: typeof last.volume === "number" && last.volume > 0 ? last.volume : "N/A",
    marketCap: meta.marketCap ?? null,
    sector: "Unknown",
    pe: null,
    dividend: null,
    history,
    yahoo_symbol: yahooSymbol,
    yahoo_status: "ok",
    lastUpdated: new Date().toISOString(),
  };
}
