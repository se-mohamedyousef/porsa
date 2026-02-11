"use client";

import { useState } from "react";
import StockSearch from "./StockSearch";

export default function AddStockModal({ onClose, onAddStock, existingSymbols }) {
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleStockSelect = (stock) => {
    if (stock.isDuplicate) {
      // Show warning but allow user to decide
      const confirmed = confirm(
        `${stock.symbol} is already in your portfolio. Add more shares?`
      );
      if (!confirmed) return;
    }

    setSelectedStock(stock);
    setBuyPrice(stock.currentPrice?.toFixed(2) || "");
  };

  const handleAddStock = async () => {
    if (!selectedStock || !quantity || !buyPrice) {
      alert("Please fill in all fields");
      return;
    }

    setIsAdding(true);
    try {
      await onAddStock({
        symbol: selectedStock.symbol,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
      });
      onClose();
    } catch (error) {
      alert("Failed to add stock: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const calculatePotential = () => {
    if (!quantity || !buyPrice || !selectedStock?.currentPrice) return null;

    const invested = parseFloat(quantity) * parseFloat(buyPrice);
    const currentValue =
      parseFloat(quantity) * parseFloat(selectedStock.currentPrice);
    const profit = currentValue - invested;
    const profitPercent = (profit / invested) * 100;

    return { invested, currentValue, profit, profitPercent };
  };

  const potential = calculatePotential();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 glass-strong border-b border-white/20 dark:border-gray-700/30 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Add Stock to Portfolio
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Search for Egyptian stocks and add to your portfolio
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl glass hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center group"
          >
            <svg
              className="w-6 h-6 text-muted-foreground group-hover:text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Stock Search */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Search Stock
            </label>
            <StockSearch
              onSelectStock={handleStockSelect}
              existingSymbols={existingSymbols}
            />
            {selectedStock && (
              <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {selectedStock.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedStock.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      {selectedStock.currentPrice?.toFixed(2)} EGP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current Price
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quantity and Buy Price */}
          {selectedStock && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Quantity (Shares)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    className="input-enhanced w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    Buy Price (EGP)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Enter buy price"
                    className="input-enhanced w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: {selectedStock.currentPrice?.toFixed(2)} EGP
                  </p>
                </div>
              </div>

              {/* Potential P/L Preview */}
              {potential && (
                <div className="card-enhanced bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Investment Preview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Investment
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {potential.invested.toLocaleString("en-US", {
                          style: "currency",
                          currency: "EGP",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Current Value
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {potential.currentValue.toLocaleString("en-US", {
                          style: "currency",
                          currency: "EGP",
                        })}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-green-200 dark:border-green-800">
                      <p className="text-xs text-muted-foreground mb-1">
                        {potential.profit >= 0
                          ? "Potential Profit"
                          : "Current Loss"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-xl font-bold ${
                            potential.profit >= 0
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {potential.profit >= 0 ? "+" : ""}
                          {potential.profit.toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-lg text-sm font-semibold ${
                            potential.profit >= 0
                              ? "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                              : "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {potential.profitPercent >= 0 ? "+" : ""}
                          {potential.profitPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass-strong border-t border-white/20 dark:border-gray-700/30 p-4 sm:p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStock}
            disabled={!selectedStock || !quantity || !buyPrice || isAdding}
            className="btn-primary flex-1 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
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
                Add to Portfolio
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
