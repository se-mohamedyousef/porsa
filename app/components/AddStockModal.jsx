"use client";

import { useState } from "react";
import { AlertCircle, TrendingUp, Calendar, FileText, CheckCircle, X } from "lucide-react";
import StockSearch from "./StockSearch";

export default function AddStockModal({ onClose, onAddStock, existingSymbols, initialStock }) {
  // Initialize selectedStock - if initialStock is a recommendation, add currentPrice
  const getInitialStock = () => {
    if (!initialStock) return null;
    if (initialStock.entryPrice && !initialStock.currentPrice) {
      // This is a recommendation, add currentPrice for calculations
      return {
        ...initialStock,
        currentPrice: initialStock.entryPrice
      };
    }
    return initialStock;
  };

  const [selectedStock, setSelectedStock] = useState(getInitialStock());
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState(initialStock?.entryPrice ? initialStock.entryPrice.toFixed(2) : "");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [investmentType, setInvestmentType] = useState(initialStock?.expectedReturn > 10 ? "short-term" : "long-term");
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState({});

  const handleStockSelect = (stock) => {
    if (stock.isDuplicate) {
      const confirmed = confirm(
        `${stock.symbol} is already in your portfolio. Add more shares?`
      );
      if (!confirmed) return;
    }

    setSelectedStock(stock);
    setBuyPrice(stock.currentPrice?.toFixed(2) || "");
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedStock) newErrors.stock = "Please select a stock";
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (!buyPrice || parseFloat(buyPrice) <= 0) newErrors.buyPrice = "Buy price must be greater than 0";
    if (!purchaseDate) newErrors.purchaseDate = "Purchase date is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddStock = async () => {
    if (!validateForm()) return;

    setIsAdding(true);
    try {
      await onAddStock({
        symbol: selectedStock.symbol,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        purchaseDate: purchaseDate,
        notes: notes,
        investmentType: investmentType,
      });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const setQuickQuantity = (qty) => {
    setQuantity(qty.toString());
    setErrors({ ...errors, quantity: undefined });
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white dark:bg-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-3xl relative z-10 flex flex-col border border-gray-200 dark:border-slate-700">
        
        {/* Premium Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-8 flex items-center justify-between z-20 rounded-t-3xl">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <TrendingUp size={32} className="text-yellow-300" />
              Add Stock
            </h2>
            <p className="text-sm text-white/80 font-semibold mt-1">
              Add Egyptian stocks to your portfolio
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center text-white hover:scale-110 transform"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Stock Search Section */}
          <div className="space-y-3">
            <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-blue-600">🔍</span> Select Stock
            </label>
            <StockSearch
              onSelectStock={handleStockSelect}
              existingSymbols={existingSymbols}
            />
            {errors.stock && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm font-semibold">
                <AlertCircle size={18} />
                {errors.stock}
              </div>
            )}
          </div>

          {/* Selected Stock Info Card */}
          {selectedStock && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-800 animate-pulse-slow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-lg">
                      {selectedStock.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900 dark:text-white">
                        {selectedStock.symbol}
                      </p>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {selectedStock.name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {selectedStock.currentPrice?.toFixed(2)} EGP
                  </p>
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Current Price
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          {selectedStock && (
            <div className="space-y-6">
              
              {/* Quantity Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  📊 Number of Shares
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    if (e.target.value) setErrors({ ...errors, quantity: undefined });
                  }}
                  placeholder="Enter number of shares"
                  className={`w-full px-4 py-3 rounded-xl font-bold text-lg bg-white dark:bg-slate-800 border-2 transition-all ${
                    errors.quantity 
                      ? 'border-red-500 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
                  } focus:outline-none`}
                />
                {errors.quantity && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.quantity}
                  </p>
                )}
                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setQuickQuantity(qty)}
                      className={`px-3 py-2 rounded-lg font-bold text-sm transition-all transform hover:scale-105 ${
                        quantity === qty.toString()
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buy Price Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  💰 Purchase Price (EGP)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={buyPrice}
                  onChange={(e) => {
                    setBuyPrice(e.target.value);
                    if (e.target.value) setErrors({ ...errors, buyPrice: undefined });
                  }}
                  placeholder="Enter purchase price"
                  className={`w-full px-4 py-3 rounded-xl font-bold text-lg bg-white dark:bg-slate-800 border-2 transition-all ${
                    errors.buyPrice 
                      ? 'border-red-500 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
                  } focus:outline-none`}
                />
                {errors.buyPrice && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.buyPrice}
                  </p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 Current market price: {selectedStock.currentPrice?.toFixed(2)} EGP
                </p>
              </div>

              {/* Purchase Date Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} /> Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value);
                    if (e.target.value) setErrors({ ...errors, purchaseDate: undefined });
                  }}
                  className={`w-full px-4 py-3 rounded-xl font-bold bg-white dark:bg-slate-800 border-2 transition-all ${
                    errors.purchaseDate 
                      ? 'border-red-500 dark:border-red-600' 
                      : 'border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
                  } focus:outline-none`}
                />
                {errors.purchaseDate && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.purchaseDate}
                  </p>
                )}
              </div>

              {/* Investment Type Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  🎯 Investment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInvestmentType("long-term")}
                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-105 ${
                      investmentType === "long-term"
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    📅 Long-term (1+ years)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentType("short-term")}
                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-105 ${
                      investmentType === "short-term"
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    ⚡ Short-term (under 1 year)
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} /> Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this purchase (e.g., 'Investment for long-term growth')"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl font-semibold bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Investment Summary */}
              {quantity && buyPrice && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border-2 border-emerald-200 dark:border-emerald-800">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4">
                    <CheckCircle size={18} className="text-emerald-600" />
                    📊 Investment Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total Investment</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {(parseFloat(quantity || 0) * parseFloat(buyPrice || 0)).toLocaleString('en-US', {maximumFractionDigits: 2})} EGP
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Current Value</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {(parseFloat(quantity || 0) * parseFloat(selectedStock.currentPrice || 0)).toLocaleString('en-US', {maximumFractionDigits: 2})} EGP
                      </p>
                    </div>
                    <div className="col-span-2 bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border-2 border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Potential Profit/Loss</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-lg font-black ${
                          (parseFloat(quantity || 0) * parseFloat(selectedStock.currentPrice || 0)) - 
                          (parseFloat(quantity || 0) * parseFloat(buyPrice || 0)) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {((parseFloat(quantity || 0) * parseFloat(selectedStock.currentPrice || 0)) - 
                            (parseFloat(quantity || 0) * parseFloat(buyPrice || 0))).toLocaleString('en-US', {maximumFractionDigits: 2})} EGP
                        </p>
                        <p className={`text-sm font-black px-3 py-1 rounded-lg ${
                          (parseFloat(quantity || 0) * parseFloat(selectedStock.currentPrice || 0)) - 
                          (parseFloat(quantity || 0) * parseFloat(buyPrice || 0)) >= 0
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        }`}>
                          {(((parseFloat(quantity || 0) * parseFloat(selectedStock.currentPrice || 0)) - 
                            (parseFloat(quantity || 0) * parseFloat(buyPrice || 0))) / 
                            (parseFloat(quantity || 0) * parseFloat(buyPrice || 0)) * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errors.submit && (
                <div className="flex items-center gap-3 px-4 py-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 font-semibold">
                  <AlertCircle size={20} />
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 p-6 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-black text-lg transition-all transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleAddStock}
            disabled={!selectedStock || !quantity || !buyPrice || isAdding}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            {isAdding ? "Adding Stock..." : "Add to Portfolio"}
          </button>
        </div>
      </div>
    </div>
  );
}
