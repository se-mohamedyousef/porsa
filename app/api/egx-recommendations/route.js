import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { scrapeEgxStocks } from "@/lib/scraper/egx";
import { buildEgxRecommendationsPayload } from "@/lib/egx/recommendations";
import { syncEgxUniverseToKv } from "@/lib/egx/stockKv";
import { redis as kv } from "@/lib/kv";

export const revalidate = 300; // 5 minutes
export const maxDuration = 120;

// Cache key for KV store
const REC_CACHE_KEY = "egx:recommendations:v2";
const REC_CACHE_TTL = 3600; // 1 hour in seconds

const loadRecommendations = unstable_cache(
  async () => {
    const stocks = await scrapeEgxStocks({
      log: (...args) => {
        if (process.env.NODE_ENV !== "production") console.log(...args);
      },
    });
    await syncEgxUniverseToKv(stocks);
    return buildEgxRecommendationsPayload(stocks);
  },
  ["egx-recommendations-v2"],
  { revalidate: 300 }
);

export async function GET() {
  try {
    // Try to get from KV cache first (1 hour TTL)
    let cachedData = null;
    try {
      cachedData = await kv.get(REC_CACHE_KEY);
    } catch (kvError) {
      console.warn("KV cache read error:", kvError);
    }

    if (cachedData && typeof cachedData === 'object' && cachedData.data) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        timestamp: cachedData.timestamp,
        cached: true,
        cacheAge: Math.floor((Date.now() - new Date(cachedData.timestamp).getTime()) / 1000),
      });
    }

    // Not in cache or cache expired, load fresh data
    const data = await loadRecommendations();
    
    // Store in KV cache for next request
    try {
      await kv.set(
        REC_CACHE_KEY,
        {
          data,
          timestamp: new Date().toISOString(),
        },
        { ex: REC_CACHE_TTL }
      );
    } catch (kvError) {
      console.warn("KV cache write error:", kvError);
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error("Error building recommendations:", error);
    
    // Try to return stale cache on error
    try {
      const staleData = await kv.get(REC_CACHE_KEY);
      if (staleData && typeof staleData === 'object' && staleData.data) {
        return NextResponse.json({
          success: true,
          data: staleData.data,
          timestamp: staleData.timestamp,
          cached: true,
          stale: true,
          error: "Using cached data due to processing error",
        }, { status: 200 });
      }
    } catch (kvError) {
      console.warn("Failed to retrieve stale cache:", kvError);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to build recommendations from live sources",
        details: error.message,
      },
      { status: 503 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: "Recommendations data is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Acknowledged (client-driven refresh not persisted server-side)",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating recommendations:", error);
    return NextResponse.json({ error: "Failed to update recommendations" }, { status: 500 });
  }
}
