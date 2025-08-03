"use client";

import { useState, useEffect } from "react";

export default function PortfolioTracker() {
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({
    symbol: "",
    quantity: "",
    buyPrice: "",
  });
  const [loading, setLoading] = useState(false);

  // ⏫ Load from localStorage on mount and refresh prices
  useEffect(() => {
    const saved = localStorage.getItem("egxPortfolio");
    if (!saved) return;

    const savedStocks = JSON.parse(saved);
    refreshSavedStockPrices(savedStocks);
  }, []);

  // 💾 Save to localStorage on stock list change
  useEffect(() => {
    localStorage.setItem("egxPortfolio", JSON.stringify(stocks));
  }, [stocks]);

  // 📡 Fetch prices and update saved stocks
  const refreshSavedStockPrices = async (savedStocks) => {
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
    setStocks(updated);
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

    setLoading(true);
    const upperSymbol = symbol.toUpperCase();
    const currentPrice = await fetchStockPrice(upperSymbol);

    if (!currentPrice) {
      alert("Invalid symbol or data unavailable");
      setLoading(false);
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

    setStocks((prev) => [...prev, stockData]);
    setNewStock({ symbol: "", quantity: "", buyPrice: "" });
    setLoading(false);
  };

  // ❌ Remove a stock
  const removeStock = (id) => {
    setStocks(stocks.filter((stock) => stock.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 My EGX Portfolio</h1>

      {/* Input Form */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <input
          type="text"
          placeholder="Symbol (e.g. COMI)"
          value={newStock.symbol}
          onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newStock.quantity}
          onChange={(e) =>
            setNewStock({ ...newStock, quantity: e.target.value })
          }
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Buy Price"
          value={newStock.buyPrice}
          onChange={(e) =>
            setNewStock({ ...newStock, buyPrice: e.target.value })
          }
          className="border p-2"
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleAddStock}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Stock"}
        </button>

        <button
          onClick={() => refreshSavedStockPrices(stocks)}
          disabled={loading || stocks.length === 0}
          className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
        >
          {loading ? "Refreshing..." : "🔄 Refresh Prices"}
        </button>
      </div>

      {/* Stock Table */}
      <table className="w-full text-sm border">
        <thead className="bg-background">
          <tr>
            <th className="p-2">Symbol</th>
            <th>Qty</th>
            <th>Buy</th>
            <th>Now</th>
            <th>P/L</th>
            <th>%</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.id} className="border-t text-center">
              <td className="p-2 font-semibold">{stock.symbol}</td>
              <td>{stock.quantity}</td>
              <td>{stock.buyPrice.toFixed(2)}</td>
              <td>{stock.currentPrice?.toFixed(2)}</td>
              <td
                className={
                  stock.profit >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {stock.profit.toFixed(2)} EGP
              </td>
              <td
                className={
                  stock.profit >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {stock.profitPercent.toFixed(2)}%
              </td>
              <td>
                <button
                  onClick={() => removeStock(stock.id)}
                  className="text-red-500 hover:underline"
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
          {stocks.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center text-gray-500 p-4">
                No stocks added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
