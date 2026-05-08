'use client';

import { ChevronRight, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function SimpleStockCard({ stock, onView, onSell, language }) {
  const { t } = useLanguageSimple();
  const isProfit = stock.profit >= 0;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-gray-200 dark:border-slate-600 p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-102 overflow-hidden relative">
      {/* Animated Gradient Background */}
      <div className={`absolute inset-0 opacity-5 ${isProfit ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 'bg-gradient-to-r from-rose-400 to-red-400'}`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header - Stock Name & Change Percent */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{stock.symbol}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  (stock.investmentType || 'long-term') === 'long-term'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                }`}
              >
                {(stock.investmentType || 'long-term') === 'long-term' ? '📅 Long-term' : '⚡ Short-term'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">📊 {stock.quantity} {t('shares')}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-black ${
              isProfit
                ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-300'
                : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 dark:from-rose-900/40 dark:to-red-900/40 dark:text-rose-300'
            }`}
          >
            {isProfit ? <TrendingUp size={16} className="inline mr-1" /> : <TrendingDown size={16} className="inline mr-1" />}
            {Math.abs(stock.profitPercent).toFixed(1)}%
          </span>
        </div>

        {/* Current Price - BIG with Gradient */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 dark:from-blue-500/20 dark:to-emerald-500/20 rounded-xl border border-blue-200/50 dark:border-blue-400/30 hover:border-blue-300 transition-colors">
          <p className="text-xs text-gray-600 dark:text-gray-300 font-bold tracking-wide uppercase mb-2">{t('currentPrice')}</p>
          <p className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text">{stock.currentPrice}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">EGP</p>
        </div>

        {/* Profit/Loss - BIG with Gradient */}
        <div
          className={`mb-5 p-4 rounded-xl border ${
            isProfit
              ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border-emerald-200/50 dark:border-emerald-400/30'
              : 'bg-gradient-to-r from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20 border-rose-200/50 dark:border-rose-400/30'
          }`}
        >
          <p className="text-xs text-gray-600 dark:text-gray-300 font-bold tracking-wide uppercase mb-2">{t('gainLoss')}</p>
          <p
            className={`text-3xl font-black ${
              isProfit
                ? 'text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text'
                : 'text-transparent bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text'
            }`}
          >
            {isProfit ? '+' : ''}{stock.profit.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">EGP</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onView(stock)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {t('viewDetails')}
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => onSell(stock)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl font-black text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {t('sell')}
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
