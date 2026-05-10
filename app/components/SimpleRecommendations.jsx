'use client';

import { TrendingUp, AlertCircle, Zap, Eye, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function SimpleRecommendations({ onAddStock, onViewDetails, onOpenAddModal, language }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguageSimple();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || 'anonymous') : 'anonymous';

      // Try to fetch preset recommendations first
      let response = await fetch(`/api/egx-recommendations`);
      let data = null;

      if (response.ok) {
        data = await response.json();
        
        // Extract recommendations from preset data
        if (data.success && data.data?.recommendations) {
          const presetRecs = data.data.recommendations;
          const confidenceFromRsi = (rsi) => {
            if (rsi == null || Number.isNaN(rsi)) return null;
            return Math.min(92, Math.max(55, Math.round(100 - Math.abs(rsi - 50))));
          };
          const allRecs = [
            ...(presetRecs.short_term_buy || []).map((r, i) => ({
              id: `st_buy_${i}`,
              symbol: r.symbol,
              name: r.symbol,
              entryPrice: r.current_price,
              targetPrice: r.target_price,
              stopLoss: Number((r.current_price * 0.97).toFixed(2)),
              expectedReturn: r.expected_return_percent,
              riskLevel: r.risk,
              reason: r.reason,
              timeframe: 'short-term',
              confidence: confidenceFromRsi(r.rsi_14) ?? 70,
            })),
            ...(presetRecs.long_term_buy || []).map((r, i) => ({
              id: `lt_buy_${i}`,
              symbol: r.symbol,
              name: r.symbol,
              entryPrice: r.current_price,
              targetPrice: r.target_price,
              stopLoss: Number((r.current_price * 0.95).toFixed(2)),
              expectedReturn: r.expected_return_percent,
              riskLevel: r.risk,
              reason: r.reason,
              timeframe: 'long-term',
              confidence: confidenceFromRsi(r.rsi_14) ?? 68,
            })),
          ];

          setRecommendations(allRecs.slice(0, 5));
          return;
        }
      }

      response = await fetch('/api/agents/get-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'standard' }),
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      data = await response.json();

      if (data.success && data.message) {
        let recommendations = [];
        try {
          const jsonMatch = data.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            recommendations = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('JSON parse error:', e);
        }

        const normalized = (recommendations || []).map((r, i) => ({
          ...r,
          id: r.id ?? `agent_${i}`,
          stopLoss:
            r.stopLoss ??
            (r.entryPrice != null ? Number((r.entryPrice * 0.97).toFixed(2)) : undefined),
          confidence: r.confidence ?? 70,
        }));

        setRecommendations(normalized);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'LOW':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300 border border-green-200 dark:border-green-400/30';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-400/30';
      case 'HIGH':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 border border-red-200 dark:border-red-400/30';
      default:
        return '';
    }
  };

  return (
    <div className="pb-24 space-y-4">
      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-bounce text-6xl mb-4">⏳</div>
          <p className="text-gray-500 dark:text-gray-400 font-semibold">{t('loading')}</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-12 text-center space-y-3 px-4">
          <p className="text-gray-600 dark:text-gray-400 font-semibold">
            No recommendations available right now.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Live market data may be temporarily unavailable. Try again in a few minutes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={rec.id}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200 dark:border-slate-600 p-5 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-102 overflow-hidden relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Animated Gradient Overlay */}
              <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-amber-400 to-orange-400"></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">⚡</div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">{rec.symbol}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{rec.name}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getRiskColor(rec.riskLevel)}`}>
                    {t('risk')}: {rec.riskLevel === 'LOW' ? t('lowRisk') : rec.riskLevel === 'MEDIUM' ? t('mediumRisk') : t('highRisk')}
                  </span>
                </div>

                {/* Price Targets */}
                <div className="space-y-2 mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 dark:from-blue-500/20 dark:to-emerald-500/20 rounded-xl border border-blue-200/50 dark:border-blue-400/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-bold">{t('buyAt')}</span>
                    <span className="font-black text-gray-900 dark:text-white text-lg">{rec.entryPrice} EGP</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-bold">{t('target')}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">📈 {rec.targetPrice} EGP</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-bold">{t('stopLoss')}</span>
                    <span className="font-black text-rose-600 dark:text-rose-400 text-lg">
                      🛑 {rec.stopLoss != null ? `${rec.stopLoss} EGP` : '—'}
                    </span>
                  </div>
                </div>

                {/* Expected Return */}
                <div className="mb-4 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 rounded-xl border border-emerald-200/50 dark:border-emerald-400/30 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">{t('expectedReturn')}</p>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-2xl">
                      {typeof rec.expectedReturn === 'number' && rec.expectedReturn >= 0
                        ? `+${rec.expectedReturn.toFixed(1)}%`
                        : `${Number(rec.expectedReturn).toFixed(1)}%`}
                    </p>
                  </div>
                </div>

                {/* Confidence Score */}
                {rec.confidence != null && (
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-xl border border-purple-200/50 dark:border-purple-400/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">{t('confidence')}</p>
                      <p className="font-black text-purple-600 dark:text-purple-400 text-2xl">{rec.confidence}%</p>
                    </div>
                    <div className="flex-1 mx-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${rec.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                )}

                {/* Reason */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-2 border border-blue-200/50 dark:border-blue-400/30">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">{rec.reason}</p>
                </div>

                {/* Track Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onViewDetails && onViewDetails(rec)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Eye size={18} />
                    View Details
                  </button>
                  <button
                    onClick={() => onOpenAddModal && onOpenAddModal(rec)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={18} />
                    Add to Stocks
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
