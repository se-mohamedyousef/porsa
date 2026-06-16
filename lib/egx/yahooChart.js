const YAHOO_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 18_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeTicker(ticker) {
  return String(ticker || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.]/g, "");
}

function buildYahooCandidates(ticker) {
  const normalized = normalizeTicker(ticker);
  if (!normalized) return [];

  const noSuffix = normalized.replace(/\.CA$/, "").split(".")[0];
  const candidates = [`${noSuffix}.CA`, normalized, noSuffix];

  return Array.from(new Set(candidates.filter(Boolean)));
}

async function fetchYahooChartOnce(yahoo, range, interval, signal) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahoo
  )}?range=${range}&interval=${interval}`;

  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    return { error: `Yahoo API Error: ${res.status} ${res.statusText}`, status: res.status };
  }
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r) return { error: "No chart data in Yahoo response", status: 404 };

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
      timestamp: d.toISOString(),
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
 * Batch fetch Yahoo EGX charts with concurrency control
 * Groups requests into batches to avoid overwhelming the API
 */
export async function batchFetchYahooEgxCharts(tickers, options = {}) {
  const {
    batchSize = 10,
    delayBetweenBatches = 200,
    range = '6mo',
    interval = '1d'
  } = options;

  const results = {};
  const failedTickers = [];

  // Process in batches
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map(ticker => fetchYahooEgxChart(ticker, range, interval))
      );

      batchResults.forEach((result, idx) => {
        const ticker = batch[idx];
        if (result.status === 'fulfilled' && result.value) {
          results[ticker] = result.value;
        } else {
          failedTickers.push(ticker);
        }
      });

      // Delay between batches to avoid rate limiting
      if (i + batchSize < tickers.length) {
        await sleep(delayBetweenBatches);
      }
    } catch (error) {
      console.warn(`Batch fetch error for tickers starting at ${i}:`, error);
      batch.forEach(t => failedTickers.push(t));
    }
  }

  return { results, failedTickers };
}

/**
 * Quick price fetch for multiple stocks (returns only current price)
 * Much faster than full chart fetch
 */
export async function batchFetchQuickPrices(tickers) {
  const prices = {};
  
  const results = await Promise.allSettled(
    tickers.map(ticker => fetchYahooEgxChart(ticker, '1d', '1m'))
  );

  results.forEach((result, idx) => {
    const ticker = tickers[idx];
    if (result.status === 'fulfilled' && result.value?.meta?.regularMarketPrice) {
      prices[ticker] = result.value.meta.regularMarketPrice;
    }
  });

  return prices;
}

/**
 * Yahoo Finance chart API for EGX listings (suffix .CA = Cairo exchange in Yahoo's namespace).
 * Returns null when the symbol is missing or delisted on Yahoo.
 */
export async function fetchYahooEgxChart(ticker, range = "6mo", interval = "1d") {
  const candidates = buildYahooCandidates(ticker);
  if (!candidates.length) return null;

  const timeoutMs = Number(process.env.YAHOO_FETCH_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  for (const yahoo of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);

      try {
        const result = await fetchYahooChartOnce(yahoo, range, interval, ctrl.signal);

        // Ignore API/network error payloads and keep trying fallbacks/retries.
        if (result?.error) {
          if (attempt === 0 && result.status !== 404) {
            await sleep(400);
          }
          continue;
        }

        if (result && Array.isArray(result.history) && result.history.length > 0) {
          return result;
        }
      } catch {
        /* timeout / network */
      } finally {
        clearTimeout(t);
      }

      if (attempt === 0) await sleep(400);
    }
  }

  return null;
}
