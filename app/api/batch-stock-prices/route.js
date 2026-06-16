/**
 * API Route: Batch Stock Price Fetching
 * POST /api/batch-stock-prices
 * 
 * Fetches current prices for multiple stocks efficiently
 */

import { batchFetchQuickPrices } from '@/lib/egx/yahooChart';
import { fetchTradingViewEgxQuote } from '@/lib/scraper/egx';

export async function POST(request) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return Response.json(
        { error: 'Array of symbols required' },
        { status: 400 }
      );
    }

    // Limit to 50 symbols per request
    const limitedSymbols = symbols.slice(0, 50);

    // Source 1: Try TradingView first (primary live source for EGX)
    const prices = {};
    const tvResults = await Promise.allSettled(
      limitedSymbols.map(sym => fetchTradingViewEgxQuote(sym))
    );
    tvResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value?.price > 0) {
        prices[limitedSymbols[idx]] = result.value.price;
      }
    });

    // Source 2: For any missing symbols, fall back to Yahoo
    const missingSymbols = limitedSymbols.filter(s => prices[s] == null);
    if (missingSymbols.length > 0) {
      const yahooPrices = await batchFetchQuickPrices(missingSymbols);
      Object.assign(prices, yahooPrices);
    }

    return Response.json({
      success: true,
      prices,
      count: Object.keys(prices).length,
      totalRequested: limitedSymbols.length,
    });
  } catch (error) {
    console.error('Batch price fetch error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch batch prices' },
      { status: 500 }
    );
  }
}
