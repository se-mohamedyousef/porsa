import { useState, useEffect, useCallback } from "react";

export function usePortfolio() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load portfolio data from API
  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio");
      if (!response.ok) {
        throw new Error("Failed to load portfolio data");
      }
      const data = await response.json();
      setStocks(data);
    } catch (err) {
      console.error("Error loading portfolio:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save portfolio data to API
  const savePortfolio = useCallback(async (portfolioData) => {
    try {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(portfolioData),
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
  }, []);

  // Update stocks and save to API
  const updateStocks = useCallback(
    async (newStocks) => {
      setStocks(newStocks);
      await savePortfolio(newStocks);
    },
    [savePortfolio]
  );

  // Add a stock
  const addStock = useCallback(
    async (stockData) => {
      const newStocks = [...stocks, stockData];
      await updateStocks(newStocks);
    },
    [stocks, updateStocks]
  );

  // Remove a stock
  const removeStock = useCallback(
    async (id) => {
      const newStocks = stocks.filter((stock) => stock.id !== id);
      await updateStocks(newStocks);
    },
    [stocks, updateStocks]
  );

  // Update stock prices
  const updateStockPrices = useCallback(
    async (updatedStocks) => {
      await updateStocks(updatedStocks);
    },
    [updateStocks]
  );

  // Load data on mount
  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  return {
    stocks,
    loading,
    error,
    addStock,
    removeStock,
    updateStockPrices,
    refreshPortfolio: loadPortfolio,
  };
}
