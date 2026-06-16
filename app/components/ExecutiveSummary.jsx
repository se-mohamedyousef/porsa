import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './ExecutiveSummary.module.css';

/**
 * ExecutiveSummary Component
 * Shows the investment thesis and outlook
 */
export default function ExecutiveSummary({ thesis, shortTerm, longTerm }) {
  const { t } = useLanguageSimple();

  return (
    <div className={styles.summary}>
      <h3>{t('investmentThesis')}</h3>

      <div className={styles.thesis}>
        <p>{thesis}</p>
      </div>

      <div className={styles.outlooks}>
        <div className={styles.outlook}>
          <h4>{t('dayOutlook')}</h4>
          <p>{shortTerm}</p>
        </div>

        <div className={styles.outlook}>
          <h4>{t('yearOutlook')}</h4>
          <p>{longTerm}</p>
        </div>
      </div>
    </div>
  );
}
