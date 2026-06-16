import { NextResponse } from "next/server";
import { fetchYahooEgxChart } from "@/lib/egx/yahooChart";
import { scraperCache } from "@/lib/scraper/cache";
import { fetchTradingViewEgxQuote } from "@/lib/scraper/egx";

function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\.CA$/, "")
    .replace(/[^A-Z0-9]/g, "");
}

function findFromCache(stocks, symbol) {
  if (!Array.isArray(stocks) || stocks.length === 0) return null;

  return stocks.find((s) => normalizeSymbol(s?.symbol) === symbol) || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbolRaw = searchParams.get("symbol");
  const symbol = normalizeSymbol(symbolRaw);

  if (!symbol) {
    return NextResponse.json({ success: false, error: "symbol query required" }, { status: 400 });
  }

  // Source 1: TradingView scanner (primary live source for EGX)
  try {
    const tvQuote = await fetchTradingViewEgxQuote(symbol);
    if (tvQuote?.price) {
      return NextResponse.json({
        success: true,
        symbol,
        source: "tradingview",
        price: Number(tvQuote.price),
        changePercent: Number(tvQuote.change) || 0,
        volume: Number(tvQuote.volume) || 0,
        timestamp: tvQuote.timestamp,
      });
    }
  } catch {
    // continue fallback chain
  }

  // Source 2: Yahoo chart quick quote
  try {
    const chart = await fetchYahooEgxChart(symbol, "1d", "1m");
    const price = Number(chart?.meta?.regularMarketPrice);
    if (Number.isFinite(price) && price > 0) {
      return NextResponse.json({
        success: true,
        symbol,
        source: "yahoo",
        price,
        changePercent: null,
        volume: null,
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    // continue fallback chain
  }

  // Source 3: last cached scraper snapshot
  try {
    const cached = await scraperCache.getStocks(false);
    const hit = findFromCache(cached?.data, symbol);
    const price = Number(hit?.price ?? hit?.currentPrice);

    if (Number.isFinite(price) && price > 0) {
      return NextResponse.json({
        success: true,
        symbol,
        source: "cache",
        price,
        changePercent: Number(hit?.change) || 0,
        volume: Number(hit?.volume) || 0,
        timestamp: hit?.last_updated || new Date().toISOString(),
      });
    }
  } catch {
    // no-op
  }

  return NextResponse.json(
    { success: false, symbol, error: "No live quote data available" },
    { status: 404 }
  );
}
