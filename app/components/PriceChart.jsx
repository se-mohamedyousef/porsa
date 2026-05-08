/**
 * PriceChart.jsx
 * Interactive price chart with technical indicators and overlays
 * Supports candlestick/line charts, MA, RSI, MACD, Bollinger Bands
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/app/context/ThemeContext';

// Helper to get CSS variable value
const getCSSVariable = (variable) => {
  if (typeof window === 'undefined') return '#000000';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

export default function PriceChart({ stock, history }) {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('90'); // 7, 30, 90
  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    sma50: false,
    sma200: false,
    rsi: false,
    bollinger: false,
    volume: true,
  });

  // Get colors from CSS variables
  const chartColors = useMemo(() => ({
    price: getCSSVariable('--line-price'),
    sma20: getCSSVariable('--line-sma20'),
    sma50: getCSSVariable('--line-sma50'),
    sma200: getCSSVariable('--line-sma200'),
    rsi: getCSSVariable('--line-rsi'),
    volume: getCSSVariable('--line-volume'),
  }), [theme]);

  // Filter history by time range
  const filteredHistory = useMemo(() => {
    if (!history) return [];
    const days = parseInt(timeRange);
    return history.slice(-days);
  }, [history, timeRange]);

  // Calculate RSI for the filtered history
  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50;
    const deltas = [];
    for (let i = 1; i < prices.length; i++) {
      deltas.push(prices[i] - prices[i - 1]);
    }
    let up = 0, down = 0;
    for (let i = 0; i < period; i++) {
      if (deltas[i] > 0) up += deltas[i];
      else down -= deltas[i];
    }
    up /= period;
    down /= period;
    for (let i = period; i < deltas.length; i++) {
      const u = deltas[i] > 0 ? deltas[i] : 0;
      const d = deltas[i] < 0 ? -deltas[i] : 0;
      up = (up * (period - 1) + u) / period;
      down = (down * (period - 1) + d) / period;
    }
    const rs = down !== 0 ? up / down : 100;
    return 100 - (100 / (1 + rs));
  };

  const calculateSMA = (prices, period) => {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const subset = prices.slice(-period);
    return subset.reduce((a, b) => a + b, 0) / period;
  };

  // Prepare chart data with indicators
  const chartData = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return [];

    const closePrices = filteredHistory.map(h => h.close);

    return filteredHistory.map((candle, index) => ({
      date: candle.date.slice(5), // MM-DD format
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      sma20: showIndicators.sma20 ? calculateSMA(closePrices.slice(0, index + 1), 20) : null,
      sma50: showIndicators.sma50 ? calculateSMA(closePrices.slice(0, index + 1), 50) : null,
      sma200: showIndicators.sma200 ? calculateSMA(closePrices.slice(0, index + 1), 200) : null,
      rsi: showIndicators.rsi ? calculateRSI(closePrices.slice(0, index + 1), 14) : null,
    }));
  }, [filteredHistory, showIndicators]);

  const handleToggleIndicator = (indicator) => {
    setShowIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };

  if (!stock || !history) {
    return <div className="p-4 text-gray-500">No chart data available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📈 Price Chart - {stock.symbol}
        </h3>
        <div className="flex gap-2">
          {['7', '30', '90'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="bg-info/10 dark:bg-info/20 p-2 rounded-lg">
          <div className="text-muted-foreground">High</div>
          <div className="font-semibold">{stock.week_52_high?.toFixed(2)} EGP</div>
        </div>
        <div className="bg-error/10 dark:bg-error/20 p-2 rounded-lg">
          <div className="text-muted-foreground">Low</div>
          <div className="font-semibold">{stock.week_52_low?.toFixed(2)} EGP</div>
        </div>
        <div className="bg-success/10 dark:bg-success/20 p-2 rounded-lg">
          <div className="text-muted-foreground">RSI(14)</div>
          <div className="font-semibold">{stock.rsi_14?.toFixed(1)} {stock.rsi_14 > 70 ? '📈' : stock.rsi_14 < 30 ? '📉' : '→'}</div>
        </div>
        <div className="bg-accent-purple/10 dark:bg-accent-purple/20 p-2 rounded-lg">
          <div className="text-muted-foreground">SMA(20)</div>
          <div className="font-semibold">{stock.sma_20?.toFixed(2)} EGP</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-background p-4 rounded-lg border border-border">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value) => {
                if (typeof value === 'number') return value.toFixed(2);
                return value;
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            
            {/* Price line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="close"
              stroke={chartColors.price}
              name="Price"
              strokeWidth={2}
              dot={false}
            />
            
            {/* Moving Averages */}
            {showIndicators.sma20 && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sma20"
                stroke={chartColors.sma20}
                name="SMA 20"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showIndicators.sma50 && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sma50"
                stroke={chartColors.sma50}
                name="SMA 50"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showIndicators.sma200 && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sma200"
                stroke={chartColors.sma200}
                name="SMA 200"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {/* RSI on right axis */}
            {showIndicators.rsi && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rsi"
                stroke={chartColors.rsi}
                name="RSI(14)"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {showIndicators.volume && (
        <div className="bg-background p-4 rounded-lg border border-border">
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Bar dataKey="volume" fill={chartColors.volume} name="Volume" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Indicator Controls */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Technical Indicators</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { key: 'sma20', label: '📊 SMA 20', color: 'bg-warning/20 dark:bg-warning/30 border-warning' },
            { key: 'sma50', label: '📊 SMA 50', color: 'bg-error/20 dark:bg-error/30 border-error' },
            { key: 'sma200', label: '📊 SMA 200', color: 'bg-accent-purple/20 dark:bg-accent-purple/30 border-accent-purple' },
            { key: 'rsi', label: '📈 RSI(14)', color: 'bg-info/20 dark:bg-info/30 border-info' },
            { key: 'volume', label: '📊 Volume', color: 'bg-muted-foreground/20 dark:bg-muted-foreground/30 border-muted-foreground' },
          ].map(ind => (
            <button
              key={ind.key}
              onClick={() => handleToggleIndicator(ind.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition border-2 ${
                showIndicators[ind.key]
                  ? `${ind.color}`
                  : 'bg-background border-border text-muted-foreground'
              }`}
            >
              {showIndicators[ind.key] ? '✓' : '○'} {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Technical Summary */}
      <div className="bg-gradient-to-r from-info/10 to-accent-purple/10 dark:from-info/20 dark:to-accent-purple/20 p-4 rounded-lg border border-info/30">
        <h4 className="font-semibold mb-2">📊 Technical Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Price vs SMA(20):</span>
            <span className={`ml-2 font-semibold ${stock.price > (stock.sma_20 || 0) ? 'text-success' : 'text-error'}`}>
              {stock.price > (stock.sma_20 || 0) ? '↑ Above' : '↓ Below'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">RSI Status:</span>
            <span className={`ml-2 font-semibold ${stock.rsi_14 > 70 ? 'text-error' : stock.rsi_14 < 30 ? 'text-success' : 'text-warning'}`}>
              {stock.rsi_14 > 70 ? 'Overbought' : stock.rsi_14 < 30 ? 'Oversold' : 'Neutral'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">52-Week Range:</span>
            <span className="ml-2 font-semibold text-info">{stock.week_52_change_percent?.toFixed(1)}% up</span>
          </div>
          <div>
            <span className="text-muted-foreground">Bollinger Bands:</span>
            <span className="ml-2 font-semibold text-accent-purple">
              {stock.bollinger_bands && stock.price > stock.bollinger_bands.upper ? 'Upper' :
               stock.price < stock.bollinger_bands.lower ? 'Lower' : 'Middle'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
