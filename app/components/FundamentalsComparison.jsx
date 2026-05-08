/**
 * FundamentalsComparison.jsx
 * Side-by-side comparison of 2-4 stocks with heat maps for key metrics
 */

'use client';

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

export default function FundamentalsComparison({ stocks = [] }) {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const addStock = (stock) => {
    if (selectedStocks.length < 4 && !selectedStocks.find(s => s.symbol === stock.symbol)) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const removeStock = (symbol) => {
    setSelectedStocks(selectedStocks.filter(s => s.symbol !== symbol));
  };

  // Calculate sector averages
  const sectorAverages = useMemo(() => {
    if (selectedStocks.length === 0) return {};
    
    const sectors = [...new Set(selectedStocks.map(s => s.sector))];
    const averages = {};
    
    sectors.forEach(sector => {
      const sectorStocks = stocks.filter(s => s.sector === sector);
      if (sectorStocks.length > 0) {
        averages[sector] = {
          pe: sectorStocks.reduce((sum, s) => sum + s.pe_ratio, 0) / sectorStocks.length,
          dividend: sectorStocks.reduce((sum, s) => sum + s.dividend_yield, 0) / sectorStocks.length,
          pb: sectorStocks.reduce((sum, s) => sum + s.pb_ratio, 0) / sectorStocks.length,
          roe: sectorStocks.reduce((sum, s) => sum + s.roe_percent, 0) / sectorStocks.length,
        };
      }
    });
    
    return averages;
  }, [selectedStocks, stocks]);

  // Determine heat map color
  const getHeatColor = (value, sectorAverage, isLowerBetter = false) => {
    if (!sectorAverage) return 'bg-gray-100';
    
    const diff = ((value - sectorAverage) / sectorAverage) * 100;
    const absPercent = Math.abs(diff);
    
    if (isLowerBetter) {
      if (diff <= -20) return 'bg-green-200 text-green-900';
      if (diff <= -10) return 'bg-green-100';
      if (diff >= 20) return 'bg-red-200 text-red-900';
      if (diff >= 10) return 'bg-red-100';
    } else {
      if (diff >= 20) return 'bg-green-200 text-green-900';
      if (diff >= 10) return 'bg-green-100';
      if (diff <= -20) return 'bg-red-200 text-red-900';
      if (diff <= -10) return 'bg-red-100';
    }
    
    return 'bg-yellow-50';
  };

  const metrics = [
    { key: 'pe_ratio', label: 'P/E Ratio', lowerBetter: true, format: (v) => v.toFixed(2) },
    { key: 'pb_ratio', label: 'P/B Ratio', lowerBetter: true, format: (v) => v.toFixed(2) },
    { key: 'dividend_yield', label: 'Dividend %', lowerBetter: false, format: (v) => v.toFixed(2) },
    { key: 'roe_percent', label: 'ROE %', lowerBetter: false, format: (v) => v.toFixed(2) },
    { key: 'week_52_change_percent', label: '52W Change %', lowerBetter: false, format: (v) => v.toFixed(2) },
    { key: 'rsi_14', label: 'RSI(14)', lowerBetter: false, format: (v) => v.toFixed(1) },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📊 Fundamentals Comparison
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
        >
          + Add Stock
        </button>
      </div>

      {/* Stock Selector Dropdown */}
      {isOpen && (
        <div className="bg-white border rounded-lg p-4 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {stocks
              .filter(s => !selectedStocks.find(sel => sel.symbol === s.symbol))
              .map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    addStock(stock);
                    if (selectedStocks.length >= 3) setIsOpen(false);
                  }}
                  className="text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition border"
                >
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-xs text-gray-600">{stock.sector}</div>
                </button>
              ))}
          </div>
          {selectedStocks.length >= 4 && (
            <div className="text-sm text-gray-500 mt-2">Max 4 stocks selected</div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {selectedStocks.length > 0 && (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Metric</th>
                {selectedStocks.map(stock => (
                  <th key={stock.symbol} className="px-4 py-3 text-center font-semibold min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-blue-600">{stock.symbol}</div>
                        <div className="text-xs text-gray-600">{stock.sector}</div>
                      </div>
                      <button
                        onClick={() => removeStock(stock.symbol)}
                        className="text-gray-400 hover:text-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => (
                <tr key={metric.key} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-700">{metric.label}</td>
                  {selectedStocks.map(stock => {
                    const value = stock[metric.key];
                    const sectorAvg = sectorAverages[stock.sector]?.[metric.key.split('_')[0] + (metric.key.includes('pe') ? '' : metric.key.includes('pb') ? '' : metric.key.includes('dividend') ? '' : '')];
                    const heatClass = getHeatColor(value, sectorAvg, metric.lowerBetter);
                    
                    return (
                      <td
                        key={stock.symbol}
                        className={`px-4 py-3 text-center font-semibold transition ${heatClass}`}
                      >
                        {metric.format(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Sector Average Row */}
              {selectedStocks.length > 0 && (
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="px-4 py-3 font-semibold text-blue-700">Sector Avg</td>
                  {selectedStocks.map(stock => (
                    <td key={stock.symbol} className="px-4 py-3 text-center text-sm text-blue-700 font-semibold">
                      <div className="space-y-1">
                        {metrics.slice(0, 2).map(m => {
                          const avg = sectorAverages[stock.sector]?.[m.key.split('_')[0] + (m.key.includes('pe') ? '' : '')];
                          return (
                            <div key={m.key} className="text-xs">
                              {avg ? m.format(avg) : '-'}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {selectedStocks.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Select 2-4 stocks to compare fundamentals side-by-side</p>
        </div>
      )}

      {/* Legend */}
      {selectedStocks.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-semibold mb-2">📊 Heat Map Legend</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span>20%+ Above Sector Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 rounded"></div>
              <span>20%+ Below Sector Average</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span>Within 10% of Average</span>
            </div>
            <div className="text-gray-600">
              ✓ = Lower is Better (P/E, P/B ratios)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
