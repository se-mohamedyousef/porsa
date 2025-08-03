"use client";

import { useEffect } from "react";

export default function KeyboardShortcuts({
  onAddStock,
  onRefreshPrices,
  onSwitchTab,
  activeTab,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Enter to add stock
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        onAddStock?.();
      }

      // Ctrl/Cmd + R to refresh prices
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        onRefreshPrices?.();
      }

      // Ctrl/Cmd + 1 to switch to portfolio tab
      if ((event.ctrlKey || event.metaKey) && event.key === "1") {
        event.preventDefault();
        onSwitchTab?.("portfolio");
      }

      // Ctrl/Cmd + 2 to switch to calculator tab
      if ((event.ctrlKey || event.metaKey) && event.key === "2") {
        event.preventDefault();
        onSwitchTab?.("calculator");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onAddStock, onRefreshPrices, onSwitchTab]);

  return null; // This component doesn't render anything
}
