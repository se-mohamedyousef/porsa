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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-background border rounded-lg p-4 flex flex-col justify-between h-full min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Total Invested
            </p>
            <p className="text-xl sm:text-2xl font-bold truncate">
              {summary.totalInvested.toLocaleString("en-US", {
                style: "currency",
                currency: "EGP",
              })}
            </p>
          </div>
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600"
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

      <div className="bg-background border rounded-lg p-4 flex flex-col justify-between h-full min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Current Value
            </p>
            <p className="text-xl sm:text-2xl font-bold truncate">
              {summary.totalCurrentValue.toLocaleString("en-US", {
                style: "currency",
                currency: "EGP",
              })}
            </p>
          </div>
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-green-600"
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

      <div className="bg-background border rounded-lg p-4 flex flex-col justify-between h-full min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Total P/L
            </p>
            <p
              className={`text-xl sm:text-2xl font-bold truncate ${
                summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.totalProfit >= 0 ? "+" : ""}
              {summary.totalProfit.toLocaleString("en-US", {
                style: "currency",
                currency: "EGP",
              })}
            </p>
            <p
              className={`text-xs sm:text-sm ${
                summary.totalProfitPercent >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {summary.totalProfitPercent >= 0 ? "+" : ""}
              {summary.totalProfitPercent.toFixed(2)}%
            </p>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              summary.totalProfit >= 0 ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <svg
              className={`w-4 h-4 ${
                summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
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

      <div className="bg-background border rounded-lg p-4 flex flex-col justify-between h-full min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Portfolio
            </p>
            <p className="text-xl sm:text-2xl font-bold truncate">
              {summary.totalStocks} stocks
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {summary.profitableStocks} profitable, {summary.losingStocks}{" "}
              losing
            </p>
          </div>
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-purple-600"
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
