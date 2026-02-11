import { useState, useEffect, useCallback } from "react";

export function useUserData(userId) {
  const [portfolio, setPortfolio] = useState([]);
  const [alerts, setAlerts] = useState([]); 
  const [history, setHistory] = useState([]); // New state for history
  const [userProfile, setUserProfile] = useState({
    name: "",
    phoneNumber: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's portfolio data
  const loadPortfolio = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolio?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to load portfolio data");
      }
      const data = await response.json();
      
      // Handle legacy (array) vs new (object) structure
      if (Array.isArray(data)) {
        setPortfolio(data);
        setAlerts([]);
        setHistory([]);
      } else {
        setPortfolio(data.stocks || []);
        setAlerts(data.alerts || []);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error loading portfolio:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load user's profile data
  const loadUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, [userId]);

  // Save user's profile data
  const saveUserProfile = useCallback(
    async (profileData) => {
      if (!userId) return false;

      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, profile: profileData }),
        });

        if (response.ok) {
          setUserProfile(profileData);
          return true;
        } else {
          const error = await response.json();
          console.error("Error saving user profile:", error);
          return false;
        }
      } catch (error) {
        console.error("Error saving user profile:", error);
        return false;
      }
    },
    [userId]
  );

  // Save user's portfolio data (stocks + alerts + history)
  const savePortfolioData = useCallback(
    async (stocks, currentAlerts, currentHistory) => {
      if (!userId) return false;

      try {
        const payload = {
          stocks: stocks,
          alerts: currentAlerts,
          history: currentHistory
        };

        const response = await fetch("/api/portfolio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, portfolio: payload }),
        });

        if (!response.ok) {
          throw new Error("Failed to save portfolio data");
        }

        return true;
      } catch (err) {
        console.error("Error saving portfolio:", err);
        setError(err.message);
        return false;
      }
    },
    [userId]
  );
  
  // Update history logic - Call this when prices are refreshed (e.g. once a day effectively)
  // We will check if we already have an entry for today. If not, add it.
  const trackHistory = useCallback(async (currentStocks) => {
      if (!currentStocks || currentStocks.length === 0) return;
      
      const totalValue = currentStocks.reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have an entry for today
      // We use the state 'history' here. 
      // NOTE: 'history' might be stale in this closure if not careful, but since we pass it to savePortfolioData...
      // Ideally we would use functional update but we need to save to DB.
      
      // Let's use the history from state. 
      const lastEntry = history.length > 0 ? history[history.length - 1] : null;
      
      let newHistory = [...history];
      if (lastEntry && lastEntry.date === today) {
          // Update today's entry (maybe the price changed during the day)
          newHistory[newHistory.length - 1] = { date: today, value: totalValue };
      } else {
          // Add new entry
          newHistory.push({ date: today, value: totalValue });
      }
      
      // Limit history to last 30 days to save space if needed, or keep it growing. 
      // Let's keep last 90 days.
      if (newHistory.length > 90) {
          newHistory = newHistory.slice(newHistory.length - 90);
      }
      
      setHistory(newHistory);
      // We don't await this save to avoid blocking UI, or we can.
      // We need to pass the current stocks and alerts too.
      await savePortfolioData(currentStocks, alerts, newHistory);
  }, [history, alerts, savePortfolioData]);

  // Update portfolio and save
  const updatePortfolio = useCallback(
    async (newPortfolio) => {
      setPortfolio(newPortfolio);
      await savePortfolioData(newPortfolio, alerts, history);
    },
    [savePortfolioData, alerts, history]
  );
  
  // Update alerts and save
  const updateAlerts = useCallback(
    async (newAlerts) => {
      setAlerts(newAlerts);
      await savePortfolioData(portfolio, newAlerts, history);
    },
    [savePortfolioData, portfolio, history]
  );

  // Add stock to portfolio
  const addStock = useCallback(
    async (stockData) => {
      const newPortfolio = [...portfolio, stockData];
      await updatePortfolio(newPortfolio);
    },
    [portfolio, updatePortfolio]
  );
  
  // Remove stock from portfolio
  const removeStock = useCallback(
    async (id) => {
      const newPortfolio = portfolio.filter((stock) => stock.id !== id);
      await updatePortfolio(newPortfolio);
    },
    [portfolio, updatePortfolio]
  );

  // Update stock prices
  const updateStockPrices = useCallback(
    async (updatedStocks) => {
      await updatePortfolio(updatedStocks);
      // Also track history when prices update
      // We wrap this so it doesn't fail the whole operation if history tracking fails
      try {
        await trackHistory(updatedStocks);
      } catch (e) {
        console.error("Failed to track history", e);
      }
    },
    [updatePortfolio, trackHistory]
  );

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadPortfolio();
      loadUserProfile();
    }
  }, [userId, loadPortfolio, loadUserProfile]);

  return {
    portfolio,
    userProfile,
    loading,
    error,
    addStock,
    removeStock,
    updateStockPrices,
    saveUserProfile,
    refreshPortfolio: loadPortfolio,
    alerts,
    history,
    addAlert: async (alert) => {
      const newAlerts = [...alerts, alert];
      await updateAlerts(newAlerts);
    },
    removeAlert: async (id) => {
      const newAlerts = alerts.filter(a => a.id !== id);
      await updateAlerts(newAlerts);
    }
  };
}

