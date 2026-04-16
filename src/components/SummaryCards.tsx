"use client";

import { formatUSD, formatCAD } from "@/lib/calculations";
import type { OwnerSummary } from "@/lib/types";

interface Props {
  summaries: OwnerSummary[];
}

const OWNER_COLORS: Record<string, string> = {
  Dev: "border-blue-500 bg-blue-50",
  Shalini: "border-purple-500 bg-purple-50",
  Vegrow: "border-emerald-500 bg-emerald-50",
};

export default function SummaryCards({ summaries }: Props) {
  const grandUSD = summaries.reduce((s, o) => s + o.totalUSD, 0);
  const grandCAD = summaries.reduce((s, o) => s + o.totalCAD, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaries.map((s) => (
        <div
          key={s.owner}
          className={`rounded-xl border-l-4 p-5 shadow-sm ${OWNER_COLORS[s.owner] || "border-gray-400 bg-gray-50"}`}
        >
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{s.owner}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatCAD(s.totalCAD)} <span className="text-sm font-normal text-gray-400">CAD</span></div>
          <div className="text-sm text-gray-500 mt-0.5">{formatUSD(s.totalUSD)} USD</div>
        </div>
      ))}
      <div className="rounded-xl border-l-4 border-gray-900 bg-gray-900 p-5 shadow-sm">
        <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Grand Total</div>
        <div className="text-2xl font-bold text-white mt-1">{formatCAD(grandCAD)} <span className="text-sm font-normal text-gray-400">CAD</span></div>
        <div className="text-sm text-gray-400 mt-0.5">{formatUSD(grandUSD)} USD</div>
      </div>
    </div>
  );
}
