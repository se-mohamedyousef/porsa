import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './AgentFindings.module.css';

/**
 * AgentFindings Component
 * Shows detailed findings from a specific agent
 */
export default function AgentFindings({ finding }) {
  const { t } = useLanguageSimple();

  if (!finding) return null;

  return (
    <div className={styles.findings}>
      <div className={styles.header}>
        <h3>{finding.displayName} - {t('investmentThesis')}</h3>
        <span className={styles.latency}>{finding.latencyMs}ms</span>
      </div>

      <div className={styles.content}>
        {finding.summary && (
          <div className={styles.section}>
            <h4>{t('investmentThesis')}</h4>
            <p>{finding.summary}</p>
          </div>
        )}

        {finding.keySignals && finding.keySignals.length > 0 && (
          <div className={styles.section}>
            <h4>{t('keySignals')}</h4>
            <div className={styles.signalGrid}>
              {finding.keySignals.map((signal, idx) => (
                <div key={idx} className={styles.signal}>
                  <span className={styles.label}>{signal.label}</span>
                  <span className={styles.value}>{signal.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {finding.risks && finding.risks.length > 0 && (
          <div className={styles.section}>
            <h4>⚠️ {t('risks')}</h4>
            <ul className={styles.list}>
              {finding.risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {finding.opportunities && finding.opportunities.length > 0 && (
          <div className={styles.section}>
            <h4>✓ {t('opportunities')}</h4>
            <ul className={styles.list}>
              {finding.opportunities.map((opp, idx) => (
                <li key={idx}>{opp}</li>
              ))}
            </ul>
          </div>
        )}

        {finding.assumptions && finding.assumptions.length > 0 && (
          <div className={styles.section}>
            <h4>{t('assumptionsData')}</h4>
            <ul className={styles.list}>
              {finding.assumptions.map((assumption, idx) => (
                <li key={idx}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        {finding.errors && finding.errors.length > 0 && (
          <div className={`${styles.section} ${styles.error}`}>
            <h4>{t('error')}</h4>
            <ul className={styles.list}>
              {finding.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
