"use client";

import { useState, useEffect, useRef } from "react";
import { useUserData } from "../hooks/useUserData";
import { useLanguage } from "../context/LanguageContext";
import PortfolioSummary from "./PortfolioSummary";
import AddStockModal from "./AddStockModal";
import PortfolioInsights from "./PortfolioInsights";
import PortfolioChart from "./PortfolioChart";
import StockDetailsModal from "./StockDetailsModal";

import PriceAlerts from "./PriceAlerts";

export default function PortfolioTracker({ userId }) {
  const { t } = useLanguage();
  const {
    portfolio: stocks,
    loading,
    error,
    addStock,
    removeStock,
    updateStockPrices,
    alerts,
    history,
    addAlert,
    removeAlert
  } = useUserData(userId);
  const [addingStock, setAddingStock] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const intervalRef = useRef(null);

  // 🔔 Check alerts against current prices
  const checkAlerts = async (stock, price) => {
    if (!alerts || alerts.length === 0) return;

    for (const alert of alerts) {
      if (!alert.active) continue;
      if (alert.symbol !== stock.symbol) continue;

      let triggered = false;
      if (alert.condition === "above" && price >= alert.targetPrice) triggered = true;
      if (alert.condition === "below" && price <= alert.targetPrice) triggered = true;

      if (triggered) {
        // Send email (mock)
        try {
          await fetch("/api/send-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: alert.email,
              symbol: stock.symbol,
              price: alert.targetPrice,
              currentPrice: price,
              condition: alert.condition
            }),
          });
          
          console.log(`Alert triggered for ${stock.symbol}`);
        } catch (e) {
          console.error("Failed to send alert", e);
        }
      }
    }
  };

  // 📡 Fetch prices and update saved stocks
  const refreshSavedStockPrices = async (savedStocks) => {
    setRefreshing(true);
    try {
      const updated = await Promise.all(
        savedStocks.map(async (s) => {
          const currentPrice = await fetchStockPrice(s.symbol);
          if (!currentPrice) return s;

          // Check alerts
          checkAlerts(s, currentPrice);

          const invested = s.buyPrice * s.quantity;
          const currentValue = currentPrice * s.quantity;
          const profit = currentValue - invested;
          const profitPercent = (profit / invested) * 100;

          return {
            ...s,
            currentPrice,
            profit,
            profitPercent,
          };
        })
      );
      updateStockPrices(updated);
    } finally {
      setRefreshing(false);
    }
  };

  // 🔍 Get current price from Investing.com
  const fetchStockPrice = async (symbol) => {
    try {
      const url =
        "https://api.investing.com/api/financialdata/assets/equitiesByCountry/default?country-id=59&fields-list=id,name,symbol,last";
      const headers = {
        accept: "*/*",
        "content-type": "application/json",
      };

      const res = await fetch(url, { headers });
      const data = await res.json();

      const stock = data.data.find(
        (s) => s.Symbol.toLowerCase() === symbol.toLowerCase()
      );
      return stock?.Last || null;
    } catch (err) {
      console.error("Price fetch failed:", err);
      return null;
    }
  };

  // ➕ Add a new stock (called from modal)
  const handleAddStockFromModal = async ({ symbol, quantity, buyPrice }) => {
    setAddingStock(true);
    const upperSymbol = symbol.toUpperCase();
    const currentPrice = await fetchStockPrice(upperSymbol);

    if (!currentPrice) {
      throw new Error("Invalid symbol or data unavailable");
    }

    const qty = parseFloat(quantity);
    const buy = parseFloat(buyPrice);
    const invested = buy * qty;
    const currentValue = currentPrice * qty;
    const profit = currentValue - invested;
    const profitPercent = (profit / invested) * 100;

    const stockData = {
      id: Date.now(),
      symbol: upperSymbol,
      quantity: qty,
      buyPrice: buy,
      currentPrice,
      profit,
      profitPercent,
    };

    await addStock(stockData);
    setAddingStock(false);
  };

  const [activeTab, setActiveTab] = useState("overview");

  // Auto-refresh prices every 60 seconds if enabled
  useEffect(() => {
    if (autoRefresh && stocks.length > 0) {
      // Immediately refresh on enable
      refreshSavedStockPrices(stocks);
      intervalRef.current = setInterval(() => {
        refreshSavedStockPrices(stocks);
      }, 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, stocks.length]);

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-all rounded-full
        ${activeTab === id 
          ? "bg-primary text-white shadow-md hover:shadow-lg transform scale-105" 
          : "bg-white/50 dark:bg-gray-800/50 text-muted-foreground hover:bg-white dark:hover:bg-gray-800 hover:text-foreground"
        }
      `}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="p-2 sm:p-0 animate-fade-in space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">{t('egxPortfolio')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
             Track your investments in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stocks.length > 0 && (
             <span className="badge badge-primary px-3 py-1">
               {stocks.length} {stocks.length === 1 ? 'Holding' : 'Holdings'}
             </span>
          )}
          <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addStock')}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton id="overview" label={t('overview')} icon="📊" />
        <TabButton id="holdings" label={t('holdings')} icon="💼" />
        <TabButton id="insights" label={t('insights')} icon="🧠" />
        <TabButton id="alerts" label={t('alerts')} icon="🔔" />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-slide-up">
            <PortfolioSummary stocks={stocks} />
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-primary">📈</span> Performance History
              </h3>
              <PortfolioChart history={history} />
            </div>
          </div>
        )}

        {activeTab === "holdings" && (
          <div className="animate-slide-up">
            <div className="card-modern bg-white dark:bg-gray-900 overflow-hidden p-0 border border-border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-start font-semibold text-muted-foreground">{t('symbol')}</th>
                      <th className="px-6 py-4 text-end font-semibold text-muted-foreground">{t('qty')}</th>
                      <th className="px-6 py-4 text-end font-semibold text-muted-foreground">{t('avgCost')}</th>
                      <th className="px-6 py-4 text-end font-semibold text-muted-foreground">{t('price')}</th>
                      <th className="px-6 py-4 text-end font-semibold text-muted-foreground">{t('profit')}</th>
                      <th className="px-6 py-4 text-end font-semibold text-muted-foreground">%</th>
                      <th className="px-6 py-4 text-center font-semibold text-muted-foreground">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedStock(stock)}
                      >
                        <td className="px-6 py-4 font-bold group-hover:text-primary transition-colors text-start">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                               {stock.symbol.substring(0,2)}
                             </div>
                             {stock.symbol}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end text-foreground font-medium">
                          {stock.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-end text-muted-foreground">
                          {stock.buyPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-end font-medium">
                          {stock.currentPrice?.toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 text-end font-bold ${stock.profit >= 0 ? "text-success" : "text-error"}`}>
                          {stock.profit >= 0 ? "+" : ""}{stock.profit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-end">
                           <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                             stock.profitPercent >= 0 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                           }`}>
                             {stock.profitPercent.toFixed(2)}%
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStock(stock.id);
                            }}
                            className="p-2 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Remove stock"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stocks.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-4 animate-scale-in">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2">
                              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Your portfolio is empty</h3>
                            <p className="text-muted-foreground max-w-sm">Start tracking your EGX stocks by adding your first investment.</p>
                            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-2">
                              Add First Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="animate-slide-up">
             <PortfolioInsights stocks={stocks} />
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="animate-slide-up">
            <PriceAlerts 
              alerts={alerts} 
              onAddAlert={addAlert} 
              onRemoveAlert={removeAlert} 
            />
          </div>
        )}
      </div>

      {/* Modals are always rendered but controlled by state */}
      {showAddModal && (
        <AddStockModal
          onClose={() => setShowAddModal(false)}
          onAddStock={handleAddStockFromModal}
          existingSymbols={stocks.map((s) => s.symbol)}
        />
      )}

      {selectedStock && (
        <StockDetailsModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}
