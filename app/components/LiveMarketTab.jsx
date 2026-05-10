"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Activity,
} from "lucide-react";
import { useLanguageSimple } from "../hooks/useLanguageSimple";
import LoadingSpinner from "./LoadingSpinner";

function formatVol(v) {
  if (v == null || v === "N/A") return "—";
  if (typeof v === "number" && v > 0) {
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return String(Math.round(v));
  }
  return String(v);
}

/** Map API row → StockDetailsModal shape */
export function liveMarketRowToDetailStock(s) {
  return {
    symbol: s.symbol,
    name: s.name || s.symbol,
    currentPrice: s.price,
    sector: s.sector || "Unknown",
    profitPercent: s.change ?? 0,
    marketCap: s.market_cap,
    index_membership: s.index_membership,
  };
}

export default function LiveMarketTab({ onViewStock, onAddFromMarket }) {
  const { t } = useLanguageSimple();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/egx-stocks");
      const j = await r.json();
      if (!r.ok || !j.success) {
        throw new Error(j.error || j.message || "Request failed");
      }
      setItems(Array.isArray(j.stocks) ? j.stocks : []);
      setUpdatedAt(j.timestamp || new Date().toISOString());
    } catch (e) {
      setError(e.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) =>
        s.symbol?.toLowerCase().includes(q) ||
        (s.name && String(s.name).toLowerCase().includes(q))
    );
  }, [items, query]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (b.change ?? 0) - (a.change ?? 0)),
    [filtered]
  );

  if (loading && items.length === 0) {
    return (
      <div className="pb-28 pt-8 flex flex-col items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-semibold">
          {t("liveMarketLoading")}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-28 px-3 sm:px-4 space-y-3">
      <div className="pt-2 sm:pt-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-600 shrink-0" />
            {t("liveMarket")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold mt-1">
            {t("liveMarketSubtitle")}
          </p>
          {updatedAt && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-mono">
              {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 disabled:opacity-50 transition-all"
          aria-label={t("refresh")}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchLiveStocks")}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm font-semibold placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
        {sorted.length} {t("symbolsCount")}
        {error && (
          <span className="text-red-500 dark:text-red-400 ml-2 block sm:inline mt-1 sm:mt-0">
            · {t("connectionError")}: {error}
          </span>
        )}
      </p>

      {error && (
        <button
          type="button"
          onClick={() => load()}
          className="mt-3 w-full py-3 rounded-xl bg-gray-200 dark:bg-slate-700 font-bold text-sm text-gray-800 dark:text-gray-200"
        >
          {t("retry")}
        </button>
      )}

      {sorted.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 font-semibold">
          {error ? `${t("connectionError")}. ${t("retry")}.` : t("noStocks")}
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pb-4">
          {sorted.map((s) => {
            const up = (s.change ?? 0) >= 0;
            const yahoo = s.yahoo_status === "ok";
            return (
              <div
                key={s.symbol}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-lg text-gray-900 dark:text-white">
                      {s.symbol}
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        yahoo
                          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200"
                          : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {yahoo ? t("yahooEnriched") : t("yahooSnapshot")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                    {s.name || "—"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t("sector")}: {s.sector || "—"} · {t("volumeTraded")}:{" "}
                    {formatVol(s.volume)}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-right">
                    <p className="font-black text-xl text-gray-900 dark:text-white">
                      {Number(s.price).toFixed(2)}{" "}
                      <span className="text-sm font-bold text-gray-500">EGP</span>
                    </p>
                    <p
                      className={`text-sm font-black flex items-center justify-end gap-1 ${
                        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {up ? "+" : ""}
                      {(s.change ?? 0).toFixed(2)}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onViewStock?.(liveMarketRowToDetailStock(s))}
                      className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-all"
                      aria-label={t("viewDetails")}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAddFromMarket?.({
                          symbol: s.symbol,
                          name: s.name || s.symbol,
                          currentPrice: s.price,
                        })
                      }
                      className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-all"
                      aria-label={t("addStock")}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
