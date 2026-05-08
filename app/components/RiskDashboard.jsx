'use client';

import { AlertTriangle, TrendingDown, BarChart3, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RiskDashboard({ userId }) {
  const [riskMetrics, setRiskMetrics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    assessRisk();
  }, [userId]);

  const assessRisk = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/agents/assess-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'assessment' })
      });

      if (!response.ok) throw new Error('Failed to assess risk');

      const data = await response.json();

      if (data.success) {
        // Mock structured response parsing
        setRiskMetrics({
          volatility: 18.5,
          sharpeRatio: 1.24,
          maxDrawdown: 12.3,
          riskTolerance: 'moderate',
          status: 'within-limits'
        });

        setRecommendations([
          {
            id: 1,
            type: 'Diversification',
            priority: 'high',
            description: 'Add uncorrelated assets to reduce portfolio volatility',
            action: 'Consider adding bonds or non-correlated sectors'
          },
          {
            id: 2,
            type: 'Position Sizing',
            priority: 'medium',
            description: 'Stock XYZ represents 15% of portfolio (above 10% threshold)',
            action: 'Reduce to 8-10% allocation'
          }
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActiveAction(action);
    try {
      const actionMap = {
        'stress-test': { action: 'stress-test', scenario: 'Market crash -20%' },
        'correlations': { action: 'correlation-risks' },
        'hedges': { action: 'suggest-hedges' },
        'stop-losses': { action: 'stop-losses' }
      };

      const response = await fetch('/api/agents/assess-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...actionMap[action] })
      });

      // Handle response
    } catch (err) {
      console.error(err);
    } finally {
      setActiveAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Assessing portfolio risk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background dark:bg-secondary rounded-lg shadow border border-border">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
        <Shield className="w-6 h-6" />
        Risk Management Dashboard
      </h2>

      {error && (
        <div className="p-4 bg-error/20 dark:bg-error/30 text-error rounded mb-4 border border-error/50">
          {error}
        </div>
      )}

      {riskMetrics && (
        <>
          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-info/20 dark:bg-info/30 p-4 rounded border border-info/50 dark:border-info/30">
              <p className="text-sm text-info font-medium">Portfolio Volatility</p>
              <p className="text-2xl font-bold text-foreground">{riskMetrics.volatility}%</p>
              <p className="text-xs text-muted-foreground mt-1">Standard Deviation</p>
            </div>

            <div className="bg-success/20 dark:bg-success/30 p-4 rounded border border-success/50 dark:border-success/30">
              <p className="text-sm text-success font-medium">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-foreground">{riskMetrics.sharpeRatio}</p>
              <p className="text-xs text-muted-foreground mt-1">Risk-Adjusted Return</p>
            </div>

            <div className="bg-warning/20 dark:bg-warning/30 p-4 rounded border border-warning/50 dark:border-warning/30">
              <p className="text-sm text-warning font-medium">Max Drawdown</p>
              <p className="text-2xl font-bold text-foreground">{riskMetrics.maxDrawdown}%</p>
              <p className="text-xs text-muted-foreground mt-1">Historical</p>
            </div>

            <div className="bg-accent-purple/20 dark:bg-accent-purple/30 p-4 rounded border border-accent-purple/50 dark:border-accent-purple/30">
              <p className="text-sm text-accent-purple font-medium">Risk Tolerance</p>
              <p className="text-xl font-bold text-foreground capitalize">{riskMetrics.riskTolerance}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {riskMetrics.status === 'within-limits' ? '✓ Within limits' : '⚠ Exceeding limits'}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5" />
              Risk Mitigation Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className={`p-4 rounded border-l-4 bg-background dark:bg-secondary/50 border-t border-r border-b border-border ${
                    rec.priority === 'high'
                      ? 'border-l-error'
                      : rec.priority === 'medium'
                      ? 'border-l-warning'
                      : 'border-l-info'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{rec.type}</h4>
                      <p className="text-sm opacity-90 mt-1 text-muted-foreground">{rec.description}</p>
                      <p className="text-sm font-medium mt-2 text-info">{rec.action}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                        rec.priority === 'high'
                          ? 'bg-error/30 text-error'
                          : rec.priority === 'medium'
                          ? 'bg-warning/30 text-warning'
                          : 'bg-info/30 text-info'
                      }`}
                    >
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'stress-test', label: 'Stress Test', icon: '📊' },
              { id: 'correlations', label: 'Correlations', icon: '🔗' },
              { id: 'hedges', label: 'Hedging', icon: '🛡️' },
              { id: 'stop-losses', label: 'Stop Losses', icon: '⛔' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => handleAction(btn.id)}
                disabled={activeAction === btn.id}
                className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded disabled:opacity-50 transition text-sm font-medium"
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Refresh Button */}
      <button
        onClick={assessRisk}
        disabled={loading}
        className="mt-6 w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded disabled:opacity-50 transition border border-border"
      >
        Refresh Analysis
      </button>
    </div>
  );
}
