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
      
      // Validate response structure
      if (!data) {
        setPortfolio([]);
        setAlerts([]);
        setHistory([]);
        return;
      }
      
      // Handle legacy (array) vs new (object) structure
      if (Array.isArray(data)) {
        setPortfolio(data);
        setAlerts([]);
        setHistory([]);
      } else if (typeof data === 'object') {
        setPortfolio(Array.isArray(data.stocks) ? data.stocks : []);
        setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
        setHistory(Array.isArray(data.history) ? data.history : []);
      } else {
        setPortfolio([]);
        setAlerts([]);
        setHistory([]);
      }
    } catch (err) {
      console.error("Error loading portfolio:", err);
      setError(err.message);
      // Set default empty values on error
      setPortfolio([]);
      setAlerts([]);
      setHistory([]);
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
  const trackHistory = useCallback(async (currentStocks, currentAlerts, currentHistory) => {
      if (!currentStocks || currentStocks.length === 0) return;
      
      const totalValue = currentStocks.reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
      const today = new Date().toISOString().split('T')[0];
      
      // Use passed history instead of closure
      const lastEntry = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;
      
      let newHistory = [...currentHistory];
      if (lastEntry && lastEntry.date === today) {
          // Update today's entry (maybe the price changed during the day)
          newHistory[newHistory.length - 1] = { date: today, value: totalValue };
      } else {
          // Add new entry
          newHistory.push({ date: today, value: totalValue });
      }
      
      // Limit history to last 90 days to save space
      if (newHistory.length > 90) {
          newHistory = newHistory.slice(newHistory.length - 90);
      }
      
      setHistory(newHistory);
      // Pass all current data to save function
      await savePortfolioData(currentStocks, currentAlerts, newHistory);
  }, [savePortfolioData]);

  // Update portfolio and save
  const updatePortfolio = useCallback(
    async (newPortfolio) => {
      setPortfolio(newPortfolio);
      // Use functional update to ensure we have current state
      setAlerts(currentAlerts => currentAlerts);
      setHistory(currentHistory => currentHistory);
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
      // Ensure all required fields are present
      const completeStock = {
        id: `${stockData.symbol}-${Date.now()}`, // Generate unique ID
        symbol: stockData.symbol,
        quantity: parseFloat(stockData.quantity) || 0,
        buyPrice: parseFloat(stockData.buyPrice) || 0,
        currentPrice: parseFloat(stockData.buyPrice) || 0, // Initialize with buy price
        purchaseDate: stockData.purchaseDate || new Date().toISOString().split('T')[0],
        notes: stockData.notes || '',
        investmentType: stockData.investmentType || 'long-term', // Add investment type
      };
      
      // Calculate profit fields
      completeStock.profit = (completeStock.currentPrice * completeStock.quantity) - (completeStock.buyPrice * completeStock.quantity);
      completeStock.profitPercent = completeStock.buyPrice > 0 ? (completeStock.profit / (completeStock.buyPrice * completeStock.quantity)) * 100 : 0;
      
      const newPortfolio = [...portfolio, completeStock];
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
      // Track history with current state values
      try {
        await trackHistory(updatedStocks, alerts, history);
      } catch (e) {
        console.error("Failed to track history", e);
      }
    },
    [updatePortfolio, trackHistory, alerts, history]
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

