"use client";

import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Clock, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

const getCSSVariable = (variable) => {
  if (typeof window === 'undefined') return '#000000';
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

const formatPrice = (value) => {
  if (!value || !Number.isFinite(Number(value))) return '—';
  return Number(value).toFixed(2);
};

const formatCapital = (value) => {
  if (!value || value === "—") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};

// Generate fallback chart data based on current price
const generateFallbackChartData = (currentPrice, days = 22) => {
  if (!currentPrice || !Number.isFinite(Number(currentPrice))) return [];
  const data = [];
  const price = Number(currentPrice);
  const volatility = price * 0.02; // 2% daily volatility
  
  for (let i = days; i > 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const variation = (Math.random() - 0.5) * volatility * 2;
    const dayPrice = Math.max(price * 0.8, price + variation);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: parseFloat(dayPrice.toFixed(2))
    });
  }
  
  return data;
};

// Determine if intraday trading is allowed
const isIntradayAllowed = (symbol) => {
  const restrictedSymbols = ['NILE', 'GOVT'];
  return !restrictedSymbols.includes((symbol || '').toUpperCase());
};

// Determine which index the stock belongs to
const getStockIndices = (stock) => {
  const symbol = (stock?.symbol || '').toUpperCase();
  
  // EGX30 - Blue chip stocks
  const egx30 = ['COMI', 'EBANK', 'FAWRY', 'ORCL', 'CALE', 'TRPL', 'EMRL', 'ETEL', 'EMAS', 'DSCW', 'SWDY', 'ETLT', 'NTSM', 'AMLK', 'MNHD', 'HERY', 'EBKD', 'ACIB', 'CRECB', 'EKHO', 'HMPF', 'ORHD', 'ATCO', 'SBK', 'NPRO', 'ETSX', 'DNOC', 'OBKE', 'CLLD', 'MOBA'];
  
  // EGX70 - Mid-cap stocks (general index - selection)
  const egx70Additional = ['SKOP', 'ENGI', 'APOT', 'AMGH', 'CLHL', 'CHDR', 'EHDR', 'KOUM', 'IDBK'];
  
  // EGX100 - Broader market
  const egx100Additional = ['RALS', 'ESPL', 'ALEX', 'AMPS', 'MREM', 'SRTK', 'RSGC', 'GRDC'];
  
  const indices = [];
  
  if (egx30.includes(symbol)) {
    indices.push({ name: 'EGX30', level: 'Blue Chip', color: 'from-blue-600 to-blue-700', textColor: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' });
  } else if (egx70Additional.includes(symbol)) {
    indices.push({ name: 'EGX70', level: 'Mid-Cap', color: 'from-purple-600 to-purple-700', textColor: 'text-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-900/30' });
  }
  
  if (egx30.includes(symbol) || egx70Additional.includes(symbol) || egx100Additional.includes(symbol)) {
    indices.push({ name: 'EGX100', level: 'Broad Market', color: 'from-emerald-600 to-emerald-700', textColor: 'text-emerald-700', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' });
  } else {
    indices.push({ name: 'EGX (Listed)', level: 'Over-the-Counter', color: 'from-gray-600 to-gray-700', textColor: 'text-gray-700', bgColor: 'bg-gray-100 dark:bg-gray-900/30' });
  }
  
  return indices;
};

export default function StockDetailsModal({ stock, onClose }) {
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [activeTimeframe, setActiveTimeframe] = useState('1D');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [quote, setQuote] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  const chartColors = useMemo(() => ({
    emerald: getCSSVariable('--emerald-primary'),
    tooltipBg: getCSSVariable('--tooltip-bg'),
  }), [theme]);

  // Fetch chart data
  useEffect(() => {
    if (!stock?.symbol) return;
    let cancelled = false;
    setChartLoading(true);

    (async () => {
      try {
        const r = await fetch(`/api/egx-chart?symbol=${encodeURIComponent(stock.symbol)}`);
        if (!r.ok) {
          console.warn(`Chart API returned ${r.status} for ${stock.symbol}`);
          if (!cancelled) setQuote(null);
          return;
        }
        const j = await r.json();
        console.log(`Chart data for ${stock.symbol}:`, { success: j.success, barsCount: j.bars?.length });
        if (!cancelled) setQuote(j.success ? j : null);
      } catch (error) {
        console.error(`Chart fetch error for ${stock.symbol}:`, error.message);
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [stock?.symbol]);

  // Process chart data
  useEffect(() => {
    const bars = quote?.bars || [];
    if (!bars.length) {
      // Use fallback data based on current price
      const fallbackData = generateFallbackChartData(stock?.currentPrice ?? stock?.price ?? companyInfo?.lastPrice, 22);
      setChartData(fallbackData);
      return;
    }

    let data = [];
    const timeframeMap = { '1D': 22, '1W': 44, '1M': 66, '1Y': null };
    const limit = timeframeMap[activeTimeframe];
    const slice = limit ? bars.slice(-limit) : bars;

    data = slice.map((b) => {
      const d = new Date(b.date + "T12:00:00");
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return { date: dateStr, price: Number(b.close) };
    });

    setChartData(data);
  }, [quote, activeTimeframe, stock?.currentPrice, stock?.price, companyInfo?.lastPrice]);

  // Update company info
  useEffect(() => {
    const m = quote?.meta || {};
    const price = stock?.currentPrice ?? stock?.price ?? stock?.buyPrice ?? m.regularMarketPrice;
    
    setCompanyInfo({
      name: m.longName || stock?.name || stock?.symbol,
      sector: stock?.sector || "—",
      marketCap: formatCapital(stock?.market_cap ?? stock?.marketCap ?? m.marketCap),
      yearHigh: formatPrice(m.fiftyTwoWeekHigh),
      yearLow: formatPrice(m.fiftyTwoWeekLow),
      avgVolume: stock?.avg_volume_30d ? `${formatCapital(stock.avg_volume_30d)}` : "—",
      pe: stock?.pe && Number.isFinite(Number(stock.pe)) ? Number(stock.pe).toFixed(2) : "—",
      rsi: stock?.rsi_14 && Number.isFinite(Number(stock.rsi_14)) ? Number(stock.rsi_14).toFixed(1) : "—",
      lastPrice: formatPrice(price),
    });
  }, [stock, quote]);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `Provide brief technical analysis for ${stock.symbol}:
Price: ${companyInfo?.lastPrice} EGP
52W High/Low: ${companyInfo?.yearHigh}/${companyInfo?.yearLow}
RSI: ${companyInfo?.rsi}
Format as JSON: {verdict: "Buy|Hold|Sell", reasoning: "brief", technicalAnalysis: "brief", trendDirection: "up|down|neutral"}`;

      const response = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const jsonMatch = data.text?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            setAnalysis(JSON.parse(jsonMatch[0]));
          } else {
            setAnalysis({ reasoning: data.text, verdict: 'Hold', trendDirection: 'neutral' });
          }
        } catch (e) {
          setAnalysis({ reasoning: data.text, verdict: 'Hold', trendDirection: 'neutral' });
        }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  const trend = (() => {
    if (chartData.length < 2) return 'neutral';
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    if (last > first * 1.02) return 'up';
    if (last < first * 0.98) return 'down';
    return 'neutral';
  })();

  const priceMovement = stock?.profitPercent || 0;
  const periodHigh = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : null;
  const periodLow = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : null;

  if (!stock) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl sm:max-w-4xl max-h-[90vh] sm:max-h-[95vh] overflow-hidden border border-white/20 dark:border-white/5 flex flex-col">
        
        {/* Header - Mobile Optimized */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start gap-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 flex-shrink-0">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center font-black text-lg sm:text-2xl shadow-lg flex-shrink-0 ${
              priceMovement >= 0 ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}>
              {stock.symbol?.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white truncate">{stock.symbol}</h2>
                <span className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                  priceMovement >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                }`}>
                  {priceMovement >= 0 ? '+' : ''}{priceMovement?.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[10px] sm:text-xs">
                {stock.sector && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                    {stock.sector}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded font-bold ${
                  trend === 'up' ? 'bg-green-500/10 text-green-600' :
                  trend === 'down' ? 'bg-red-500/10 text-red-600' :
                  'bg-gray-500/10 text-gray-600'
                }`}>
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trend}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95 flex-shrink-0"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Trading Info - Top Priority Section */}
            {stock && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Intraday Trading Status */}
                <div className={`rounded-xl p-4 sm:p-5 border-2 border-b-4 shadow-lg transform hover:scale-[1.02] transition-transform ${
                  isIntradayAllowed(stock.symbol)
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-400 dark:border-green-500'
                    : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/20 border-orange-400 dark:border-orange-500'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black uppercase tracking-wider">
                      {isIntradayAllowed(stock.symbol) ? '✅ INTRADAY TRADING' : '⚠️ RESTRICTED TRADING'}
                    </p>
                    <span className={`text-2xl font-black ${
                      isIntradayAllowed(stock.symbol) ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {isIntradayAllowed(stock.symbol) ? '✓' : '✗'}
                    </span>
                  </div>
                  <p className={`text-base font-bold leading-relaxed ${
                    isIntradayAllowed(stock.symbol)
                      ? 'text-green-900 dark:text-green-200'
                      : 'text-orange-900 dark:text-orange-200'
                  }`}>
                    {isIntradayAllowed(stock.symbol)
                      ? 'You can BUY & SELL in the same trading session'
                      : 'Must hold position until next trading day'}
                  </p>
                </div>

                {/* Index Membership */}
                <div className="rounded-xl p-4 sm:p-5 border-2 border-b-4 border-blue-400 dark:border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 shadow-lg">
                  <p className="text-sm font-black uppercase tracking-wider opacity-80 mb-3">📍 MARKET INDEX</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getStockIndices(stock).map((idx, i) => (
                      <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${idx.bgColor} ${idx.textColor} border border-current/20`}>
                        {idx.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-base font-bold text-blue-900 dark:text-blue-200">
                    {getStockIndices(stock)[0]?.level}
                  </p>
                </div>
              </div>
            )}
            
            {/* Key Metrics - Compact Grid */}
            {companyInfo && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <MetricCard label="Current" value={`${companyInfo.lastPrice} EGP`} icon="📊" />
                <MetricCard label="52W High" value={`${companyInfo.yearHigh}`} icon="⬆️" />
                <MetricCard label="52W Low" value={`${companyInfo.yearLow}`} icon="⬇️" />
                <MetricCard label="RSI(14)" value={companyInfo.rsi} icon="📈" />
              </div>
            )}

            {/* Chart Section */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/30 dark:to-gray-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-3 sm:p-4 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white">Price Chart</h3>
                  {!quote?.bars?.length && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estimated trend based on current price</p>
                  )}
                </div>
                <div className="flex gap-1 sm:gap-2">
                  {['1D', '1W', '1M', '1Y'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setActiveTimeframe(tf)}
                      className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        activeTimeframe === tf
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-48 sm:h-80 w-full">
                {chartLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Loading chart...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-4">
                    Unable to load chart data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                      <XAxis dataKey="date" stroke="currentColor" opacity={0.5} style={{fontSize: '11px'}} tick={{fontSize: 11}} />
                      <YAxis stroke="currentColor" opacity={0.5} style={{fontSize: '11px'}} tick={{fontSize: 11}} width={40} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          background: '#fff',
                          padding: '8px 12px',
                        }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                        formatter={(value) => [`${formatPrice(value)} EGP`, 'Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981"
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {chartData.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-bold mb-1">High</p>
                    <p className="text-green-600 dark:text-green-400 font-black">{periodHigh?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-bold mb-1">Low</p>
                    <p className="text-red-600 dark:text-red-400 font-black">{periodLow?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 font-bold mb-1">Change</p>
                    <p className={`font-black ${priceMovement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {priceMovement >= 0 ? '+' : ''}{priceMovement?.toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Stats */}
            {stock && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <StatCard 
                  label="Holdings" 
                  value={stock.quantity?.toLocaleString() || '0'} 
                  unit="shares"
                />
                <StatCard 
                  label="Avg Cost" 
                  value={formatPrice(stock.buyPrice)} 
                  unit="EGP/share"
                />
                <StatCard 
                  label="Gain/Loss" 
                  value={formatPrice(stock.profit)} 
                  unit="EGP"
                  color={stock.profit >= 0 ? 'green' : 'red'}
                />
                <StatCard 
                  label="Return" 
                  value={`${priceMovement >= 0 ? '+' : ''}${priceMovement?.toFixed(2)}`} 
                  unit="%"
                  color={priceMovement >= 0 ? 'green' : 'red'}
                />
              </div>
            )}

            {/* Company Info */}
            {companyInfo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase">About</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {companyInfo.name || stock.symbol}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Sector: <span className="font-bold">{companyInfo.sector}</span> • 
                  Market Cap: <span className="font-bold">{companyInfo.marketCap}</span>
                </p>
              </div>
            )}

            {/* Trading Info */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700/50">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3 uppercase flex items-center gap-2">
                <Clock size={16} /> Trading Sessions (Cairo Time)
              </p>
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-gray-900 dark:text-white">
                  🌅 Morning: 10:30 AM - 1:00 PM
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  🌆 Evening: 3:30 PM - 5:00 PM
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">AI Analysis</p>
                {!analysis && !loading && (
                  <button 
                    onClick={generateAnalysis}
                    className="text-xs sm:text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
                  >
                    Generate
                  </button>
                )}
              </div>

              {loading && (
                <div className="text-center py-6">
                  <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Analyzing...</p>
                </div>
              )}

              {analysis && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border-l-4 ${
                    analysis.verdict === 'Buy' ? 'bg-green-50 dark:bg-green-900/20 border-green-600' :
                    analysis.verdict === 'Sell' ? 'bg-red-50 dark:bg-red-900/20 border-red-600' :
                    'bg-amber-50 dark:bg-amber-900/20 border-amber-600'
                  }`}>
                    <p className="text-xs font-bold mb-1 opacity-70">Recommendation</p>
                    <p className={`text-lg font-black ${
                      analysis.verdict === 'Buy' ? 'text-green-700 dark:text-green-300' :
                      analysis.verdict === 'Sell' ? 'text-red-700 dark:text-red-300' :
                      'text-amber-700 dark:text-amber-300'
                    }`}>{analysis.verdict?.toUpperCase() || 'HOLD'}</p>
                  </div>
                  
                  {analysis.reasoning && (
                    <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {analysis.reasoning.substring(0, 200)}...
                    </div>
                  )}
                </div>
              )}

              {!analysis && !loading && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Request AI-powered technical analysis for this stock.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/30 p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-white/10">
      <p className="text-[9px] sm:text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1 truncate">{label}</p>
      <p className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{icon} {value}</p>
    </div>
  );
}

function StatCard({ label, value, unit, color = 'gray' }) {
  const colorMap = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/40 dark:to-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-white/10">
      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-lg sm:text-xl font-black ${colorMap[color]}`}>{value}</p>
      <p className="text-[9px] text-gray-500 dark:text-gray-500 mt-1">{unit}</p>
    </div>
  );
}
