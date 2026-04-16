"use client";

import React from "react";
import { formatUSD, formatCAD, formatQty } from "@/lib/calculations";
import type { CategorySummary } from "@/lib/types";

interface Props {
  categories: CategorySummary[];
  grandUSD: number;
  grandCAD: number;
}

const CAT_COLORS: Record<string, string> = {
  "Questrade Investments": "bg-indigo-600",
  "Crypto": "bg-orange-500",
  "Cash (All)": "bg-green-600",
};

export default function CategoryBreakdown({ categories, grandUSD, grandCAD }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-800 mb-4">By Category</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-2">Category / Asset</th>
              <th className="text-right px-4 py-2">Qty</th>
              <th className="text-right px-4 py-2">Value USD</th>
              <th className="text-right px-4 py-2">Value CAD</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <React.Fragment key={cat.name}>
                <tr className="bg-gray-800 text-white font-medium">
                  <td className="px-4 py-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${CAT_COLORS[cat.name] || "bg-gray-500"}`}></span>
                    {cat.name}
                  </td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatUSD(cat.totalUSD)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatCAD(cat.totalCAD)}</td>
                </tr>
                {cat.items.map((item, i) => (
                  <tr key={`${cat.name}-${i}`} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-1.5 pl-8 text-gray-600">{item.asset}</td>
                    <td className="px-4 py-1.5 text-right text-gray-500 tabular-nums">{formatQty(item.qty)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{formatUSD(item.valueUSD)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{formatCAD(item.valueCAD)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-gray-900 text-white font-bold text-base">
              <td className="px-4 py-3" colSpan={2}>GRAND TOTAL</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatUSD(grandUSD)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCAD(grandCAD)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
