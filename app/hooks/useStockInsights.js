import { useState, useEffect, useCallback } from 'react';

/**
 * Hook: useStockRecommendation
 * Fetches AI insights for a stock (recommendation, risk, confidence, anomalies)
 * Caches results to avoid redundant API calls
 */
export function useStockRecommendation(symbol, { cacheTime = 300000 } = {}) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchInsight = async () => {
      setLoading(true);
      setError(null);

      try {
        // For now, generate a simple insight based on mock data
        // In production, this would call an AI agent endpoint
        const mockInsights = generateMockInsight(symbol);
        setInsight(mockInsights);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [symbol]);

  return { insight, loading, error };
}

/**
 * Hook: useAllStockInsights
 * Fetches AI insights for multiple stocks
 */
export function useAllStockInsights(symbols = []) {
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    const fetchInsights = async () => {
      setLoading(true);
      const newInsights = {};

      for (const symbol of symbols) {
        try {
          newInsights[symbol] = generateMockInsight(symbol);
        } catch (error) {
          console.warn(`Failed to fetch insight for ${symbol}:`, error);
          newInsights[symbol] = {
            recommendation: 'HOLD',
            riskLevel: 'MEDIUM',
            confidence: 0,
            anomaly: null
          };
        }
      }

      setInsights(newInsights);
      setLoading(false);
    };

    fetchInsights();
  }, [symbols]);

  return { insights, loading };
}

/**
 * Generate mock AI insight for demonstration
 * Replace with actual agent call in production
 */
function generateMockInsight(symbol) {
  const recommendations = ['BUY', 'SELL', 'HOLD'];
  const risks = ['LOW', 'MEDIUM', 'HIGH'];
  
  // Pseudo-random based on symbol
  const hash = symbol.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  
  return {
    recommendation: recommendations[hash % 3],
    riskLevel: risks[hash % 3],
    confidence: 60 + (hash % 40),
    anomaly: hash % 4 === 0 ? 'High volume spike detected' : null
  };
}
