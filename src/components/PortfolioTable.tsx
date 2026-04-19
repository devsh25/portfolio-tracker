"use client";

import React from "react";
import { formatUSD, formatCAD, formatQty } from "@/lib/calculations";
import type { OwnerSummary, PortfolioRow } from "@/lib/types";

interface Props {
  summary: OwnerSummary;
}

function groupRows(rows: PortfolioRow[]): Map<string, PortfolioRow[]> {
  const groups = new Map<string, PortfolioRow[]>();
  const order: string[] = [];

  for (const row of rows) {
    let groupKey: string;
    if (row.accountType === "questrade") {
      groupKey = row.account;
    } else if (row.accountType === "crypto") {
      groupKey = row.account;
    } else {
      groupKey = "Cash";
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
      order.push(groupKey);
    }
    groups.get(groupKey)!.push(row);
  }

  const sorted = new Map<string, PortfolioRow[]>();
  for (const key of order) {
    sorted.set(key, groups.get(key)!);
  }
  return sorted;
}

const OWNER_ACCENT: Record<string, string> = {
  Dev: "border-l-cyan-400",
  Shalini: "border-l-blue-400",
  Vegrow: "border-l-orange-400",
};

export default function PortfolioTable({ summary }: Props) {
  const groups = groupRows(summary.rows);

  return (
    <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className={`px-5 py-3 border-b border-neutral-800 border-l-4 ${OWNER_ACCENT[summary.owner] || "border-l-neutral-700"} flex justify-between items-center`}>
        <h2 className="text-lg font-semibold text-white tracking-tight">{summary.owner}</h2>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-neutral-500 mr-2">Total</span>
          <span className="font-bold text-white tabular-nums">{formatCAD(summary.totalCAD)}</span>
          <span className="text-xs text-neutral-500 ml-1">CAD</span>
          <span className="text-xs text-neutral-500 ml-2 tabular-nums">({formatUSD(summary.totalUSD)} USD)</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-500 text-[10px] uppercase tracking-widest">
              <th className="text-left px-5 py-2 font-semibold">Asset</th>
              <th className="text-left px-5 py-2 font-semibold">Account</th>
              <th className="text-right px-5 py-2 font-semibold">Qty</th>
              <th className="text-right px-5 py-2 font-semibold">Value USD</th>
              <th className="text-right px-5 py-2 font-semibold">Value CAD</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(groups.entries()).map(([groupName, rows], gi) => {
              const groupUSD = rows.reduce((s, r) => s + r.valueUSD, 0);
              const groupCAD = rows.reduce((s, r) => s + r.valueCAD, 0);
              return (
                <React.Fragment key={groupName}>
                  {rows.map((row, ri) => (
                    <tr key={`${groupName}-${ri}`} className="border-t border-neutral-800/60 hover:bg-neutral-800/40 transition-colors">
                      <td className="px-5 py-2 font-medium text-neutral-100">{row.accountType === "cash" ? "Cash" : row.asset}</td>
                      <td className="px-5 py-2 text-neutral-400">{row.accountType === "cash" ? row.account : groupName}</td>
                      <td className="px-5 py-2 text-right text-neutral-400 tabular-nums">{formatQty(row.qty)}</td>
                      <td className="px-5 py-2 text-right text-neutral-300 tabular-nums">{formatUSD(row.valueUSD)}</td>
                      <td className="px-5 py-2 text-right text-white tabular-nums">{formatCAD(row.valueCAD)}</td>
                    </tr>
                  ))}
                  <tr className="bg-neutral-900/80 text-xs border-t border-neutral-800">
                    <td className="px-5 py-1.5 text-neutral-500 uppercase tracking-wider" colSpan={3}>{groupName} Subtotal</td>
                    <td className="px-5 py-1.5 text-right font-semibold text-neutral-300 tabular-nums">{formatUSD(groupUSD)}</td>
                    <td className="px-5 py-1.5 text-right font-semibold text-neutral-100 tabular-nums">{formatCAD(groupCAD)}</td>
                  </tr>
                  {gi < groups.size - 1 && <tr><td colSpan={5} className="h-1 bg-neutral-950"></td></tr>}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
