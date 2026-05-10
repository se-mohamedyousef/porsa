import { NextResponse } from "next/server";
import { redis as kv } from "@/lib/kv";
import { apiLogger } from "@/lib/logger";

export const maxDuration = 30;

/**
 * Health Check Endpoint
 * Verifies system health and dependencies
 */
export async function GET(request) {
  const startTime = Date.now();
  const checks = {};
  let healthy = true;

  try {
    // Check Redis/KV
    try {
      await Promise.race([
        kv.get("health:check"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("KV timeout")), 5000)
        ),
      ]);
      checks.kv = { status: "ok", responseTime: Date.now() - startTime };
    } catch (error) {
      checks.kv = { status: "error", error: error.message };
      healthy = false;
    }

    // Check environment
    checks.environment = {
      status: "ok",
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
    };

    // Check required env vars
    const requiredEnvVars = [
      "KV_REST_API_URL",
      "KV_REST_API_TOKEN",
      "HF_TOKEN",
      "RESEND_API_KEY",
    ];

    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
      checks.environment.status = "warning";
      checks.environment.missingVars = missingVars;
      healthy = false;
    }

    // Build timestamp
    checks.build = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    const response = {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
    };

    apiLogger.info("Health check", "GET", {
      status: response.status,
      responseTime: response.responseTime,
    });

    return NextResponse.json(response, {
      status: healthy ? 200 : 503,
    });
  } catch (error) {
    apiLogger.error("Health check failed", "GET", { error: error.message });

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
        checks,
      },
      { status: 503 }
    );
  }
}
