'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function StockExplorer({ onAddStock, existingSymbols = [] }) {
  const { t, language } = useLanguageSimple();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);

  // Mock stock data - replace with API calls
  const mockStocks = [
    { symbol: 'EBANK', name: 'Egypt Bank', price: 12.50, change: 2.5, changePercent: 3.2, volume: 1250000 },
    { symbol: 'ETEL', name: 'Etisalat', price: 2.85, change: 0.15, changePercent: 5.6, volume: 3500000 },
    { symbol: 'ORWE', name: 'Orange Egypt', price: 5.20, change: -0.10, changePercent: -1.9, volume: 890000 },
    { symbol: 'SWDY', name: 'Swandy', price: 8.90, change: 0.45, changePercent: 5.3, volume: 450000 },
    { symbol: 'COMI', name: 'Commercial Bank', price: 45.50, change: -1.50, changePercent: -3.2, volume: 2100000 },
    { symbol: 'TELEM', name: 'Telecom Egypt', price: 1.45, change: 0.08, changePercent: 5.8, volume: 5600000 },
    { symbol: 'RAYA', name: 'Raya Holding', price: 3.25, change: -0.15, changePercent: -4.4, volume: 650000 },
    { symbol: 'JUFO', name: 'Juhayna', price: 28.75, change: 1.50, changePercent: 5.5, volume: 1200000 },
    { symbol: 'ECAP', name: 'E.S.C.A.P', price: 55.00, change: 2.25, changePercent: 4.3, volume: 890000 },
    { symbol: 'PASU', name: 'Panda Suez', price: 18.50, change: -0.50, changePercent: -2.6, volume: 440000 },
  ];

  useEffect(() => {
    // Initialize with top movers
    const gainers = [...mockStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const losers = [...mockStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
    setTopGainers(gainers);
    setTopLosers(losers);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      const results = mockStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query) || 
        stock.name.toLowerCase().includes(query)
      );
      setFilteredStocks(results);
    } else {
      setFilteredStocks([]);
    }
  };

  const StockCard = ({ stock, isAdded }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="font-bold text-gray-900 dark:text-white">{stock.symbol}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</p>
        </div>
        <button
          onClick={() => onAddStock(stock)}
          disabled={isAdded}
          className={`ml-2 p-2 rounded-lg transition-all ${
            isAdded
              ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:scale-110'
          }`}
          title={isAdded ? 'Already in portfolio' : 'Add to portfolio'}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stock.price.toFixed(2)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vol: {(stock.volume / 1000000).toFixed(1)}M</p>
        </div>
        <div className={`text-right ${stock.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          <div className="flex items-center gap-1 justify-end">
            {stock.changePercent >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <p className="font-bold">{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</p>
          </div>
          <p className="text-xs">{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-24 px-4 space-y-4">
      <div className="pt-4">
        <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {t('explore')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Discover and add stocks to your portfolio</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim().length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Search Results ({filteredStocks.length})</p>
          {filteredStocks.length > 0 ? (
            <div className="space-y-3">
              {filteredStocks.map(stock => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  isAdded={existingSymbols.includes(stock.symbol)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No stocks found</p>
            </div>
          )}
        </div>
      )}

      {/* Top Gainers */}
      {searchQuery.trim().length === 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Gainers</h3>
            </div>
            <div className="space-y-3">
              {topGainers.map(stock => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  isAdded={existingSymbols.includes(stock.symbol)}
                />
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="text-rose-600 dark:text-rose-400" size={20} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Losers</h3>
            </div>
            <div className="space-y-3">
              {topLosers.map(stock => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  isAdded={existingSymbols.includes(stock.symbol)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
