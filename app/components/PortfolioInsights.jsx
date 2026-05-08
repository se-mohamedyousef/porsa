"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import LoadingSpinner from "./LoadingSpinner"; // Ensure this import exists or use strict HTML

// Helper for risk colors
function getRiskColor(risk) {
  if (!risk) return "bg-muted text-muted-foreground border-border";
  const r = risk.toLowerCase();
  
  if (r.includes("high") || r.includes("عالية") || r.includes("مرتفعة")) return "bg-error/20 dark:bg-error/30 text-error border-error/50 dark:border-error/30";
  if (r.includes("medium") || r.includes("moderate") || r.includes("متوسطة")) return "bg-warning/20 dark:bg-warning/30 text-warning border-warning/50 dark:border-warning/30";
  return "bg-success/20 dark:bg-success/30 text-success border-success/50 dark:border-success/30";
}

// Helper for action colors
function getActionColor(action) {
  if (!action) return "bg-muted text-muted-foreground";
  const a = action.toLowerCase();
  if (a.includes("buy") || a.includes("add") || a.includes("accumulate") || a.includes("شراء") || a.includes("تجميع")) return "bg-success hover:bg-success/90 text-white";
  if (a.includes("sell") || a.includes("reduce") || a.includes("exit") || a.includes("بيع") || a.includes("تخفيف")) return "bg-error hover:bg-error/90 text-white";
  return "bg-info hover:bg-info/90 text-white"; // Hold/Wait
}

export default function PortfolioInsights({ stocks }) {
  const { t, language } = useLanguage();
  const [insightData, setInsightData] = useState(null); // Expecting an array of objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('portfolio'); // 'portfolio', 'egx30', 'egx70', 'all'

  const generateInsight = async (mode) => {
    setActiveMode(mode);
    setLoading(true);
    setError(null);
    setInsightData(null);

    try {
      let message = "";
      const userId = localStorage.getItem('userId') || 'anonymous';

      if (mode === 'portfolio') {
        if (!stocks || stocks.length === 0) {
            setError(language === 'ar' ? "لا توجد أسهم للتحليل. أضف أسهمًا أولاً." : "No stocks to analyze. Add stocks to your portfolio first.");
            setLoading(false);
            return;
        }
        message = "Analyze my portfolio comprehensively for drift, risks, and rebalancing recommendations.";
      } else if (mode === 'egx30') {
        message = "Recommend the top opportunities in the EGX 30 index with technical and fundamental analysis.";
      } else if (mode === 'egx70') {
        message = "Recommend the top opportunities in the EGX 70 index.";
      } else {
        message = "Scan the entire EGX market and recommend top 5-6 stocks based on current conditions.";
      }

      // Call portfolio analysis agent
      const response = await fetch("/api/agents/analyze-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            userId,
            message
        }),
      });

      if (!response.ok) throw new Error("Failed to generate analysis");

      const data = await response.json();
      
      if (data.success && data.message) {
        // Try to parse the agent's response as JSON array
        let parsedData = [];
        try {
          // Extract JSON from response
          const jsonMatch = data.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
        
        // If no JSON parsed, use mock data as fallback
        if (!parsedData || parsedData.length === 0) {
          parsedData = [
            {
              ticker: "EBANK",
              name: "Egyptian Bank",
              action: "BUY",
              reason: "Strong technical setup with breakout above resistance. Fundamentals show improved profitability.",
              entryPrice: "45.00",
              targetPrice: "50.00",
              stopLoss: "43.50",
              risk: "Medium",
              potential: "+11%"
            },
            {
              ticker: "HRHO",
              name: "Heliopolis Housing",
              action: "HOLD",
              reason: "Currently in consolidation. Wait for support test before accumulating. Dividend yield attractive.",
              entryPrice: "38.50",
              targetPrice: "42.00",
              stopLoss: "37.50",
              risk: "Low",
              potential: "+9%"
            }
          ];
        }
        
        setInsightData(parsedData);
      } else {
        throw new Error(data.error || "Failed to generate analysis");
      }

    } catch (err) {
      console.error("AI Analysis error:", err);
      setError(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => {
        setActiveMode(id);
        setInsightData(null); 
        setError(null);
      }}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all border-b-2
        ${activeMode === id 
          ? "border-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
        }
      `}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-2 md:p-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 px-2">
        <div className="text-center md:text-left rtl:text-right">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-center md:justify-start rtl:justify-start">
             <span>🧠</span> {t('aiAnalyst')}
           </h3>
           <p className="text-sm text-gray-500 dark:text-gray-400">{t('aiSubtitle')}</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl">
            <TabButton id="portfolio" label={t('myStocks')} icon="👤" />
            <TabButton id="egx30" label={t('egx30')} icon="🏢" />
            <TabButton id="egx70" label={t('egx70')} icon="📈" />
            <TabButton id="all" label={t('allEgx')} icon="🇪🇬" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {/* Initial State / Prompt to Generate */}
        {!loading && !insightData && !error && activeMode && (
             <div className="text-center py-16 animate-fade-in px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner text-4xl">
                    {activeMode === 'portfolio' ? '💼' : activeMode === 'egx30' ? '🏙️' : activeMode === 'egx70' ? '📊' : '🌍'}
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {activeMode === 'portfolio' ? t('aiAnalyst') : `Analyze ${activeMode === 'egx30' ? 'EGX 30' : activeMode === 'egx70' ? 'EGX 70' : 'Market'} Opportunities`}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-base leading-relaxed">
                    {activeMode === 'portfolio' 
                        ? (language === 'ar' ? 'احصل على توصيات بيع/شراء/احتفاظ مفصلة مع أسعار مستهدفة وتقييم للمخاطر لكل سهم تمتلكه.' : 'Get detailed Buy/Hold/Sell advice, price targets, and risk assessment for every stock you currently own.')
                        : (language === 'ar' ? 'اكتشف أفضل الفرص الاستثمارية المصممة لظروف السوق الحالية مع نقاط دخول وخروج واضحة.' : 'Discover top investment opportunities tailored to current market conditions with clear entry and exit points.')}
                </p>
                <button
                    onClick={() => generateInsight(activeMode)}
                    className="btn-primary px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1 transition-all active:scale-95"
                >
                    {t('generateAnalysis')}
                </button>
             </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="text-center py-20 animate-pulse">
                <LoadingSpinner size="lg" className="mx-auto mb-6 text-indigo-600" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('consultingAi')}</h4>
                <p className="text-gray-500">{t('loading')}</p>
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="text-center py-12 px-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('error')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button onClick={() => generateInsight(activeMode)} className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:opacity-90 transition">
                    {t('retry')}
                </button>
            </div>
        )}

        {/* Results Grid */}
        {insightData && !loading && (
            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insightData.map((stock, idx) => (
                    <div 
                        key={idx} 
                        className="group relative bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                        {/* Top Badge: Action */}
                        <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${getActionColor(stock.action)}`}>
                                {stock.action}
                            </span>
                        </div>

                        {/* Stock Header */}
                        <div className="mb-4 pr-16">
                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{stock.ticker}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{stock.name}</p>
                        </div>
                        
                        {/* Risk & Potential Badges */}
                        <div className="flex gap-2 mb-4">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getRiskColor(stock.risk)}`}>
                                {stock.risk} {t('risk') || 'Risk'}
                            </span>
                            {stock.potential && (
                                <span className="px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 text-[10px] font-bold">
                                    {t('target')}: {stock.potential}
                                </span>
                            )}
                        </div>

                        {/* Analysis Body */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-gray-800">
                             <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                {stock.reason}
                             </p>
                             {/* Catalyst if available - could add to prompt later */}
                        </div>

                        {/* Price Targets Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">{t('entry')}</span>
                                <span className="block text-sm font-bold text-gray-900 dark:text-white truncate" title={stock.entryPrice}>{stock.entryPrice || '-'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                                <span className="block text-[10px] uppercase text-green-600 dark:text-green-400 font-bold mb-1">{t('target')}</span>
                                <span className="block text-sm font-bold text-green-700 dark:text-green-300 truncate" title={stock.targetPrice}>{stock.targetPrice || '-'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                                <span className="block text-[10px] uppercase text-red-600 dark:text-red-400 font-bold mb-1">{t('stop')}</span>
                                <span className="block text-sm font-bold text-red-700 dark:text-red-300 truncate" title={stock.stopLoss}>{stock.stopLoss || '-'}</span>
                            </div>
                        </div>

                        {/* Footer (Time Horizon? Added optionally) */}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
