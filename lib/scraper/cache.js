/**
 * Enhanced Scraper Cache System
 * Provides intelligent caching with TTL, invalidation, and fallback
 */

import { redis as kv } from '@/lib/kv';
import { scraperLogger } from '@/lib/logger';

const CACHE_KEYS = {
  EGX_STOCKS: 'scraper:egx:stocks',
  EGX_STOCKS_LITE: 'scraper:egx:stocks:lite',
  SCRAPER_STATE: 'scraper:state',
  LAST_SCRAPE: 'scraper:last_scrape',
  SCRAPE_ERRORS: 'scraper:errors',
};

const DEFAULT_TTL = {
  STOCKS: 900, // 15 minutes for full data
  STOCKS_LITE: 300, // 5 minutes for lite data
  STATE: 3600, // 1 hour for state
  ERROR: 60, // 1 minute for error tracking
};

/**
 * Check if EGX market is open
 * EGX market hours: 9:00 AM - 2:30 PM Cairo time (UTC+2 or UTC+3 with DST)
 * Days: Sunday - Thursday
 */
export function isEgxMarketOpen() {
  const now = new Date();
  
  // Convert to Cairo time (UTC+2/UTC+3)
  const cairoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  
  const dayOfWeek = cairoTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = cairoTime.getHours();
  const minutes = cairoTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // Market closes on Friday and Saturday
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return false;
  }
  
  // Market hours: 9:00 AM (540 min) to 2:30 PM (870 min)
  const marketOpen = 9 * 60; // 540 minutes
  const marketClose = 14 * 60 + 30; // 870 minutes (2:30 PM)
  
  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

/**
 * Get appropriate TTL based on market status
 */
export function getAdaptiveTTL(baseType = 'STOCKS_LITE') {
  const isOpen = isEgxMarketOpen();
  
  if (!isOpen) {
    // Market is closed - use longer TTL to reduce unnecessary API calls
    return {
      STOCKS: 21600, // 6 hours
      STOCKS_LITE: 21600, // 6 hours
    }[baseType] || DEFAULT_TTL[baseType];
  }
  
  // Market is open - use shorter TTL for fresher data
  return DEFAULT_TTL[baseType];
}

class ScraperCache {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize cache system
   */
  async initialize() {
    try {
      await kv.get(CACHE_KEYS.SCRAPER_STATE);
      this.isInitialized = true;
      scraperLogger.debug('Cache system initialized');
    } catch (error) {
      scraperLogger.warn('Cache system initialization failed', 'init', { error: error.message });
      this.isInitialized = false;
    }
  }

  /**
   * Get cached stocks
   */
  async getStocks(lite = false) {
    try {
      const cacheKey = lite ? CACHE_KEYS.EGX_STOCKS_LITE : CACHE_KEYS.EGX_STOCKS;
      const cached = await kv.get(cacheKey);

      if (cached) {
        scraperLogger.debug('Cache hit for stocks', 'getStocks', { lite, count: cached?.length });
        return { data: cached, fromCache: true, timestamp: await this.getCacheAge(cacheKey) };
      }

      return { data: null, fromCache: false };
    } catch (error) {
      scraperLogger.warn('Failed to retrieve stocks from cache', 'getStocks', { error: error.message });
      return { data: null, fromCache: false };
    }
  }

  /**
   * Set cached stocks
   */
  async setStocks(stocks, lite = false, ttl = null) {
    try {
      const cacheKey = lite ? CACHE_KEYS.EGX_STOCKS_LITE : CACHE_KEYS.EGX_STOCKS;
      const actualTtl = ttl || (lite ? DEFAULT_TTL.STOCKS_LITE : DEFAULT_TTL.STOCKS);

      await kv.set(cacheKey, stocks, { ex: actualTtl });
      await kv.set(CACHE_KEYS.LAST_SCRAPE, {
        timestamp: new Date().toISOString(),
        count: stocks?.length || 0,
        lite,
      });

      scraperLogger.info('Stocks cached', 'setStocks', { count: stocks?.length, ttl: actualTtl });
    } catch (error) {
      scraperLogger.error('Failed to cache stocks', 'setStocks', { error: error.message });
    }
  }

  /**
   * Invalidate cache
   */
  async invalidate(lite = null) {
    try {
      if (lite === null) {
        await kv.del(CACHE_KEYS.EGX_STOCKS);
        await kv.del(CACHE_KEYS.EGX_STOCKS_LITE);
        scraperLogger.info('All cache invalidated');
      } else {
        const key = lite ? CACHE_KEYS.EGX_STOCKS_LITE : CACHE_KEYS.EGX_STOCKS;
        await kv.del(key);
        scraperLogger.info('Cache invalidated', 'invalidate', { lite });
      }
    } catch (error) {
      scraperLogger.warn('Failed to invalidate cache', 'invalidate', { error: error.message });
    }
  }

  /**
   * Get cache age in seconds
   */
  async getCacheAge(cacheKey) {
    try {
      const ttl = await kv.ttl(cacheKey);
      return ttl > 0 ? DEFAULT_TTL.STOCKS - ttl : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Track scraper errors
   */
  async trackError(error, context = '') {
    try {
      const errorKey = `${CACHE_KEYS.SCRAPE_ERRORS}:${Date.now()}`;
      await kv.set(errorKey, {
        timestamp: new Date().toISOString(),
        context,
        message: error.message,
        stack: error.stack,
      }, { ex: DEFAULT_TTL.ERROR });

      scraperLogger.warn('Scraper error tracked', 'trackError', { context, error: error.message });
    } catch (err) {
      scraperLogger.warn('Failed to track error', 'trackError', { error: err.message });
    }
  }
}

export const scraperCache = new ScraperCache();
