import React, { useState } from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import DecisionBanner from './DecisionBanner';
import ExecutiveSummary from './ExecutiveSummary';
import BullBearArguments from './BullBearArguments';
import PriceTargets from './PriceTargets';
import AgentDashboard from './AgentDashboard';
import AgentFindings from './AgentFindings';
import styles from './AnalysisResult.module.css';

/**
 * AnalysisResult Component
 * Displays the complete analysis with all components
 */
export default function AnalysisResult({ data }) {
  const { t } = useLanguageSimple();
  const [expandedAgent, setExpandedAgent] = useState(null);

  if (!data || !data.finalDecision) {
    return null;
  }

  return (
    <div className={styles.result}>
      {/* Decision Banner */}
      <DecisionBanner decision={data.finalDecision} summary={data.summary} />

      {/* Executive Summary */}
      <ExecutiveSummary
        thesis={data.finalDecision.investmentThesis}
        shortTerm={data.finalDecision.shortTermOutlook}
        longTerm={data.finalDecision.longTermOutlook}
      />

      {/* Bull vs Bear Case */}
      <BullBearArguments
        bullCase={data.finalDecision.bullCase}
        bearCase={data.finalDecision.bearCase}
      />

      {/* Price Targets */}
      <PriceTargets targets={data.finalDecision.targets} />

      {/* Agent Dashboard */}
      <AgentDashboard
        findings={data.specialistFindings}
        expandedAgent={expandedAgent}
        onToggle={setExpandedAgent}
      />

      {/* Detailed Agent Findings */}
      {expandedAgent && (
        <AgentFindings
          finding={data.specialistFindings.find(f => f.agentId === expandedAgent)}
        />
      )}

      {/* Execution Info */}
      <div className={styles.footer}>
        <small>
          {t('executionTime')}: {data.finalDecision.latencyMs}ms • {data.summary.totalAgents} {t('agents')} • {t('consensus')}: {data.summary.consensus}%
        </small>
      </div>
    </div>
  );
}
