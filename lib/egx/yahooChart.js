const YAHOO_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 18_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchYahooChartOnce(yahoo, range, interval, signal) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahoo
  )}?range=${range}&interval=${interval}`;

  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    signal,
  });

  if (!res.ok) return null;
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r) return null;

  const meta = r.meta || {};
  const q = r.indicators?.quote?.[0];
  const ts = r.timestamp || [];
  if (!q || !ts.length) {
    return {
      yahooSymbol: yahoo,
      meta: {
        currency: meta.currency,
        longName: meta.longName,
        shortName: meta.shortName,
        regularMarketPrice: meta.regularMarketPrice,
        chartPreviousClose: meta.chartPreviousClose,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        marketCap: meta.marketCap,
      },
      history: [],
    };
  }

  const history = [];
  for (let i = 0; i < ts.length; i++) {
    const close = q.close?.[i];
    if (close == null || Number.isNaN(close)) continue;
    const d = new Date(ts[i] * 1000);
    history.push({
      date: d.toISOString().split("T")[0],
      open: q.open?.[i] ?? close,
      high: q.high?.[i] ?? close,
      low: q.low?.[i] ?? close,
      close,
      volume: q.volume?.[i] ?? 0,
    });
  }

  return {
    yahooSymbol: yahoo,
    meta: {
      currency: meta.currency,
      longName: meta.longName,
      shortName: meta.shortName,
      regularMarketPrice: meta.regularMarketPrice,
      chartPreviousClose: meta.chartPreviousClose,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      marketCap: meta.marketCap,
    },
    history,
  };
}

/**
 * Yahoo Finance chart API for EGX listings (suffix .CA = Cairo exchange in Yahoo's namespace).
 * Returns null when the symbol is missing or delisted on Yahoo.
 */
export async function fetchYahooEgxChart(ticker, range = "6mo", interval = "1d") {
  const yahoo = `${String(ticker).trim().toUpperCase()}.CA`;
  const timeoutMs = Number(process.env.YAHOO_FETCH_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const result = await fetchYahooChartOnce(yahoo, range, interval, ctrl.signal);
      if (result) return result;
    } catch {
      /* timeout / network */
    } finally {
      clearTimeout(t);
    }
    if (attempt === 0) await sleep(400);
  }
  return null;
}
