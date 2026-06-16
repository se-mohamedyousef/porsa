import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './PriceTargets.module.css';

/**
 * PriceTargets Component
 * Displays price targets and investment levels
 */
export default function PriceTargets({ targets }) {
  const { t } = useLanguageSimple();

  if (!targets) return null;

  return (
    <div className={styles.targets}>
      <h3>📍 {t('priceTargets')}</h3>

      <div className={styles.grid}>
        <div className={styles.target}>
          <span className={styles.label}>{t('entryPoint')}</span>
          <span className={styles.value}>{targets.entry}</span>
        </div>

        <div className={styles.target}>
          <span className={styles.label}>{t('targetPrice')}</span>
          <span className={styles.value}>{targets.target}</span>
        </div>

        <div className={styles.target}>
          <span className={styles.label}>{t('stopLossLevel')}</span>
          <span className={styles.value}>{targets.stop}</span>
        </div>

        <div className={styles.target}>
          <span className={styles.label}>{t('timeHorizon')}</span>
          <span className={styles.value}>{targets.horizon}</span>
        </div>
      </div>
    </div>
  );
}
