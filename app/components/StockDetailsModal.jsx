"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function StockDetailsModal({ stock, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);

  // Generate mock chart data for visualization
  useEffect(() => {
    if (stock) {
      const data = [];
      let price = stock.currentPrice || stock.buyPrice;
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Random walk
        price = price * (1 + (Math.random() * 0.04 - 0.02));
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: parseFloat(price.toFixed(2))
        });
      }
      setChartData(data);
    }
  }, [stock]);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze this stock deeply:
Symbol: ${stock.symbol}
My Buy Price: ${stock.buyPrice}
Current Price: ${stock.currentPrice}
Quantity: ${stock.quantity}
P/L: ${stock.profit} (${stock.profitPercent}%)
Context: Egypt Stock Market (EGX).

Provide a response in this JSON format:
{
  "verdict": "Buy" | "Hold" | "Sell",
  "reasoning": "One sentence summary",
  "opportunities": ["point 1", "point 2"],
  "risks": ["point 1", "point 2"],
  "supportResistance": "Support at X, Resistance at Y"
}`;

      const response = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        // Naive JSON parsing of the AI text content if it returns a string block
        // In a real app we'd use Structured Outputs or more robust parsing
        // For now, let's assume the AI follows the JSON format or we display the text.
        // Since our AI endpoint returns { text: string }, let's try to parse that string as JSON.
        try {
            // Find JSON block in text (handling potential markdown code blocks)
            const jsonMatch = data.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                setAnalysis(JSON.parse(jsonMatch[0]));
            } else {
                // Fallback if not proper JSON
                setAnalysis({ reasoning: data.text });
            }
        } catch (e) {
            setAnalysis({ reasoning: data.text });
        }
      }
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!stock) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{stock.symbol}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                stock.profit >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {stock.profitPercent.toFixed(2)}%
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">EGX Stock Deep Dive</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Stats & Chart */}
          <div className="space-y-6">
            {/* Fundamentals Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-medium">Current Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stock.currentPrice?.toFixed(2)} <span className="text-sm font-normal text-gray-500">EGP</span></p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase font-medium">Avg Buy Price</p>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white">{stock.buyPrice?.toFixed(2)} <span className="text-sm font-normal text-gray-500">EGP</span></p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase font-medium">Quantity</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">{stock.quantity?.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-xl ${stock.profit >= 0 ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}`}>
                 <p className={`text-xs uppercase font-medium ${stock.profit >= 0 ? "text-green-600" : "text-red-600"}`}>Total P/L</p>
                 <p className={`text-xl font-bold ${stock.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                   {stock.profit >= 0 ? "+" : ""}{stock.profit.toFixed(2)}
                 </p>
              </div>
            </div>

            {/* Mock Chart */}
            <div className="h-64 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Price Trend (30 Days)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <span className="text-2xl">🤖</span>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Analyst</h3>
              </div>
              {!analysis && !loading && (
                <button 
                  onClick={generateAnalysis}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors"
                >
                  Analyze Stock
                </button>
              )}
            </div>

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-indigo-600">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="animate-pulse font-medium">Reading market signals...</p>
              </div>
            )}

            {!analysis && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                <p className="max-w-xs">Tap "Analyze Stock" to get a detailed breakdown of risks, opportunities, and a buy/sell verdict.</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 animate-fade-in">
                {/* Verdict */}
                {analysis.verdict && (
                  <div className="flex items-center justify-between bg-white dark:bg-black/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Verdict</span>
                    <span className={`text-lg font-bold px-3 py-1 rounded-lg ${
                      analysis.verdict === 'Buy' ? 'bg-green-100 text-green-700' :
                      analysis.verdict === 'Sell' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {analysis.verdict}
                    </span>
                  </div>
                )}

                <div>
                   <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analysis</h4>
                   <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                     "{analysis.reasoning}"
                   </p>
                </div>

                {analysis.opportunities && (
                  <div>
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      Opportunities
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                      {analysis.opportunities.map((op, i) => <li key={i}>• {op}</li>)}
                    </ul>
                  </div>
                )}
                
                {analysis.risks && (
                  <div>
                    <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Risks
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                      {analysis.risks.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
