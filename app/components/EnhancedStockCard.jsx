'use client';

import { AlertCircle, MessageSquare, Plus, Bell, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useState } from 'react';

/**
 * Enhanced Stock Card Component
 * Displays stock with inline AI micro-insights, alerts, and action buttons
 */
export default function EnhancedStockCard({ 
  stock, 
  onAddToPortfolio, 
  onAskAI, 
  onSetAlert,
  aiInsights = {},
  activeAlerts = [],
  language = 'en'
}) {
  const [hovering, setHovering] = useState(false);
  
  const isPositive = (stock?.change ?? 0) >= 0;
  const riskLevel = aiInsights?.riskLevel || 'MEDIUM';
  const confidence = aiInsights?.confidence || 0;
  const recommendation = aiInsights?.recommendation || '';
  
  const getRiskColor = (risk) => {
    switch(risk) {
      case 'LOW':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600';
      case 'HIGH':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  // Get triggered alerts for this stock
  const triggeredAlerts = activeAlerts.filter(a => a.symbol === stock?.symbol && a.triggered);

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Header: Stock Info + Price */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">{stock?.symbol || 'N/A'}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{stock?.name || 'Stock'}</p>
          </div>
          
          {/* Risk Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(riskLevel)}`}>
            {riskLevel}
          </div>
        </div>

        {/* Price & Change */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stock?.currentPrice?.toFixed(2) || '0.00'} EGP
            </p>
          </div>
          <div className={`flex items-center gap-1 px-3 py-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={`font-bold text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}{(stock?.change ?? 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      {(recommendation || aiInsights?.anomaly) && (
        <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-slate-700">
          {recommendation && (
            <div className="flex items-start gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">AI Recommendation</p>
                <p className="text-sm text-purple-900 dark:text-purple-100 font-medium truncate">
                  {recommendation}
                </p>
              </div>
              {confidence > 0 && (
                <span className="px-2 py-1 bg-purple-200 dark:bg-purple-800 rounded text-xs font-bold text-purple-700 dark:text-purple-300 flex-shrink-0">
                  {confidence}% 📊
                </span>
              )}
            </div>
          )}
          
          {aiInsights?.anomaly && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">
                ⚠️ {aiInsights.anomaly}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Triggered Alerts Banner */}
      {triggeredAlerts.length > 0 && (
        <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-600">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400 animate-bounce" />
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {triggeredAlerts.length} Alert(s) Triggered! 🔥
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => onAddToPortfolio?.(stock)}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
        >
          <Plus size={16} />
          Add
        </button>

        <button
          onClick={() => onAskAI?.(stock)}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
        >
          <MessageSquare size={16} />
          Ask AI
        </button>

        <button
          onClick={() => onSetAlert?.(stock)}
          className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-bold text-sm transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
        >
          <Bell size={16} />
          Alert
        </button>
      </div>

      {/* Meta Info Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
        <span>52W High: {stock?.fiftyTwoWeekHigh?.toFixed(2) || '—'}</span>
        <span>52W Low: {stock?.fiftyTwoWeekLow?.toFixed(2) || '—'}</span>
      </div>
    </div>
  );
}
