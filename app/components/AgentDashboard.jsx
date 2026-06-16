import React from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import styles from './AgentDashboard.module.css';

/**
 * AgentDashboard Component
 * Shows all specialist agents with their findings
 */
export default function AgentDashboard({ findings, expandedAgent, onToggle }) {
  const { t } = useLanguageSimple();

  if (!findings || findings.length === 0) return null;

  const getRecommendationIcon = (rec) => {
    switch (rec) {
      case 'bullish':
        return '🟢';
      case 'bearish':
        return '🔴';
      default:
        return '🟡';
    }
  };

  return (
    <div className={styles.dashboard}>
      <h3>🔍 {t('agentBreakdown')}</h3>

      <div className={styles.agentGrid}>
        {findings.map((finding) => (
          <div
            key={finding.agentId}
            className={`${styles.agentCard} ${expandedAgent === finding.agentId ? styles.expanded : ''}`}
            onClick={() => onToggle(expandedAgent === finding.agentId ? null : finding.agentId)}
          >
            <div className={styles.header}>
              <span className={styles.icon}>{finding.displayName.split(' ')[0]}</span>
              <h4>{finding.displayName}</h4>
            </div>

            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.label}>{t('recommendation')}</span>
                <span className={styles.value}>
                  {getRecommendationIcon(finding.recommendation)} {finding.recommendation}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.label}>{t('decisionConfidence')}</span>
                <div className={styles.confidence}>
                  <div className={styles.bar}>
                    <div
                      className={styles.fill}
                      style={{
                        width: `${finding.confidence}%`,
                        backgroundColor:
                          finding.confidence > 70
                            ? '#10b981'
                            : finding.confidence > 40
                            ? '#f59e0b'
                            : '#ef4444'
                      }}
                    />
                  </div>
                  <span>{finding.confidence}%</span>
                </div>
              </div>
            </div>

            {expandedAgent === finding.agentId && (
              <div className={styles.details}>
                <p className={styles.summary}>{finding.summary}</p>

                {finding.signals && finding.signals.length > 0 && (
                  <div className={styles.section}>
                    <h5>{t('keySignals')}</h5>
                    <ul>
                      {finding.signals.map((signal, idx) => (
                        <li key={idx}>
                          <strong>{signal.label}:</strong> {signal.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {finding.risks && finding.risks.length > 0 && (
                  <div className={styles.section}>
                    <h5>{t('risks')}</h5>
                    <ul>
                      {finding.risks.map((risk, idx) => (
                        <li key={idx}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {finding.opportunities && finding.opportunities.length > 0 && (
                  <div className={styles.section}>
                    <h5>{t('opportunities')}</h5>
                    <ul>
                      {finding.opportunities.map((opp, idx) => (
                        <li key={idx}>✓ {opp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className={styles.arrow}>
              {expandedAgent === finding.agentId ? '▲' : '▼'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
