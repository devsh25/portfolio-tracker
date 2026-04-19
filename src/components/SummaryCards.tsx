"use client";

import { formatUSD, formatCAD } from "@/lib/calculations";

interface Props {
  grandUSD: number;
  grandCAD: number;
  investableUSD: number;
  investableCAD: number;
}

export default function SummaryCards({ grandUSD, grandCAD, investableUSD, investableCAD }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="rounded-xl border-l-4 border-cyan-400 border-t border-r border-b border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">Liquid Portfolio</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 font-medium">ex-Real Estate</span>
        </div>
        <div className="text-3xl font-bold text-cyan-400 mt-2 tabular-nums">{formatCAD(investableCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
        <div className="text-sm text-neutral-400 mt-0.5 tabular-nums">{formatUSD(investableUSD)} USD</div>
      </div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
          Grand Total <span className="text-xs font-normal normal-case text-neutral-400">· incl. real estate</span>
        </div>
        <div className="text-3xl font-bold text-white mt-2 tabular-nums">{formatCAD(grandCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
        <div className="text-sm text-neutral-400 mt-0.5 tabular-nums">{formatUSD(grandUSD)} USD</div>
      </div>
    </div>
  );
}
