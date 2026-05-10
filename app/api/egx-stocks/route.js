import { NextResponse } from "next/server";
import { scrapeEgxStocks } from "@/lib/scraper/egx";
import { syncEgxUniverseToKv } from "@/lib/egx/stockKv";
import { apiLogger } from "@/lib/logger";
import { scraperCache } from "@/lib/scraper/cache";

export const maxDuration = 120;

function stripHistory(stocks) {
  return stocks.map(({ history_90d: _h, ...rest }) => rest);
}

export async function GET(request) {
  const startTime = Date.now();
  let success = false;
  let statusCode = 200;

  try {
    const { searchParams } = new URL(request.url);
    const lite = searchParams.get("lite") === "1" || searchParams.get("lite") === "true";
    const forceFresh = searchParams.get("fresh") === "1" || searchParams.get("fresh") === "true";

    apiLogger.debug("EGX stocks request", "GET", { lite, forceFresh });

    const stocks = await scrapeEgxStocks({
      log: (...args) => {
        if (process.env.NODE_ENV !== "production") console.log(...args);
      },
      useCache: !forceFresh,
      forceFresh,
    });

    // Sync to KV store asynchronously (don't block response)
    syncEgxUniverseToKv(stocks).catch((err) => {
      apiLogger.warn("Failed to sync stocks to KV", "syncEgxUniverseToKv", {
        error: err.message,
      });
    });

    const payload = lite ? stripHistory(stocks) : stocks;
    success = true;

    return NextResponse.json(
      {
        success: true,
        stocks: payload,
        count: payload.length,
        timestamp: new Date().toISOString(),
        lite,
        cached: false,
        executionTime: Date.now() - startTime,
      },
      { status: 200 }
    );
  } catch (error) {
    statusCode = 503;
    apiLogger.error("EGX Stocks error", "GET", {
      error: error.message,
      stack: error.stack,
    });

    // Try to return cached data on error
    try {
      const cached = await scraperCache.getStocks(false);
      if (cached.data) {
        const lite = searchParams.get("lite") === "1" || searchParams.get("lite") === "true";
        const payload = lite ? stripHistory(cached.data) : cached.data;

        return NextResponse.json(
          {
            success: true,
            stocks: payload,
            count: payload.length,
            timestamp: new Date().toISOString(),
            lite,
            cached: true,
            cacheAge: cached.timestamp,
            fallbackReason: error.message,
            executionTime: Date.now() - startTime,
          },
          { status: 200 }
        );
      }
    } catch (cacheErr) {
      apiLogger.warn("Fallback cache also failed", "GET", {
        error: cacheErr.message,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch live EGX data and no cached data available",
        stocks: [],
        count: 0,
        executionTime: Date.now() - startTime,
      },
      { status: statusCode }
    );
  }
}
