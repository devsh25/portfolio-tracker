"use client";

import React, { useState } from "react";
import { formatUSD, formatCAD, formatQty, formatPrice } from "@/lib/calculations";
import type { OwnerSummary, PortfolioRow } from "@/lib/types";
import holdingsData from "../../data/holdings.json";

const tickerMeta = (holdingsData as { tickerMeta: Record<string, { currency: string }> }).tickerMeta;

function rowPrice(row: PortfolioRow): { price: number; currency: "CAD" | "USD" } | null {
  if (row.qty <= 0) return null;
  const meta = tickerMeta[row.asset];
  const currency: "CAD" | "USD" = meta?.currency === "CAD" ? "CAD" : "USD";
  const nativeValue = currency === "CAD" ? row.valueCAD : row.valueUSD;
  return { price: nativeValue / row.qty, currency };
}

interface Props {
  summary: OwnerSummary;
  rank: number;
  pctOfTotal: number;
}

function groupRows(rows: PortfolioRow[]): Map<string, PortfolioRow[]> {
  const groups = new Map<string, PortfolioRow[]>();
  const order: string[] = [];

  for (const row of rows) {
    if (row.accountType === "questrade" && row.qty <= 0) continue;
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

const RANK_ACCENT = [
  { border: "border-l-cyan-400", num: "text-cyan-400", value: "text-cyan-400", bg: "bg-cyan-400/5" },
  { border: "border-l-blue-400", num: "text-blue-400", value: "text-blue-400", bg: "bg-blue-400/5" },
  { border: "border-l-orange-400", num: "text-orange-400", value: "text-orange-400", bg: "bg-orange-400/5" },
];

export default function PortfolioTable({ summary, rank, pctOfTotal }: Props) {
  const [open, setOpen] = useState(false);
  const groups = groupRows(summary.rows);
  const accent = RANK_ACCENT[rank - 1] || {
    border: "border-l-neutral-700",
    num: "text-neutral-400",
    value: "text-neutral-300",
    bg: "",
  };

  return (
    <div className={`mb-3 sm:mb-4 rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden`}>
      {/* Header — mobile: stacked, desktop: grid */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full px-3 sm:px-5 py-3 sm:py-4 border-l-4 ${accent.border} ${accent.bg} ${open ? "border-b border-neutral-800" : ""} hover:bg-neutral-800/30 transition-colors text-left`}
      >
        {/* Mobile layout */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`text-2xl font-bold ${accent.num} tabular-nums leading-none flex-shrink-0`}>{rank}</span>
              <svg
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <div className="min-w-0">
                <div className="text-base font-semibold text-white truncate">{summary.owner}</div>
                <div className="text-[10px] text-neutral-400 tabular-nums">{pctOfTotal.toFixed(1)}% of total</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-lg font-bold ${accent.value} tabular-nums leading-tight`}>{formatCAD(summary.totalCAD)}</div>
              <div className="text-[10px] text-neutral-400 tabular-nums">{formatUSD(summary.totalUSD)} USD</div>
            </div>
          </div>
        </div>
        {/* Desktop layout */}
        <div className="hidden sm:grid grid-cols-[44px_1fr_1fr_auto] gap-4 items-center">
          <div className={`text-3xl font-bold ${accent.num} tabular-nums`}>{rank}</div>
          <div className="flex items-center gap-3 min-w-0">
            <svg
              className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ${open ? "rotate-90" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-base font-semibold text-white">{summary.owner}</div>
              <div className="text-xs text-neutral-400 tabular-nums">{pctOfTotal.toFixed(1)}% of total</div>
            </div>
          </div>
          <div className={`text-right text-2xl font-bold ${accent.value} tabular-nums`}>{formatCAD(summary.totalCAD)}</div>
          <div className="text-right min-w-[110px]">
            <div className="text-base font-semibold text-neutral-300 tabular-nums">{formatUSD(summary.totalUSD)}</div>
            <div className="text-xs text-neutral-400 uppercase tracking-wider">USD</div>
          </div>
        </div>
      </button>

      {open && (
        <>
          {/* Mobile: card list */}
          <div className="sm:hidden divide-y divide-neutral-800/60">
            {Array.from(groups.entries()).map(([groupName, rows]) => {
              const groupCAD = rows.reduce((s, r) => s + r.valueCAD, 0);
              return (
                <div key={groupName}>
                  <div className="bg-neutral-950/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                    <span>{groupName}</span>
                    <span className="tabular-nums text-neutral-200 font-semibold">{formatCAD(groupCAD)}</span>
                  </div>
                  {rows.map((row, ri) => {
                    const p = rowPrice(row);
                    return (
                      <div key={`${groupName}-${ri}`} className="px-3 py-2.5 flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-neutral-100 truncate">
                            {row.accountType === "cash" ? row.account : row.asset}
                          </div>
                          <div className="text-[11px] text-neutral-400 tabular-nums">
                            {row.accountType !== "cash" && row.qty > 0 && (
                              <>
                                {formatQty(row.qty)}
                                {p && <> · {formatPrice(p.price)} {p.currency}</>}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold text-white tabular-nums">{formatCAD(row.valueCAD)}</div>
                          <div className="text-[10px] text-neutral-400 tabular-nums">{formatUSD(row.valueUSD)} USD</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Desktop: full table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-200 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-bold">Asset</th>
                  <th className="text-left px-5 py-3 font-bold">Account</th>
                  <th className="text-right px-5 py-3 font-bold">Qty</th>
                  <th className="text-right px-5 py-3 font-bold">Price</th>
                  <th className="text-right px-5 py-3 font-bold">Value USD</th>
                  <th className="text-right px-5 py-3 font-bold">Value CAD</th>
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
                          <td className="px-5 py-2 text-right text-neutral-300 tabular-nums">
                            {(() => {
                              const p = rowPrice(row);
                              return p ? <>{formatPrice(p.price)} <span className="text-neutral-400 text-xs">{p.currency}</span></> : "—";
                            })()}
                          </td>
                          <td className="px-5 py-2 text-right text-neutral-300 tabular-nums">{formatUSD(row.valueUSD)}</td>
                          <td className="px-5 py-2 text-right text-white tabular-nums">{formatCAD(row.valueCAD)}</td>
                        </tr>
                      ))}
                      <tr className="bg-neutral-900/80 text-xs border-t border-neutral-800">
                        <td className="px-5 py-1.5 text-neutral-400 uppercase tracking-wider" colSpan={4}>{groupName} Subtotal</td>
                        <td className="px-5 py-1.5 text-right font-semibold text-neutral-300 tabular-nums">{formatUSD(groupUSD)}</td>
                        <td className="px-5 py-1.5 text-right font-semibold text-neutral-100 tabular-nums">{formatCAD(groupCAD)}</td>
                      </tr>
                      {gi < groups.size - 1 && <tr><td colSpan={6} className="h-1 bg-neutral-950"></td></tr>}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
