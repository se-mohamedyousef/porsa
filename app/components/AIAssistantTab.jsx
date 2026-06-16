'use client';

import { useState } from 'react';
import { Bot, LineChart, ShieldAlert, Zap, TrendingUp, Search, Send, Loader2, RefreshCw } from 'lucide-react';
import { useLanguageSimple } from '../hooks/useLanguageSimple';

export default function AIAssistantTab({ userId, portfolio = [] }) {
  const { t, language } = useLanguageSimple();
  const [activeAgent, setActiveAgent] = useState('research-stock');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastQueries, setLastQueries] = useState([]);

  const agents = [
    { id: 'research-stock', icon: Search, label: 'Stock Research', endpoint: '/api/agents/research-stock', placeholder: 'Enter stock symbol (e.g., COMI)' },
    { id: 'analyze-portfolio', icon: LineChart, label: 'Portfolio Analysis', endpoint: '/api/agents/analyze-portfolio', placeholder: 'Ask about your portfolio performance' },
    { id: 'assess-risk', icon: ShieldAlert, label: 'Risk Assessment', endpoint: '/api/agents/assess-risk', placeholder: 'Assess risk for specific stocks or portfolio' },
    { id: 'get-recommendations', icon: TrendingUp, label: 'Recommendations', endpoint: '/api/agents/get-recommendations', placeholder: 'What are you looking for? (e.g., undervalued stocks)' },
    { id: 'detect-anomalies', icon: Zap, label: 'Anomaly Detection', endpoint: '/api/agents/detect-anomalies', placeholder: 'Detect anomalies in the market today' }
  ];

  const currentAgentInfo = agents.find(a => a.id === activeAgent);

  // Quick action shortcuts
  const quickActions = {
    'analyze-portfolio': [
      { label: 'Portfolio Summary', query: 'Summarize my portfolio performance' },
      { label: 'Top Performers', query: 'What are my top 3 performing stocks?' },
      { label: 'Largest Losses', query: 'Which stocks are losing the most value?' }
    ],
    'assess-risk': [
      { label: 'Portfolio Risk', query: 'What is my portfolio risk level?' },
      { label: 'Volatility Check', query: 'Check volatility for my stocks' },
      { label: 'Concentration Risk', query: 'Is my portfolio too concentrated?' }
    ],
    'get-recommendations': [
      { label: 'Buy Recommendations', query: 'What stocks should I buy?' },
      { label: 'Sell Signals', query: 'Which stocks show sell signals?' },
      { label: 'Undervalued Stocks', query: 'Find undervalued stocks' }
    ],
    'detect-anomalies': [
      { label: 'Market Anomalies', query: 'Detect any market anomalies today' },
      { label: 'Volume Spikes', query: 'Show stocks with unusual volume' },
      { label: 'Price Gaps', query: 'Detect price gaps or gaps' }
    ]
  };

  const handleQuery = async (e, quickQuery = null) => {
    e?.preventDefault?.();
    
    const queryToUse = quickQuery || query;
    if (!queryToUse.trim()) return;

    // For portfolio analysis, we pass the portfolio if query is empty or anyway to help the agent
    const bodyPayload = { 
      symbol: queryToUse.toUpperCase(),
      query: queryToUse,
      portfolio: portfolio
    };

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(currentAgentInfo.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI analysis. Please try again.');
      }

      const data = await response.json();
      
      // Agent endpoints might return data.analysis, data.recommendations, data.riskProfile, or just data.text
      setResult(data.analysis || data.text || data.markdown || JSON.stringify(data, null, 2));
      
      // Track last query
      if (quickQuery) {
        setLastQueries(prev => [quickQuery, ...prev.slice(0, 2)]);
      }
    } catch (err) {
      console.error('Agent error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 px-4 sm:px-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
          <Bot size={14} /> Porsa Intelligence
        </div>
        <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 drop-shadow-sm">
          AI Investment Agent
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-semibold max-w-2xl">
          Leverage our specialized AI agents to perform deep market analysis, assess risk, and generate personalized recommendations for the EGX market.
        </p>
      </div>

      {/* Agent Selector */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isActive = activeAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => {
                setActiveAgent(agent.id);
                setResult(null);
                setError(null);
                setQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all font-bold text-sm border-2 ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-md'
                  : 'border-transparent bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              {agent.label}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      {quickActions[activeAgent] && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-2">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickActions[activeAgent].map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => handleQuery(e, action.query)}
                disabled={loading}
                className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⚡ {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Interaction Area */}
      <div className="glass-card p-1 sm:p-2 border border-gray-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Input Form */}
        <form onSubmit={handleQuery} className="relative p-2">
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentAgentInfo.placeholder}
              className="w-full px-6 py-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 font-medium text-sm sm:text-base"
            />
            <div className="pr-2">
              <button
                type="submit"
                disabled={loading || (!query && activeAgent === 'research-stock')}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  loading || (!query && activeAgent === 'research-stock')
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
                }`}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </form>

        {/* Results Area */}
        <div className="px-4 pb-4 pt-2">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl text-red-700 dark:text-red-400 text-sm font-medium flex items-start gap-3 animate-fade-in">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading && !error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fade-in text-indigo-600 dark:text-indigo-400">
              <div className="relative">
                <RefreshCw size={40} className="animate-spin-slow opacity-20" />
                <Bot size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-sm font-bold tracking-wide animate-pulse">AGENT IS ANALYZING...</p>
            </div>
          )}

          {!loading && !error && result && (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 animate-slide-up">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <currentAgentInfo.icon size={20} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Analysis Complete</h3>
              </div>
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
                {typeof result === 'string' ? (
                  result.split('\n').map((line, i) => (
                    line.startsWith('#') ? (
                      <h4 key={i} className="mt-4 mb-2 font-black text-gray-800 dark:text-gray-200">{line.replace(/^#+\s/, '')}</h4>
                    ) : line.startsWith('-') || line.startsWith('*') ? (
                      <li key={i} className="ml-4 mb-1 text-gray-600 dark:text-gray-300">{line.replace(/^[-*]\s/, '')}</li>
                    ) : (
                      <p key={i} className="mb-2 text-gray-600 dark:text-gray-300">{line}</p>
                    )
                  ))
                ) : (
                  <pre className="text-xs bg-gray-50 dark:bg-slate-900 p-4 rounded-xl overflow-x-auto text-gray-700 dark:text-gray-300">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
          
          {!loading && !error && !result && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm mb-4">
                <currentAgentInfo.icon size={28} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Ready to Assist</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select an agent above and enter your query to get professional-grade investment insights powered by AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
