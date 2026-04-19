"use client";

import React from "react";
import { formatUSD, formatCAD, formatQty, formatPrice } from "@/lib/calculations";
import type { CategorySummary } from "@/lib/types";

interface Props {
  categories: CategorySummary[];
  grandUSD: number;
  grandCAD: number;
}

const CAT_DOT: Record<string, string> = {
  "Questrade Investments": "bg-cyan-400",
  "Crypto": "bg-orange-400",
  "Cash (All)": "bg-emerald-400",
};

export default function CategoryBreakdown({ categories, grandUSD, grandCAD }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider mb-3">By Category</h2>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-200 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-bold">Category / Asset</th>
              <th className="text-right px-5 py-3 font-bold">Qty</th>
              <th className="text-right px-5 py-3 font-bold">Price USD</th>
              <th className="text-right px-5 py-3 font-bold">Value USD</th>
              <th className="text-right px-5 py-3 font-bold">Value CAD</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <React.Fragment key={cat.name}>
                <tr className="bg-neutral-800/60 border-t border-neutral-800">
                  <td className="px-5 py-2.5 font-semibold text-white">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${CAT_DOT[cat.name] || "bg-neutral-500"}`}></span>
                    {cat.name}
                  </td>
                  <td className="px-5 py-2.5" colSpan={2}></td>
                  <td className="px-5 py-2.5 text-right font-semibold text-neutral-200 tabular-nums">{formatUSD(cat.totalUSD)}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-white tabular-nums">{formatCAD(cat.totalCAD)}</td>
                </tr>
                {cat.items.map((item, i) => (
                  <tr key={`${cat.name}-${i}`} className="border-t border-neutral-800/60 hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-1.5 pl-10 text-neutral-400">{item.asset}</td>
                    <td className="px-5 py-1.5 text-right text-neutral-400 tabular-nums">{formatQty(item.qty)}</td>
                    <td className="px-5 py-1.5 text-right text-neutral-400 tabular-nums">{item.qty > 0 ? formatPrice(item.valueUSD / item.qty) : "\u2014"}</td>
                    <td className="px-5 py-1.5 text-right text-neutral-300 tabular-nums">{formatUSD(item.valueUSD)}</td>
                    <td className="px-5 py-1.5 text-right text-neutral-100 tabular-nums">{formatCAD(item.valueCAD)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="bg-neutral-950 border-t border-neutral-800">
              <td className="px-5 py-3 font-bold text-white uppercase tracking-wider text-xs" colSpan={3}>Grand Total</td>
              <td className="px-5 py-3 text-right font-bold text-neutral-200 tabular-nums">{formatUSD(grandUSD)}</td>
              <td className="px-5 py-3 text-right font-bold text-white tabular-nums">{formatCAD(grandCAD)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
