"use client";

import PortfolioTracker from "./components/PortfolioTracker";
import LoginForm from "./components/LoginForm";
import ResetPasswordForm from "./components/ResetPasswordForm";
import { useState, useEffect } from "react";
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
  reason: string;
  entry: string;
  exit: string;
  risk: string;
};
type MyStockAdvice = {
  ticker: string | null;
  advice: string;
  exit?: string | null; // Added exit point (optional for backward compatibility)
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

export default function Home() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token");
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

From this data, pick the top 3 stocks for short-term investment today.

For each stock, return a JSON object with these fields:
- ticker (string)
- name (string)
- reason (string, 1–2 sentences why it's promising today)
- entry (string, entry price range)
- exit (string, exit price range)
- risk (string: low, medium, or high)

Return a JSON array of exactly 3 objects, no explanation, no markdown, just the array.
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

      // Stronger prompt: ask for JSON array of objects
      const prompt = `
You are an Egyptian stock market analyst.
Here is today's EGX market data: ${JSON.stringify(allEgxStocks)}
My EGX portfolio: ${JSON.stringify(userStocks)}

For each stock in my portfolio, if there is a profit, return a JSON object:
- ticker (string)
- advice (string, concise and practical, when to consider selling to realize profit)
- exit (string, recommended exit price or price range for selling to realize profit)

Return a JSON array of such objects, no explanation, no markdown, just the array.
If no advice, return an empty array.
Not financial advice.
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
        <div className="text-center w-full max-w-xs mx-auto">
          <div className="w-12 h-12 sm:w-8 sm:h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-lg sm:text-sm">P</span>
          </div>
          <p className="text-muted-foreground text-base sm:text-sm animate-pulse">
            Loading...
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-2">
        <div className="w-full max-w-sm">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-40% to-55% flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} />
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
}: {
  currentUser: User;
  onLogout: () => void;
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60 w-full shadow-md">
      <div
        className={`w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-3 md:py-4`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 w-full">
          <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-blue-900">
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
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {recommendations.map((rec, idx) => (
        <div
          key={idx}
          className="relative bg-gradient-to-br from-blue-100/80 to-white border-2 border-blue-300 rounded-2xl p-6 shadow-lg hover:scale-[1.025] transition-transform group"
        >
          <div className="absolute top-2 right-2">
            <span
              className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${riskColor(
                rec.risk
              )}`}
            >
              {rec.risk?.charAt(0).toUpperCase() + rec.risk?.slice(1)} Risk
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-extrabold text-blue-800 tracking-wide drop-shadow">
              {rec.ticker}
            </span>
            <span className="text-lg font-semibold text-gray-700">
              {rec.name}
            </span>
          </div>
          <div className="mb-2 text-base text-gray-700 font-medium">
            <span className="text-blue-700">Reason:</span>{" "}
            <span className="font-normal">{rec.reason}</span>
          </div>
          <div className="flex flex-row gap-2 mb-2">
            <div className="flex-1">
              <span className="block text-xs text-blue-700 font-semibold">
                Entry
              </span>
              <span className="block bg-blue-200/80 text-blue-900 px-2 py-1 rounded-lg font-mono text-sm shadow-inner">
                {rec.entry}
              </span>
            </div>
            <div className="flex-1">
              <span className="block text-xs text-purple-700 font-semibold">
                Exit
              </span>
              <span className="block bg-purple-200/80 text-purple-900 px-2 py-1 rounded-lg font-mono text-sm shadow-inner">
                {rec.exit}
              </span>
            </div>
          </div>
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
    <div className="mt-4 grid gap-3">
      {advices.map((item, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 bg-gradient-to-br from-purple-100/80 to-white border-2 border-purple-300 rounded-xl p-4 shadow group"
        >
          {item.ticker ? (
            <span className="font-bold text-purple-700 text-lg min-w-[60px] tracking-wide">
              {item.ticker}
            </span>
          ) : (
            <span className="font-bold text-gray-400 min-w-[60px]">•</span>
          )}
          <div className="flex flex-col">
            <span className="text-gray-800 text-base">{item.advice}</span>
            {item.exit && (
              <span className="text-xs text-purple-700 mt-1">
                <span className="font-semibold">Exit Point:</span>{" "}
                <span className="bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded font-mono shadow-inner">
                  {item.exit}
                </span>
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
                  <span className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></span>
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
                  <span className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></span>
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
                  <span className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></span>
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
                  <span className="animate-spin w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full"></span>
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
