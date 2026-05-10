'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useLanguageSimple } from '../hooks/useLanguageSimple';
import { calculatePortfolioSummary } from '../utils/portfolio';
import SimpleStockCard from './SimpleStockCard';
import BottomNav from './BottomNav';
import SimpleAlerts from './SimpleAlerts';
import SimpleProfile from './SimpleProfile';
import SimpleRecommendations from './SimpleRecommendations';
import LoadingSpinner from './LoadingSpinner';
import AddStockModal from './AddStockModal';
import StockDetailsModal from './StockDetailsModal';
import EnhancedToast from './EnhancedToast';
import LiveMarketTab from './LiveMarketTab';
import { Plus, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

async function fetchLiveQuotePrice(symbol) {
  try {
    const r = await fetch(`/api/egx-chart?symbol=${encodeURIComponent(symbol)}`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.success) return null;
    const rp = j.meta?.regularMarketPrice;
    if (rp != null && !Number.isNaN(Number(rp))) return Number(rp);
    const last = j.bars?.[j.bars.length - 1]?.close;
    if (last != null && !Number.isNaN(Number(last))) return Number(last);
  } catch {
    /* network / parse */
  }
  return null;
}

export default function SimpleDashboard({ userId, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [initialStockData, setInitialStockData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [investmentFilter, setInvestmentFilter] = useState('all');
  const { t, language, isRTL } = useLanguageSimple();

  const {
    portfolio: stocks,
    userProfile,
    loading,
    error,
    addStock,
    removeStock,
    updateStockPrices
  } = useUserData(userId);

  // Use shared portfolio summary calculation
  const summary = calculatePortfolioSummary(stocks);

  // Filter stocks by investment type
  const filteredStocks = investmentFilter === 'all' 
    ? stocks 
    : stocks.filter(s => (s.investmentType || 'long-term') === investmentFilter);

  // Calculate summaries for each investment type
  const longTermStocks = stocks.filter(s => (s.investmentType || 'long-term') === 'long-term');
  const shortTermStocks = stocks.filter(s => s.investmentType === 'short-term');
  const longTermSummary = calculatePortfolioSummary(longTermStocks);
  const shortTermSummary = calculatePortfolioSummary(shortTermStocks);

  const refreshPrices = useCallback(async () => {
    if (!stocks?.length) return;
    setRefreshing(true);
    try {
      let liveCount = 0;
      const updated = await Promise.all(
        stocks.map(async (s) => {
          const live = await fetchLiveQuotePrice(s.symbol);
          const newPrice = live != null ? live : s.currentPrice;
          if (live != null) liveCount += 1;
          const invested = s.buyPrice * s.quantity;
          const currentValue = newPrice * s.quantity;
          const profit = currentValue - invested;
          const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
          return {
            ...s,
            currentPrice: parseFloat(Number(newPrice).toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            profitPercent: parseFloat(profitPercent.toFixed(2)),
          };
        })
      );
      await updateStockPrices(updated);
      setToast({
        message:
          liveCount > 0
            ? `Prices updated (${liveCount}/${stocks.length} from live quotes).`
            : 'No live quotes for these symbols; holdings unchanged.',
        type: liveCount > 0 ? 'success' : 'warning',
      });
    } catch (error) {
      console.error('Error refreshing prices:', error);
      setToast({ message: 'Failed to refresh', type: 'error' });
    } finally {
      setRefreshing(false);
    }
  }, [stocks, updateStockPrices]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!stocks?.length) return;
    const id = setInterval(() => {
      refreshPrices();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [stocks?.length, refreshPrices]);

  const handleOpenAddFromMarket = (stockPayload) => {
    setInitialStockData(stockPayload);
    setShowAddModal(true);
  };

  const handleAddStock = async (stockData) => {
    try {
      // Handle recommendation data by converting to stock format
      let dataToAdd = stockData;
      if (stockData.entryPrice && stockData.targetPrice) {
        // This is a recommendation object
        dataToAdd = {
          symbol: stockData.symbol,
          name: stockData.name,
          quantity: 1, // Default quantity for recommendations
          buyPrice: stockData.entryPrice,
          currentPrice: stockData.entryPrice,
          sector: stockData.sector || 'Unknown',
          investmentType: stockData.expectedReturn > 10 ? 'short-term' : 'long-term'
        };
      }
      await addStock(dataToAdd);
      setShowAddModal(false);
      setToast({ message: '✅ Stock added!', type: 'success' });
    } catch (error) {
      console.error('Error adding stock:', error);
      setToast({ message: 'Failed to add stock', type: 'error' });
    }
  };

  const handleRemoveStock = (stock) => {
    if (confirm(`Remove ${stock.symbol} from your portfolio?`)) {
      removeStock(stock.id);
      setToast({ message: `${stock.symbol} removed!`, type: 'success' });
    }
  };

  const handleViewStock = (stock) => {
    setSelectedStock(stock);
    setShowDetailsModal(true);
  };

  const handleOpenAddModalWithRecommendation = (recommendation) => {
    // Convert recommendation data to stock format for the modal
    setInitialStockData(recommendation);
    setShowAddModal(true);
  };

  if (loading && !stocks) return <LoadingSpinner />;

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* HOME Tab */}
      {activeTab === 'home' && (
        <div className="pb-32 px-3 sm:px-4 space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="pt-2 sm:pt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Porsa</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">{t('yourPortfolio')}</p>
            </div>
            <button
              onClick={refreshPrices}
              disabled={refreshing}
              className="p-2 sm:p-3 bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 hover:from-emerald-200 hover:to-blue-200 dark:hover:from-emerald-800/50 dark:hover:to-blue-800/50 rounded-xl transition-all transform hover:scale-110 active:scale-95 shadow-md"
            >
              <RefreshCw size={20} className={`text-emerald-600 dark:text-emerald-400 sm:w-6 sm:h-6 w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Portfolio Hero Card - Enhanced Colors */}
          <div className="bg-gradient-to-br from-blue-600 via-emerald-500 to-teal-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-102">
            <p className="text-xs sm:text-sm opacity-90 mb-2 font-semibold tracking-wide">💼 {t('yourPortfolio')}</p>
            <h2 className="text-2xl sm:text-5xl font-black mb-4 sm:mb-8 drop-shadow-lg">{(summary?.totalValue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} EGP</h2>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Total Gain/Loss */}
              <div className="bg-white/25 backdrop-blur-lg rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-white/30 hover:bg-white/35 transition-all">
                <p className="text-xs opacity-90 mb-1 sm:mb-2 font-bold tracking-wide uppercase">{t('totalGain')}</p>
                <div className="flex items-center gap-2">
                  {(summary?.totalProfit || 0) >= 0 ? (
                    <TrendingUp size={16} className="text-emerald-200 sm:w-5 sm:h-5" />
                  ) : (
                    <TrendingDown size={16} className="text-rose-200 sm:w-5 sm:h-5" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-lg sm:text-3xl font-black drop-shadow-lg truncate ${(summary?.totalProfit || 0) >= 0 ? 'text-emerald-100' : 'text-rose-100'}`}>
                      {(summary?.totalProfit || 0) >= 0 ? '+' : ''}{(summary?.totalProfit || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs opacity-80">{(summary?.totalProfitPercent || 0).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
              
              {/* Stocks Count */}
              <div className="bg-white/25 backdrop-blur-lg rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-white/30 hover:bg-white/35 transition-all">
                <p className="text-xs opacity-90 mb-1 sm:mb-2 font-bold tracking-wide uppercase">{t('stocks')}</p>
                <p className="text-lg sm:text-3xl font-black drop-shadow-lg mb-1">{stocks?.length || 0}</p>
                <p className="text-xs opacity-80">
                  🟢{summary?.profitableCount || 0} 🔴{summary?.losingCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Add Stock Button - Enhanced */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl"
          >
            <Plus size={20} className="sm:w-7 sm:h-7" />
            {t('addStock')}
          </button>

          {/* Investment Type Breakdown Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
            {/* Long-term Investments Card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all">
              <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase mb-1 sm:mb-2">📅 Long-term</p>
              <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{longTermStocks.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1 truncate">
                Invested: {(calculatePortfolioSummary(longTermStocks).totalInvested / 1000).toFixed(0)}k EGP
              </p>
            </div>

            {/* Short-term Investments Card */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all">
              <p className="text-xs text-orange-600 dark:text-orange-300 font-bold uppercase mb-1 sm:mb-2">⚡ Short-term</p>
              <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{shortTermStocks.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mt-1 truncate">
                Invested: {(calculatePortfolioSummary(shortTermStocks).totalInvested / 1000).toFixed(0)}k EGP
              </p>
            </div>
          </div>

          {/* Stocks List with Investment Type Filter */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-3 sm:mt-4">{t('stocks')}</h3>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">({filteredStocks.length})</span>
            </div>
            
            {/* Investment Type Filter Tabs */}
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setInvestmentFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  investmentFilter === 'all'
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                📊 All ({stocks.length})
              </button>
              <button
                onClick={() => setInvestmentFilter('long-term')}
                className={`px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  investmentFilter === 'long-term'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }`}
              >
                📅 Long ({stocks.filter(s => (s.investmentType || 'long-term') === 'long-term').length})
              </button>
              <button
                onClick={() => setInvestmentFilter('short-term')}
                className={`px-3 sm:px-4 py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  investmentFilter === 'short-term'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                }`}
              >
                ⚡ Short ({stocks.filter(s => s.investmentType === 'short-term').length})
              </button>
            </div>

            {filteredStocks.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {filteredStocks.map(stock => (
                  <SimpleStockCard
                    key={stock.id}
                    stock={stock}
                    onView={() => handleViewStock(stock)}
                    onSell={() => handleRemoveStock(stock)}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <p className="text-2xl sm:text-4xl mb-2">📈</p>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold">{t('noStocks')}</p>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">{t('addYourFirst')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE MARKET Tab */}
      {activeTab === 'market' && (
        <LiveMarketTab
          onViewStock={(mapped) => {
            setSelectedStock(mapped);
            setShowDetailsModal(true);
          }}
          onAddFromMarket={handleOpenAddFromMarket}
        />
      )}

      {/* RECOMMENDATIONS Tab */}
      {activeTab === 'recommendations' && (
        <div className="pb-24 px-4 space-y-4">
          <div className="pt-4">
            <h2 className="text-3xl font-black bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">{t('recommendations')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{t('goodPicks')}</p>
          </div>
          <SimpleRecommendations 
            onViewDetails={handleViewStock}
            onOpenAddModal={handleOpenAddModalWithRecommendation}
            language={language} 
          />
        </div>
      )}

      {/* ALERTS Tab */}
      {activeTab === 'alerts' && (
        <div className="pb-24 px-4 space-y-4">
          <div className="pt-4">
            <h2 className="text-3xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">{t('priceAlerts')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{t('setAlerts')}</p>
          </div>
          <SimpleAlerts language={language} userId={userId} />
        </div>
      )}

      {/* PROFILE Tab */}
      {activeTab === 'profile' && (
        <SimpleProfile language={language} user={userProfile} userId={userId} onLogout={onLogout} />
      )}

      {/* Bottom Navigation */}
      <BottomNav onTabChange={setActiveTab} activeTab={activeTab} />

      {/* Modals */}
      {showAddModal && (
        <AddStockModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setInitialStockData(null);
          }}
          onAddStock={handleAddStock}
          existingSymbols={stocks.map((s) => s.symbol)}
          initialStock={initialStockData}
        />
      )}

      {showDetailsModal && selectedStock && (
        <StockDetailsModal
          stock={selectedStock}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <EnhancedToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
