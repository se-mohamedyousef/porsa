"use client";

import PortfolioTracker from "./components/PortfolioTracker";
import LoginForm from "./components/LoginForm";
import { useState, useEffect } from "react";

// Responsive container max width for desktop, tablet, and mobile
const CONTAINER_MAX_WIDTH = "max-w-7xl"; // wider for desktop

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState<"egx30" | "egx70" | "all">("egx30");
  const [myStocksLoading, setMyStocksLoading] = useState(false);
  const [myStocksRecommendation, setMyStocksRecommendation] = useState<
    string | null
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

  const handleLogin = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("porsaCurrentUser");
  };

  async function handleAsk(type: "egx30" | "egx70" | "all" = aiType) {
    setAiLoading(true);
    setAiRecommendation(null);

    try {
      // EGX30: country-id=59, EGX70: country-id=59&index-id=EGX70, All: country-id=59
      let url =
        "https://api.investing.com/api/financialdata/assets/equitiesByCountry/default?country-id=59&fields-list=id,name,symbol,last";
      let promptIndex = "EGX30";
      if (type === "egx70") {
        // There is no direct index filter in the sample API, so we will filter by symbol later
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

      const prompt = `
      You are a professional Egyptian stock market analyst specializing in the ${promptIndex}.
      Here is today’s market data for ${promptIndex} companies:
      
      ${JSON.stringify(egxData)}
      
      From this data, pick the **top 3 stocks** for short-term investment today.
      
      For each stock, give in **1–2 short sentences**:
      - Ticker & company name
      - Main reason it’s promising today
      - Entry & exit price ranges
      - Risk level (low, medium, high)
      
      Keep it concise and easy to scan.  
      Educational purposes only — not financial advice.
      `;

      const res = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
        }),
      });
      const data = await res.json();
      setAiRecommendation(data?.text || "No recommendation received.");
    } catch (err) {
      setAiRecommendation("Failed to fetch recommendation.");
    } finally {
      setAiLoading(false);
    }
  }

  // New: Analyze my stocks button handler
  async function handleAnalyzeMyStocks() {
    console.log("🚀 ~ handleAnalyzeMyStocks ~ currentUser:", currentUser);
    if (!currentUser?.id) return;
    setMyStocksLoading(true);
    setMyStocksRecommendation(null);

    try {
      // Fetch user's stocks from backend API (assuming /api/portfolio?userId=...)
      const res = await fetch(`/api/portfolio?userId=${currentUser?.id}`);
      if (!res.ok) throw new Error("Failed to fetch your portfolio.");
      const userStocks = await res.json();

      if (
        !userStocks ||
        !Array.isArray(userStocks) ||
        userStocks.length === 0
      ) {
        setMyStocksRecommendation("No stocks found in your portfolio.");
        return;
      }

      // Fetch all EGX stocks data to provide to the AI for better analysis
      const egxRes = await fetch(
        "https://api.investing.com/api/financialdata/assets/equitiesByCountry/default?country-id=59&fields-list=id,name,symbol,last"
      );
      const egxDataJson = await egxRes.json();
      const allEgxStocks = egxDataJson.data;

      const prompt = `
      You are an Egyptian stock market analyst.
      Here is today's EGX market data: ${JSON.stringify(allEgxStocks)}
      My EGX portfolio: ${JSON.stringify(userStocks)}

      For each stock in my portfolio, if there is a profit, briefly say when I could consider selling to realize the profit, using the latest market data above. 
      Keep it concise and practical. Not financial advice.
      `;

      const aiRes = await fetch("/api/askAi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const aiData = await aiRes.json();
      setMyStocksRecommendation(aiData?.text || "No analysis received.");
    } catch (err) {
      setMyStocksRecommendation("Failed to analyze your portfolio.");
    } finally {
      setMyStocksLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center w-full max-w-xs mx-auto">
          <div className="w-12 h-12 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg sm:text-sm">
              P
            </span>
          </div>
          <p className="text-muted-foreground text-base sm:text-sm">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-2">
        <div className="w-full max-w-sm">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
        />
      </main>
    </div>
  );
}

function Header({
  currentUser,
  onLogout,
}: {
  currentUser: any;
  onLogout: () => void;
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60 w-full">
      <div
        className={`w-full ${CONTAINER_MAX_WIDTH} mx-auto px-2 md:px-6 lg:px-8 py-3 md:py-4`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 w-full">
          <div className="flex items-center space-x-2 w-full md:w-auto justify-center md:justify-start">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                P
              </span>
            </div>
            <h1 className="text-lg md:text-2xl font-bold">Porsa</h1>
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
}: {
  currentUser: any;
  aiRecommendation: string | null;
  aiLoading: boolean;
  onAskAi: (type?: "egx30" | "egx70" | "all") => void;
  aiType: "egx30" | "egx70" | "all";
  setAiType: (type: "egx30" | "egx70" | "all") => void;
  myStocksLoading: boolean;
  myStocksRecommendation: string | null;
  onAnalyzeMyStocks: () => void;
}) {
  return (
    <div className="space-y-4 md:space-y-6 w-full">
      <div className="bg-background border rounded-lg shadow-sm p-2 md:p-6 w-full">
        <PortfolioTracker userId={currentUser?.id} />
      </div>
      <div className="bg-background border rounded-lg shadow-sm p-2 md:p-6 w-full">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setAiType("egx30");
                onAskAi("egx30");
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                aiType === "egx30"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={aiLoading}
            >
              {aiLoading && aiType === "egx30"
                ? "Getting EGX30 Recommendation..."
                : "Ask AI for EGX30"}
            </button>
            <button
              onClick={() => {
                setAiType("egx70");
                onAskAi("egx70");
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                aiType === "egx70"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={aiLoading}
            >
              {aiLoading && aiType === "egx70"
                ? "Getting EGX70 Recommendation..."
                : "Ask AI for EGX70"}
            </button>
            <button
              onClick={() => {
                setAiType("all");
                onAskAi("all");
              }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                aiType === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={aiLoading}
            >
              {aiLoading && aiType === "all"
                ? "Getting All Stocks Recommendation..."
                : "Ask AI for All EGX Stocks"}
            </button>
            {/* New button for analyzing user's own stocks */}
            <button
              onClick={onAnalyzeMyStocks}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors bg-accent text-accent-foreground hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={myStocksLoading}
            >
              {myStocksLoading
                ? "Analyzing My Portfolio..."
                : "Analyze My Stocks"}
            </button>
          </div>
          {aiRecommendation && (
            <div className="mt-2 p-3 bg-muted rounded text-sm text-muted-foreground whitespace-pre-line">
              {aiRecommendation}
            </div>
          )}
          {myStocksRecommendation && (
            <div className="mt-2 p-3 bg-muted rounded text-sm text-muted-foreground whitespace-pre-line">
              {myStocksRecommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
