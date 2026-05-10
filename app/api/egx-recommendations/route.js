import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { scrapeEgxStocks } from "@/lib/scraper/egx";
import { buildEgxRecommendationsPayload } from "@/lib/egx/recommendations";
import { syncEgxUniverseToKv } from "@/lib/egx/stockKv";

export const revalidate = 120;
export const maxDuration = 120;

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
  { revalidate: 120 }
);

export async function GET() {
  try {
    const data = await loadRecommendations();
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error building recommendations:", error);
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
