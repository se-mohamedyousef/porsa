import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './StockHeader.module.css';

/**
 * StockHeader Component
 * Displays stock name, current price, and quick actions
 */
export default function StockHeader({ ticker, analysis }) {
  const { t } = useLanguageSimple();

  // Mock price data - in production, use real data
  const mockPrice = 95 + Math.random() * 10;
  const priceChange = (Math.random() - 0.5) * 10;
  const priceChangePercent = ((priceChange / mockPrice) * 100).toFixed(2);
  const isPositive = priceChange > 0;

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.stockInfo}>
          <div className={styles.tickerDisplay}>
            <h1 className={styles.ticker}>{ticker}</h1>
            <span className={styles.badge}>📈 EGX</span>
          </div>

          <div className={styles.priceInfo}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Current Price</span>
              <span className={styles.price}>
                {mockPrice.toFixed(2)} <span className={styles.currency}>EGP</span>
              </span>
            </div>

            <div className={styles.changeRow}>
              <span className={styles.changeLabel}>24h Change</span>
              <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
                {isPositive ? '📈 +' : '📉 '}{Math.abs(priceChange).toFixed(2)} ({priceChangePercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* AI Recommendation Summary */}
        <div className={styles.recommendationBox}>
          <div className={styles.recommendation}>
            {analysis?.finalDecision?.finalDecision === 'BUY' && <span className={styles.buyIcon}>🟢 BUY</span>}
            {analysis?.finalDecision?.finalDecision === 'SELL' && <span className={styles.sellIcon}>🔴 SELL</span>}
            {analysis?.finalDecision?.finalDecision === 'HOLD' && <span className={styles.holdIcon}>➡️ HOLD</span>}
            <span className={styles.confidence}>
              {analysis?.finalDecision?.decisionConfidence?.toFixed(0)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
