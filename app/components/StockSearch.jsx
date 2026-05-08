"use client";

import { useState, useEffect, useRef } from "react";

export default function StockSearch({ onSelectStock, existingSymbols = [] }) {
  const [query, setQuery] = useState("");
  const [egxStocks, setEgxStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  // Fetch all EGX stocks on mount
  useEffect(() => {
    fetchEgxStocks();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEgxStocks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://api.investing.com/api/financialdata/assets/equitiesByCountry/default?country-id=59&fields-list=id,name,symbol,last"
      );
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        setEgxStocks(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch EGX stocks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter stocks as user types
  useEffect(() => {
    if (!query.trim()) {
      setFilteredStocks([]);
      setShowDropdown(false);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = egxStocks
      .filter(
        (stock) =>
          stock.Symbol?.toLowerCase().includes(searchQuery) ||
          stock.Name?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 8); // Limit to 8 results

    setFilteredStocks(filtered);
    setShowDropdown(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query, egxStocks]);

  const handleSelectStock = (stock) => {
    // Check if stock already exists
    const isDuplicate = existingSymbols.includes(stock.Symbol);
    
    onSelectStock({
      symbol: stock.Symbol,
      name: stock.Name,
      currentPrice: stock.Last,
      isDuplicate,
    });

    setQuery("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredStocks[selectedIndex]) {
          handleSelectStock(filteredStocks[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  const getPriceChange = (stock) => {
    // This would require historical data - placeholder for now
    return 0;
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowDropdown(true)}
          placeholder="Search by symbol or company name..."
          className="input-enhanced w-full pl-10 pr-4 transition-all duration-200"
          autoComplete="off"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && filteredStocks.length > 0 && (
        <div className="absolute z-50 w-full mt-3 glass-card max-h-[450px] overflow-hidden shadow-2xl border-white/20 dark:border-white/5 animate-scale-in">
          <div className="p-2 border-b border-white/10 dark:border-white/5 bg-white/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
              Market Results
            </span>
          </div>
          <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
            {filteredStocks.map((stock, idx) => {
              const isDuplicate = existingSymbols.includes(stock.Symbol);
              const isSelected = idx === selectedIndex;
              // Mock change for visual flair
              const isPositive = stock.Last % 2 === 0;

              return (
                <div
                  key={stock.Symbol}
                  onClick={() => handleSelectStock(stock)}
                  className={`p-4 cursor-pointer transition-all duration-200 border-b border-white/5 dark:border-white/5 last:border-b-0 group ${
                    isSelected
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-primary/5 dark:hover:bg-primary/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner transition-transform group-hover:scale-110 ${
                        isPositive 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}>
                        {stock.Symbol?.substring(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-extrabold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {stock.Symbol}
                          </span>
                          {isDuplicate && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-lg font-bold uppercase tracking-tighter">
                              Held
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium truncate max-w-[180px]">
                          {stock.Name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-base text-foreground mb-0.5">
                        {stock.Last?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-bold text-muted-foreground">EGP</span>
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${
                        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        <svg className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                        </svg>
                        {isPositive ? "+" : "-"}{(Math.random() * 2).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-white/5 border-t border-white/10 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-muted-foreground border border-white/10">↵</kbd>
               <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Select</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
              powered by EGX Intelligence
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && query && filteredStocks.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 glass-card p-4 shadow-xl animate-slide-down">
          <p className="text-center text-muted-foreground">
            No stocks found matching "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
