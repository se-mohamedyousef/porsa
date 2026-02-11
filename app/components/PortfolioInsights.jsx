"use client";

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import LoadingSpinner from "./LoadingSpinner"; // Ensure this import exists or use strict HTML

// Helper for risk colors
function getRiskColor(risk) {
  if (!risk) return "bg-gray-100 text-gray-800";
  const r = risk.toLowerCase();
  
  if (r.includes("high") || r.includes("عالية") || r.includes("مرتفعة")) return "bg-red-100 text-red-800 border-red-200";
  if (r.includes("medium") || r.includes("moderate") || r.includes("متوسطة")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

// Helper for action colors
function getActionColor(action) {
  if (!action) return "bg-gray-100 text-gray-800";
  const a = action.toLowerCase();
  if (a.includes("buy") || a.includes("add") || a.includes("accumulate") || a.includes("شراء") || a.includes("تجميع")) return "bg-green-600 text-white";
  if (a.includes("sell") || a.includes("reduce") || a.includes("exit") || a.includes("بيع") || a.includes("تخفيف")) return "bg-red-600 text-white";
  return "bg-blue-600 text-white"; // Hold/Wait
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
      let prompt = "";
      const langContext = language === 'ar' 
        ? "IMPORTANT: Output language must be ARABIC (اللغة العربية)." 
        : "Output language: English.";
        
      let context = `Context: Egypt Stock Market (EGX). Analysis must be current and actionable. ${langContext}`;

      if (mode === 'portfolio') {
        if (!stocks || stocks.length === 0) {
            setError(language === 'ar' ? "لا توجد أسهم للتحليل. أضف أسهمًا أولاً." : "No stocks to analyze. Add stocks to your portfolio first.");
            setLoading(false);
            return;
        }
        const portfolioSummary = stocks
          .map(
            (s) =>
              `- ${s.symbol}: ${s.quantity} shares, Avg Cost: ${s.buyPrice}, Current: ${s.currentPrice}`
          )
          .join("\n");
        prompt = `
You are a senior portfolio manager. Analyze these specific holdings in the user's EGX portfolio.
For EACH stock, provide a clear Buy/Hold/Sell recommendation with targets.

Portfolio:
${portfolioSummary}
${context}`;
      } else {
        // Market Modes
        const indexName = mode === 'egx30' ? "EGX 30" : mode === 'egx70' ? "EGX 70" : "All EGX stocks";
        prompt = `
You are a senior market analyst. Recommend the top 6 investment opportunities currently in the ${indexName}.
Select a mix of strong technical setups and fundamental value.
${context}`;
      }

      // Strict JSON format instruction
      prompt += `
      
RETURN ONLY A JSON ARRAY of objects. No markdown, no conversational text.
Format for each object:
{
  "ticker": "Symbol (e.g., COMI)",
  "name": "Company Name (in ${language === 'ar' ? 'Arabic' : 'English'})",
  "action": "${language === 'ar' ? 'شراء | بيع | احتفاظ' : 'Buy | Sell | Hold'}",
  "reason": "Concise 2-sentence reasoning (Technical + Fundamental) in ${language === 'ar' ? 'Arabic' : 'English'}",
  "entryPrice": "Recommended entry range",
  "targetPrice": "Short/Mid-term target",
  "stopLoss": "Stop loss level",
  "risk": "${language === 'ar' ? 'منخفضة | متوسطة | عالية' : 'Low | Medium | High'}",
  "potential": "Expected % return"
}
`;

      const response = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            prompt,
            expectJson: true // Backend hint to enforce JSON
        }),
      });

      if (!response.ok) throw new Error("Failed to generate insights");

      const data = await response.json();
      
      // Robust Parsing Logic
      let parsedData = [];
      if (data.json && Array.isArray(data.json)) {
          parsedData = data.json;
      } else if (typeof data.text === 'string') {
          // Attempt to clean and parse
          let cleanText = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
          // Find array brackets
          const start = cleanText.indexOf('[');
          const end = cleanText.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
              cleanText = cleanText.substring(start, end + 1);
              try {
                parsedData = JSON.parse(cleanText);
              } catch (e) {
                console.error("JSON Parse Error:", e);
                throw new Error("AI returned malformed data format.");
              }
          } else {
             throw new Error("AI did not return a structured list.");
          }
      }
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
           throw new Error("No actionable insights found.");
      }

      setInsightData(parsedData);

    } catch (err) {
      console.error("AI Insight error:", err);
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
