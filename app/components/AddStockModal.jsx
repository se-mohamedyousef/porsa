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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in relative z-10 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 glass border-b border-border p-5 flex items-center justify-between z-20">
          <div>
            <h2 className="text-2xl font-bold gradient-text">
              Add Stock
            </h2>
            <p className="text-sm text-muted-foreground">
              Search and add EGX stocks
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Stock Search */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              Search Stock
            </label>
            <StockSearch
              onSelectStock={handleStockSelect}
              existingSymbols={existingSymbols}
            />
            {selectedStock && (
              <div className="p-4 bg-secondary/50 rounded-xl border border-border animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">
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
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Quantity (Shares)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    className="input-enhanced"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Buy Price (EGP)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Enter buy price"
                    className="input-enhanced"
                  />
                </div>
              </div>

              {/* Potential P/L Preview */}
              {potential && (
                <div className="p-4 rounded-xl border border-border bg-gradient-surface space-y-3">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <span className="text-primary">📊</span> Investment Preview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Investment</p>
                      <p className="text-base font-bold text-foreground">
                        {potential.invested.toLocaleString("en-US", { style: "currency", currency: "EGP" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Est. Current Value</p>
                      <p className="text-base font-bold text-foreground">
                        {potential.currentValue.toLocaleString("en-US", { style: "currency", currency: "EGP" })}
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {potential.profit >= 0 ? "Potential Profit" : "Current Loss"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${potential.profit >= 0 ? "text-success" : "text-error"}`}>
                          {potential.profit >= 0 ? "+" : ""}
                          {potential.profit.toLocaleString("en-US", { style: "currency", currency: "EGP" })}
                        </span>
                        <span className={`badge ${potential.profit >= 0 ? "badge-success" : "badge-error"}`}>
                          {potential.profitPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 glass border-t border-border p-5 flex gap-3 z-20">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStock}
            disabled={!selectedStock || !quantity || !buyPrice || isAdding}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isAdding ? "Adding..." : "Add to Portfolio"}
          </button>
        </div>
      </div>
    </div>
  );
}
