import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './StockActionButtons.module.css';

/**
 * StockActionButtons Component
 * Displays a single add-to-portfolio action for AI recommendations
 */
export default function StockActionButtons({ ticker, decision, price, onAddStock }) {
  const { t } = useLanguageSimple();

  const handleAddStock = () => {
    if (!onAddStock || !ticker) return;
    onAddStock({
      symbol: ticker,
      name: ticker,
      currentPrice: price
    });
  };

  const decisionType = decision?.finalDecision || 'HOLD';

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        <button className={`${styles.btn} ${styles.buyBtn}`} onClick={handleAddStock}>
          <span className={styles.icon}>➕</span>
          <span className={styles.text}>{t('addStock') || 'Add Stock'}</span>
        </button>
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <p>
          {decisionType === 'BUY' && (
            <>
              <strong>✅ AI recommends BUY:</strong> {decision?.decisionConfidence?.toFixed(0)}% confidence based on 7 agent analysis
            </>
          )}
          {decisionType === 'SELL' && (
            <>
              <strong>⚠️ AI recommends SELL:</strong> {decision?.decisionConfidence?.toFixed(0)}% confidence based on 7 agent analysis
            </>
          )}
          {decisionType === 'HOLD' && (
            <>
              <strong>➡️ AI recommends HOLD:</strong> Wait for stronger signals. Confidence: {decision?.decisionConfidence?.toFixed(0)}%
            </>
          )}
        </p>
      </div>
    </div>
  );
}
