import { useState, useEffect, useCallback } from "react";

export function useUserData(userId) {
  const [portfolio, setPortfolio] = useState([]);
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
      setPortfolio(data);
    } catch (err) {
      console.error("Error loading portfolio:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save user's portfolio data
  const savePortfolio = useCallback(
    async (portfolioData) => {
      if (!userId) return false;

      try {
        const response = await fetch("/api/portfolio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, portfolio: portfolioData }),
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

  // Update portfolio and save
  const updatePortfolio = useCallback(
    async (newPortfolio) => {
      setPortfolio(newPortfolio);
      await savePortfolio(newPortfolio);
    },
    [savePortfolio]
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
    },
    [updatePortfolio]
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
  };
}
