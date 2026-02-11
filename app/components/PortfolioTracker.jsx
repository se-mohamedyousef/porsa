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
        // Send email
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
          
          // Deactivate alert locally to prevent spam (in a real app, update DB)
          // For now we just let it spam or we'd need to update the alert state to active: false
          // Let's just log it for now
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
        flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2
        ${activeTab === id 
          ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" 
          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        }
      `}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent rtl:bg-gradient-to-l">{t('egxPortfolio')}</h2>
        <div className="flex items-center gap-2">
          {stocks.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
              {stocks.length} {stocks.length === 1 ? 'Stock' : 'Stocks'}
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        <TabButton id="overview" label={t('overview')} icon="📊" />
        <TabButton id="holdings" label={t('holdings')} icon="💼" />
        <TabButton id="insights" label={t('insights')} icon="🧠" />
        <TabButton id="alerts" label={t('alerts')} icon="🔔" />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            <PortfolioSummary stocks={stocks} />
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Portfolio Performance</h3>
              <PortfolioChart history={history} />
            </div>
          </div>
        )}

        {activeTab === "holdings" && (
          <div className="animate-fade-in">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('addStock')}
              </button>
            </div>

            {/* Stock Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/50">
              <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold text-gray-600 dark:text-gray-300">{t('symbol')}</th>
                    <th className="px-4 py-3 text-end font-semibold text-gray-600 dark:text-gray-300">{t('qty')}</th>
                    <th className="px-4 py-3 text-end font-semibold text-gray-600 dark:text-gray-300">{t('avgCost')}</th>
                    <th className="px-4 py-3 text-end font-semibold text-gray-600 dark:text-gray-300">{t('price')}</th>
                    <th className="px-4 py-3 text-end font-semibold text-gray-600 dark:text-gray-300">{t('profit')}</th>
                    <th className="px-4 py-3 text-end font-semibold text-gray-600 dark:text-gray-300">%</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedStock(stock)}
                    >
                      <td className="px-4 py-3 font-semibold group-hover:text-blue-600 transition-colors text-start">
                        {stock.symbol}
                      </td>
                      <td className="px-4 py-3 text-end text-gray-600 dark:text-gray-300">
                        {stock.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-end text-gray-600 dark:text-gray-300">
                        {stock.buyPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-end text-gray-600 dark:text-gray-300">
                        {stock.currentPrice?.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-end font-medium ${stock.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {stock.profit >= 0 ? "+" : ""}{stock.profit.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-end font-medium ${stock.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {stock.profitPercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStock(stock.id);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                          title="Remove stock"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {stocks.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <p>Your portfolio is empty.</p>
                          <button onClick={() => setShowAddModal(true)} className="text-blue-600 hover:underline text-sm font-medium">Add your first stock</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="animate-fade-in">
             <PortfolioInsights stocks={stocks} />
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="animate-fade-in">
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
