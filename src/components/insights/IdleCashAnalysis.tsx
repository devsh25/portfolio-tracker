"use client";

import { useEffect, useState } from "react";
import { formatCAD, formatUSD } from "@/lib/calculations";
import type { CashBreakdown, CashType } from "@/lib/insights";

interface AssetPerformance {
  ticker: string;
  name: string;
  pctChange: number; // YTD
  changes: Record<string, number | null>;
}

interface Props {
  totalCashCAD: number;
  breakdown: CashBreakdown[];
  liquidCAD: number;
}

const BENCHMARKS: { ticker: string; label: string; tag: string; tagColor: string }[] = [
  { ticker: "CASH.TO", label: "HISA ETF (CASH.TO)", tag: "Safe", tagColor: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30" },
  { ticker: "VFV.TO", label: "S&P 500 (VFV.TO)", tag: "Index", tagColor: "bg-blue-400/15 text-blue-400 border-blue-400/30" },
  { ticker: "BTC", label: "Bitcoin", tag: "Crypto", tagColor: "bg-orange-400/15 text-orange-400 border-orange-400/30" },
  { ticker: "ZID.TO", label: "India (ZID.TO)", tag: "Region", tagColor: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
];

const TYPE_COLORS: Record<CashType, string> = {
  Bank: "bg-cyan-400",
  Stablecoin: "bg-purple-400",
  ETF: "bg-emerald-400",
};

export default function IdleCashAnalysis({ totalCashCAD, breakdown, liquidCAD }: Props) {
  const [perf, setPerf] = useState<AssetPerformance[] | null>(null);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => setPerf(d.data))
      .catch((e) => console.error("performance fetch failed", e));
  }, []);

  const cashPct = liquidCAD > 0 ? (totalCashCAD / liquidCAD) * 100 : 0;
  const totalCashUSD = breakdown.reduce((s, b) => s + b.valueUSD, 0);

  // Currency split
  let cadAmount = 0, usdAmount = 0;
  for (const b of breakdown) {
    if (b.currency === "CAD") cadAmount += b.valueCAD;
    else usdAmount += b.valueCAD;
  }

  // Type split
  const byType: Record<CashType, number> = { Bank: 0, Stablecoin: 0, ETF: 0 };
  for (const b of breakdown) byType[b.type] += b.valueCAD;

  // YTD opportunity: what would cash be worth if invested in each benchmark on Jan 1?
  const perfMap: Record<string, AssetPerformance> = {};
  if (perf) for (const a of perf) perfMap[a.ticker] = a;
  const benchmarks = BENCHMARKS.map((b) => {
    const p = perfMap[b.ticker];
    if (!p) return null;
    const wouldBe = totalCashCAD * (1 + p.pctChange / 100);
    const gain = wouldBe - totalCashCAD;
    return { ...b, pctChange: p.pctChange, wouldBe, gain };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Idle Cash Analysis</h3>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-cyan-400">
          <div className="text-xs text-cyan-400 uppercase tracking-widest">Total Idle Cash</div>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">{formatCAD(totalCashCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
          <div className="text-xs text-neutral-400 tabular-nums">{formatUSD(totalCashUSD)} USD equiv</div>
        </div>
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-amber-400">
          <div className="text-xs text-amber-400 uppercase tracking-widest">% of Liquid Portfolio</div>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">{cashPct.toFixed(1)}%</div>
          <div className="text-xs text-neutral-400">Lower = more invested</div>
        </div>
        <div className="rounded-lg p-4 bg-neutral-950 border border-neutral-800">
          <div className="text-xs text-neutral-400 uppercase tracking-widest mb-2">Currency Mix</div>
          <div className="flex justify-between text-sm font-semibold text-white tabular-nums">
            <span>CAD</span>
            <span>{formatCAD(cadAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white tabular-nums mt-0.5">
            <span>USD</span>
            <span>{formatCAD(usdAmount)}</span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden flex">
            <div className="bg-red-400" style={{ width: `${totalCashCAD > 0 ? (cadAmount / totalCashCAD) * 100 : 0}%` }} />
            <div className="bg-blue-400" style={{ width: `${totalCashCAD > 0 ? (usdAmount / totalCashCAD) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="rounded-lg p-4 bg-neutral-950 border border-neutral-800">
          <div className="text-xs text-neutral-400 uppercase tracking-widest mb-2">By Type</div>
          {(Object.keys(byType) as CashType[]).map((t) => (
            <div key={t} className="flex items-center justify-between text-sm text-white tabular-nums mb-0.5">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${TYPE_COLORS[t]}`} />
                {t}
              </span>
              <span className="font-semibold">{formatCAD(byType[t])}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Where it's sitting */}
      {breakdown.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">Where the cash is sitting</div>
          <div className="rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              <div>Account</div>
              <div className="text-right">Type</div>
              <div className="text-right min-w-[110px]">Amount</div>
              <div className="text-right min-w-[60px]">%</div>
            </div>
            {breakdown.map((b, i) => {
              const pct = totalCashCAD > 0 ? (b.valueCAD / totalCashCAD) * 100 : 0;
              return (
                <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-2.5 ${i < breakdown.length - 1 ? "border-b border-neutral-800" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{b.account}</div>
                    <div className="text-xs text-neutral-400">{b.owner} · {b.currency}</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[b.type]}/15 text-white`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${TYPE_COLORS[b.type]}`} />
                      {b.type}
                    </span>
                  </div>
                  <div className="text-right min-w-[110px]">
                    <div className="text-sm font-bold text-white tabular-nums">{formatCAD(b.valueCAD)}</div>
                    <div className="text-xs text-neutral-400 tabular-nums">{formatUSD(b.valueUSD)} USD</div>
                  </div>
                  <div className="text-right min-w-[60px] text-sm font-semibold text-neutral-300 tabular-nums">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YTD opportunity cost */}
      <div>
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
          What this cash would be worth if invested on Jan 1 (YTD actual)
        </div>
        {!perf ? (
          <div className="text-sm text-neutral-400">Loading benchmark returns…</div>
        ) : benchmarks.length === 0 ? (
          <div className="text-sm text-neutral-400">No benchmark data</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {benchmarks.map((b) => {
              const positive = b.gain >= 0;
              return (
                <div key={b.ticker} className="rounded-lg p-4 bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${b.tagColor}`}>{b.tag}</span>
                    <span className={`text-sm font-bold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
                      {positive ? "+" : ""}{b.pctChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">{b.label}</div>
                  <div className="text-lg font-bold text-white tabular-nums mt-1">{formatCAD(b.wouldBe)}</div>
                  <div className={`text-xs tabular-nums font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                    {positive ? "+" : ""}{formatCAD(b.gain)} CAD
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-neutral-400 mt-2">
          Hypothetical: if your idle cash had been fully invested in each asset at YTD open, using actual market returns.
        </p>
      </div>
    </div>
  );
}
