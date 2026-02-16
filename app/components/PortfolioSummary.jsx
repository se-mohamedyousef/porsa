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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
      {/* Total Invested */}
      <div className="card-modern hover-lift border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-900/10">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {summary.totalInvested.toLocaleString("en-US", {
            style: "currency",
            currency: "EGP",
          })}
        </p>
      </div>

      {/* Current Value */}
      <div className="card-modern hover-lift border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/10">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <p className="text-sm font-medium text-muted-foreground">Current Value</p>
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">
          {summary.totalCurrentValue.toLocaleString("en-US", {
            style: "currency",
            currency: "EGP",
          })}
        </p>
      </div>

      {/* Total P/L */}
      <div className={`card-modern hover-lift border-l-4 ${summary.totalProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'} bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50`}>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <p className="text-sm font-medium text-muted-foreground">Total Profit/Loss</p>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${summary.totalProfit >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {summary.totalProfit >= 0 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              }
            </svg>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {summary.totalProfit >= 0 ? "+" : ""}
            {summary.totalProfit.toLocaleString("en-US", {
              style: "currency",
              currency: "EGP",
            })}
          </p>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${summary.totalProfit >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            {summary.totalProfitPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Portfolio Status */}
      <div className="card-modern hover-lift border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-900/10">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <p className="text-sm font-medium text-muted-foreground">Portfolio Checks</p>
           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5" title="Profitable Stocks">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm font-medium text-foreground">{summary.profitableStocks} Up</span>
          </div>
          <div className="flex items-center gap-1.5" title="Losing Stocks">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-sm font-medium text-foreground">{summary.losingStocks} Down</span>
          </div>
        </div>
      </div>
    </div>
  );
}
