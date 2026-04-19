"use client";

import { formatUSD, formatCAD } from "@/lib/calculations";
import type { EntityTotal } from "@/lib/types";

interface Props {
  entities: EntityTotal[];
  grandUSD: number;
  grandCAD: number;
  investableUSD: number;
  investableCAD: number;
}

const RANK_ACCENT = [
  { border: "border-l-cyan-400", num: "text-cyan-400", value: "text-cyan-400", bg: "bg-cyan-400/5" },
  { border: "border-l-blue-400", num: "text-blue-400", value: "text-blue-400", bg: "bg-blue-400/5" },
  { border: "border-l-orange-400", num: "text-orange-400", value: "text-orange-400", bg: "bg-orange-400/5" },
];

export default function SummaryCards({ entities, grandUSD, grandCAD, investableUSD, investableCAD }: Props) {
  const sorted = [...entities].sort((a, b) => b.totalCAD - a.totalCAD);
  const topThree = sorted.slice(0, 3);
  const midTier = sorted.slice(3);

  return (
    <>
      {/* Hero: Liquid + Grand Total */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border-l-4 border-cyan-400 border-t border-r border-b border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-widest">Liquid Portfolio</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 font-medium">ex-Real Estate</span>
          </div>
          <div className="text-3xl font-bold text-cyan-400 mt-2 tabular-nums">{formatCAD(investableCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
          <div className="text-sm text-neutral-400 mt-0.5 tabular-nums">{formatUSD(investableUSD)} USD</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
            Grand Total <span className="text-[10px] font-normal normal-case text-neutral-400">· incl. real estate</span>
          </div>
          <div className="text-3xl font-bold text-white mt-2 tabular-nums">{formatCAD(grandCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
          <div className="text-sm text-neutral-400 mt-0.5 tabular-nums">{formatUSD(grandUSD)} USD</div>
        </div>
      </div>

      {/* Ranked entity table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-8">
        <div className="grid grid-cols-[44px_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-neutral-800 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
          <div>#</div>
          <div>Entity</div>
          <div className="text-right">Total (CAD)</div>
          <div className="text-right min-w-[110px]">USD Equiv</div>
        </div>

        {topThree.map((e, i) => {
          const pct = (e.totalCAD / grandCAD) * 100;
          const accent = RANK_ACCENT[i];
          return (
            <div
              key={e.entity}
              className={`grid grid-cols-[44px_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-l-4 ${accent.border} ${accent.bg} border-b border-neutral-800`}
            >
              <div className={`text-3xl font-bold ${accent.num} tabular-nums`}>{i + 1}</div>
              <div>
                <div className="text-base font-semibold text-white">{e.entity}</div>
                <div className="text-xs text-neutral-400">{pct.toFixed(1)}% of total</div>
              </div>
              <div className={`text-right text-2xl font-bold ${accent.value} tabular-nums`}>{formatCAD(e.totalCAD)}</div>
              <div className="text-right min-w-[110px]">
                <div className="text-base font-semibold text-neutral-300 tabular-nums">{formatUSD(e.totalUSD)}</div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">USD</div>
              </div>
            </div>
          );
        })}

        {midTier.length > 0 && (
          <>
            <div className="px-5 py-2 text-center text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.3em] border-b border-neutral-800">
              Mid-Tier
            </div>
            {midTier.map((e, i) => {
              const pct = (e.totalCAD / grandCAD) * 100;
              const rank = i + 4;
              const isLast = i === midTier.length - 1;
              return (
                <div
                  key={e.entity}
                  className={`grid grid-cols-[44px_1fr_1fr_auto] gap-4 items-center px-5 py-4 ${isLast ? "" : "border-b border-neutral-800"}`}
                >
                  <div className="text-2xl font-medium text-neutral-400 tabular-nums">{rank}</div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-200">{e.entity}</div>
                    <div className="text-xs text-neutral-400">{pct.toFixed(1)}% of total</div>
                  </div>
                  <div className="text-right text-lg font-semibold text-neutral-300 tabular-nums">{formatCAD(e.totalCAD)}</div>
                  <div className="text-right min-w-[110px]">
                    <div className="text-sm font-medium text-neutral-400 tabular-nums">{formatUSD(e.totalUSD)}</div>
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wider">USD</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
