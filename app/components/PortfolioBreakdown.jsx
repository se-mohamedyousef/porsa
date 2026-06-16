'use client';

import { useMemo } from 'react';
import styles from './PortfolioBreakdown.module.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/**
 * PortfolioBreakdown
 * Shows diversification view: concentration per stock, sector allocation,
 * investment type split, and total P&L summary.
 *
 * Props:
 *  - portfolio: Array of stock objects from useUserData
 */
export default function PortfolioBreakdown({ portfolio = [] }) {
  const analysis = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return null;

    const totalValue = portfolio.reduce((sum, s) => sum + (s.currentPrice || 0) * (s.quantity || 0), 0);
    const totalCost = portfolio.reduce((sum, s) => sum + (s.buyPrice || 0) * (s.quantity || 0), 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // Per-stock concentration
    const stockWeights = portfolio
      .map(s => ({
        symbol: s.symbol,
        value: (s.currentPrice || 0) * (s.quantity || 0),
        weight: totalValue > 0 ? ((s.currentPrice || 0) * (s.quantity || 0) / totalValue) * 100 : 0,
        profit: (s.currentPrice || 0) * (s.quantity || 0) - (s.buyPrice || 0) * (s.quantity || 0),
        profitPercent: s.profitPercent || 0
      }))
      .sort((a, b) => b.weight - a.weight);

    // Sector breakdown
    const sectorMap = {};
    portfolio.forEach(s => {
      const sector = s.sector || 'Unknown';
      if (!sectorMap[sector]) sectorMap[sector] = { value: 0, count: 0 };
      sectorMap[sector].value += (s.currentPrice || 0) * (s.quantity || 0);
      sectorMap[sector].count += 1;
    });

    const sectors = Object.entries(sectorMap)
      .map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count,
        weight: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.weight - a.weight);

    // Investment type split
    const longTerm = portfolio.filter(s => s.investmentType === 'long-term').length;
    const shortTerm = portfolio.filter(s => s.investmentType === 'short-term').length;

    return {
      totalValue,
      totalCost,
      totalProfit,
      totalProfitPercent,
      stockWeights,
      sectors,
      longTerm,
      shortTerm,
      stockCount: portfolio.length
    };
  }, [portfolio]);

  if (!analysis) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          No stocks in portfolio. Add stocks to see your portfolio breakdown.
        </div>
      </div>
    );
  }

  const { totalValue, totalCost, totalProfit, totalProfitPercent, stockWeights, sectors, longTerm, shortTerm, stockCount } = analysis;

  // Build CSS conic gradient for pie chart
  let pieGradient = '';
  let cumPercent = 0;
  const sectorColors = sectors.map((s, i) => {
    const color = COLORS[i % COLORS.length];
    const start = cumPercent;
    cumPercent += s.weight;
    return { ...s, color, start, end: cumPercent };
  });

  if (sectorColors.length > 0) {
    const gradientParts = sectorColors.map(s =>
      `${s.color} ${s.start.toFixed(1)}% ${s.end.toFixed(1)}%`
    );
    pieGradient = `conic-gradient(${gradientParts.join(', ')})`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>Portfolio Overview</div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Value</div>
          <div className={styles.summaryValue}>
            {totalValue.toLocaleString('en', { maximumFractionDigits: 0 })} EGP
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total P&L</div>
          <div className={`${styles.summaryValue} ${totalProfit >= 0 ? styles.summaryPositive : styles.summaryNegative}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('en', { maximumFractionDigits: 0 })} EGP
            <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4 }}>
              ({totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Cost</div>
          <div className={styles.summaryValue}>
            {totalCost.toLocaleString('en', { maximumFractionDigits: 0 })} EGP
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Stocks</div>
          <div className={styles.summaryValue}>{stockCount}</div>
        </div>
      </div>

      {/* Sector Allocation */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Sector Allocation</div>
        <div className={styles.pieContainer}>
          <div className={styles.pie} style={{ background: pieGradient || '#e2e8f0' }} />
          <div className={styles.legend}>
            {sectorColors.map((s, i) => (
              <div key={i} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: s.color }} />
                <span>{s.name} ({s.count})</span>
                <span className={styles.legendValue}>{s.weight.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Concentration */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Stock Concentration</div>
        {stockWeights.map((s, i) => (
          <div key={i} className={styles.barItem}>
            <span className={styles.barLabel}>{s.symbol}</span>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${
                  s.weight > 25 ? styles.barDanger :
                  s.weight > 15 ? styles.barWarning :
                  styles.barSafe
                }`}
                style={{ width: `${Math.min(100, s.weight)}%` }}
              />
            </div>
            <span className={styles.barPercent}>{s.weight.toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Investment Type Split */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Investment Type</div>
        <div className={styles.typeSplit}>
          <div className={styles.typeCard}>
            <div className={styles.typeCount}>{longTerm}</div>
            <div className={styles.typeLabel}>Long Term</div>
          </div>
          <div className={styles.typeCard}>
            <div className={styles.typeCount}>{shortTerm}</div>
            <div className={styles.typeLabel}>Short Term</div>
          </div>
        </div>
      </div>
    </div>
  );
}
