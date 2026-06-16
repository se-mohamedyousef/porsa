/**
 * StockScorer — Multi-factor scoring engine for EGX stocks.
 * Deterministic scoring based on real data only.
 * Used for ranking recommendations and as LLM fallback.
 *
 * Factors:
 *   Technical (40%) — RSI zone, MA alignment, MACD crossover, Bollinger position
 *   Momentum  (20%) — 1W/1M/3M returns, trend consistency
 *   Volume    (20%) — volume ratio vs avg, accumulation/distribution pattern
 *   Risk      (20%) — volatility rank, drawdown, 52-week position
 */

export class StockScorer {

  /**
   * Score a stock from collected data.
   * @param {object} collected — output of DataCollector.collectAll()
   * @returns {{ score: number, category: string, factors: object }}
   */
  static score(collected) {
    const tech = collected.technical || {};
    const fund = collected.fundamental || {};
    const news = collected.news || {};

    const technicalScore = this.scoreTechnical(tech);
    const momentumScore  = this.scoreMomentum(tech);
    const volumeScore    = this.scoreVolume(tech);
    const riskScore      = this.scoreRisk(tech);
    const newsBonus      = this.scoreNews(news);

    // Weighted composite (sums to 100 base)
    const raw = (
      technicalScore.score * 0.40 +
      momentumScore.score  * 0.20 +
      volumeScore.score    * 0.20 +
      riskScore.score      * 0.20 +
      newsBonus.bonus // ±5 max
    );

    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const category = this.classify(score);

    return {
      score,
      category,
      factors: {
        technical: technicalScore,
        momentum: momentumScore,
        volume: volumeScore,
        risk: riskScore,
        news: newsBonus,
      },
      // Quick summary for recommendation cards
      topSignals: this.extractTopSignals(technicalScore, momentumScore, volumeScore, riskScore, newsBonus),
      // Price targets based on technical levels
      targets: this.computeTargets(tech, score),
    };
  }

  // ── Technical Factor (0-100) ──
  static scoreTechnical(tech) {
    if (!tech.available) return { score: 50, details: 'No technical data' };

    let score = 50; // Start neutral
    const details = [];

    // RSI (0-100) — sweet spot is 40-60 for entry, penalize extremes
    if (tech.rsi != null) {
      if (tech.rsi >= 30 && tech.rsi <= 50) {
        score += 15; // Approaching from oversold — good entry
        details.push(`RSI ${tech.rsi.toFixed(0)} (recovery zone)`);
      } else if (tech.rsi > 50 && tech.rsi <= 65) {
        score += 10; // Healthy momentum
        details.push(`RSI ${tech.rsi.toFixed(0)} (healthy momentum)`);
      } else if (tech.rsi > 65 && tech.rsi <= 75) {
        score += 0; // Getting hot
        details.push(`RSI ${tech.rsi.toFixed(0)} (approaching overbought)`);
      } else if (tech.rsi > 75) {
        score -= 15; // Overbought
        details.push(`RSI ${tech.rsi.toFixed(0)} (overbought ⚠️)`);
      } else if (tech.rsi < 30) {
        score += 5; // Oversold — could bounce but risky
        details.push(`RSI ${tech.rsi.toFixed(0)} (oversold)`);
      }
    }

    // MA Alignment
    if (tech.maAlignment) {
      const maScores = {
        'strong-bullish': 20, 'bullish': 15, 'mild-bullish': 8,
        'neutral': 0,
        'mild-bearish': -8, 'bearish': -15, 'strong-bearish': -20,
      };
      score += maScores[tech.maAlignment] || 0;
      details.push(`MA: ${tech.maAlignment}`);
    }

    // MACD crossover
    if (tech.macdCrossover === 'bullish') {
      score += 10;
      details.push('MACD bullish crossover');
    } else if (tech.macdCrossover === 'bearish') {
      score -= 10;
      details.push('MACD bearish crossover');
    }

    // Bollinger Band position
    if (tech.bollingerBands) {
      const pctB = tech.bollingerBands.percentB;
      if (pctB < 0.2) {
        score += 5; // Near lower band — potential bounce
        details.push('Near Bollinger lower band');
      } else if (pctB > 0.8) {
        score -= 5; // Near upper band — potential pullback
        details.push('Near Bollinger upper band');
      }
    }

    return { score: Math.max(0, Math.min(100, score)), details };
  }

  // ── Momentum Factor (0-100) ──
  static scoreMomentum(tech) {
    if (!tech.available) return { score: 50, details: 'No momentum data' };

    let score = 50;
    const details = [];

    // Weekly momentum
    if (tech.weekChange != null) {
      if (tech.weekChange > 5) { score += 15; details.push(`Week +${tech.weekChange.toFixed(1)}%`); }
      else if (tech.weekChange > 2) { score += 10; details.push(`Week +${tech.weekChange.toFixed(1)}%`); }
      else if (tech.weekChange > 0) { score += 5; }
      else if (tech.weekChange < -5) { score -= 15; details.push(`Week ${tech.weekChange.toFixed(1)}%`); }
      else if (tech.weekChange < -2) { score -= 10; }
      else if (tech.weekChange < 0) { score -= 5; }
    }

    // Monthly momentum
    if (tech.monthChange != null) {
      if (tech.monthChange > 10) { score += 10; details.push(`Month +${tech.monthChange.toFixed(1)}%`); }
      else if (tech.monthChange > 3) { score += 5; }
      else if (tech.monthChange < -10) { score -= 10; details.push(`Month ${tech.monthChange.toFixed(1)}%`); }
      else if (tech.monthChange < -3) { score -= 5; }
    }

    // 3-month momentum
    if (tech.threeMonthChange != null) {
      if (tech.threeMonthChange > 20) { score += 10; details.push(`3M +${tech.threeMonthChange.toFixed(1)}%`); }
      else if (tech.threeMonthChange > 5) { score += 5; }
      else if (tech.threeMonthChange < -20) { score -= 10; }
      else if (tech.threeMonthChange < -5) { score -= 5; }
    }

    // Trend consistency — all timeframes positive = bonus
    if (tech.weekChange > 0 && tech.monthChange > 0 && tech.threeMonthChange > 0) {
      score += 5;
      details.push('Consistent uptrend');
    }

    return { score: Math.max(0, Math.min(100, score)), details };
  }

  // ── Volume Factor (0-100) ──
  static scoreVolume(tech) {
    if (!tech.available || !tech.volume) return { score: 50, details: 'No volume data' };

    let score = 50;
    const details = [];
    const vol = tech.volume;

    // Volume ratio (current vs 20-day avg)
    if (vol.ratio > 2.0) {
      score += 20; details.push(`Volume ${vol.ratio.toFixed(1)}x avg (breakout signal)`);
    } else if (vol.ratio > 1.5) {
      score += 15; details.push(`Volume ${vol.ratio.toFixed(1)}x avg (high interest)`);
    } else if (vol.ratio > 1.0) {
      score += 5;
    } else if (vol.ratio < 0.5) {
      score -= 10; details.push('Low volume (weak conviction)');
    }

    // Accumulation pattern (high volume + price up)
    if (vol.accumulation) {
      score += 10; details.push('Accumulation pattern');
    }
    // Distribution pattern (high volume + price down)
    if (vol.distribution) {
      score -= 10; details.push('Distribution pattern ⚠️');
    }

    // Minimum liquidity check
    if (vol.avg20 > 0 && vol.avg20 < 50000) {
      score -= 15; details.push('Low liquidity ⚠️');
    }

    return { score: Math.max(0, Math.min(100, score)), details };
  }

  // ── Risk Factor (0-100, higher = lower risk = better) ──
  static scoreRisk(tech) {
    if (!tech.available) return { score: 50, details: 'No risk data' };

    let score = 70; // Start optimistic
    const details = [];

    // Volatility — lower is better for risk score
    if (tech.volatility != null) {
      if (tech.volatility > 50) { score -= 30; details.push(`High volatility ${tech.volatility.toFixed(0)}%`); }
      else if (tech.volatility > 35) { score -= 15; details.push(`Moderate-high volatility ${tech.volatility.toFixed(0)}%`); }
      else if (tech.volatility > 20) { score -= 5; }
      else { score += 10; details.push(`Low volatility ${tech.volatility.toFixed(0)}%`); }
    }

    // Max drawdown
    if (tech.maxDrawdown != null) {
      if (tech.maxDrawdown > 30) { score -= 15; details.push(`Max drawdown ${tech.maxDrawdown.toFixed(0)}%`); }
      else if (tech.maxDrawdown > 20) { score -= 5; }
    }

    // 52-week position — near low is higher risk but could be value
    if (tech.fiftyTwoWeekPosition != null) {
      if (tech.fiftyTwoWeekPosition < 20) {
        score -= 10; details.push('Near 52-week low');
      } else if (tech.fiftyTwoWeekPosition > 80) {
        score -= 5; details.push('Near 52-week high');
      }
    }

    return { score: Math.max(0, Math.min(100, score)), details };
  }

  // ── News Bonus (±8 added to composite) ──
  static scoreNews(news) {
    if (!news || news.count === 0) return { bonus: 0, details: ['No news data'] };

    let bonus = 0;
    const details = [];

    // Keyword-based sentiment
    if (news.sentimentScore > 0.3) { bonus += 2; details.push(`Positive news sentiment (${news.count} articles)`); }
    else if (news.sentimentScore < -0.3) { bonus -= 2; details.push(`Negative news sentiment`); }

    // LLM deep analysis sentiment (stronger weight)
    const llm = news.llmInsights;
    if (llm) {
      if (llm.sentiment === 'bullish') { bonus += 3; details.push('AI analysis: bullish news outlook'); }
      else if (llm.sentiment === 'bearish') { bonus -= 3; details.push('AI analysis: bearish news outlook'); }
      if (llm.impactLevel === 'high') { bonus += (llm.sentiment === 'bullish' ? 1 : llm.sentiment === 'bearish' ? -1 : 0); details.push('High impact news detected'); }
    }

    // Recent news volume
    if (news.recentCount > 10) { bonus += 2; details.push(`${news.recentCount} articles this week — high attention`); }
    else if (news.recentCount > 5) { bonus += 1; details.push(`${news.recentCount} articles this week`); }

    // Deals/partnerships are typically positive catalysts
    const cats = news.categories || {};
    if (cats.deals?.length > 0) { bonus += 1; details.push(`${cats.deals.length} deal/partnership news`); }

    return { bonus: Math.max(-8, Math.min(8, bonus)), details };
  }

  // ── Classification ──
  static classify(score) {
    if (score >= 75) return 'STRONG_BUY';
    if (score >= 60) return 'BUY';
    if (score >= 45) return 'HOLD';
    if (score >= 30) return 'SELL';
    return 'STRONG_SELL';
  }

  // ── Extract top 3-5 signals for display ──
  static extractTopSignals(tech, momentum, volume, risk, news) {
    const all = [
      ...tech.details.map(d => ({ text: d, factor: 'Technical' })),
      ...momentum.details.map(d => ({ text: d, factor: 'Momentum' })),
      ...volume.details.map(d => ({ text: d, factor: 'Volume' })),
      ...risk.details.map(d => ({ text: d, factor: 'Risk' })),
      ...news.details.map(d => ({ text: d, factor: 'News' })),
    ];
    return all.slice(0, 5);
  }

  // ── Compute price targets from real technical levels ──
  static computeTargets(tech, score) {
    if (!tech.available || !tech.price) return null;

    const price = tech.price;
    const support = tech.support || price * 0.95;
    const resistance = tech.resistance || price * 1.10;
    const volatility = tech.volatility || 25;

    // Entry: current price for BUY, support zone for value entry
    const entry = Math.round(price * 100) / 100;

    // Target: based on resistance and volatility
    const target = score >= 60
      ? Math.round(Math.max(resistance, price * (1 + volatility / 200)) * 100) / 100
      : Math.round(resistance * 100) / 100;

    // Stop: based on support and volatility
    const stop = Math.round(Math.min(support * 0.97, price * (1 - volatility / 300)) * 100) / 100;

    // Risk-reward ratio
    const reward = target - price;
    const risk = price - stop;
    const riskReward = risk > 0 ? Math.round((reward / risk) * 100) / 100 : 0;

    return {
      entry,
      target,
      stop,
      expectedReturn: price > 0 ? Math.round(((target - price) / price) * 100 * 10) / 10 : 0,
      maxRisk: price > 0 ? Math.round(((stop - price) / price) * 100 * 10) / 10 : 0,
      riskReward,
      timeframe: volatility > 30 ? '2-4 weeks' : '1-3 months',
    };
  }

  /**
   * Score and rank an array of collected stock data.
   * Returns sorted array with scores.
   */
  static rankStocks(collectedMap) {
    const scored = [];

    for (const [ticker, data] of Object.entries(collectedMap)) {
      if (data.error) continue;
      const result = this.score(data);
      scored.push({
        ticker,
        ...result,
        price: data.technical?.price || 0,
        name: data.technical?.name || ticker,
        pe: data.fundamental?.pe || null,
        sector: data.fundamental?.sector || 'Unknown',
        marketCap: data.fundamental?.marketCap || null,
        marketCapTier: data.fundamental?.marketCapTier || 'unknown',
        newsCount: data.news?.count || 0,
        newsSentiment: data.news?.sentiment || 'neutral',
        dailyChange: data.technical?.dailyChangePercent || 0,
        volume: data.technical?.volume?.current || 0,
        volumeRatio: data.technical?.volume?.ratio || 1,
        rsi: data.technical?.rsi || null,
      });
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }
}

export default StockScorer;
