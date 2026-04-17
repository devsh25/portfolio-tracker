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

const ENTITY_COLORS: Record<string, string> = {
  Dev: "border-blue-500 bg-blue-50",
  Shalini: "border-purple-500 bg-purple-50",
  Vegrow: "border-emerald-500 bg-emerald-50",
  Blockwiz: "border-orange-500 bg-orange-50",
  Seglitix: "border-pink-500 bg-pink-50",
};

export default function SummaryCards({ entities, grandUSD, grandCAD, investableUSD, investableCAD }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border-2 border-indigo-500 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Liquid Portfolio</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-400/30 text-indigo-50 font-medium">ex-Real Estate</span>
          </div>
          <div className="text-3xl font-bold text-white mt-1.5">{formatCAD(investableCAD)} <span className="text-sm font-normal text-indigo-200">CAD</span></div>
          <div className="text-sm text-indigo-200 mt-0.5">{formatUSD(investableUSD)} USD</div>
        </div>
        <div className="rounded-xl border-2 border-gray-700 bg-gray-900 p-5 shadow-md">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grand Total <span className="text-[10px] font-normal normal-case">(incl. real estate)</span></div>
          <div className="text-3xl font-bold text-white mt-1.5">{formatCAD(grandCAD)} <span className="text-sm font-normal text-gray-400">CAD</span></div>
          <div className="text-sm text-gray-400 mt-0.5">{formatUSD(grandUSD)} USD</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {entities.map((e) => (
          <div
            key={e.entity}
            className={`rounded-xl border-l-4 p-4 shadow-sm ${ENTITY_COLORS[e.entity] || "border-gray-400 bg-gray-50"}`}
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{e.entity}</div>
            <div className="text-lg font-bold text-gray-900 mt-1">{formatCAD(e.totalCAD)} <span className="text-xs font-normal text-gray-400">CAD</span></div>
            <div className="text-xs text-gray-500 mt-0.5">{formatUSD(e.totalUSD)} USD</div>
          </div>
        ))}
      </div>
    </>
  );
}
