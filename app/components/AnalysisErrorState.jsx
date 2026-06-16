import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './AnalysisErrorState.module.css';

/**
 * AnalysisErrorState Component
 * Shows error message with retry option
 */
export default function AnalysisErrorState({ error, onRetry }) {
  const { t } = useLanguageSimple();

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorBox}>
        <div className={styles.icon}>⚠️</div>

        <h3>{t('failedToAnalyze')}</h3>

        <p className={styles.message}>{error}</p>

        <div className={styles.details}>
          <small>Please check the ticker and try again, or contact support if the issue persists.</small>
        </div>

        <button className={styles.retryButton} onClick={onRetry}>
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}
