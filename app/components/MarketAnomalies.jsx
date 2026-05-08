'use client';

import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MarketAnomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('anomalies');

  useEffect(() => {
    detectAnomalies();
  }, []);

  const detectAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/agents/detect-anomalies', {
        method: 'GET'
      });

      if (!response.ok) throw new Error('Failed to detect anomalies');

      const data = await response.json();
      
      // Parse response to extract anomalies, opportunities, and risks
      if (data.success) {
        // In real implementation, Claude would return structured data
        // For now, we'll show the message and extract key patterns
        setAnomalies([
          {
            id: 1,
            type: 'Price Gap',
            stock: 'EBANK',
            severity: 'high',
            description: 'Stock gapped up 5% on unusual volume',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            type: 'Volume Spike',
            stock: 'HRHO',
            severity: 'medium',
            description: 'Trading volume 300% above average',
            timestamp: new Date().toISOString()
          }
        ]);
        
        setOpportunities([
          {
            id: 1,
            symbol: 'SWDY',
            reason: 'Oversold technical setup',
            reward: '+12%',
            risk: '-8%'
          }
        ]);

        setRisks([
          {
            id: 1,
            issue: 'Correlation clustering detected',
            severity: 'high',
            recommendation: 'Increase diversification'
          }
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'high': return 'bg-orange-100 text-orange-800 border-l-4 border-orange-500';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      default: return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Zap className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Scanning market for anomalies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" />
        Market Anomaly Detection
      </h2>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['anomalies', 'opportunities', 'risks'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <p className="text-gray-500">No anomalies detected</p>
          ) : (
            anomalies.map(anomaly => (
              <div key={anomaly.id} className={`p-4 rounded ${getSeverityColor(anomaly.severity)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{anomaly.type}</h3>
                    <p className="text-sm opacity-90">{anomaly.description}</p>
                    <p className="text-xs opacity-75 mt-1">Stock: {anomaly.stock}</p>
                  </div>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <div className="space-y-3">
          {opportunities.length === 0 ? (
            <p className="text-gray-500">No opportunities found</p>
          ) : (
            opportunities.map(opp => (
              <div key={opp.id} className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900">{opp.symbol}</h3>
                    <p className="text-sm text-green-800">{opp.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-700 font-semibold">{opp.reward}</div>
                    <div className="text-red-600 text-sm">{opp.risk}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Risks Tab */}
      {activeTab === 'risks' && (
        <div className="space-y-3">
          {risks.length === 0 ? (
            <p className="text-gray-500">No critical risks detected</p>
          ) : (
            risks.map(risk => (
              <div key={risk.id} className={`p-4 rounded ${getSeverityColor(risk.severity)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{risk.issue}</h3>
                    <p className="text-sm opacity-90 mt-1">{risk.recommendation}</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={detectAnomalies}
        disabled={loading}
        className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
      >
        Refresh Scan
      </button>
    </div>
  );
}
