"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area, AreaChart, ComposedChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Clock, AlertCircle, Loader, Plus, Bell, BarChart3, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useLanguageSimple } from '@/app/hooks/useLanguageSimple';
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
function StockDetailsContent({ stock, onClose, onAddStock, onSetAlert }) {
  const { theme } = useTheme();
  const { t, language } = useLanguageSimple();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartDataDaily, setChartDataDaily] = useState([]);
  const [chartDataWeekly, setChartDataWeekly] = useState([]);
  const [chartDataMonthly, setChartDataMonthly] = useState([]);
  const [chartDataYearly, setChartDataYearly] = useState([]);
  const [chartDataFiveYear, setChartDataFiveYear] = useState([]);
  const [chartDataIntraday, setChartDataIntraday] = useState([]);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [quote, setQuote] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [chartNotice, setChartNotice] = useState(null);
  const [intradayLoading, setIntradayLoading] = useState(false);
  const [intradayError, setIntradayError] = useState(null);
  const [liveSessionPoints, setLiveSessionPoints] = useState([]);
  const [liveQuote, setLiveQuote] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const chartColors = useMemo(() => ({
    emerald: getCSSVariable('--emerald-primary') || '#10b981',
    emeraldLight: getCSSVariable('--emerald-light') || '#d1fae5',
    tooltipBg: getCSSVariable('--tooltip-bg') || '#ffffff',
    tooltipShadow: getCSSVariable('--tooltip-shadow') || '0 4px 6px rgba(0,0,0,0.1)',
  }), [theme]);

  const formatWeekdayDay = (dateInput) => {
    const d = new Date(dateInput);
    if (!Number.isFinite(d.getTime())) return String(dateInput);
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    return `${weekday} ${day}`;
  };

  // Safe bar to chart data conversion
  const barsToChartData = useCallback((bars, maxPoints, dateStyle = "short") => {
    if (!bars || !Array.isArray(bars) || bars.length === 0) return [];
    
    try {
      const slice = maxPoints ? bars.slice(-maxPoints) : bars;
      return slice
        .filter(b => b && b.date && typeof b.close === 'number')
        .map((b) => {
          try {
            const d = b.timestamp ? new Date(b.timestamp) : new Date(`${b.date}T12:00:00`);
            if (!Number.isFinite(d.getTime())) return null;
            let dateStr;
            if (dateStyle === "2-digit") {
              dateStr = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
            } else if (dateStyle === "intraday") {
              dateStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
            } else if (dateStyle === "day-only") {
              dateStr = formatWeekdayDay(d);
            } else {
              dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
            const fullDate = dateStyle === "intraday"
              ? d.toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
            return {
              date: dateStr,
              fullDate,
              xIso: d.toISOString(),
              price: Number(b.close) || 0,
              open: Number(b.open) || Number(b.close) || 0,
              high: Number(b.high) || Number(b.close) || 0,
              low: Number(b.low) || Number(b.close) || 0,
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

  // Compute SMA and enrich chart data
  const addMovingAverages = useCallback((data, periods = [20, 50]) => {
    if (!data || data.length === 0) return data;
    return data.map((point, idx) => {
      const enriched = { ...point };
      for (const p of periods) {
        if (idx >= p - 1) {
          const slice = data.slice(idx - p + 1, idx + 1);
          enriched[`sma${p}`] = slice.reduce((sum, d) => sum + (d.price || 0), 0) / p;
        }
      }
      // Normalize volume to percentage of max for overlay
      return enriched;
    });
  }, []);

  const livePointsToChartData = useCallback((points) => {
    if (!Array.isArray(points) || points.length === 0) return [];

    return points
      .map((p) => {
        const d = new Date(p.timestamp);
        const price = Number(p.price);
        if (!Number.isFinite(d.getTime()) || !Number.isFinite(price) || price <= 0) return null;

        return {
          date: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          fullDate: d.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          xIso: d.toISOString(),
          price,
          volume: 0,
        };
      })
      .filter(Boolean);
  }, []);

  const buildEstimatedHistoryBars = useCallback(() => {
    const base = Number(stock?.currentPrice ?? stock?.price ?? stock?.entryPrice ?? liveQuote?.price);
    if (!Number.isFinite(base) || base <= 0) return [];

    const points = 260; // ~5 years weekly points
    const bars = [];
    let prevClose = base * 0.85;

    for (let i = 0; i < points; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (points - 1 - i) * 7);

      const wave = Math.sin(i / 8) * 0.01 + Math.cos(i / 20) * 0.006;
      const drift = (base - prevClose) / base * 0.02;
      const move = wave + drift;

      const close = Math.max(0.01, prevClose * (1 + move));
      const open = prevClose;

      bars.push({
        date: d.toISOString().split("T")[0],
        open,
        high: Math.max(open, close) * 1.004,
        low: Math.min(open, close) * 0.996,
        close,
        volume: 0,
      });

      prevClose = close;
    }

    return bars;
  }, [stock?.currentPrice, stock?.price, stock?.entryPrice, liveQuote?.price]);

  const mergeLivePriceIntoBars = useCallback((bars, livePrice) => {
    if (!Number.isFinite(livePrice) || livePrice <= 0) return bars;

    const sourceBars = Array.isArray(bars) ? [...bars] : [];
    const today = new Date().toISOString().split("T")[0];

    if (sourceBars.length === 0) {
      return [{ date: today, open: livePrice, high: livePrice, low: livePrice, close: livePrice, volume: 0 }];
    }

    const last = sourceBars[sourceBars.length - 1];
    if (last?.date === today) {
      const open = Number(last.open ?? last.close ?? livePrice) || livePrice;
      const high = Math.max(Number(last.high ?? livePrice) || livePrice, livePrice);
      const low = Math.min(Number(last.low ?? livePrice) || livePrice, livePrice);
      sourceBars[sourceBars.length - 1] = {
        ...last,
        open,
        high,
        low,
        close: livePrice,
      };
      return sourceBars;
    }

    const prevClose = Number(last.close ?? livePrice) || livePrice;
    sourceBars.push({
      date: today,
      open: prevClose,
      high: Math.max(prevClose, livePrice),
      low: Math.min(prevClose, livePrice),
      close: livePrice,
      volume: 0,
    });
    return sourceBars;
  }, []);

  // Fetch chart data
  useEffect(() => {
    if (!stock?.symbol) return;
    
    let isMounted = true;
    const controller = new AbortController();

    const fetchChart = async () => {
      setChartLoading(true);
      setChartError(null);
      setChartNotice(null);

      try {
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const response = await fetch(
          `/api/egx-chart?symbol=${encodeURIComponent(stock.symbol)}&range=5y&interval=1d`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              const estimatedBars = buildEstimatedHistoryBars();
              if (estimatedBars.length > 0) {
                setQuote({
                  success: true,
                  symbol: stock.symbol,
                  source: "estimated",
                  meta: {
                    regularMarketPrice: Number(stock?.currentPrice ?? stock?.price ?? stock?.entryPrice ?? liveQuote?.price) || null,
                  },
                  bars: estimatedBars,
                });
                setChartNotice("Historical provider unavailable. Showing modeled long-range trend.");
                setChartError(null);
              } else {
                setChartError(`No historical chart data available for ${stock.symbol}`);
                setQuote(null);
              }
            }
            return;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          if (data.success) {
            setQuote(data);
            if (data.source === "cache") {
              setChartNotice("Showing cached historical chart data.");
            }
          } else {
            setChartError("Failed to load chart data");
            setQuote(null);
          }
        }
      } catch (error) {
        if (isMounted && error.name !== 'AbortError') {
          // Only log unexpected network errors, not our custom ones
          if (!error.message?.includes('No chart data available')) {
            console.error("Chart fetch error:", error);
          }
          const estimatedBars = buildEstimatedHistoryBars();
          if (estimatedBars.length > 0) {
            setQuote({
              success: true,
              symbol: stock.symbol,
              source: "estimated",
              meta: {
                regularMarketPrice: Number(stock?.currentPrice ?? stock?.price ?? stock?.entryPrice ?? liveQuote?.price) || null,
              },
              bars: estimatedBars,
            });
            setChartNotice("Historical provider unavailable. Showing modeled long-range trend.");
            setChartError(null);
          } else {
            setChartError(error.message);
            setQuote(null);
          }
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
  }, [stock?.symbol, stock?.currentPrice, stock?.price, stock?.entryPrice, liveQuote?.price, buildEstimatedHistoryBars]);

  // Fetch strict intraday data for 1D only (no cache fallback, no synthetic bars).
  useEffect(() => {
    if (!stock?.symbol || activeTimeframe !== "1D") return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchIntraday = async () => {
      setIntradayLoading(true);
      setIntradayError(null);

      try {
        const response = await fetch(
          `/api/egx-chart?symbol=${encodeURIComponent(stock.symbol)}&range=1d&interval=15m&cache=0`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              setChartDataIntraday([]);
              setIntradayError("Intraday (1D) data is unavailable right now.");
            }
            return;
          }

          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const bars = Array.isArray(data?.bars) ? data.bars : [];

        if (!isMounted) return;

        if (data.success && bars.length > 0) {
          setChartDataIntraday(barsToChartData(bars, null, "intraday"));
          setIntradayError(null);
        } else {
          setChartDataIntraday([]);
          setIntradayError("Intraday (1D) data is unavailable right now.");
        }
      } catch (error) {
        if (isMounted && error.name !== "AbortError") {
          setChartDataIntraday([]);
          setIntradayError(error.message || "Failed to load intraday data");
        }
      } finally {
        if (isMounted) setIntradayLoading(false);
      }
    };

    fetchIntraday();
    const id = setInterval(fetchIntraday, 60_000);

    return () => {
      isMounted = false;
      clearInterval(id);
      controller.abort();
    };
  }, [stock?.symbol, activeTimeframe, barsToChartData]);

  useEffect(() => {
    setLiveSessionPoints([]);
  }, [stock?.symbol]);

  // Poll live quote from multi-source endpoint (TradingView primary, Yahoo/cache fallback).
  useEffect(() => {
    if (!stock?.symbol) return;

    let isMounted = true;

    const fetchLiveQuote = async () => {
      try {
        const response = await fetch(`/api/stock-price?symbol=${encodeURIComponent(stock.symbol)}`);
        if (!response.ok) return;

        const data = await response.json();
        const price = Number(data?.price);

        if (!isMounted || !data?.success || !Number.isFinite(price) || price <= 0) return;

        setLiveQuote({
          price,
          source: data.source || "unknown",
          changePercent: data.changePercent,
          timestamp: data.timestamp || new Date().toISOString(),
        });

        setLiveSessionPoints((prev) => {
          const ts = data.timestamp || new Date().toISOString();
          const next = [...prev, { timestamp: ts, price }];
          return next.slice(-240);
        });

        setQuote((prev) => {
          const prevBars = Array.isArray(prev?.bars) ? prev.bars : [];

          // Do not fabricate chart history from live quotes when we have no bars.
          if (prevBars.length === 0) {
            return {
              ...(prev || {}),
              success: Boolean(prev?.success),
              symbol: stock.symbol,
              source: prev?.source || data.source || "live",
              meta: {
                ...(prev?.meta || {}),
                regularMarketPrice: price,
              },
              bars: [],
            };
          }

          const nextBars = mergeLivePriceIntoBars(prevBars, price);
          return {
            ...(prev || {}),
            success: true,
            symbol: stock.symbol,
            source: data.source || prev?.source || "live",
            meta: {
              ...(prev?.meta || {}),
              regularMarketPrice: price,
            },
            bars: nextBars,
          };
        });
      } catch {
        // Ignore polling failures; base chart state remains visible.
      }
    };

    fetchLiveQuote();
    const id = setInterval(fetchLiveQuote, 20_000);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [stock?.symbol, mergeLivePriceIntoBars]);

  // Process chart data
  useEffect(() => {
    const bars = quote?.bars || [];
    
    if (!stock || !Array.isArray(bars) || bars.length === 0) {
      setChartDataDaily([]);
      setChartDataWeekly([]);
      setChartDataMonthly([]);
      setChartDataYearly([]);
      setChartDataFiveYear([]);
      setCompanyInfo(prev => prev || getDefaultCompanyInfo());
      return;
    }

    setChartDataDaily(barsToChartData(bars, 8, "day-only"));
    setChartDataWeekly(barsToChartData(bars, 14, "short"));
    setChartDataMonthly(barsToChartData(bars, 30, "short"));
    setChartDataYearly(barsToChartData(bars, 252, "short"));
    setChartDataFiveYear(barsToChartData(bars, null, "2-digit"));

    updateCompanyInfo();
  }, [stock, quote, barsToChartData]);

  // Get default company info
  const getDefaultCompanyInfo = () => ({
    name: stock?.name || stock?.symbol || "Unknown",
    sector: stock?.sector || "N/A",
    industry: stock?.sector || "N/A",
    marketCap: formatCapital(stock?.marketCap ?? stock?.market_cap),
    lastPrice: stock?.currentPrice ?? stock?.price ?? stock?.entryPrice ?? "N/A",
    yearHigh: stock?.week_52_high ?? "N/A",
    yearLow: stock?.week_52_low ?? "N/A",
    avgVolume: stock?.avg_volume_30d ? formatVolume(stock.avg_volume_30d) : "N/A",
    pe: stock?.pe ? Number(stock.pe).toFixed(2) : "N/A",
    rsi: stock?.rsi_14 ? Number(stock.rsi_14).toFixed(1) : "N/A",
    change: stock?.change ?? stock?.profitPercent ?? 0,
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

    const rawPrice = stock?.currentPrice ?? stock?.price ?? stock?.entryPrice ?? meta.regularMarketPrice ?? "N/A";
    const price = rawPrice !== "N/A" && !Number.isNaN(Number(rawPrice)) ? Number(rawPrice).toFixed(2) : "N/A";
    const prevBar = bars.length >= 2 ? bars[bars.length - 2] : null;
    const previousClose = meta.chartPreviousClose ?? prevBar?.close ?? null;

    setCompanyInfo({
      ...getDefaultCompanyInfo(),
      price: price,
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
    const liveSessionChartData = livePointsToChartData(liveSessionPoints);
    const mapping = {
      '1D': chartDataIntraday.length > 0 ? chartDataIntraday : liveSessionChartData,
      '1W': chartDataWeekly,
      '1M': chartDataMonthly,
      '1Y': chartDataYearly,
      '5Y': chartDataFiveYear,
    };
    const raw = mapping[activeTimeframe] || chartDataDaily;
    // Add SMAs for non-intraday timeframes with enough data
    if (activeTimeframe !== '1D' && raw.length >= 20) {
      return addMovingAverages(raw, raw.length >= 50 ? [20, 50] : [20]);
    }
    return raw;
  };

  const activeChartData = useMemo(
    () => getChartData(),
    [activeTimeframe, chartDataDaily, chartDataIntraday, chartDataWeekly, chartDataMonthly, chartDataYearly, chartDataFiveYear, liveSessionPoints, addMovingAverages]
  );

  const isOneDay = activeTimeframe === '1D';
  const hasOneDayChartData = activeChartData.length > 0;
  const effectiveChartLoading = isOneDay ? intradayLoading : chartLoading;
  const effectiveChartError = isOneDay ? (hasOneDayChartData ? null : intradayError) : chartError;

  if (!stock) return null;

  const trend = calculateTrend(activeChartData);
  const info = companyInfo || getDefaultCompanyInfo();
  const liveTimeLabel = liveQuote?.timestamp
    ? new Date(liveQuote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  const chartStart = activeChartData?.[0]?.fullDate || activeChartData?.[0]?.date || "-";
  const chartEnd = activeChartData?.[activeChartData.length - 1]?.fullDate || activeChartData?.[activeChartData.length - 1]?.date || "-";
  const latestPrice = activeChartData?.length
    ? Number(activeChartData[activeChartData.length - 1]?.price)
    : null;
  const chartMin = activeChartData.length
    ? Math.min(...activeChartData.map((p) => Number(p.price) || 0))
    : null;
  const chartMax = activeChartData.length
    ? Math.max(...activeChartData.map((p) => Number(p.price) || 0))
    : null;
  const maxVolume = activeChartData.length
    ? Math.max(...activeChartData.map((p) => Number(p.volume) || 0))
    : 0;
  const hasVolume = maxVolume > 0;
  const hasSma20 = activeChartData.some(d => d.sma20 != null);
  const hasSma50 = activeChartData.some(d => d.sma50 != null);
  const firstPrice = activeChartData.length
    ? Number(activeChartData[0]?.price)
    : null;
  const totalChangePct = Number.isFinite(firstPrice) && firstPrice > 0 && Number.isFinite(latestPrice)
    ? ((latestPrice - firstPrice) / firstPrice) * 100
    : null;

  const formatXAxisTick = (xValue) => {
    const d = new Date(xValue);
    if (!Number.isFinite(d.getTime())) return xValue;
    if (activeTimeframe === '1D') {
      // Hours: 10 AM, 2 PM
      return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    }
    if (activeTimeframe === '1W') {
      // Days: Mon 9, Tue 10, Wed 11
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }
    if (activeTimeframe === '1M') {
      // Weeks: Jun 2, Jun 9, Jun 16
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (activeTimeframe === '1Y') {
      // Months: Jan, Feb, Mar
      return d.toLocaleDateString('en-US', { month: 'short' });
    }
    // 5Y → Years: 2022, 2023, 2024
    return d.toLocaleDateString('en-US', { year: 'numeric' });
  };

  const getXAxisLabel = () => {
    const labels = { '1D': 'Hours', '1W': 'Days', '1M': 'Weeks', '1Y': 'Months', '5Y': 'Years' };
    return labels[activeTimeframe] || 'Date';
  };

  const getYAxisTickCount = () => {
    if (!chartMin || !chartMax) return 6;
    const range = chartMax - chartMin;
    if (range < 5) return 4;
    if (range < 20) return 6;
    return 8;
  };

  const formatYAxisTick = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    if (n >= 100) return n.toFixed(0);
    if (n >= 10) return n.toFixed(1);
    return n.toFixed(2);
  };

  const formatTooltipLabel = (xValue) => {
    const d = new Date(xValue);
    if (!Number.isFinite(d.getTime())) return `Date: ${xValue}`;

    if (activeTimeframe === '1D') {
      return `Date: ${d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }

    if (activeTimeframe === '1W' || activeTimeframe === '1M') {
      return `Date: ${d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}`;
    }

    if (activeTimeframe === '1Y') {
      return `Date: ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
    }

    return `Date: ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-4 sm:p-5 flex justify-between items-start rounded-t-2xl">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{stock.symbol}</h2>
            <p className="text-emerald-100 text-sm font-semibold">{info.name}</p>
            {info.sector && info.sector !== 'N/A' && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                {info.sector}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {liveQuote?.price && (
              <div className="text-right mr-2">
                <p className="text-2xl font-black text-white">{Number(liveQuote.price).toFixed(2)} <span className="text-sm">EGP</span></p>
                {Number.isFinite(Number(liveQuote.changePercent)) && (
                  <p className={`text-sm font-bold ${Number(liveQuote.changePercent) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {Number(liveQuote.changePercent) >= 0 ? '+' : ''}{Number(liveQuote.changePercent).toFixed(2)}%
                  </p>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Price Info */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{t('currentPrice')}</p>
              <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{info.lastPrice} <span className="text-sm text-gray-400">EGP</span></p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{t('marketCap')}</p>
              <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{info.marketCap}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{t('peRatio')}</p>
              <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{info.pe}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">RSI (14)</p>
              <p className={`text-lg sm:text-xl font-black ${
                info.rsi !== 'N/A' && Number(info.rsi) > 70 ? 'text-red-600 dark:text-red-400' :
                info.rsi !== 'N/A' && Number(info.rsi) < 30 ? 'text-emerald-600 dark:text-emerald-400' :
                'text-gray-900 dark:text-white'
              }`}>{info.rsi}</p>
            </div>
          </div>

          {/* 52W Range + Volume */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{t('week52High')} / {t('week52Low')}</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">{info.yearHigh} / {info.yearLow}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">{t('volumeTraded')}</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">{info.avgVolume}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onAddStock && (
              <button
                onClick={() => onAddStock({
                  symbol: stock.symbol,
                  name: info.name,
                  currentPrice: Number(info.lastPrice) || 0,
                  entryPrice: Number(info.lastPrice) || 0,
                  sector: info.sector,
                })}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Plus size={16} />
                {t('addToPortfolio')}
              </button>
            )}
            {onSetAlert && (
              <button
                onClick={() => onSetAlert({
                  symbol: stock.symbol,
                  currentPrice: Number(info.lastPrice) || 0,
                })}
                className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Bell size={16} />
                {t('setAlert')}
              </button>
            )}
          </div>

          {/* Chart Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <h3 className="text-lg font-bold dark:text-white">{t('priceChart')}</h3>
                {liveQuote?.price ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    🟢 LIVE {liveQuote.source ? `• ${String(liveQuote.source).toUpperCase()}` : ''}
                    {liveTimeLabel ? ` • ${liveTimeLabel}` : ''}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {['1D', '1W', '1M', '1Y', '5Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTimeframe === tf
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Period summary bar */}
            {activeChartData.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap text-xs font-bold">
                <span className="text-gray-500 dark:text-gray-400">{chartStart} → {chartEnd}</span>
                {Number.isFinite(totalChangePct) && (
                  <span className={`px-2 py-0.5 rounded-full ${totalChangePct >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                    {totalChangePct >= 0 ? '+' : ''}{totalChangePct.toFixed(2)}%
                  </span>
                )}
                {chartMin != null && <span className="text-gray-500 dark:text-gray-400">L: {chartMin.toFixed(2)}</span>}
                {chartMax != null && <span className="text-gray-500 dark:text-gray-400">H: {chartMax.toFixed(2)}</span>}
                {hasSma20 && <span className="text-blue-500">SMA20</span>}
                {hasSma50 && <span className="text-orange-500">SMA50</span>}
              </div>
            )}

            {((chartNotice && !isOneDay) || (isOneDay && intradayError && hasOneDayChartData)) && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                {isOneDay
                  ? "Intraday history unavailable. Showing live session data."
                  : chartNotice}
              </div>
            )}

            {effectiveChartLoading ? (
              <div className="h-72 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : effectiveChartError ? (
              <div className="h-72 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-600 dark:text-red-400 text-sm font-bold">{effectiveChartError}</p>
                </div>
              </div>
            ) : activeChartData.length > 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Main price chart */}
                <div className="p-2 pt-3">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={activeChartData} margin={{ top: 10, right: 16, left: 4, bottom: 20 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1'} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1'} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} vertical={false} />
                      <XAxis
                        dataKey="xIso"
                        tickFormatter={formatXAxisTick}
                        interval="preserveStartEnd"
                        minTickGap={50}
                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        tickLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        tickMargin={8}
                        label={{ value: getXAxisLabel(), position: 'insideBottom', offset: -12, style: { fontSize: 11, fill: '#9ca3af', fontWeight: 700 } }}
                      />
                      <YAxis
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tickFormatter={formatYAxisTick}
                        tickCount={getYAxisTickCount()}
                        width={60}
                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                        axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        tickLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                        tickMargin={6}
                        label={{ value: 'EGP', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#9ca3af', fontWeight: 700 } }}
                      />
                      {Number.isFinite(latestPrice) && (
                        <ReferenceLine
                          y={latestPrice}
                          stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1'}
                          strokeDasharray="4 3"
                          strokeWidth={1.5}
                        />
                      )}
                      {Number.isFinite(firstPrice) && activeTimeframe !== '1D' && (
                        <ReferenceLine
                          y={firstPrice}
                          stroke="#9ca3af"
                          strokeDasharray="2 4"
                          strokeWidth={1}
                        />
                      )}
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          if (!d) return null;
                          return (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-xs">
                              <p className="font-bold text-gray-900 dark:text-white mb-1.5">{d.fullDate || d.date}</p>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-500">Close</span>
                                  <span className="font-bold text-gray-900 dark:text-white">{Number(d.price).toFixed(2)} EGP</span>
                                </div>
                                {d.open > 0 && d.open !== d.price && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Open</span>
                                    <span className="font-semibold">{Number(d.open).toFixed(2)}</span>
                                  </div>
                                )}
                                {d.high > 0 && d.high !== d.price && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">High</span>
                                    <span className="font-semibold text-emerald-600">{Number(d.high).toFixed(2)}</span>
                                  </div>
                                )}
                                {d.low > 0 && d.low !== d.price && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Low</span>
                                    <span className="font-semibold text-red-500">{Number(d.low).toFixed(2)}</span>
                                  </div>
                                )}
                                {d.volume > 0 && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Vol</span>
                                    <span className="font-semibold">{formatVolume(d.volume)}</span>
                                  </div>
                                )}
                                {d.sma20 != null && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-blue-500">SMA20</span>
                                    <span className="font-semibold text-blue-600">{Number(d.sma20).toFixed(2)}</span>
                                  </div>
                                )}
                                {d.sma50 != null && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-orange-500">SMA50</span>
                                    <span className="font-semibold text-orange-600">{Number(d.sma50).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="none"
                        fill="url(#priceGradient)"
                        fillOpacity={1}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6366f1'}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#fff', stroke: trend === 'up' ? '#10b981' : '#ef4444', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      {hasSma20 && (
                        <Line
                          type="monotone"
                          dataKey="sma20"
                          stroke="#3b82f6"
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          dot={false}
                          isAnimationActive={false}
                          connectNulls={false}
                        />
                      )}
                      {hasSma50 && (
                        <Line
                          type="monotone"
                          dataKey="sma50"
                          stroke="#f97316"
                          strokeWidth={1.5}
                          strokeDasharray="6 3"
                          dot={false}
                          isAnimationActive={false}
                          connectNulls={false}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume chart */}
                {hasVolume && activeTimeframe !== '1D' && (
                  <div className="px-2 pb-2 border-t border-gray-100 dark:border-gray-800">
                    <ResponsiveContainer width="100%" height={60}>
                      <ComposedChart data={activeChartData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                        <XAxis dataKey="xIso" hide />
                        <YAxis hide domain={[0, 'dataMax']} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            return d?.volume > 0 ? (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-[10px] shadow">
                                <span className="text-gray-500">{d.fullDate || d.date}</span>
                                <span className="ml-2 font-bold">{formatVolume(d.volume)}</span>
                              </div>
                            ) : null;
                          }}
                        />
                        <Bar
                          dataKey="volume"
                          fill={trend === 'up' ? '#10b98140' : '#ef444440'}
                          radius={[1, 1, 0, 0]}
                          isAnimationActive={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium -mt-1">{t('volumeTraded')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400">{t('error')}</p>
              </div>
            )}
          </div>

          {/* Analysis Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">{t('technicalAnalysis')}</h3>
              <button
                onClick={generateAnalysis}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-bold text-sm"
              >
                {loading ? t('analyzing') : t('analyze')}
              </button>
            </div>

            {analysisError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                {analysisError}
              </div>
            )}

            {analysis && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                <p><strong>{t('recommendation')}:</strong> {analysis.verdict || t('hold')}</p>
                <p><strong>{t('technicalIndicators')}:</strong> {analysis.trendDirection || t('neutral')}</p>
                <p>{analysis.reasoning || ''}</p>
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
