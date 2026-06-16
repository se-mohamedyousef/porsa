/**
 * EGX Index Compositions — Dynamic from TradingView market cap ranking
 * Top 30 by market cap ≈ EGX30, next 70 ≈ EGX70, combined = EGX100
 * Cached in memory, refreshed every 6 hours
 */

const TV_URL = 'https://scanner.tradingview.com/egypt/scan';
const TV_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

let _cache = { egx30: null, egx70: null, ts: 0 };

// Fallback static sets (from TradingView June 2026 market cap ranking)
const FALLBACK_EGX30 = new Set([
  'COMI','TMGH','SWDY','ETEL','EGAL','EAST','QNBE','MFPC','ORAS','ABUK',
  'ALCN','HDBK','EFIH','ADIB','EMFD','FWRY','SCTS','PHDC','ORHD','GPPL',
  'EFID','HRHO','CANA','JUFO','BTFH','IRON','GBCO','RAYA','CIEB','CLHO',
]);

const FALLBACK_EGX70 = new Set([
  'FAIT','FAITA','VLMRA','VLMR','OCDI','EGCH','HELI','EXPA','VALU','IRAX',
  'ARCC','TAQA','EFIC','EGTS','SKPC','POUL','MTIE','MCQE','EGSA','SCEM',
  'SAUD','CIRA','ORWE','UBEE','MASR','MBSC','PHAR','ISPH','AMES','TALM',
  'MHOT','CICH','EGBE','MOIL','ATQA','BINV','RMDA','AMOC','IFAP','CSAG',
  'OLFI','SVCE','GTHE','BONY','SPHT','NIPH','ISMQ','MIPH','EGAS','OIH',
  'CCAP','ELEC','SUGR','DOMT','PRDC','ACAP','MOIN','SUCE','ZMID','MPRC',
  'NBKE','CPME','BIOC','AXPH','PHTV','EITP','CPCI','CNFN','SPMD','SPIN',
]);

/**
 * Fetch top 100 stocks by market cap from TradingView scanner
 */
async function fetchIndexFromTV() {
  try {
    const res = await fetch(TV_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': TV_UA,
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/',
      },
      body: JSON.stringify({
        filter: [{ left: 'market_cap_basic', operation: 'greater', right: 0 }],
        options: { lang: 'en' },
        markets: ['egypt'],
        columns: ['name', 'market_cap_basic'],
        sort: { sortBy: 'market_cap_basic', sortOrder: 'desc' },
        range: [0, 100],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.data?.length) return null;

    // Filter out non-standard tickers (e.g. EGS... codes)
    const symbols = data.data
      .map(r => String(r.d?.[0] || '').trim().toUpperCase())
      .filter(s => s && /^[A-Z]{2,6}$/.test(s));

    if (symbols.length < 30) return null;

    return {
      egx30: new Set(symbols.slice(0, 30)),
      egx70: new Set(symbols.slice(30, 100)),
    };
  } catch {
    return null;
  }
}

/**
 * Get current index sets (cached, auto-refreshes)
 */
async function getIndices() {
  const now = Date.now();
  if (_cache.egx30 && (now - _cache.ts) < CACHE_TTL) {
    return { egx30: _cache.egx30, egx70: _cache.egx70 };
  }

  const fresh = await fetchIndexFromTV();
  if (fresh) {
    _cache = { egx30: fresh.egx30, egx70: fresh.egx70, ts: now };
    return fresh;
  }

  // Use cache if available (even if stale), otherwise fallback
  if (_cache.egx30) return { egx30: _cache.egx30, egx70: _cache.egx70 };
  return { egx30: FALLBACK_EGX30, egx70: FALLBACK_EGX70 };
}

// Sync versions using cached data (for client-side use)
export const EGX30 = FALLBACK_EGX30;
export const EGX70 = FALLBACK_EGX70;

/**
 * Get the index membership for a stock symbol (sync, uses cache/fallback)
 */
export function getStockIndex(symbol) {
  const s = String(symbol || '').trim().toUpperCase().replace(/\.CA$/, '');
  const indices = _cache.egx30 ? { egx30: _cache.egx30, egx70: _cache.egx70 } : { egx30: FALLBACK_EGX30, egx70: FALLBACK_EGX70 };
  if (indices.egx30.has(s)) return 'EGX30';
  if (indices.egx70.has(s)) return 'EGX70';
  return null;
}

/**
 * Check if a stock belongs to a given index filter (sync)
 */
export function matchesIndexFilter(symbol, filter) {
  if (!filter || filter === 'ALL') return true;
  const idx = getStockIndex(symbol);
  if (filter === 'EGX30') return idx === 'EGX30';
  if (filter === 'EGX70') return idx === 'EGX70';
  if (filter === 'EGX100') return idx === 'EGX30' || idx === 'EGX70';
  return true;
}

/**
 * Async version — ensures fresh data from TradingView
 */
export async function matchesIndexFilterAsync(symbol, filter) {
  if (!filter || filter === 'ALL') return true;
  const indices = await getIndices();
  const s = String(symbol || '').trim().toUpperCase().replace(/\.CA$/, '');
  if (filter === 'EGX30') return indices.egx30.has(s);
  if (filter === 'EGX70') return indices.egx70.has(s);
  if (filter === 'EGX100') return indices.egx30.has(s) || indices.egx70.has(s);
  return true;
}

/**
 * Pre-warm the index cache (call on app startup or API init)
 */
export async function warmIndexCache() {
  await getIndices();
}

/**
 * Index filter options for UI
 */
export const INDEX_FILTERS = [
  { id: 'ALL', label: 'All Stocks' },
  { id: 'EGX30', label: 'EGX 30' },
  { id: 'EGX70', label: 'EGX 70' },
  { id: 'EGX100', label: 'EGX 100' },
];
