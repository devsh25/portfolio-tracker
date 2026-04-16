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

const OWNER_HEADER_COLORS: Record<string, string> = {
  Dev: "bg-blue-600",
  Shalini: "bg-purple-600",
  Vegrow: "bg-emerald-600",
};

export default function PortfolioTable({ summary }: Props) {
  const groups = groupRows(summary.rows);

  return (
    <div className="mb-8 overflow-x-auto">
      <div className={`${OWNER_HEADER_COLORS[summary.owner] || "bg-gray-700"} text-white px-4 py-3 rounded-t-lg flex justify-between items-center`}>
        <h2 className="text-lg font-bold">{summary.owner}</h2>
        <div className="text-right">
          <span className="text-sm opacity-80">Total: </span>
          <span className="font-bold">{formatCAD(summary.totalCAD)} CAD</span>
          <span className="text-sm opacity-60 ml-2">({formatUSD(summary.totalUSD)} USD)</span>
        </div>
      </div>
      <table className="w-full text-sm border border-gray-200 border-t-0">
        <thead>
          <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-2">Asset</th>
            <th className="text-left px-4 py-2">Account</th>
            <th className="text-right px-4 py-2">Qty</th>
            <th className="text-right px-4 py-2">Value USD</th>
            <th className="text-right px-4 py-2">Value CAD</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(groups.entries()).map(([groupName, rows], gi) => {
            const groupUSD = rows.reduce((s, r) => s + r.valueUSD, 0);
            const groupCAD = rows.reduce((s, r) => s + r.valueCAD, 0);
            return (
              <React.Fragment key={groupName}>
                {rows.map((row, ri) => (
                  <tr key={`${groupName}-${ri}`} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-1.5 font-medium text-gray-800">{row.accountType === "cash" ? "Cash" : row.asset}</td>
                    <td className="px-4 py-1.5 text-gray-500">{row.accountType === "cash" ? row.account : groupName}</td>
                    <td className="px-4 py-1.5 text-right text-gray-600 tabular-nums">{formatQty(row.qty)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{formatUSD(row.valueUSD)}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">{formatCAD(row.valueCAD)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium text-xs">
                  <td className="px-4 py-1 text-gray-500" colSpan={3}>{groupName} Subtotal</td>
                  <td className="px-4 py-1 text-right tabular-nums">{formatUSD(groupUSD)}</td>
                  <td className="px-4 py-1 text-right tabular-nums">{formatCAD(groupCAD)}</td>
                </tr>
                {gi < groups.size - 1 && (
                  <tr><td colSpan={5} className="h-1"></td></tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
