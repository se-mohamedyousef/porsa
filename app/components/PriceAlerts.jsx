"use client";

import { useState } from "react";

export default function PriceAlerts({ alerts, onAddAlert, onRemoveAlert }) {
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("above"); // 'above' or 'below'
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!symbol || !price || !email) return;

    onAddAlert({
      id: Date.now(),
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(price),
      condition,
      email,
      active: true,
    });

    setSymbol("");
    setPrice("");
  };

  return (
    <div className="card-enhanced mb-6 animate-fade-in bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2">
            <span className="text-xl">🔔</span> Smart Price Alerts
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
            Get notified via email when stocks hit your target price
          </p>
        </div>

        {/* Add Alert Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-1 block">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g. COMI"
              className="input-field bg-white/50 w-full"
              required
            />
          </div>
          <div className="w-full sm:w-24">
            <label className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-1 block">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="input-field bg-white/50 w-full"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-1 block">Target Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="input-field bg-white/50 w-full"
              required
            />
          </div>
          <div className="flex-[1.5] w-full">
            <label className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="me@example.com"
              className="input-field bg-white/50 w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto mt-2 sm:mt-0"
          >
            Add Alert
          </button>
        </form>

        {/* Active Alerts List */}
        {alerts && alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Active Alerts</p>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-orange-100 dark:border-orange-900/30"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-900 dark:text-orange-200">{alert.symbol}</span>
                  <span className="text-sm">
                    {alert.condition === "above" ? "📈 rises above" : "📉 drops below"}{" "}
                    <span className="font-mono font-semibold">{alert.targetPrice} EGP</span>
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline-block">
                    via {alert.email}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveAlert(alert.id)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Remove Alert"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
