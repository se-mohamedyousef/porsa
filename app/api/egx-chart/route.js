import { NextResponse } from "next/server";
import { fetchYahooEgxChart } from "@/lib/egx/yahooChart";
import { scraperCache } from "@/lib/scraper/cache";

function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\.CA$/, "")
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeCachedBars(history = []) {
  if (!Array.isArray(history) || history.length === 0) return [];

  return history
    .map((bar) => {
      const close = Number(bar?.close);
      if (!bar?.date || Number.isNaN(close)) return null;

      const open = Number(bar?.open);
      const high = Number(bar?.high);
      const low = Number(bar?.low);
      const volume = Number(bar?.volume);

      return {
        date: String(bar.date),
        open: Number.isNaN(open) ? close : open,
        high: Number.isNaN(high) ? close : high,
        low: Number.isNaN(low) ? close : low,
        close,
        volume: Number.isNaN(volume) ? 0 : volume,
      };
    })
    .filter(Boolean);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const rangeParam = (searchParams.get("range") || "5y").trim();
  const intervalParam = (searchParams.get("interval") || "1d").trim();
  const allowCache = searchParams.get("cache") !== "0";

  const allowedRanges = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]);
  const allowedIntervals = new Set(["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]);

  const range = allowedRanges.has(rangeParam) ? rangeParam : "5y";
  const interval = allowedIntervals.has(intervalParam) ? intervalParam : "1d";

  if (!symbol?.trim()) {
    return NextResponse.json({ error: "symbol query required" }, { status: 400 });
  }

  try {
    const chart = await fetchYahooEgxChart(symbol.trim(), range, interval);
    if (!chart || !Array.isArray(chart.history) || chart.history.length === 0) {
      if (!allowCache) {
        return NextResponse.json(
          { success: false, error: "No Yahoo chart data for symbol", symbol: symbol.trim() },
          { status: 404 }
        );
      }

      // Fallback: serve cached historical bars from last successful scraper sync.
      const cached = await scraperCache.getStocks(false);
      const requested = normalizeSymbol(symbol);
      const cachedStock = cached?.data?.find((s) => normalizeSymbol(s?.symbol) === requested);
      const cachedBars = normalizeCachedBars(cachedStock?.history_90d);

      if (cachedBars.length > 0) {
        const last = cachedBars[cachedBars.length - 1];
        const prev = cachedBars.length >= 2 ? cachedBars[cachedBars.length - 2] : last;

        return NextResponse.json({
          success: true,
          symbol: symbol.trim().toUpperCase(),
          source: "cache",
          yahoo_symbol: cachedStock?.yahoo_symbol || `${requested}.CA`,
          meta: {
            longName: cachedStock?.name || requested,
            regularMarketPrice: last?.close,
            chartPreviousClose: prev?.close,
            marketCap: cachedStock?.market_cap ?? null,
          },
          bars: cachedBars,
        });
      }

      return NextResponse.json(
        { success: false, error: "No Yahoo chart data for symbol", symbol: symbol.trim() },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      symbol: symbol.trim().toUpperCase(),
      yahoo_symbol: chart.yahooSymbol,
      meta: chart.meta,
      bars: chart.history,
    });
  } catch (e) {
    console.error("egx-chart", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
