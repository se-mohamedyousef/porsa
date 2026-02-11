"use client";

import PortfolioTracker from "./components/PortfolioTracker";
import LoginForm from "./components/LoginForm";
import ResetPasswordForm from "./components/ResetPasswordForm";
import ProfilePage from "./components/ProfilePage";
import LoadingSpinner from "./components/LoadingSpinner";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Responsive container max width for desktop, tablet, and mobile
const CONTAINER_MAX_WIDTH = "max-w-7xl"; // wider for desktop

// Define a type for the user object to avoid 'never' type errors
type User = {
  id?: string;
  name?: string;
  phone?: string;
  [key: string]: any;
};

// Types for AI recommendations and analysis
type AiRecommendation = {
  ticker: string;
  name: string;
  sector?: string;
  reason: string;
  entry: string;
  exit?: string;
  target_price?: string;
  stop_loss?: string;
  risk: string;
  time_horizon?: string;
  market_cap_category?: string;
  key_catalyst?: string;
  potential_return?: string;
};
type MyStockAdvice = {
  ticker: string | null;
  name?: string;
  sector?: string;
  advice: string; // This will be the detailed reason/analysis
  entry?: string;
  target_price?: string;
  stop_loss?: string;
  risk?: string;
  time_horizon?: string;
  market_cap_category?: string;
  key_catalyst?: string;
  potential_return?: string;
  current_price?: string;
};

// UI: Color for risk level
function riskColor(risk: string) {
  switch (risk?.toLowerCase()) {
    case "low":
      return "bg-green-100 text-green-800 border-green-300";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "high":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function HomeContent() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<
    AiRecommendation[] | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState<"egx30" | "egx70" | "all">("egx30");
  const [myStocksLoading, setMyStocksLoading] = useState(false);
  const [myStocksRecommendation, setMyStocksRecommendation] = useState<
    MyStockAdvice[] | null
  >(null);

  // Track which button is currently clicked
  const [currentClickedButton, setCurrentClickedButton] = useState<
    "egx30" | "egx70" | "all" | "myStocks" | null
  >(null);

  // Check for existing user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("porsaCurrentUser");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error loading user session:", error);
        localStorage.removeItem("porsaCurrentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("porsaCurrentUser");
    setShowProfile(false);
  };

  async function handleAsk(type: "egx30" | "egx70" | "all" = aiType) {
    setCurrentClickedButton(type);
    setAiLoading(true);
    setAiRecommendation(null);

    try {
      let url =
        "https://api.investing.com/api/financialdata/assets/equitiesByCountry/default?country-id=59&fields-list=id,name,symbol,last";
      let promptIndex = "EGX30";
      if (type === "egx70") {
        promptIndex = "EGX70";
      } else if (type === "all") {
        promptIndex = "all EGX stocks";
      }
      const headers = {
        accept: "*/*",
        "content-type": "application/json",
      };

      const res1 = await fetch(url, { headers });
      const data1 = await res1.json();

      let egxData = data1.data;

      // Stronger prompt: ask for JSON array of objects
      const prompt = `
You are a professional Egyptian stock market analyst specializing in the ${promptIndex}.
Here is today’s market data for ${promptIndex} companies:

${JSON.stringify(egxData)}

From this data, recommend 7 stocks for investment today (2 low-risk, 3 medium-risk, 2 high-risk).

For each stock, return a JSON object with these fields:
- ticker (string)
- name (string)
- sector (string): Industry sector  
- reason (string, 2-3 sentences with fundamental AND technical basis)
- entry (string, entry price range)
- target_price (string, price target)
- stop_loss (string, stop loss price)
- risk (string: low, medium, or high)
- time_horizon (string: short-term, medium-term, or long-term)
- market_cap_category (string: large, mid, or small)
- key_catalyst (string, 1 sentence on what makes it a good buy NOW)
- potential_return (string, expected return percentage like +15%)

Return a JSON array of exactly 7 objects, no explanation, no markdown, just the array.
Ensure diversity across sectors and risk levels.
Educational purposes only — not financial advice.
`;

      const res = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          expectJson: true, // Optionally signal to backend to parse as JSON
        }),
      });
      const data = await res.json();

      // Try to parse as JSON array
      let parsed: AiRecommendation[] | null = null;
      if (Array.isArray(data?.json)) {
        parsed = data.json;
      } else if (typeof data?.text === "string") {
        try {
          const arr = JSON.parse(data.text);
          if (Array.isArray(arr)) parsed = arr;
        } catch (e) {
          parsed = null;
        }
      }
      setAiRecommendation(parsed || null);
    } catch (err) {
      setAiRecommendation(null);
    } finally {
      setAiLoading(false);
      setCurrentClickedButton(null);
    }
  }

  // New: Analyze my stocks button handler
  async function handleAnalyzeMyStocks() {
    setCurrentClickedButton("myStocks");
    if (!currentUser || !currentUser.id) return;
    setMyStocksLoading(true);
    setMyStocksRecommendation(null);

    try {
      // Fetch user's stocks from backend API (assuming /api/portfolio?userId=...)
      const res = await fetch(`/api/portfolio?userId=${currentUser.id}`);
      if (!res.ok) throw new Error("Failed to fetch your portfolio.");
      const userStocks = await res.json();

      if (
        !userStocks ||
        !Array.isArray(userStocks) ||
        userStocks.length === 0
      ) {
        setMyStocksRecommendation([
          { ticker: null, advice: "No stocks found in your portfolio." },
        ]);
        return;
      }

      // Fetch all EGX stocks data to provide to the AI for better analysis
      const egxRes = await fetch(
        "https://api.investing.com/api/financialdata/assets/equitiesByCountry/default?country-id=59&fields-list=id,name,symbol,last"
      );
      const egxDataJson = await egxRes.json();
      const allEgxStocks = egxDataJson.data;

      // Enhanced prompt: ask for comprehensive analysis of portfolio stocks
      const prompt = `
You are an Egyptian stock market analyst.
Here is today's EGX market data: ${JSON.stringify(allEgxStocks)}
My EGX portfolio: ${JSON.stringify(userStocks)}

For each stock in my portfolio, provide a comprehensive analysis with the following JSON object:
- ticker (string): Stock symbol
- name (string): Company name
- sector (string): Industry sector
- current_price (string): Current market price from the data
- advice (string): 2-3 sentences analyzing current position - should I hold, sell, or add more? Include both fundamental and technical reasoning
- entry (string): If buying more, recommended entry price range
- target_price (string): Price target for profitable exit
- stop_loss (string): Recommended stop loss to protect gains/limit losses
- risk (string): "low", "medium", or "high" - current risk assessment
- time_horizon (string): "short-term", "medium-term", or "long-term" - recommended holding period
- market_cap_category (string): "large", "mid", or "small"
- key_catalyst (string): 1 sentence on what could drive the stock price in coming weeks
- potential_return (string): Expected return from current price to target (e.g., "+15%")

Return a JSON array of objects, one per stock in my portfolio, no explanation, no markdown, just the array.
If a stock is not found in market data, still provide analysis based on portfolio data.
Educational purposes only — not financial advice.
`;

      const aiRes = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, expectJson: true }),
      });
      const aiData = await aiRes.json();

      let parsed: MyStockAdvice[] | null = null;
      if (Array.isArray(aiData?.json)) {
        parsed = aiData.json;
      } else if (typeof aiData?.text === "string") {
        try {
          const arr = JSON.parse(aiData.text);
          if (Array.isArray(arr)) parsed = arr;
        } catch (e) {
          parsed = null;
        }
      }
      setMyStocksRecommendation(
        parsed || [{ ticker: null, advice: "No analysis received." }]
      );
    } catch (err) {
      setMyStocksRecommendation([
        { ticker: null, advice: "Failed to analyze your portfolio." },
      ]);
    } finally {
      setMyStocksLoading(false);
      setCurrentClickedButton(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 px-4">
        <div className="text-center w-full max-w-xs mx-auto animate-fade-in">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-subtle hover-glow">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <p className="text-muted-foreground text-lg font-medium animate-pulse">
            Loading your portfolio...
          </p>
        </div>
      </div>
    );
  }

  // Show reset password form if token is present
  if (resetToken) {
    return <ResetPasswordForm token={resetToken} />;
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Show profile page if requested
  if (showProfile) {
    return (
      <ProfilePage
        currentUser={currentUser}
        onBack={() => setShowProfile(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex flex-col animate-fade-in">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={() => setShowProfile(true)}
      />
      <main
        className={`flex-1 w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-4 md:py-8`}
      >
        <Dashboard
          currentUser={currentUser}
          aiRecommendation={aiRecommendation}
          aiLoading={aiLoading}
          onAskAi={handleAsk}
          aiType={aiType}
          setAiType={setAiType}
          myStocksLoading={myStocksLoading}
          myStocksRecommendation={myStocksRecommendation}
          onAnalyzeMyStocks={handleAnalyzeMyStocks}
          currentClickedButton={currentClickedButton}
        />
      </main>
    </div>
  );
}

function Header({
  currentUser,
  onLogout,
  onShowProfile,
}: {
  currentUser: User;
  onLogout: () => void;
  onShowProfile: () => void;
}) {
  return (
    <header className="glass-strong border-b border-white/20 dark:border-gray-700/30 w-full shadow-lg sticky top-0 z-50 animate-slide-down">
      <div
        className={`w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-4 md:py-5`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 w-full">
          <div className="flex items-center space-x-3 w-full md:w-auto justify-center md:justify-start">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg hover-glow transition-all cursor-pointer hover-lift">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Porsa
            </h1>
          </div>
          <div className="flex flex-col md:flex-row items-center md:space-x-4 space-y-1 md:space-y-0 mt-2 md:mt-0 w-full md:w-auto">
            {currentUser && (
              <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-center md:justify-end">
                <div className="text-sm text-muted-foreground truncate max-w-[120px] md:max-w-none">
                  👤 {currentUser.name || currentUser.phone}
                </div>
                <button
                  onClick={onShowProfile}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  Profile
                </button>
                <button
                  onClick={onLogout}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            <div className="text-xs md:text-sm text-muted-foreground text-center md:text-left w-full md:w-auto">
              EGX Portfolio Tracker
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper function to get color classes for each button based on selection
function getButtonColor(
  button: "egx30" | "egx70" | "all" | "myStocks",
  currentClickedButton: "egx30" | "egx70" | "all" | "myStocks" | null
) {
  if (currentClickedButton === button) {
    switch (button) {
      case "egx30":
        return "bg-blue-600 text-white shadow";
      case "egx70":
        return "bg-green-600 text-white shadow";
      case "all":
        return "bg-yellow-500 text-black shadow";
      case "myStocks":
        return "bg-purple-600 text-white shadow";
      default:
        return "bg-primary text-primary-foreground";
    }
  } else {
    switch (button) {
      case "egx30":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "egx70":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "all":
        return "bg-yellow-100 text-yellow-900 hover:bg-yellow-200";
      case "myStocks":
        return "bg-purple-100 text-purple-900 hover:bg-purple-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  }
}

// Stronger UI for AI Recommendations
function AiRecommendationCard({
  recommendations,
}: {
  recommendations: AiRecommendation[] | null;
}) {
  // Defensive: ensure recommendations is an array
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <div className="mt-2 p-4 bg-white border border-blue-100 rounded-lg text-sm text-gray-700 shadow-sm whitespace-pre-line">
        No recommendation received.
      </div>
    );
  }
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="relative bg-gradient-to-br from-blue-50/90 to-purple-50/90 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
        >
          {/* Header with Symbol, Risk Badge, and Sector */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-extrabold text-blue-800 dark:text-blue-300 tracking-wide drop-shadow">
                  {rec.ticker}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${riskColor(
                    rec.risk
                  )}`}
                >
                  {rec.risk?.charAt(0).toUpperCase() + rec.risk?.slice(1)}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {rec.name}
              </p>
              {rec.sector && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  {rec.sector}
                </span>
              )}
            </div>
          </div>

          {/* Key Catalyst */}
          {rec.key_catalyst && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                💡 {rec.key_catalyst}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="mb-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {rec.reason}
            </p>
          </div>

          {/* Price Information Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded-lg p-2">
              <span className="block text-xs text-blue-700 dark:text-blue-300 font-semibold">
                Entry
              </span>
              <span className="block text-sm font-bold text-blue-900 dark:text-blue-200">
                {rec.entry}
              </span>
            </div>
            {rec.target_price && (
              <div className="bg-green-100/50 dark:bg-green-900/30 rounded-lg p-2">
                <span className="block text-xs text-green-700 dark:text-green-300 font-semibold">
                  Target
                </span>
                <span className="block text-sm font-bold text-green-900 dark:text-green-200">
                  {rec.target_price}
                </span>
              </div>
            )}
            {rec.stop_loss && (
              <div className="bg-red-100/50 dark:bg-red-900/30 rounded-lg p-2">
                <span className="block text-xs text-red-700 dark:text-red-300 font-semibold">
                  Stop Loss
                </span>
                <span className="block text-sm font-bold text-red-900 dark:text-red-200">
                  {rec.stop_loss}
                </span>
              </div>
            )}
            {rec.potential_return && (
              <div className="bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg p-2">
                <span className="block text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  Potential
                </span>
                <span className="block text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {rec.potential_return}
                </span>
              </div>
            )}
          </div>

          {/* Footer with Time Horizon and Market Cap */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            {rec.time_horizon && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ⏱️ {rec.time_horizon}
              </span>
            )}
            {rec.market_cap_category && (
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                📊 {rec.market_cap_category} cap
              </span>
            )}
          </div>

          {/* Action Buttons (optional - can add later) */}
          {/* <div className="mt-3 flex gap-2">
            <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
              Quick Add
            </button>
            <button className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition-colors">
              Analyze
            </button>
          </div> */}
        </div>
      ))}
    </div>
  );
}

// Stronger UI for Portfolio Analysis
function MyStocksAnalysisCard({
  advices,
}: {
  advices: MyStockAdvice[] | null;
}) {
  if (!Array.isArray(advices) || advices.length === 0) {
    return (
      <div className="mt-2 p-4 bg-white border border-purple-100 rounded-lg text-sm text-gray-700 shadow-sm whitespace-pre-line">
        No analysis received.
      </div>
    );
  }
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {advices.map((item, idx) => (
        <div
          key={idx}
          className="relative bg-gradient-to-br from-purple-50/90 to-pink-50/90 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
        >
          {/* Header with Symbol, Risk Badge, and Sector */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {item.ticker ? (
                  <span className="text-2xl font-extrabold text-purple-800 dark:text-purple-300 tracking-wide drop-shadow">
                    {item.ticker}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-gray-400">•</span>
                )}
                {item.risk && (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${riskColor(
                      item.risk
                    )}`}
                  >
                    {item.risk?.charAt(0).toUpperCase() + item.risk?.slice(1)}
                  </span>
                )}
              </div>
              {item.name && (
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {item.name}
                </p>
              )}
              {item.sector && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  {item.sector}
                </span>
              )}
              {item.current_price && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Current: <span className="font-semibold">{item.current_price} EGP</span>
                </p>
              )}
            </div>
          </div>

          {/* Key Catalyst */}
          {item.key_catalyst && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                💡 {item.key_catalyst}
              </p>
            </div>
          )}

          {/* Analysis/Advice */}
          <div className="mb-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.advice}
            </p>
          </div>

          {/* Price Information Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {item.entry && (
              <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded-lg p-2">
                <span className="block text-xs text-blue-700 dark:text-blue-300 font-semibold">
                  Add More At
                </span>
                <span className="block text-sm font-bold text-blue-900 dark:text-blue-200">
                  {item.entry}
                </span>
              </div>
            )}
            {item.target_price && (
              <div className="bg-green-100/50 dark:bg-green-900/30 rounded-lg p-2">
                <span className="block text-xs text-green-700 dark:text-green-300 font-semibold">
                  Target
                </span>
                <span className="block text-sm font-bold text-green-900 dark:text-green-200">
                  {item.target_price}
                </span>
              </div>
            )}
            {item.stop_loss && (
              <div className="bg-red-100/50 dark:bg-red-900/30 rounded-lg p-2">
                <span className="block text-xs text-red-700 dark:text-red-300 font-semibold">
                  Stop Loss
                </span>
                <span className="block text-sm font-bold text-red-900 dark:text-red-200">
                  {item.stop_loss}
                </span>
              </div>
            )}
            {item.potential_return && (
              <div className="bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg p-2">
                <span className="block text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  Potential
                </span>
                <span className="block text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {item.potential_return}
                </span>
              </div>
            )}
          </div>

          {/* Footer with Time Horizon and Market Cap */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-800">
            {item.time_horizon && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ⏱️ {item.time_horizon}
              </span>
            )}
            {item.market_cap_category && (
              <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                📊 {item.market_cap_category} cap
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({
  currentUser,
  aiRecommendation,
  aiLoading,
  onAskAi,
  aiType,
  setAiType,
  myStocksLoading,
  myStocksRecommendation,
  onAnalyzeMyStocks,
  currentClickedButton,
}: {
  currentUser: User;
  aiRecommendation: AiRecommendation[] | null;
  aiLoading: boolean;
  onAskAi: (type?: "egx30" | "egx70" | "all") => void;
  aiType: "egx30" | "egx70" | "all";
  setAiType: (type: "egx30" | "egx70" | "all") => void;
  myStocksLoading: boolean;
  myStocksRecommendation: MyStockAdvice[] | null;
  onAnalyzeMyStocks: () => void;
  currentClickedButton: "egx30" | "egx70" | "all" | "myStocks" | null;
}) {
  return (
    <div className="space-y-6 w-full">
      <div className="bg-accent border border-blue-100 rounded-lg shadow-sm p-2 md:p-6 w-full">
        <PortfolioTracker userId={currentUser?.id} />
      </div>
      <div className="bg-accent border border-purple-100 rounded-lg shadow-sm p-2 md:p-6 w-full">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setAiType("egx30");
                onAskAi("egx30");
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonColor(
                "egx30",
                currentClickedButton
              )} disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={aiLoading}
              data-selected={
                currentClickedButton === "egx30" ? "true" : undefined
              }
            >
              {aiLoading && currentClickedButton === "egx30" ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-blue-400" />
                  Getting EGX30...
                </span>
              ) : (
                "Ask AI for EGX30"
              )}
            </button>
            <button
              onClick={() => {
                setAiType("egx70");
                onAskAi("egx70");
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonColor(
                "egx70",
                currentClickedButton
              )} disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={aiLoading}
              data-selected={
                currentClickedButton === "egx70" ? "true" : undefined
              }
            >
              {aiLoading && currentClickedButton === "egx70" ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-green-400" />
                  Getting EGX70...
                </span>
              ) : (
                "Ask AI for EGX70"
              )}
            </button>
            <button
              onClick={() => {
                setAiType("all");
                onAskAi("all");
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonColor(
                "all",
                currentClickedButton
              )} disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={aiLoading}
              data-selected={
                currentClickedButton === "all" ? "true" : undefined
              }
            >
              {aiLoading && currentClickedButton === "all" ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-yellow-400" />
                  Getting All Stocks...
                </span>
              ) : (
                "Ask AI for All EGX Stocks"
              )}
            </button>
            {/* New button for analyzing user's own stocks */}
            <button
              onClick={onAnalyzeMyStocks}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${getButtonColor(
                "myStocks",
                currentClickedButton
              )} disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={myStocksLoading}
              data-selected={
                currentClickedButton === "myStocks" ? "true" : undefined
              }
            >
              {myStocksLoading && currentClickedButton === "myStocks" ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-purple-400" />
                  Analyzing My Portfolio...
                </span>
              ) : (
                "Analyze My Stocks"
              )}
            </button>
          </div>
          {aiRecommendation && (
            <>
              <div className="mt-6 mb-2 text-lg font-bold text-blue-900">
                AI Analysis for{" "}
                {aiType === "egx30"
                  ? "EGX30"
                  : aiType === "egx70"
                    ? "EGX70"
                    : "All EGX Stocks"}
              </div>
              <AiRecommendationCard recommendations={aiRecommendation} />
            </>
          )}
          {myStocksRecommendation && (
            <>
              <div className="mt-6 mb-2 text-lg font-bold text-purple-900">
                AI Analysis for My Portfolio
              </div>
              <MyStocksAnalysisCard advices={myStocksRecommendation} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-primary-foreground font-bold text-xl sm:text-2xl">P</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}
