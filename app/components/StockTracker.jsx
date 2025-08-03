"use client";

import { useState } from "react";

export default function StockTracker() {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!symbol || !quantity || !buyPrice) return;

    setLoading(true);
    const ticker = symbol.toUpperCase() + ".CA";

    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`
      );
      const data = await res.json();
      const currentPrice = data.chart.result?.[0]?.meta?.regularMarketPrice;

      if (!currentPrice) throw new Error("Price not found");

      const qty = parseFloat(quantity);
      const buy = parseFloat(buyPrice);
      const currentValue = currentPrice * qty;
      const invested = buy * qty;
      const profit = currentValue - invested;
      const profitPercent = (profit / invested) * 100;

      setResult({
        currentPrice,
        currentValue,
        profit,
        profitPercent,
      });
    } catch (e) {
      console.error(e);
      alert("Error fetching price or invalid symbol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">
        📈 Egypt Stock Profit Calculator
      </h2>

      <input
        type="text"
        placeholder="Stock Symbol (e.g. COMI)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <input
        type="number"
        placeholder="Buy Price (EGP)"
        value={buyPrice}
        onChange={(e) => setBuyPrice(e.target.value)}
        className="w-full border p-2 mb-4"
      />

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Calculating..." : "Calculate Profit/Loss"}
      </button>

      {result && (
        <div className="mt-6 border-t pt-4">
          <p>
            <strong>Current Price:</strong> {result.currentPrice.toFixed(2)} EGP
          </p>
          <p>
            <strong>Current Value:</strong> {result.currentValue.toFixed(2)} EGP
          </p>
          <p>
            <strong>Profit/Loss:</strong>
            <span
              className={result.profit >= 0 ? "text-green-600" : "text-red-600"}
            >
              {result.profit.toFixed(2)} EGP ({result.profitPercent.toFixed(2)}
              %)
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
