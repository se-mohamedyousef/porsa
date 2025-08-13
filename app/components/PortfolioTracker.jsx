"use client";

import { useState, useEffect, useRef } from "react";
import { useUserData } from "../hooks/useUserData";
import PortfolioSummary from "./PortfolioSummary";

export default function PortfolioTracker({ userId }) {
  const {
    portfolio: stocks,
    loading,
    error,
    addStock,
    removeStock,
    updateStockPrices,
  } = useUserData(userId);
  const [newStock, setNewStock] = useState({
    symbol: "",
    quantity: "",
    buyPrice: "",
  });
  const [addingStock, setAddingStock] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // 📡 Fetch prices and update saved stocks
  const refreshSavedStockPrices = async (savedStocks) => {
    setRefreshing(true);
    try {
      const updated = await Promise.all(
        savedStocks.map(async (s) => {
          const currentPrice = await fetchStockPrice(s.symbol);
          if (!currentPrice) return s;

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

  // ➕ Add a new stock
  const handleAddStock = async () => {
    const { symbol, quantity, buyPrice } = newStock;
    if (!symbol || !quantity || !buyPrice) return;

    setAddingStock(true);
    const upperSymbol = symbol.toUpperCase();
    const currentPrice = await fetchStockPrice(upperSymbol);

    if (!currentPrice) {
      alert("Invalid symbol or data unavailable");
      setAddingStock(false);
      return;
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
    setNewStock({ symbol: "", quantity: "", buyPrice: "" });
    setAddingStock(false);
  };

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

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">📊 My EGX Portfolio</h2>
      </div>

      <PortfolioSummary stocks={stocks} />

      {/* Input Form */}
      <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mb-6">
        <h3 className="text-sm font-medium mb-3">Add New Stock</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Symbol
            </label>
            <input
              type="text"
              placeholder="e.g. COMI"
              value={newStock.symbol}
              onChange={(e) =>
                setNewStock({ ...newStock, symbol: e.target.value })
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Quantity
            </label>
            <input
              type="number"
              placeholder="Number of shares"
              value={newStock.quantity}
              onChange={(e) =>
                setNewStock({ ...newStock, quantity: e.target.value })
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Buy Price (EGP)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Price per share"
              value={newStock.buyPrice}
              onChange={(e) =>
                setNewStock({ ...newStock, buyPrice: e.target.value })
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <button
          onClick={handleAddStock}
          disabled={addingStock || loading}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {addingStock ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Stock
            </>
          )}
        </button>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm font-medium">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={() => setAutoRefresh((v) => !v)}
            className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            disabled={loading || stocks.length === 0}
          />
          Auto-refresh prices
          {refreshing && (
            <svg
              className="animate-spin ml-2 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
        </label>
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-muted-foreground">
                Symbol
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-muted-foreground">
                Quantity
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-muted-foreground">
                Buy Price
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-muted-foreground">
                Current Price
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-muted-foreground">
                P/L
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-muted-foreground">
                %
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stocks.map((stock) => (
              <tr
                key={stock.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold">
                  {stock.symbol}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                  {stock.quantity.toLocaleString()}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                  {stock.buyPrice.toFixed(2)} EGP
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                  {stock.currentPrice?.toFixed(2)} EGP
                </td>
                <td
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-medium ${
                    stock.profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stock.profit >= 0 ? "+" : ""}
                  {stock.profit.toFixed(2)} EGP
                </td>
                <td
                  className={`px-2 sm:px-4 py-2 sm:py-3 text-right font-medium ${
                    stock.profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stock.profit >= 0 ? "+" : ""}
                  {stock.profitPercent.toFixed(2)}%
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                  <button
                    onClick={() => removeStock(stock.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    disabled={loading}
                    title="Remove stock"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="px-2 sm:px-4 py-8 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg
                      className="w-12 h-12 text-muted-foreground/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p className="text-sm">No stocks added yet.</p>
                    <p className="text-xs text-muted-foreground">
                      Add your first stock to start tracking your portfolio.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
