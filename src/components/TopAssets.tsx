"use client";

import { useEffect, useState } from "react";
import { formatUSD, formatCAD, formatPrice } from "@/lib/calculations";
import type { HoldingsData, OwnerSummary } from "@/lib/types";

interface Props {
  summaries: OwnerSummary[];
  holdings: HoldingsData;
}

interface AssetPerformance {
  ticker: string;
  pctChange: number;
}

export default function TopAssets({ summaries, holdings }: Props) {
  const [perfMap, setPerfMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, number> = {};
        for (const a of d.data as AssetPerformance[]) map[a.ticker] = a.pctChange;
        setPerfMap(map);
      })
      .catch((e) => console.error("performance fetch failed", e));
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
    .map(([asset, d]) => ({
      asset,
      name: holdings.tickerMeta[asset]?.name || asset,
      qty: d.qty,
      valueUSD: d.valueUSD,
      valueCAD: d.valueCAD,
      price: d.qty > 0 ? d.valueUSD / d.qty : 0,
    }))
    .sort((a, b) => b.valueCAD - a.valueCAD)
    .slice(0, 10);

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-3">Top 10 Assets</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {items.map((it) => {
          const pct = perfMap[it.asset];
          const hasPerf = pct !== undefined;
          const positive = hasPerf && pct >= 0;
          return (
            <div
              key={it.asset}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="text-base font-bold text-white truncate">{it.asset}</div>
                  <div className="text-xs text-neutral-400 truncate">{it.name}</div>
                </div>
                {hasPerf && (
                  <span className={`text-xs font-bold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"} flex-shrink-0 ml-1`}>
                    {positive ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums mt-1.5">{formatPrice(it.price)}</div>
              <div className="text-xs text-neutral-400 tabular-nums">{formatCAD(it.valueCAD)} CAD</div>
              <div className="text-xs text-neutral-400 tabular-nums">{formatUSD(it.valueUSD)} USD</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
