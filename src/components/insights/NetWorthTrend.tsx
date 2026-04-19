"use client";

import { formatCAD } from "@/lib/calculations";

interface Props {
  currentCAD: number;
  currentUSD: number;
}

export default function NetWorthTrend({ currentCAD, currentUSD }: Props) {
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Net Worth Snapshot</h3>
      <div className="rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-800 p-8 text-center mb-4">
        <div className="text-sm text-neutral-400 uppercase tracking-widest">Total Net Worth</div>
        <div className="text-4xl font-bold text-white mt-2 tabular-nums">{formatCAD(currentCAD)} <span className="text-lg font-normal text-neutral-400">CAD</span></div>
        <div className="text-lg text-neutral-400 mt-1 tabular-nums">{formatCAD(currentUSD)} USD</div>
        <div className="text-xs text-neutral-400 mt-3">As of {today}</div>
      </div>
      <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-lg p-4 text-sm text-cyan-300">
        <strong className="text-cyan-400">Historical trend:</strong> See the Liquid Portfolio Growth chart above for the YTD time series.
      </div>
    </div>
  );
}
