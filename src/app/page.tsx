"use client";

import { useEffect, useState, useCallback } from "react";
import holdingsData from "../../data/holdings.json";
import { buildPortfolio, buildCategories } from "@/lib/calculations";
import { getEntityTotals, getRealEstateCAD } from "@/lib/insights";
import type { HoldingsData, PriceData, OwnerSummary, CategorySummary, EntityTotal } from "@/lib/types";
import SummaryCards from "@/components/SummaryCards";
import PortfolioTable from "@/components/PortfolioTable";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import Navigation from "@/components/Navigation";

export default function Home() {
  const [summaries, setSummaries] = useState<OwnerSummary[]>([]);
  const [entities, setEntities] = useState<EntityTotal[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [realEstateCAD, setRealEstateCAD] = useState(0);
  const [fxRate, setFxRate] = useState(1.373);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/prices");
      const data = await res.json();
      const prices: PriceData = data.prices;

      const fx = prices["CAD=X"]?.price || 1.373;
      const inr = prices["CADINR=X"]?.price || 61.5;
      setFxRate(fx);

      const holdings = holdingsData as unknown as HoldingsData;
      const sums = buildPortfolio(holdings, prices, fx);
      const cats = buildCategories(sums);
      const ents = getEntityTotals(sums, holdings, fx, inr);
      const reCAD = getRealEstateCAD(holdings, fx, inr);

      setSummaries(sums);
      setEntities(ents);
      setCategories(cats);
      setRealEstateCAD(reCAD);
      setLastRefresh(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError("Failed to fetch prices. Retrying...");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const grandUSD = entities.reduce((s, e) => s + e.totalUSD, 0);
  const grandCAD = entities.reduce((s, e) => s + e.totalCAD, 0);
  const investableCAD = grandCAD - realEstateCAD;
  const investableUSD = investableCAD / fxRate;

  return (
    <>
    <Navigation />
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Tracker</h1>
            <p className="text-sm text-gray-500">
              Holdings as of {holdingsData.lastUpdated} &middot; CAD/USD: {fxRate.toFixed(4)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-gray-400">Last refresh: {lastRefresh}</span>
            )}
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Refreshing..." : "Refresh Prices"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {loading && summaries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full mb-4"></div>
            <p>Fetching live prices...</p>
          </div>
        ) : (
          <>
            <SummaryCards
              entities={entities}
              grandUSD={grandUSD}
              grandCAD={grandCAD}
              investableUSD={investableUSD}
              investableCAD={investableCAD}
            />
            {summaries.map((s) => (
              <PortfolioTable key={s.owner} summary={s} />
            ))}
            <CategoryBreakdown
              categories={categories}
              grandUSD={grandUSD}
              grandCAD={grandCAD}
            />
          </>
        )}
      </div>
    </main>
    </>
  );
}
