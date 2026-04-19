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
import { formatCAD, formatUSD } from "@/lib/calculations";
import Navigation from "@/components/Navigation";
import AssetAllocation from "@/components/insights/AssetAllocation";
import OwnerComparison from "@/components/insights/OwnerComparison";
import ConcentrationRisk from "@/components/insights/ConcentrationRisk";
import CurrencyExposure from "@/components/insights/CurrencyExposure";
import CryptoVsTraditional from "@/components/insights/CryptoVsTraditional";
import IdleCashAnalysis from "@/components/insights/IdleCashAnalysis";
import NetWorthTrend from "@/components/insights/NetWorthTrend";
import LiquidGrowth from "@/components/insights/LiquidGrowth";
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
  const [investableCAD, setInvestableCAD] = useState(0);
  const [investableUSD, setInvestableUSD] = useState(0);
  const [realEstateCAD, setRealEstateCAD] = useState(0);

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
      setInvestableCAD(portfolioCAD);
      setInvestableUSD(portfolioCAD / fxRate);
      setRealEstateCAD(realEstateCAD);
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
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-center text-neutral-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-neutral-800 border-t-white rounded-full mb-4" />
            <p>Loading insights...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-neutral-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Insights</h1>
            <p className="text-sm text-neutral-400">Analysis including real estate &middot; {holdingsData.lastUpdated}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border-l-4 border-cyan-400 border-t border-r border-b border-neutral-800 bg-neutral-900 p-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-widest">Liquid Portfolio</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 font-medium">ex-Real Estate</span>
              </div>
              <div className="text-3xl font-bold text-cyan-400 mt-2 tabular-nums">{formatCAD(investableCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
              <div className="text-sm text-neutral-400 mt-0.5 tabular-nums">{formatUSD(investableUSD)} USD</div>
              <div className="text-[11px] text-neutral-400 mt-2">Stocks, ETFs, crypto, cash</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
                Grand Total <span className="text-[10px] font-normal normal-case text-neutral-400">· incl. real estate</span>
              </div>
              <div className="text-3xl font-bold text-white mt-2 tabular-nums">{formatCAD(totalCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
              <div className="text-sm text-neutral-400 mt-0.5 tabular-nums">{formatUSD(totalUSD)} USD</div>
              <div className="text-[11px] text-neutral-400 mt-2">Real estate: {formatCAD(realEstateCAD)} CAD</div>
            </div>
          </div>

          <LiquidGrowth />

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
