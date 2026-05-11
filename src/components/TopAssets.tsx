"use client";

import { useEffect, useState } from "react";
import { formatUSD, formatCAD, formatPrice } from "@/lib/calculations";
import type { HoldingsData, OwnerSummary, PriceData } from "@/lib/types";

interface Props {
  summaries: OwnerSummary[];
  holdings: HoldingsData;
}

type Period = "7d" | "30d" | "3m" | "6m" | "1y" | "ytd";

interface AssetPerformance {
  ticker: string;
  changes: Record<Period, number | null>;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "ytd", label: "YTD" },
];

export default function TopAssets({ summaries, holdings }: Props) {
  const [perfMap, setPerfMap] = useState<Record<string, AssetPerformance["changes"]>>({});
  const [priceMap, setPriceMap] = useState<PriceData>({});
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, AssetPerformance["changes"]> = {};
        for (const a of d.data as AssetPerformance[]) map[a.ticker] = a.changes;
        setPerfMap(map);
      })
      .catch((e) => console.error("performance fetch failed", e));

    fetch("/api/prices")
      .then((r) => r.json())
      .then((d) => setPriceMap(d.prices || {}))
      .catch((e) => console.error("prices fetch failed", e));
  }, []);

  const byAsset: Record<string, { qty: number; valueUSD: number; valueCAD: number }> = {};
  for (const s of summaries) {
    for (const r of s.rows) {
      if (r.accountType === "cash") continue;
      if (!byAsset[r.asset]) byAsset[r.asset] = { qty: 0, valueUSD: 0, valueCAD: 0 };
      byAsset[r.asset].qty += r.qty;
      byAsset[r.asset].valueUSD += r.valueUSD;
      byAsset[r.asset].valueCAD += r.valueCAD;
    }
  }

  const items = Object.entries(byAsset)
    .map(([asset, d]) => {
      const meta = holdings.tickerMeta[asset];
      const currency = meta?.currency === "CAD" ? "CAD" : "USD";
      const nativeValue = currency === "CAD" ? d.valueCAD : d.valueUSD;
      return {
        asset,
        name: meta?.name || asset,
        qty: d.qty,
        valueUSD: d.valueUSD,
        valueCAD: d.valueCAD,
        price: d.qty > 0 ? nativeValue / d.qty : 0,
        currency,
        watch: false,
      };
    })
    .sort((a, b) => b.valueCAD - a.valueCAD);

  // Watchlist tickers (not owned — tracked for reference)
  const watchItems = (holdings.watchlist || [])
    .map((ticker) => {
      const meta = holdings.tickerMeta[ticker];
      const priceInfo = priceMap[ticker];
      if (!meta || !priceInfo) return null;
      const currency = meta.currency === "CAD" ? "CAD" : "USD";
      return {
        asset: ticker,
        name: meta.name,
        qty: 0,
        valueUSD: 0,
        valueCAD: 0,
        price: priceInfo.price,
        currency,
        watch: true,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const allItems = [...items, ...watchItems];

  if (allItems.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">All Holdings ({items.length})</h2>
        <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-0.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                period === p.key
                  ? "bg-white text-neutral-950"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {allItems.map((it) => {
          const changes = perfMap[it.asset];
          const pct = changes?.[period];
          const hasPerf = pct != null;
          const positive = hasPerf && pct >= 0;
          return (
            <div
              key={it.asset}
              className={`rounded-xl border bg-neutral-900 p-2.5 sm:p-3 hover:bg-neutral-800/40 transition-colors ${
                it.watch ? "border-amber-400/40 border-dashed" : "border-neutral-800"
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-bold text-white truncate">{it.asset}</span>
                    {it.watch && (
                      <span className="text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded bg-amber-400/15 text-amber-400 uppercase tracking-wider flex-shrink-0">
                        Watch
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs text-neutral-400 truncate">{it.name}</div>
                </div>
                {hasPerf && (
                  <span className={`text-[10px] sm:text-xs font-bold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"} flex-shrink-0`}>
                    {positive ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className={`text-base sm:text-lg font-bold tabular-nums mt-1 sm:mt-1.5 ${it.watch ? "text-amber-400" : "text-cyan-400"}`}>
                {formatPrice(it.price)} <span className="text-[10px] sm:text-xs font-normal text-neutral-400">{it.currency}</span>
              </div>
              {it.watch ? (
                <div className="text-[11px] sm:text-xs text-neutral-500 italic">Not held · tracked</div>
              ) : (
                <>
                  <div className="text-[11px] sm:text-xs text-neutral-400 tabular-nums">{formatCAD(it.valueCAD)} CAD</div>
                  <div className="text-[10px] sm:text-xs text-neutral-400 tabular-nums">{formatUSD(it.valueUSD)} USD</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
