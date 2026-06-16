'use client';

import { ChevronRight, Trash2, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';
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
  const { t, language: lang } = useLanguageSimple();
  const isProfit = stock.profit >= 0;
  const quantity = Number(stock.quantity) || 0;
  const buyPrice = Number(stock.buyPrice) || 0;
  const currentPrice = Number(stock.currentPrice) || 0;
  const invested = quantity * buyPrice;
  const marketValue = quantity * currentPrice;

  const formatPrice = (value) =>
    Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate days held since purchase
  const purchaseDate = stock.purchaseDate ? new Date(stock.purchaseDate) : null;
  const daysHeld = purchaseDate ? Math.floor((new Date() - purchaseDate) / (1000 * 60 * 60 * 24)) : null;
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
            {purchaseDate && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  <Calendar size={12} /> {formatDate(stock.purchaseDate)}
                </span>
                {daysHeld != null && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    <Clock size={11} /> {daysHeld} {t('daysHeld')}
                  </span>
                )}
              </div>
            )}
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

        {/* Profit / Loss Hero */}
        <div
          className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl border-2 ${
            isProfit
              ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border-emerald-300 dark:border-emerald-500/40'
              : 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 border-rose-300 dark:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isProfit ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50">
                  <TrendingUp size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-rose-900/50">
                  <TrendingDown size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
              )}
              <span className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isProfit ? 'Profit' : 'Loss'}
              </span>
            </div>
            <span className={`text-xl sm:text-3xl font-black ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isProfit ? '+' : ''}{Math.abs(Number(stock.profitPercent || 0)).toFixed(2)}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-lg sm:text-2xl font-black ${isProfit ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {isProfit ? '+' : '-'}{Math.abs(Number(stock.profit || 0)).toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold">
              {formatPrice(buyPrice)} → {formatPrice(currentPrice)}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-3 sm:mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg bg-slate-100/80 dark:bg-slate-700/60 p-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold">{t('buyPrice')}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{formatPrice(buyPrice)} EGP</p>
          </div>
          <div className="rounded-lg bg-cyan-100/70 dark:bg-cyan-900/30 p-2">
            <p className="text-[11px] text-cyan-700 dark:text-cyan-300 font-bold">{t('currentPrice')}</p>
            <p className="text-sm font-black text-cyan-700 dark:text-cyan-300">{formatPrice(currentPrice)} EGP</p>
          </div>
          <div className="rounded-lg bg-slate-100/80 dark:bg-slate-700/60 p-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-300 font-bold">{t('totalInvestment')}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{invested.toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP</p>
          </div>
          <div className="rounded-lg bg-blue-100/70 dark:bg-blue-900/30 p-2">
            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">{t('currentValue')}</p>
            <p className="text-sm font-black text-blue-700 dark:text-blue-300">{marketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP</p>
          </div>
        </div>

        {/* Transaction History */}
        {stock.transactions?.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('transactionHistory')}</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {stock.transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map((txn) => {
                const txnDaysAgo = Math.floor((new Date() - new Date(txn.date)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={txn.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                        txn.type === 'buy'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                      }`}>{txn.type}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{txn.quantity} × {formatPrice(txn.price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <span>{formatDate(txn.date)}</span>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{txnDaysAgo} {t('daysAgo')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
