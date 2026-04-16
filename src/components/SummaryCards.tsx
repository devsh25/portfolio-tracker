"use client";

import { formatUSD, formatCAD } from "@/lib/calculations";
import type { EntityTotal } from "@/lib/types";

interface Props {
  entities: EntityTotal[];
  grandUSD: number;
  grandCAD: number;
}

const ENTITY_COLORS: Record<string, string> = {
  Dev: "border-blue-500 bg-blue-50",
  Shalini: "border-purple-500 bg-purple-50",
  Vegrow: "border-emerald-500 bg-emerald-50",
  Blockwiz: "border-orange-500 bg-orange-50",
  Seglitix: "border-pink-500 bg-pink-50",
};

export default function SummaryCards({ entities, grandUSD, grandCAD }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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
      <div className="rounded-xl border-l-4 border-gray-900 bg-gray-900 p-4 shadow-sm">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Grand Total</div>
        <div className="text-lg font-bold text-white mt-1">{formatCAD(grandCAD)} <span className="text-xs font-normal text-gray-400">CAD</span></div>
        <div className="text-xs text-gray-400 mt-0.5">{formatUSD(grandUSD)} USD</div>
      </div>
    </div>
  );
}
