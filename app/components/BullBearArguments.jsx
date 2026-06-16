import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './BullBearArguments.module.css';

/**
 * BullBearArguments Component
 * Displays bull case vs bear case
 */
export default function BullBearArguments({ bullCase, bearCase }) {
  const { t } = useLanguageSimple();

  return (
    <div className={styles.arguments}>
      <div className={styles.case}>
        <h3 className={styles.bullHeader}>🚀 {t('bullCase')}</h3>
        <p>{bullCase}</p>
      </div>

      <div className={styles.case}>
        <h3 className={styles.bearHeader}>🔴 {t('bearCase')}</h3>
        <p>{bearCase}</p>
      </div>
    </div>
  );
}
