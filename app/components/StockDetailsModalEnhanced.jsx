"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Clock, AlertCircle, Loader } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import ErrorBoundary from '@/app/components/ErrorBoundary';

const getCSSVariable = (variable) => {
  if (typeof window === 'undefined') return '#000000';
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  } catch {
    return '#000000';
  }
};

// Enhanced Stock Details Component with Error Handling
function StockDetailsContent({ stock, onClose }) {
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartDataDaily, setChartDataDaily] = useState([]);
  const [chartDataWeekly, setChartDataWeekly] = useState([]);
  const [chartDataMonthly, setChartDataMonthly] = useState([]);
  const [chartDataYearly, setChartDataYearly] = useState([]);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [quote, setQuote] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const chartColors = useMemo(() => ({
    emerald: getCSSVariable('--emerald-primary') || '#10b981',
    emeraldLight: getCSSVariable('--emerald-light') || '#d1fae5',
    tooltipBg: getCSSVariable('--tooltip-bg') || '#ffffff',
    tooltipShadow: getCSSVariable('--tooltip-shadow') || '0 4px 6px rgba(0,0,0,0.1)',
  }), [theme]);

  // Safe bar to chart data conversion
  const barsToChartData = useCallback((bars, maxPoints, dateStyle = "short") => {
    if (!bars || !Array.isArray(bars) || bars.length === 0) return [];
    
    try {
      const slice = maxPoints ? bars.slice(-maxPoints) : bars;
      return slice
        .filter(b => b && b.date && typeof b.close === 'number')
        .map((b) => {
          try {
            const d = new Date(b.date + "T12:00:00");
            const dateStr = dateStyle === "2-digit"
              ? d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return {
              date: dateStr,
              price: Number(b.close) || 0,
              volume: b.volume ?? 0,
            };
          } catch (e) {
            console.warn("Error converting bar:", e);
            return null;
          }
        })
        .filter(Boolean);
    } catch (e) {
      console.error("Error in barsToChartData:", e);
      return [];
    }
  }, []);

  // Fetch chart data
  useEffect(() => {
    if (!stock?.symbol) return;
    
    let isMounted = true;
    const controller = new AbortController();

    const fetchChart = async () => {
      setChartLoading(true);
      setChartError(null);

      try {
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const response = await fetch(
          `/api/egx-chart?symbol=${encodeURIComponent(stock.symbol)}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success) {
            setQuote(data);
          } else {
            setChartError("Failed to load chart data");
            setQuote(null);
          }
        }
      } catch (error) {
        if (isMounted && error.name !== 'AbortError') {
          console.error("Chart fetch error:", error);
          setChartError(error.message);
          setQuote(null);
        }
      } finally {
        if (isMounted) {
          setChartLoading(false);
        }
      }
    };

    fetchChart();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [stock?.symbol]);

  // Process chart data
  useEffect(() => {
    const bars = quote?.bars || [];
    
    if (!stock || !Array.isArray(bars) || bars.length === 0) {
      setChartDataDaily([]);
      setChartDataWeekly([]);
      setChartDataMonthly([]);
      setChartDataYearly([]);
      setCompanyInfo(prev => prev || getDefaultCompanyInfo());
      return;
    }

    setChartDataDaily(barsToChartData(bars, 22, "short"));
    setChartDataWeekly(barsToChartData(bars, 44, "short"));
    setChartDataMonthly(barsToChartData(bars, 66, "short"));
    setChartDataYearly(barsToChartData(bars, null, "2-digit"));

    updateCompanyInfo();
  }, [stock, quote, barsToChartData]);

  // Get default company info
  const getDefaultCompanyInfo = () => ({
    name: stock?.name || stock?.symbol || "Unknown",
    sector: stock?.sector || "N/A",
    industry: stock?.sector || "N/A",
    marketCap: formatCapital(stock?.market_cap),
    lastPrice: stock?.price || "N/A",
    yearHigh: stock?.week_52_high || "N/A",
    yearLow: stock?.week_52_low || "N/A",
    avgVolume: stock?.avg_volume_30d ? formatVolume(stock.avg_volume_30d) : "N/A",
    pe: stock?.pe ? Number(stock.pe).toFixed(2) : "N/A",
    rsi: stock?.rsi_14 ? Number(stock.rsi_14).toFixed(1) : "N/A",
    change: stock?.change || 0,
  });

  const formatCapital = (value) => {
    if (value == null) return "N/A";
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B EGP`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M EGP`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K EGP`;
    return `${n.toFixed(0)} EGP`;
  };

  const formatVolume = (value) => {
    if (value == null) return "N/A";
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return `${n.toFixed(0)}`;
  };

  const updateCompanyInfo = () => {
    const meta = quote?.meta || {};
    const bars = quote?.bars || [];

    const price = stock?.currentPrice ?? stock?.price ?? meta.regularMarketPrice ?? "N/A";
    const prevBar = bars.length >= 2 ? bars[bars.length - 2] : null;
    const previousClose = meta.chartPreviousClose ?? prevBar?.close ?? null;

    setCompanyInfo({
      ...getDefaultCompanyInfo(),
      price: price ? Number(price).toFixed(2) : "N/A",
      previousClose: previousClose ? Number(previousClose).toFixed(2) : "N/A",
      description: meta.longName ? `${meta.longName} (EGX)` : `${stock?.symbol} (EGX)`,
    });
  };

  // Generate AI analysis
  const generateAnalysis = useCallback(async () => {
    setLoading(true);
    setAnalysisError(null);

    try {
      const info = companyInfo || getDefaultCompanyInfo();
      const prompt = `Provide technical and fundamental analysis for EGX stock:
Symbol: ${stock.symbol}
Sector: ${info.sector}
Price: ${info.lastPrice}
52W High: ${info.yearHigh}
52W Low: ${info.yearLow}
RSI: ${info.rsi}

Include: 1) Technical Analysis, 2) Trend, 3) Key Levels, 4) Outlook, 5) Risks`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      
      try {
        const jsonMatch = data.text.match(/\{[\s\S]*\}/);
        setAnalysis(jsonMatch ? JSON.parse(jsonMatch[0]) : {
          reasoning: data.text,
          verdict: 'Hold',
          trendDirection: 'Neutral',
        });
      } catch (e) {
        setAnalysis({
          reasoning: data.text || "Analysis complete",
          verdict: 'Hold',
          trendDirection: 'Neutral',
        });
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      setAnalysisError("Failed to generate analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [stock?.symbol, companyInfo]);

  // Calculate trend
  const calculateTrend = (data) => {
    if (!Array.isArray(data) || data.length < 2) return 'neutral';
    const firstPrice = Number(data[0].price) || 0;
    const lastPrice = Number(data[data.length - 1].price) || 0;
    if (lastPrice > firstPrice * 1.02) return 'up';
    if (lastPrice < firstPrice * 0.98) return 'down';
    return 'neutral';
  };

  const getChartData = () => {
    const mapping = {
      '1W': chartDataWeekly,
      '1M': chartDataMonthly,
      '1Y': chartDataYearly,
    };
    return mapping[activeTimeframe] || chartDataDaily;
  };

  if (!stock) return null;

  const activeChartData = getChartData();
  const trend = calculateTrend(activeChartData);
  const info = companyInfo || getDefaultCompanyInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{stock.symbol}</h2>
            <p className="text-emerald-100">{info.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-emerald-700 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Price</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{info.lastPrice} EGP</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Market Cap</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{info.marketCap}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">52W High/Low</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{info.yearHigh} / {info.yearLow}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">RSI (14)</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{info.rsi}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">Price Chart</h3>
              <div className="flex gap-2">
                {['1D', '1W', '1M', '1Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-3 py-1 rounded ${
                      activeTimeframe === tf
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {chartLoading ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : chartError ? (
              <div className="h-64 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 dark:text-red-400">{chartError}</p>
                </div>
              </div>
            ) : activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activeChartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.emerald} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.emerald} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)} EGP`} />
                  <Area type="monotone" dataKey="price" stroke={chartColors.emerald} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
              </div>
            )}
          </div>

          {/* Analysis Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">AI Analysis</h3>
              <button
                onClick={generateAnalysis}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Generate Analysis"}
              </button>
            </div>

            {analysisError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                {analysisError}
              </div>
            )}

            {analysis && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                <p><strong>Verdict:</strong> {analysis.verdict || "Hold"}</p>
                <p><strong>Trend:</strong> {analysis.trendDirection || "Neutral"}</p>
                <p><strong>Analysis:</strong> {analysis.reasoning || "No analysis available"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockDetailsModal(props) {
  return (
    <ErrorBoundary>
      <StockDetailsContent {...props} />
    </ErrorBoundary>
  );
}
