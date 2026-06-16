import React, { useState, useCallback, useEffect } from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import { matchesIndexFilter, INDEX_FILTERS } from '@/lib/egx/indices';
import TickerInputBar from './TickerInputBar';
import StockHeader from './StockHeader';
import StockActionButtons from './StockActionButtons';
import AnalysisResult from './AnalysisResult';
import AnalysisSkeleton from './AnalysisSkeleton';
import AnalysisErrorState from './AnalysisErrorState';
import RecommendationCard from './RecommendationCard';
import PortfolioBreakdown from './PortfolioBreakdown';
import styles from './AIWorkspaceTab.module.css';

/**
 * AIWorkspaceTab Component
 * Main container for multi-agent AI analysis + portfolio holdings analysis
 */
export default function AIWorkspaceTab({ onAddStock, onViewDetails, portfolio = [] }) {
  const { t } = useLanguageSimple();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTicker, setCurrentTicker] = useState('');
  const [activeSection, setActiveSection] = useState('analyze');
  const [holdingsAnalysis, setHoldingsAnalysis] = useState(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [indexFilter, setIndexFilter] = useState('ALL');

  const handleAnalyzeStock = useCallback(async (ticker) => {
    if (!ticker) return;

    setActiveSection('analyze');
    setCurrentTicker(ticker);
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/ai-workspace/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          horizon: 'medium',
          portfolio
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('failedToAnalyze'));
        setLoading(false);
        return;
      }

      setAnalysis(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Network error during analysis');
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (currentTicker) {
      handleAnalyzeStock(currentTicker);
    }
  }, [currentTicker, handleAnalyzeStock]);

  // Load a top-scored stock analysis on component mount (rotates daily)
  useEffect(() => {
    const loadTopStock = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch recommendations to get top scored stocks
        const response = await fetch('/api/egx-recommendations');
        const data = await response.json();

        let topStock = null;

        if (data.success && data.data?.recommendations) {
          const recs = data.data.recommendations;
          let picks = recs.scored_picks || [
            ...(recs.short_term_buy || []),
            ...(recs.long_term_buy || []),
          ];

          // Filter by selected index
          if (indexFilter !== 'ALL') {
            picks = picks.filter(p => matchesIndexFilter(p.symbol, indexFilter));
          }

          if (picks.length > 0) {
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
            const index = dayOfYear % Math.min(picks.length, 8);
            topStock = picks[index]?.symbol;
          }
        }

        if (!topStock) {
          setLoading(false);
          setError(t('noRecommendations'));
          return;
        }

        handleAnalyzeStock(topStock);
      } catch (err) {
        console.error('Error loading top stock:', err);
        setLoading(false);
        setError(err.message || t('failedToAnalyze'));
      }
    };

    loadTopStock();
  }, [indexFilter]); // Re-run when index filter changes

  // Analyze all portfolio holdings
  const handleAnalyzeHoldings = useCallback(async () => {
    if (!portfolio || portfolio.length === 0) return;

    setActiveSection('holdings');
    setHoldingsLoading(true);

    try {
      const response = await fetch('/api/ai-workspace/analyze-holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setHoldingsAnalysis(data);
      }
    } catch (err) {
      console.error('Error analyzing holdings:', err);
    } finally {
      setHoldingsLoading(false);
    }
  }, [portfolio]);

  // Get real stock price from analysis data
  const getStockPrice = (ticker) => {
    if (analysis?.finalDecision?.actionCard?.currentPrice) {
      return analysis.finalDecision.actionCard.currentPrice;
    }
    // Fallback to market data price
    if (analysis?.finalDecision?.targets?.entry) {
      return analysis.finalDecision.targets.entry;
    }
    return 0;
  };

  const stockPrice = getStockPrice(currentTicker);

  return (
    <div className={styles.workspace}>
      <div className={styles.header}>
        <h1>🤖 {t('aiWorkspace')}</h1>
        <p>{t('multiAgentAnalysis')}</p>
      </div>

      {/* Section tabs */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {INDEX_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setIndexFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: indexFilter === f.id ? '#10b981' : 'var(--bg-secondary, #f1f5f9)',
                color: indexFilter === f.id ? '#fff' : 'var(--text-secondary, #64748b)',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        padding: '0 16px',
        marginBottom: 16,
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveSection('analyze')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeSection === 'analyze' ? '#3b82f6' : 'var(--bg-secondary, #f1f5f9)',
            color: activeSection === 'analyze' ? '#fff' : 'var(--text-secondary, #64748b)',
          }}
        >
          🔍 {t('analyzeStock')}
        </button>
        <button
          onClick={handleAnalyzeHoldings}
          disabled={!portfolio || portfolio.length === 0}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: portfolio.length > 0 ? 'pointer' : 'not-allowed',
            opacity: portfolio.length > 0 ? 1 : 0.5,
            background: activeSection === 'holdings' ? '#10b981' : 'var(--bg-secondary, #f1f5f9)',
            color: activeSection === 'holdings' ? '#fff' : 'var(--text-secondary, #64748b)',
          }}
        >
          📊 {t('myHoldings')} ({portfolio.length})
        </button>
        <button
          onClick={() => setActiveSection('portfolio')}
          disabled={!portfolio || portfolio.length === 0}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: portfolio.length > 0 ? 'pointer' : 'not-allowed',
            opacity: portfolio.length > 0 ? 1 : 0.5,
            background: activeSection === 'portfolio' ? '#8b5cf6' : 'var(--bg-secondary, #f1f5f9)',
            color: activeSection === 'portfolio' ? '#fff' : 'var(--text-secondary, #64748b)',
          }}
        >
          📈 {t('portfolioView')}
        </button>
      </div>

      {/* ANALYZE STOCK section */}
      {activeSection === 'analyze' && (
        <>
          <TickerInputBar onAnalyze={handleAnalyzeStock} disabled={loading} />

          {loading && <AnalysisSkeleton />}

          {error && !loading && <AnalysisErrorState error={error} onRetry={handleRetry} />}

          {analysis && !loading && (
            <>
              {/* ActionCard summary */}
              {analysis.finalDecision?.actionCard && (
                <div style={{ padding: '0 16px', marginBottom: 12 }}>
                  <RecommendationCard
                    data={{
                      ...analysis.finalDecision.actionCard,
                      portfolioWarnings: analysis.finalDecision?.portfolioWarnings || []
                    }}
                    onViewDetails={() => onViewDetails && onViewDetails({ symbol: currentTicker, name: currentTicker })}
                    mode="recommendation"
                  />
                </div>
              )}

              <StockHeader ticker={currentTicker} analysis={analysis} />
              
              {/* Quick action: View Chart Details */}
              {onViewDetails && (
                <div style={{ padding: '0 16px', marginBottom: 8 }}>
                  <button
                    onClick={() => onViewDetails({ symbol: currentTicker, name: currentTicker, currentPrice: stockPrice })}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    📊 {t('viewDetails')} — {currentTicker}
                  </button>
                </div>
              )}

              <StockActionButtons
                ticker={currentTicker}
                decision={analysis.finalDecision}
                price={stockPrice}
                onAddStock={onAddStock}
              />
              <AnalysisResult data={analysis} />
            </>
          )}

          {!loading && !error && !analysis && (
            <div className={styles.empty}>
              <div className={styles.emptyContent}>
                <p>{t('enterStockTicker')}</p>
                <small>{t('sevenAgents')}</small>
              </div>
            </div>
          )}
        </>
      )}

      {/* HOLDINGS ANALYSIS section */}
      {activeSection === 'holdings' && (
        <div style={{ padding: '0 16px' }}>
          {holdingsLoading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
              <p style={{ color: 'var(--text-secondary, #64748b)', fontWeight: 600 }}>
                Analyzing {portfolio.length} stocks...
              </p>
              <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 12, marginTop: 4 }}>
                Running AI agents on each holding
              </p>
            </div>
          )}

          {holdingsAnalysis && !holdingsLoading && (
            <>
              {/* Summary banner */}
              <div style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
                background: holdingsAnalysis.summary?.sell > 0
                  ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                  : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: `1px solid ${holdingsAnalysis.summary?.sell > 0 ? '#fecaca' : '#bbf7d0'}`
              }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>
                  {holdingsAnalysis.summary?.message}
                </p>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  {holdingsAnalysis.summary?.keep} keep · {holdingsAnalysis.summary?.sell} sell · {holdingsAnalysis.summary?.add} add more
                </p>
              </div>

              {/* Holdings cards */}
              {holdingsAnalysis.holdings?.map((holding, idx) => (
                <RecommendationCard
                  key={holding.stockId || idx}
                  data={{
                    action: holding.action,
                    confidence: holding.confidence,
                    ticker: holding.ticker,
                    currentPrice: holding.currentPrice,
                    buyPrice: holding.buyPrice,
                    profitPercent: holding.profitPercent,
                    quantity: holding.quantity,
                    targetPrice: holding.targetPrice,
                    stopLoss: holding.stopLoss,
                    riskLevel: holding.riskLevel || 'MEDIUM',
                    reason: holding.reason,
                    entryPrice: holding.buyPrice,
                  }}
                  onViewDetails={(ticker) => onViewDetails ? onViewDetails({ symbol: ticker, name: ticker }) : handleAnalyzeStock(ticker)}
                  mode="holding"
                />
              ))}
            </>
          )}

          {!holdingsLoading && !holdingsAnalysis && portfolio.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary, #94a3b8)' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
              <p>No stocks in portfolio. Add stocks to analyze your holdings.</p>
            </div>
          )}
        </div>
      )}

      {/* PORTFOLIO BREAKDOWN section */}
      {activeSection === 'portfolio' && (
        <PortfolioBreakdown portfolio={portfolio} />
      )}
    </div>
  );
}
