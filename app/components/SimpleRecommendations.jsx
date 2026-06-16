'use client';

import { TrendingUp, TrendingDown, AlertCircle, Plus, RefreshCw, Filter, ArrowUpDown, Shield, Zap, Target, BarChart3, Newspaper } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import { matchesIndexFilter, INDEX_FILTERS } from '@/lib/egx/indices';

// Score badge color based on score
function getScoreColor(score) {
  if (score >= 75) return 'from-emerald-500 to-green-500 text-white';
  if (score >= 60) return 'from-blue-500 to-cyan-500 text-white';
  if (score >= 45) return 'from-amber-500 to-yellow-500 text-white';
  if (score >= 30) return 'from-orange-500 to-red-400 text-white';
  return 'from-red-500 to-rose-600 text-white';
}

function getCategoryTag(tag) {
  const tags = {
    'Value Pick': { icon: '💎', bg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
    'Strong Momentum': { icon: '🚀', bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    'Technical Breakout': { icon: '📈', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    'Balanced': { icon: '⚖️', bg: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
    'General': { icon: '📊', bg: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  };
  return tags[tag] || tags['General'];
}

function getRiskBadge(targets) {
  if (!targets) return { label: '?', color: 'bg-gray-100 text-gray-600' };
  const risk = Math.abs(targets.maxRisk || 0);
  if (risk > 7) return { label: 'HIGH', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
  if (risk > 4) return { label: 'MED', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' };
  return { label: 'LOW', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' };
}

function formatCap(cap) {
  if (!cap) return null;
  if (cap >= 1e9) return `${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `${(cap / 1e6).toFixed(0)}M`;
  return `${cap}`;
}

export default function SimpleRecommendations({ onAddStock, onViewDetails, onOpenAddModal }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [filterCategory, setFilterCategory] = useState('all');
  const [indexFilter, setIndexFilter] = useState('ALL');
  const { t } = useLanguageSimple();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/egx-recommendations');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success && data.data?.recommendations) {
        const recs = data.data.recommendations;
        // Use scored_picks if available (new engine), fallback to legacy format
        if (recs.scored_picks?.length > 0) {
          setRecommendations(recs.scored_picks);
        } else {
          // Legacy: convert short_term_buy + long_term_buy to display format
          const legacy = [
            ...(recs.short_term_buy || []).map(r => ({
              symbol: r.symbol, name: r.symbol, price: r.current_price,
              score: r.score || 60, category: 'BUY', tag: 'Strong Momentum',
              change: 0, sector: r.sector || 'Unknown', pe: null,
              targets: { entry: r.current_price, target: r.target_price, stop: r.current_price * 0.97, expectedReturn: r.expected_return_percent, maxRisk: -3, riskReward: 2.5 },
              topSignals: [{ text: r.reason, factor: 'Analysis' }],
              rsi_14: r.rsi_14,
            })),
            ...(recs.long_term_buy || []).map(r => ({
              symbol: r.symbol, name: r.symbol, price: r.current_price,
              score: r.score || 55, category: 'BUY', tag: 'Value Pick',
              change: 0, sector: r.sector || 'Unknown', pe: null,
              targets: { entry: r.current_price, target: r.target_price, stop: r.current_price * 0.95, expectedReturn: r.expected_return_percent, maxRisk: -5, riskReward: 2 },
              topSignals: [{ text: r.reason, factor: 'Analysis' }],
              rsi_14: r.rsi_14,
            })),
          ];
          setRecommendations(legacy);
        }
      } else {
        throw new Error('No recommendation data');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sort and filter
  const sortedRecs = useMemo(() => {
    let filtered = [...recommendations];
    // Index filter
    if (indexFilter !== 'ALL') {
      filtered = filtered.filter(r => matchesIndexFilter(r.symbol, indexFilter));
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(r => r.tag === filterCategory || r.category === filterCategory);
    }
    filtered.sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'return') return (b.targets?.expectedReturn || 0) - (a.targets?.expectedReturn || 0);
      if (sortBy === 'risk') return Math.abs(a.targets?.maxRisk || 99) - Math.abs(b.targets?.maxRisk || 99);
      if (sortBy === 'change') return (b.change || 0) - (a.change || 0);
      return 0;
    });
    return filtered;
  }, [recommendations, sortBy, filterCategory, indexFilter]);

  const categories = useMemo(() => {
    const cats = new Set(recommendations.map(r => r.tag).filter(Boolean));
    return ['all', ...cats];
  }, [recommendations]);

  if (loading) {
    return (
      <div className="pb-24 px-4">
        <div className="py-16 text-center">
          <div className="animate-pulse text-5xl mb-4">📊</div>
          <p className="text-gray-500 dark:text-gray-400 font-bold">{t('scanningStocks')}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('scoringDescription')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-24 px-4">
        <div className="py-12 text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">{error}</p>
          <button onClick={fetchRecommendations} className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm inline-flex items-center gap-2">
            <RefreshCw size={14} /> {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-3 px-3 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{t('topPicks')}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{recommendations.length} {t('scoredStocks')} • {t('multiFactorAnalysis')}</p>
        </div>
        <button onClick={fetchRecommendations} className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
          <RefreshCw size={16} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Filters & Sorting */}
      <div className="space-y-2">
        {/* Index filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {INDEX_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setIndexFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                indexFilter === f.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat === 'all' ? t('all') : cat}
            </button>
          ))}
        </div>

        {/* Sort options */}
        <div className="flex gap-1.5">
          {[
            { id: 'score', label: t('score'), icon: Target },
            { id: 'return', label: t('returnLabel'), icon: TrendingUp },
            { id: 'risk', label: t('lowRiskLabel'), icon: Shield },
            { id: 'change', label: t('today'), icon: Zap },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                sortBy === s.id
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <s.icon size={12} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-3">
        {sortedRecs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <p className="font-semibold">{t('noMatchFilter')}</p>
          </div>
        ) : sortedRecs.map((rec, idx) => {
          const risk = getRiskBadge(rec.targets);
          const catTag = getCategoryTag(rec.tag);
          const isProfit = (rec.change || 0) >= 0;
          const targets = rec.targets || {};

          return (
            <div
              key={`${rec.symbol}-${idx}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm hover:shadow-lg transition-all relative overflow-hidden"
            >
              {/* Score badge */}
              <div className="absolute top-0 right-0">
                <div className={`px-3 py-1.5 rounded-bl-xl bg-gradient-to-r ${getScoreColor(rec.score)} font-black text-sm shadow-md`}>
                  {rec.score}/100
                </div>
              </div>

              {/* Header: Symbol + Category + Change */}
              <div className="flex items-start gap-3 mb-3 pr-16">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">{rec.symbol}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catTag.bg}`}>
                      {catTag.icon} {rec.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    {rec.sector && rec.sector !== 'Unknown' && <span>{rec.sector}</span>}
                    {rec.pe && <span>P/E {rec.pe.toFixed(1)}</span>}
                    {rec.market_cap && <span>Cap {formatCap(rec.market_cap)}</span>}
                  </div>
                </div>
              </div>

              {/* Price + Daily Change */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {rec.price?.toFixed(2)} <span className="text-sm font-bold text-gray-400">EGP</span>
                </span>
                <span className={`text-sm font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isProfit ? <TrendingUp size={14} className="inline mr-0.5" /> : <TrendingDown size={14} className="inline mr-0.5" />}
                  {isProfit ? '+' : ''}{(rec.change || 0).toFixed(2)}%
                </span>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 p-2 text-center">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">RSI</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{rec.rsi_14?.toFixed(0) || '—'}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2 text-center">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">{t('target')}</p>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{targets.target?.toFixed(2) || '—'}</p>
                </div>
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-2 text-center">
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">{t('stop')}</p>
                  <p className="text-sm font-black text-rose-700 dark:text-rose-300">{targets.stop?.toFixed(2) || '—'}</p>
                </div>
                <div className={`rounded-lg p-2 text-center ${risk.color}`}>
                  <p className="text-[10px] font-bold">{t('risk')}</p>
                  <p className="text-sm font-black">{risk.label}</p>
                </div>
              </div>

              {/* Expected Return + Risk-Reward */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">{t('expectedReturnLabel')}</span>
                  <span className="text-sm font-black text-blue-700 dark:text-blue-300">
                    {targets.expectedReturn != null ? `+${targets.expectedReturn.toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-2">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">{t('riskReward')}</span>
                  <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">
                    {targets.riskReward ? `1:${targets.riskReward.toFixed(1)}` : '—'}
                  </span>
                </div>
              </div>

              {/* Top Signals */}
              {rec.topSignals?.length > 0 && (
                <div className="mb-3 space-y-1">
                  {rec.topSignals.slice(0, 3).map((sig, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{sig.text}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{sig.factor}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails({ symbol: rec.symbol, name: rec.name || rec.symbol })}
                    className="px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-xs transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <BarChart3 size={14} />
                    {t('viewDetails')}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (onOpenAddModal) {
                      onOpenAddModal({
                        symbol: rec.symbol,
                        name: rec.name || rec.symbol,
                        entryPrice: targets.entry || rec.price,
                        targetPrice: targets.target || rec.price * 1.1,
                        stopLoss: targets.stop || rec.price * 0.95,
                        expectedReturn: targets.expectedReturn || 10,
                        sector: rec.sector || 'Unknown',
                      });
                    }
                  }}
                  className="flex-1 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-bold text-xs transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Plus size={14} />
                  {t('addToPortfolio')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
        <p className="text-[10px] text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
          ⚠️ {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
