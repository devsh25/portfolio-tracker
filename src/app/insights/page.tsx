"use client";

import { useEffect, useState, useCallback } from "react";
import holdingsData from "../../../data/holdings.json";
import { buildPortfolio } from "@/lib/calculations";
import {
  getAssetAllocation, getEntityTotals, getConcentrationRisk,
  getCurrencyExposure, getCryptoVsTraditional, getIdleCashAnalysis,
  getCountryExposure, getRealEstateCAD,
} from "@/lib/insights";
import type { HoldingsData, PriceData, OwnerSummary, ChartSlice, EntityTotal, CountryTotal, WhatIfScenario } from "@/lib/types";
import Navigation from "@/components/Navigation";
import AssetAllocation from "@/components/insights/AssetAllocation";
import OwnerComparison from "@/components/insights/OwnerComparison";
import ConcentrationRisk from "@/components/insights/ConcentrationRisk";
import CurrencyExposure from "@/components/insights/CurrencyExposure";
import CryptoVsTraditional from "@/components/insights/CryptoVsTraditional";
import IdleCashAnalysis from "@/components/insights/IdleCashAnalysis";
import NetWorthTrend from "@/components/insights/NetWorthTrend";
import CountryExposureChart from "@/components/insights/CountryExposure";

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState<ChartSlice[]>([]);
  const [entities, setEntities] = useState<EntityTotal[]>([]);
  const [concentration, setConcentration] = useState<ChartSlice[]>([]);
  const [currency, setCurrency] = useState<ChartSlice[]>([]);
  const [cryptoVsTrad, setCryptoVsTrad] = useState<{ current: { cryptoCAD: number; traditionalCAD: number; cryptoPct: number }; scenarios: WhatIfScenario[] } | null>(null);
  const [idleCash, setIdleCash] = useState<{ totalCashCAD: number; projections: { years: number; at7pct: number; at10pct: number; at12pct: number }[] } | null>(null);
  const [countryData, setCountryData] = useState<CountryTotal[]>([]);
  const [totalCAD, setTotalCAD] = useState(0);
  const [totalUSD, setTotalUSD] = useState(0);

  const fetchAndCalculate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/prices");
      const data = await res.json();
      const prices: PriceData = data.prices;
      const fxRate = prices["CAD=X"]?.price || 1.373;
      const inrRate = prices["CADINR=X"]?.price || 61.5; // INR per 1 CAD

      const holdings = holdingsData as unknown as HoldingsData;
      const summaries = buildPortfolio(holdings, prices, fxRate);

      const realEstateCAD = getRealEstateCAD(holdings, fxRate, inrRate);
      const portfolioCAD = summaries.reduce((s, o) => s + o.totalCAD, 0);
      const grandCAD = portfolioCAD + realEstateCAD;
      const grandUSD = grandCAD / fxRate;

      setTotalCAD(grandCAD);
      setTotalUSD(grandUSD);
      setAllocation(getAssetAllocation(summaries, holdings, fxRate, inrRate));
      setEntities(getEntityTotals(summaries, holdings, fxRate, inrRate));
      setConcentration(getConcentrationRisk(summaries, holdings, fxRate, inrRate));
      setCurrency(getCurrencyExposure(summaries, holdings, fxRate, inrRate));
      setCryptoVsTrad(getCryptoVsTraditional(summaries, holdings, fxRate, inrRate));
      setIdleCash(getIdleCashAnalysis(summaries));
      setCountryData(getCountryExposure(summaries, holdings, fxRate, inrRate));
    } catch (e) {
      console.error("Failed to load insights:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndCalculate();
  }, [fetchAndCalculate]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full mb-4" />
            <p>Loading insights...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Insights</h1>
            <p className="text-sm text-gray-500">Analysis including real estate &middot; {holdingsData.lastUpdated}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetAllocation data={allocation} />
            <ConcentrationRisk data={concentration} />
          </div>

          <OwnerComparison data={entities} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrencyExposure data={currency} />
            <CountryExposureChart data={countryData} />
          </div>

          {cryptoVsTrad && (
            <CryptoVsTraditional current={cryptoVsTrad.current} scenarios={cryptoVsTrad.scenarios} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {idleCash && (
              <IdleCashAnalysis totalCashCAD={idleCash.totalCashCAD} projections={idleCash.projections} />
            )}
            <NetWorthTrend currentCAD={totalCAD} currentUSD={totalUSD} />
          </div>
        </div>
      </main>
    </>
  );
}
