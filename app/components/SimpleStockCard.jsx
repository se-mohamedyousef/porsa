'use client';

import { ChevronRight, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

// Determine if intraday trading is allowed
const isIntradayAllowed = (symbol) => {
  const restrictedSymbols = ['NILE', 'GOVT'];
  return !restrictedSymbols.includes((symbol || '').toUpperCase());
};

// Determine which index the stock belongs to
const getStockIndices = (stock) => {
  const symbol = (stock?.symbol || '').toUpperCase();
  
  const egx30 = ['COMI', 'EBANK', 'FAWRY', 'ORCL', 'CALE', 'TRPL', 'EMRL', 'ETEL', 'EMAS', 'DSCW', 'SWDY', 'ETLT', 'NTSM', 'AMLK', 'MNHD', 'HERY', 'EBKD', 'ACIB', 'CRECB', 'EKHO', 'HMPF', 'ORHD', 'ATCO', 'SBK', 'NPRO', 'ETSX', 'DNOC', 'OBKE', 'CLLD', 'MOBA'];
  const egx70Additional = ['SKOP', 'ENGI', 'APOT', 'AMGH', 'CLHL', 'CHDR', 'EHDR', 'KOUM', 'IDBK'];
  const egx100Additional = ['RALS', 'ESPL', 'ALEX', 'AMPS', 'MREM', 'SRTK', 'RSGC', 'GRDC'];
  
  const indices = [];
  
  if (egx30.includes(symbol)) {
    indices.push({ name: 'EGX30', label: 'Blue Chip', color: 'from-blue-600 to-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-300' });
  } else if (egx70Additional.includes(symbol)) {
    indices.push({ name: 'EGX70', label: 'Mid-Cap', color: 'from-purple-600 to-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-300' });
  }
  
  if (egx30.includes(symbol) || egx70Additional.includes(symbol) || egx100Additional.includes(symbol)) {
    indices.push({ name: 'EGX100', label: 'Market', color: 'from-emerald-600 to-emerald-700', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-300' });
  } else {
    indices.push({ name: 'EGX', label: 'Listed', color: 'from-gray-600 to-gray-700', bgColor: 'bg-gray-100 dark:bg-gray-900/30', textColor: 'text-gray-700 dark:text-gray-300' });
  }
  
  return indices;
};

export default function SimpleStockCard({ stock, onView, onSell, language }) {
  const { t } = useLanguageSimple();
  const isProfit = stock.profit >= 0;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-600 p-3 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-102 overflow-hidden relative">
      {/* Animated Gradient Background */}
      <div className={`absolute inset-0 opacity-5 ${isProfit ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 'bg-gradient-to-r from-rose-400 to-red-400'}`}></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header - Stock Name & Change Percent */}
        <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{stock.symbol}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  (stock.investmentType || 'long-term') === 'long-term'
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                }`}
              >
                {(stock.investmentType || 'long-term') === 'long-term' ? '📅' : '⚡'}
              </span>
              {isIntradayAllowed(stock.symbol) ? (
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 whitespace-nowrap">
                  ✓ Intraday
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 whitespace-nowrap">
                  ✗ No Intraday
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap text-xs mb-2">
              {getStockIndices(stock).map((idx, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded text-xs font-bold ${idx.bgColor} ${idx.textColor}`}>
                  {idx.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">📊 {stock.quantity} {t('shares')}</p>
          </div>
          <span
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-black whitespace-nowrap ${
              isProfit
                ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-300'
                : 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 dark:from-rose-900/40 dark:to-red-900/40 dark:text-rose-300'
            }`}
          >
            {isProfit ? <TrendingUp size={14} className="inline mr-1 sm:w-4 sm:h-4" /> : <TrendingDown size={14} className="inline mr-1 sm:w-4 sm:h-4" />}
            {Math.abs(stock.profitPercent).toFixed(1)}%
          </span>
        </div>

        {/* Current Price - BIG with Gradient */}
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 dark:from-blue-500/20 dark:to-emerald-500/20 rounded-lg sm:rounded-xl border border-blue-200/50 dark:border-blue-400/30 hover:border-blue-300 transition-colors">
          <p className="text-xs text-gray-600 dark:text-gray-300 font-bold tracking-wide uppercase mb-1 sm:mb-2">{t('currentPrice')}</p>
          <p className="text-2xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text">{stock.currentPrice}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">EGP</p>
        </div>

        {/* Profit/Loss - BIG with Gradient */}
        <div
          className={`mb-4 sm:mb-5 p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
            isProfit
              ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border-emerald-200/50 dark:border-emerald-400/30'
              : 'bg-gradient-to-r from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20 border-rose-200/50 dark:border-rose-400/30'
          }`}
        >
          <p className="text-xs text-gray-600 dark:text-gray-300 font-bold tracking-wide uppercase mb-1 sm:mb-2">{t('gainLoss')}</p>
          <p
            className={`text-xl sm:text-3xl font-black ${
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
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => onView(stock)}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl font-black text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl"
          >
            {t('viewDetails')}
            <ChevronRight size={16} className="sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => onSell(stock)}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-lg sm:rounded-xl font-black text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl"
          >
            {t('sell')}
            <Trash2 size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
