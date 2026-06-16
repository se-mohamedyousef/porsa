import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './DecisionBanner.module.css';

/**
 * DecisionBanner Component
 * Displays the final BUY/HOLD/SELL decision prominently
 */
export default function DecisionBanner({ decision, summary }) {
  const { t } = useLanguageSimple();

  if (!decision || !summary) return null;

  const getDecisionClass = (decision) => {
    switch (decision.finalDecision) {
      case 'BUY':
        return styles.buy;
      case 'SELL':
        return styles.sell;
      default:
        return styles.hold;
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision.finalDecision) {
      case 'BUY':
        return '📈';
      case 'SELL':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getDecisionText = (decision) => {
    switch (decision.finalDecision) {
      case 'BUY':
        return t('buy');
      case 'SELL':
        return t('sell');
      default:
        return t('holdDecision');
    }
  };

  return (
    <div className={`${styles.banner} ${getDecisionClass(decision)}`}>
      <div className={styles.content}>
        <div className={styles.decision}>
          <span className={styles.icon}>{getDecisionIcon(decision)}</span>
          <h2>{getDecisionText(decision)}</h2>
        </div>

        <div className={styles.details}>
          <div className={styles.metric}>
            <span className={styles.label}>{t('decisionConfidence')}</span>
            <span className={styles.value}>{decision.decisionConfidence}%</span>
          </div>

          <div className={styles.metric}>
            <span className={styles.label}>{t('consensus')}</span>
            <span className={styles.value}>{decision.consensusScore.toFixed(1)}%</span>
          </div>

          <div className={styles.metric}>
            <span className={styles.label}>{t('dayOutlook')}</span>
            <span className={`${styles.value} ${decision.shortTermPotential > 0 ? styles.positive : styles.negative}`}>
              {decision.shortTermPotential > 0 ? '+' : ''}
              {decision.shortTermPotential}%
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.label}>{t('yearOutlook')}</span>
            <span className={`${styles.value} ${decision.longTermPotential > 0 ? styles.positive : styles.negative}`}>
              {decision.longTermPotential > 0 ? '+' : ''}
              {decision.longTermPotential}%
            </span>
          </div>
        </div>
      </div>

      <p className={styles.summary}>{decision.executiveSummary}</p>
    </div>
  );
}
