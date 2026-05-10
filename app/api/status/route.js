import { NextResponse } from "next/server";
import { redis as kv } from "@/lib/kv";
import { apiLogger } from "@/lib/logger";

export const maxDuration = 30;

/**
 * System Status and Monitoring Endpoint
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const verbose = searchParams.get("verbose") === "true";

    const status = {
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Check scraper status
    try {
      const lastScrape = await kv.get("scraper:last_scrape");
      status.services.scraper = {
        status: lastScrape ? "ok" : "never_run",
        lastExecution: lastScrape?.timestamp || null,
        stockCount: lastScrape?.count || 0,
      };
    } catch (error) {
      status.services.scraper = { status: "error", error: error.message };
    }

    // Check agent executions if verbose
    if (verbose) {
      try {
        const recentExecutions = await kv.lrange("agent:executions", 0, 9);
        status.services.agents = {
          status: recentExecutions?.length > 0 ? "ok" : "idle",
          recentCount: recentExecutions?.length || 0,
        };
      } catch (error) {
        status.services.agents = { status: "error", error: error.message };
      }

      // Check errors
      try {
        const errorKeys = await kv.keys("scraper:errors:*");
        status.services.errors = {
          count: errorKeys?.length || 0,
        };
      } catch (error) {
        status.services.errors = { status: "error" };
      }
    }

    const allHealthy = Object.values(status.services).every(
      (s) => s.status === "ok" || s.status === "idle" || s.status === "never_run"
    );

    return NextResponse.json(
      {
        ...status,
        overallStatus: allHealthy ? "operational" : "degraded",
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    apiLogger.error("Status check failed", "GET", { error: error.message });

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        overallStatus: "error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
