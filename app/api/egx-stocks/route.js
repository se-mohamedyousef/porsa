import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export async function GET(req) {
  try {
    const projectRoot = path.join(process.cwd());
    const pythonScript = path.join(projectRoot, "egx_stock_analyzer.py");
    const fullDataFile = path.join(projectRoot, "egx_stocks_full.json");
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      return NextResponse.json(
        { error: "Stock analyzer not configured" },
        { status: 500 }
      );
    }

    // Set environment variable for Groq API key
    const env = {
      ...process.env,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    };

    // Run Python analyzer to fetch fresh stock data
    const pythonPath = path.join(projectRoot, "venv/bin/python");
    try {
      await execAsync(
        `${pythonPath} ${pythonScript}`,
        { env, cwd: projectRoot, timeout: 60000 }
      );
    } catch (execError) {
      // Python script may exit with error code even when saving error state successfully
      // This is expected in error-first mode, so we continue to read the JSON file
    }

    // Read scraped results
    if (fs.existsSync(fullDataFile)) {
      const data = fs.readFileSync(fullDataFile, "utf-8");
      const parsed = JSON.parse(data);
      
      // Check if scraper had an error
      if (parsed.error) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error,
            message: "❌ Failed to fetch real EGX data",
            stocks: [],
            count: 0,
            timestamp: parsed.timestamp,
          },
          { status: 503 }
        );
      }
      
      const stocks = parsed.stocks || [];
      
      // If no stocks fetched, return error
      if (stocks.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No stocks retrieved from EGX",
            message: "Scraper failed to fetch any real stock data. This could be due to network issues or EGX website changes.",
            stocks: [],
            count: 0,
            timestamp: parsed.timestamp,
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json({
        success: true,
        stocks: stocks,
        count: stocks.length,
        timestamp: parsed.timestamp || new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { 
        success: false,
        error: "No stocks data file",
        message: "Failed to generate stocks data from scraper.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("EGX Stocks error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stocks",
        details: error.message,
        stocks: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
