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
