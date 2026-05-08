/**
 * Shared portfolio calculation utilities
 * Single source of truth for portfolio summary calculations
 */

/**
 * Calculate portfolio summary metrics
 * @param {Array} stocks - Array of stock objects with buyPrice, quantity, currentPrice, profit fields
 * @returns {Object} Portfolio summary object with calculated values
 */
export function calculatePortfolioSummary(stocks) {
  if (!stocks || stocks.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalProfitPercent: 0,
      profitableCount: 0,
      losingCount: 0,
      totalGainPercent: 0,
    };
  }

  // Calculate invested and current values
  const totalInvested = stocks.reduce((sum, s) => sum + ((s.buyPrice || 0) * (s.quantity || 0)), 0);
  const totalValue = stocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 0)), 0);
  
  // Calculate profit metrics
  const totalProfit = totalValue - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  
  // Count profitable vs losing stocks
  const profitableCount = stocks.filter(s => (s.profit || 0) >= 0).length;
  const losingCount = stocks.filter(s => (s.profit || 0) < 0).length;

  return {
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    totalProfitPercent: parseFloat(totalProfitPercent.toFixed(2)),
    profitableCount,
    losingCount,
    totalGainPercent: parseFloat(totalProfitPercent.toFixed(2)),
  };
}

/**
 * Calculate individual stock metrics
 * @param {Object} stock - Stock object with buyPrice, quantity, currentPrice
 * @returns {Object} Stock with calculated profit and profitPercent
 */
export function calculateStockMetrics(stock) {
  const invested = (stock.buyPrice || 0) * (stock.quantity || 0);
  const currentValue = (stock.currentPrice || 0) * (stock.quantity || 0);
  const profit = currentValue - invested;
  const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

  return {
    ...stock,
    profit: parseFloat(profit.toFixed(2)),
    profitPercent: parseFloat(profitPercent.toFixed(2)),
  };
}

/**
 * Format currency for display
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'en-US') {
  return new Intl.NumberFormat(currency, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

/**
 * Get profit/loss percentage color
 * @param {number} percentage - Profit percentage
 * @returns {string} Tailwind color class
 */
export function getProfitColor(percentage) {
  if (percentage >= 0) {
    return percentage >= 5 ? 'text-green-600' : 'text-emerald-600';
  }
  return percentage <= -5 ? 'text-red-600' : 'text-rose-600';
}

/**
 * Get profit/loss background color
 * @param {number} percentage - Profit percentage
 * @returns {string} Tailwind background color class
 */
export function getProfitBgColor(percentage) {
  if (percentage >= 0) {
    return 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border-emerald-200/50 dark:border-emerald-400/30';
  }
  return 'bg-gradient-to-r from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20 border-rose-200/50 dark:border-rose-400/30';
}
