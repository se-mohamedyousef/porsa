import { NextResponse } from "next/server";
import { fetchYahooEgxChart } from "@/lib/egx/yahooChart";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol?.trim()) {
    return NextResponse.json({ error: "symbol query required" }, { status: 400 });
  }

  try {
    const chart = await fetchYahooEgxChart(symbol.trim(), "1y", "1d");
    if (!chart) {
      return NextResponse.json(
        { success: false, error: "No Yahoo chart data for symbol", symbol: symbol.trim() },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      symbol: symbol.trim().toUpperCase(),
      yahoo_symbol: chart.yahooSymbol,
      meta: chart.meta,
      bars: chart.history,
    });
  } catch (e) {
    console.error("egx-chart", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
