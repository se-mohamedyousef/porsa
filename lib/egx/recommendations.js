function calculateDaysToTarget(currentPrice, targetPrice, dailyMovePercent = 0.5) {
  if (!currentPrice || currentPrice <= 0) return 0;
  const pct = Math.abs(((targetPrice - currentPrice) / currentPrice) * 100);
  return Math.max(1, Math.round(pct / dailyMovePercent));
}

function volumeLabel(v) {
  if (v == null || v === "N/A") return "volume data unavailable";
  if (typeof v === "number" && v > 0) {
    if (v >= 1e6) return `avg liquidity ~${(v / 1e6).toFixed(2)}M shares (recent bars)`;
    if (v >= 1e3) return `avg liquidity ~${(v / 1e3).toFixed(0)}K shares (recent bars)`;
    return `recent volume ${Math.round(v)}`;
  }
  return String(v);
}

function buildBuyReason(s, targetPct) {
  const rsi = s.rsi_14;
  const volNote = volumeLabel(s.avg_volume_30d ?? s.volume);
  const tech =
    rsi != null
      ? `RSI(14) ${rsi.toFixed(1)}.`
      : "Limited technical history; momentum from session change.";
  return `Session momentum ${s.change >= 0 ? "+" : ""}${s.change}%. ${tech} ${volNote}. Rule-based target +${targetPct}% from last quote. Not investment advice.`;
}

function buildSellReason(s) {
  const volNote = volumeLabel(s.avg_volume_30d ?? s.volume);
  return `Weak session momentum ${s.change}%. ${volNote}. Rule-based -5% stress scenario from last quote. Not investment advice.`;
}

function buildLongTermReason(s) {
  const rsi = s.rsi_14;
  const sma = s.sma_20 != null && s.price != null ? (s.price > s.sma_20 ? "above" : "below") : "near";
  const rsiNote =
    rsi != null ? `RSI(14) ${rsi.toFixed(1)} (avoiding extreme overbought).` : "Trend filtered on available history.";
  return `Larger-cap preference from live scan: price ${sma} 20d MA where available. ${rsiNote} Not investment advice.`;
}

function longTermScore(s) {
  let score = 0;
  if (s.change > 0) score += s.change;
  if (s.rsi_14 != null && s.rsi_14 >= 35 && s.rsi_14 <= 68) score += 5;
  if (s.sma_20 != null && s.price != null && s.price > s.sma_20) score += 3;
  const vol = s.avg_volume_30d;
  if (typeof vol === "number" && vol > 500_000) score += 2;
  if (Array.isArray(s.history_90d) && s.history_90d.length >= 60) score += 2;
  return score;
}

/**
 * @param {Array<object>} stocks — output of scrapeEgxStocks (enriched)
 */
export function buildEgxRecommendationsPayload(stocks) {
  if (!stocks?.length) {
    return {
      timestamp: new Date().toISOString(),
      stocks_analyzed: 0,
      recommendations: {
        short_term_buy: [],
        short_term_sell: [],
        long_term_buy: [],
        market_analysis: "No live listings returned from the scanner.",
      },
    };
  }

  const advancers = stocks.filter((s) => s.change > 0).length;
  const decliners = stocks.filter((s) => s.change < 0).length;
  const unchanged = stocks.length - advancers - decliners;

  const sortedUp = [...stocks].sort((a, b) => b.change - a.change);
  const sortedDown = [...stocks].sort((a, b) => a.change - b.change);

  const shortTermTargetPct = 8;

  const short_term_buy = sortedUp.slice(0, 3).map((s) => {
    const target_price = Number((s.price * (1 + shortTermTargetPct / 100)).toFixed(2));
    return {
      symbol: s.symbol,
      current_price: s.price,
      sector: s.sector || "Unknown",
      index: s.index_membership ?? null,
      reason: buildBuyReason(s, shortTermTargetPct),
      target_price,
      expected_return_percent: shortTermTargetPct,
      days_to_target: calculateDaysToTarget(s.price, target_price),
      risk: "MEDIUM",
      volume: s.volume,
      market_cap: s.market_cap ?? null,
      rsi_14: s.rsi_14 ?? null,
      sma_20: s.sma_20 ?? null,
    };
  });

  const short_term_sell = sortedDown.slice(0, 2).map((s) => {
    const target_price = Number((s.price * 0.95).toFixed(2));
    return {
      symbol: s.symbol,
      current_price: s.price,
      sector: s.sector || "Unknown",
      index: s.index_membership ?? null,
      reason: buildSellReason(s),
      target_price,
      expected_return_percent: -5,
      days_to_target: calculateDaysToTarget(s.price, target_price),
      risk: "HIGH",
      volume: s.volume,
      market_cap: s.market_cap ?? null,
    };
  });

  const longPool = [...stocks]
    .filter((s) => s.change > 0)
    .sort((a, b) => longTermScore(b) - longTermScore(a));

  const long_term_buy = longPool.slice(0, 2).map((s) => {
    const targetPct = 12;
    const target_price = Number((s.price * (1 + targetPct / 100)).toFixed(2));
    return {
      symbol: s.symbol,
      current_price: s.price,
      sector: s.sector || "Unknown",
      index: s.index_membership ?? null,
      reason: buildLongTermReason(s),
      target_price,
      expected_return_percent: targetPct,
      days_to_target: calculateDaysToTarget(s.price, target_price, 0.35),
      risk: "LOW",
      volume: s.volume,
      market_cap: s.market_cap ?? null,
      rsi_14: s.rsi_14 ?? null,
      sma_20: s.sma_20 ?? null,
    };
  });

  const market_analysis = `Live EGX movers scan: ${advancers} up, ${decliners} down, ${unchanged} flat (n=${stocks.length}). Short-term picks rank by session % change; long-term list adds basic RSI / MA / history filters where data exists.`;

  return {
    timestamp: new Date().toISOString(),
    stocks_analyzed: stocks.length,
    recommendations: {
      short_term_buy,
      short_term_sell,
      long_term_buy,
      market_analysis,
    },
  };
}
