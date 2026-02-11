"use client";

import { useMemo } from "react";

export default function PortfolioSummary({ stocks }) {
  const summary = useMemo(() => {
    if (!stocks || stocks.length === 0) return null;

    const totalInvested = stocks.reduce(
      (sum, stock) => sum + stock.buyPrice * stock.quantity,
      0
    );
    const totalCurrentValue = stocks.reduce(
      (sum, stock) => sum + stock.currentPrice * stock.quantity,
      0
    );
    const totalProfit = totalCurrentValue - totalInvested;
    const totalProfitPercent = (totalProfit / totalInvested) * 100;

    const profitableStocks = stocks.filter((stock) => stock.profit > 0);
    const losingStocks = stocks.filter((stock) => stock.profit < 0);

    return {
      totalInvested,
      totalCurrentValue,
      totalProfit,
      totalProfitPercent,
      profitableStocks: profitableStocks.length,
      losingStocks: losingStocks.length,
      totalStocks: stocks.length,
    };
  }, [stocks]);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up">
      <div className="card-enhanced hover-lift bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
              Total Invested
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-200">
              {summary.totalInvested.toLocaleString("en-US", {
                style: "currency",
                currency: "EGP",
              })}
            </p>
          </div>
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg hover-glow">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="card-enhanced hover-lift bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
              Current Value
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-200">
              {summary.totalCurrentValue.toLocaleString("en-US", {
                style: "currency",
                currency: "EGP",
              })}
            </p>
          </div>
          <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center shadow-lg hover-glow">
            <svg
              className="w-6 h-6 text-white"
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
          </div>
        </div>
      </div>

      <div className={`card-enhanced hover-lift ${
        summary.totalProfit >= 0 
          ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20"
          : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20"
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className={`text-xs sm:text-sm font-semibold mb-1 ${
              summary.totalProfit >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
            }`}>
              Total P/L
            </p>
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                summary.totalProfit >= 0 ? "text-green-900 dark:text-green-200" : "text-red-900 dark:text-red-200"
              }`}
            >
              {summary.totalProfit >= 0 ? "+" : ""}
              {summary.totalProfit.toLocaleString("en-US", {
                style: "currency",
                currency: "EGP",
              })}
            </p>
            <p
              className={`text-sm font-semibold mt-1 ${
                summary.totalProfitPercent >= 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {summary.totalProfitPercent >= 0 ? "+" : ""}
              {summary.totalProfitPercent.toFixed(2)}%
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover-glow ${
              summary.totalProfit >= 0 ? "gradient-success" : "gradient-error"
            }`}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {summary.totalProfit >= 0 ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      <div className="card-enhanced hover-lift bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-400 mb-1">
              Portfolio
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-200">
              {summary.totalStocks} stocks
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
              {summary.profitableStocks} profitable, {summary.losingStocks}{" "}
              losing
            </p>
          </div>
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg hover-glow">
            <svg
              className="w-6 h-6 text-white"
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
          </div>
        </div>
      </div>
    </div>
  );
}
