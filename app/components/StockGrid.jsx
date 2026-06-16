'use client';

import { useState, useEffect } from 'react';
import EnhancedStockCard from './EnhancedStockCard';
import { LoadingSpinner } from 'lucide-react';

/**
 * StockGrid Component
 * Displays a grid of EnhancedStockCards with filtering and sorting options
 */
export default function StockGrid({
  stocks = [],
  loading = false,
  onAddStock,
  onAskAI,
  onSetAlert,
  aiInsights = {},
  activeAlerts = [],
  filterBy = 'all', // 'recommendation', 'risk', 'change', 'all'
  sortBy = 'change', // 'change', 'risk', 'confidence', 'name'
  language = 'en'
}) {
  const [sortedStocks, setSortedStocks] = useState([]);

  // Apply sorting and filtering
  useEffect(() => {
    let filtered = [...stocks];

    // Filter by recommendation
    if (filterBy === 'buy') {
      filtered = filtered.filter(s => 
        aiInsights[s.symbol]?.recommendation?.toLowerCase().includes('buy')
      );
    } else if (filterBy === 'sell') {
      filtered = filtered.filter(s => 
        aiInsights[s.symbol]?.recommendation?.toLowerCase().includes('sell')
      );
    } else if (filterBy === 'hold') {
      filtered = filtered.filter(s => 
        aiInsights[s.symbol]?.recommendation?.toLowerCase().includes('hold')
      );
    }

    // Sort
    let sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          return (b.change || 0) - (a.change || 0);
        case 'risk':
          const riskOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2 };
          const aRisk = riskOrder[aiInsights[a.symbol]?.riskLevel || 'MEDIUM'] || 1;
          const bRisk = riskOrder[aiInsights[b.symbol]?.riskLevel || 'MEDIUM'] || 1;
          return aRisk - bRisk;
        case 'confidence':
          return (aiInsights[b.symbol]?.confidence || 0) - (aiInsights[a.symbol]?.confidence || 0);
        case 'name':
          return (a.symbol || '').localeCompare(b.symbol || '');
        default:
          return 0;
      }
    });

    setSortedStocks(sorted);
  }, [stocks, filterBy, sortBy, aiInsights]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-4">📊</div>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading stocks...</p>
        </div>
      </div>
    );
  }

  if (sortedStocks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-600 dark:text-gray-400 font-semibold">
          No stocks available
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Try adjusting your filters or check back soon
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedStocks.map((stock) => (
        <EnhancedStockCard
          key={stock.symbol}
          stock={stock}
          onAddToPortfolio={onAddStock}
          onAskAI={onAskAI}
          onSetAlert={onSetAlert}
          aiInsights={aiInsights[stock.symbol] || {}}
          activeAlerts={activeAlerts}
          language={language}
        />
      ))}
    </div>
  );
}
