'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import styles from './RecommendationCard.module.css';

/**
 * RecommendationCard
 * Displays a clear, actionable stock recommendation card.
 * Supports: BUY/SELL/HOLD (for new recommendations) and KEEP/SELL/ADD (for holdings).
 * 
 * Props:
 *  - data: { action, confidence, ticker, stockName, currentPrice, entryPrice, targetPrice,
 *            stopLoss, expectedReturn, maxRisk, positionSizeAdvice, timeframe, topReason,
 *            bullPoints, bearPoints, riskLevel, consensusScore, portfolioWarnings,
 *            buyPrice, profitPercent, quantity }
 *  - onViewDetails: (ticker) => void
 *  - mode: 'recommendation' | 'holding'
 */
export default function RecommendationCard({ data, onViewDetails, mode = 'recommendation' }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const {
    action = 'HOLD',
    confidence = 0,
    ticker = '',
    stockName = '',
    currentPrice = 0,
    entryPrice = 0,
    targetPrice = 0,
    stopLoss = 0,
    expectedReturn = 0,
    maxRisk = 0,
    positionSizeAdvice = '',
    timeframe = '',
    topReason = '',
    bullPoints = [],
    bearPoints = [],
    riskLevel = 'MEDIUM',
    consensusScore = 0,
    portfolioWarnings = [],
    // Holdings-specific
    buyPrice = 0,
    profitPercent = 0,
    quantity = 0,
    reason = ''
  } = data;

  const actionUpper = action.toUpperCase();
  const displayReason = reason || topReason;

  // Card style based on action
  const cardClass = `${styles.card} ${
    actionUpper === 'BUY' ? styles.cardBuy :
    actionUpper === 'SELL' ? styles.cardSell :
    actionUpper === 'ADD' ? styles.cardAdd :
    actionUpper === 'KEEP' ? styles.cardKeep :
    styles.cardHold
  }`;

  const badgeClass = `${styles.badge} ${
    actionUpper === 'BUY' ? styles.badgeBuy :
    actionUpper === 'SELL' ? styles.badgeSell :
    actionUpper === 'ADD' ? styles.badgeAdd :
    actionUpper === 'KEEP' ? styles.badgeKeep :
    styles.badgeHold
  }`;

  const ActionIcon = actionUpper === 'BUY' || actionUpper === 'ADD'
    ? TrendingUp
    : actionUpper === 'SELL'
      ? TrendingDown
      : Minus;

  const confidenceClass = confidence >= 65
    ? styles.confidenceHigh
    : confidence >= 40
      ? styles.confidenceMid
      : styles.confidenceLow;

  const riskClass = riskLevel === 'LOW'
    ? styles.riskLow
    : riskLevel === 'HIGH'
      ? styles.riskHigh
      : styles.riskMedium;

  return (
    <div className={cardClass} onClick={() => setExpanded(!expanded)}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.tickerSection}>
          <span className={styles.ticker}>{ticker}</span>
          {stockName && stockName !== ticker && (
            <span className={styles.stockName}>{stockName}</span>
          )}
        </div>
        <span className={badgeClass}>
          <ActionIcon size={14} />
          {actionUpper}
        </span>
      </div>

      {/* Price + Return */}
      <div className={styles.priceRow}>
        <div>
          <span className={styles.currentPrice}>
            {currentPrice > 0 ? currentPrice.toFixed(2) : '—'}
          </span>
          <span className={styles.currency}>EGP</span>
        </div>
        {mode === 'holding' && profitPercent !== 0 && (
          <span className={`${styles.returnBadge} ${profitPercent >= 0 ? styles.returnPositive : styles.returnNegative}`}>
            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%
          </span>
        )}
        {mode === 'recommendation' && expectedReturn !== 0 && (
          <span className={`${styles.returnBadge} ${expectedReturn >= 0 ? styles.returnPositive : styles.returnNegative}`}>
            {expectedReturn >= 0 ? '+' : ''}{expectedReturn.toFixed(1)}% expected
          </span>
        )}
      </div>

      {/* P&L for holdings */}
      {mode === 'holding' && buyPrice > 0 && (
        <div className={styles.pnlRow}>
          <span className={styles.pnlLabel}>
            {quantity} shares @ {buyPrice.toFixed(2)} EGP
          </span>
          <span className={`${styles.pnlValue} ${profitPercent >= 0 ? styles.pnlPositive : styles.pnlNegative}`}>
            {profitPercent >= 0 ? '+' : ''}{((currentPrice - buyPrice) * quantity).toFixed(0)} EGP
          </span>
        </div>
      )}

      {/* Price targets */}
      {(entryPrice > 0 || targetPrice > 0 || stopLoss > 0) && (
        <div className={styles.targets}>
          <div className={styles.targetItem}>
            <div className={styles.targetLabel}>Entry</div>
            <div className={`${styles.targetValue} ${styles.targetEntry}`}>
              {entryPrice > 0 ? entryPrice.toFixed(2) : '—'}
            </div>
          </div>
          <div className={styles.targetItem}>
            <div className={styles.targetLabel}>Target</div>
            <div className={`${styles.targetValue} ${styles.targetTarget}`}>
              {targetPrice > 0 ? targetPrice.toFixed(2) : '—'}
            </div>
          </div>
          <div className={styles.targetItem}>
            <div className={styles.targetLabel}>Stop</div>
            <div className={`${styles.targetValue} ${styles.targetStop}`}>
              {stopLoss > 0 ? stopLoss.toFixed(2) : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Reason */}
      {displayReason && (
        <div className={styles.reason}>{displayReason}</div>
      )}

      {/* Confidence bar */}
      <div className={styles.confidenceRow}>
        <span className={styles.confidenceLabel}>Confidence</span>
        <div className={styles.confidenceBar}>
          <div
            className={`${styles.confidenceFill} ${confidenceClass}`}
            style={{ width: `${Math.min(100, confidence)}%` }}
          />
        </div>
        <span className={styles.confidenceValue}>{Math.round(confidence)}%</span>
      </div>

      {/* Meta row */}
      <div className={styles.meta}>
        <span className={`${styles.riskBadge} ${riskClass}`}>
          {riskLevel} RISK
        </span>
        {timeframe && <span>{timeframe}</span>}
        {positionSizeAdvice && <span>{positionSizeAdvice}</span>}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className={styles.expanded}>
          {/* Bull / Bear points */}
          {(bullPoints.length > 0 || bearPoints.length > 0) && (
            <div className={styles.bullBearGrid}>
              <div className={styles.bullSection}>
                <div className={`${styles.sectionTitle} ${styles.bullTitle}`}>Bull Case</div>
                <ul className={styles.pointList}>
                  {bullPoints.map((p, i) => <li key={i}>{p}</li>)}
                  {bullPoints.length === 0 && <li>No strong bullish signals</li>}
                </ul>
              </div>
              <div className={styles.bearSection}>
                <div className={`${styles.sectionTitle} ${styles.bearTitle}`}>Bear Case</div>
                <ul className={styles.pointList}>
                  {bearPoints.map((p, i) => <li key={i}>{p}</li>)}
                  {bearPoints.length === 0 && <li>No strong bearish signals</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Portfolio warnings */}
          {portfolioWarnings && portfolioWarnings.length > 0 && (
            <div className={styles.warnings}>
              {portfolioWarnings.map((w, i) => (
                <div key={i} className={styles.warning}>
                  <AlertTriangle size={12} style={{ marginRight: 4 }} />
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* View full analysis link */}
          {onViewDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetails(ticker); }}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '8px',
                background: 'var(--bg-secondary, #f1f5f9)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-primary, #334155)'
              }}
            >
              View Full Analysis →
            </button>
          )}
        </div>
      )}

      {/* Expand toggle */}
      <div className={styles.expandToggle}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
    </div>
  );
}
