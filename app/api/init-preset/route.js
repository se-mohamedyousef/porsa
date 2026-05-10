import { NextResponse } from "next/server";
import { redis } from "../../../lib/kv.js";
import { scrapeEgxStocks } from "@/lib/scraper/egx";
import { buildEgxRecommendationsPayload } from "@/lib/egx/recommendations";
import { syncEgxUniverseToKv } from "@/lib/egx/stockKv";

export const maxDuration = 120;

async function buildFreshPreset() {
  const stocks = await scrapeEgxStocks({
    log: (...a) => {
      if (process.env.NODE_ENV !== "production") console.log(...a);
    },
  });
  await syncEgxUniverseToKv(stocks);
  return buildEgxRecommendationsPayload(stocks);
}

/**
 * Initialize preset data for a user
 * Called when a new user registers to set up default portfolio data and recommendations
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const recommendations = await buildFreshPreset();

    const presetKey = `preset:recommendations:${userId}`;
    await redis.set(presetKey, recommendations);

    const portfolioKey = `portfolio:${userId}`;
    const existingPortfolio = await redis.get(portfolioKey);

    if (!existingPortfolio) {
      const defaultPortfolio = {
        stocks: [],
        alerts: [],
        history: [],
      };
      await redis.set(portfolioKey, defaultPortfolio);
    }

    return NextResponse.json({
      success: true,
      message: "Preset data initialized for user",
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initializing preset data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize preset data",
        details: error.message,
      },
      { status: 503 }
    );
  }
}

/**
 * GET endpoint to retrieve preset recommendations for a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const presetKey = `preset:recommendations:${userId}`;
    let recommendations = await redis.get(presetKey);

    if (!recommendations) {
      recommendations = await buildFreshPreset();
      await redis.set(presetKey, recommendations);
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      source: "preset",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error retrieving preset data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve preset data",
        details: error.message,
      },
      { status: 503 }
    );
  }
}
