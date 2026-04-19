"use client";

import { useEffect, useState } from "react";
import snapshots from "../../../data/snapshots.json";
import { formatCAD, formatPrice } from "@/lib/calculations";

interface Snapshot {
  timestamp: string;
  liquidCAD: number;
  liquidUSD: number;
  fxRate: number;
  source: string;
}

interface AssetPerformance {
  ticker: string;
  name: string;
  pctChange: number;
  startPrice: number;
  endPrice: number;
  startDate: string;
  endDate: string;
}

function findClosestSnapshot(snaps: Snapshot[], targetMs: number): Snapshot | null {
  let best: Snapshot | null = null;
  let bestDiff = Infinity;
  for (const s of snaps) {
    const t = new Date(s.timestamp).getTime();
    const diff = Math.abs(t - targetMs);
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return best;
}

export default function PortfolioPerformance() {
  const [perf, setPerf] = useState<AssetPerformance[] | null>(null);
  const [loadingPerf, setLoadingPerf] = useState(true);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => setPerf(d.data))
      .catch((e) => console.error("performance fetch failed", e))
      .finally(() => setLoadingPerf(false));
  }, []);

  const snaps = snapshots as Snapshot[];
  if (snaps.length < 2) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Portfolio Performance</h3>
        <p className="text-sm text-neutral-400 mt-2">Not enough snapshot history yet.</p>
      </div>
    );
  }

  const latest = snaps[snaps.length - 1];
  const nowMs = new Date(latest.timestamp).getTime();
  const day = 24 * 3600 * 1000;

  const periods = [
    { label: "1 Week", days: 7 },
    { label: "1 Month", days: 30 },
    { label: "3 Months", days: 90 },
    { label: "YTD", days: null as number | null },
  ];

  const periodReturns = periods.map((p) => {
    const ref = p.days === null ? snaps[0] : findClosestSnapshot(snaps, nowMs - p.days * day);
    if (!ref || ref.timestamp === latest.timestamp) return { label: p.label, delta: 0, pct: 0, hasData: false };
    const delta = latest.liquidCAD - ref.liquidCAD;
    const pct = (delta / ref.liquidCAD) * 100;
    return { label: p.label, delta, pct, hasData: true };
  });

  // Peak + max drawdown
  let peak = snaps[0];
  let maxDrawdown = 0;
  let runningPeak = snaps[0].liquidCAD;
  for (const s of snaps) {
    if (s.liquidCAD > peak.liquidCAD) peak = s;
    if (s.liquidCAD > runningPeak) runningPeak = s.liquidCAD;
    const dd = (runningPeak - s.liquidCAD) / runningPeak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const fromPeak = ((latest.liquidCAD - peak.liquidCAD) / peak.liquidCAD) * 100;

  // Best / worst day
  let bestDay = { pct: -Infinity, date: "" };
  let worstDay = { pct: Infinity, date: "" };
  for (let i = 1; i < snaps.length; i++) {
    const prev = snaps[i - 1].liquidCAD;
    const curr = snaps[i].liquidCAD;
    const pct = ((curr - prev) / prev) * 100;
    if (pct > bestDay.pct) bestDay = { pct, date: snaps[i].timestamp.slice(0, 10) };
    if (pct < worstDay.pct) worstDay = { pct, date: snaps[i].timestamp.slice(0, 10) };
  }

  const winners = perf ? perf.slice(0, 5) : [];
  const losers = perf ? [...perf].slice(-5).reverse() : [];

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-6">
      <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Portfolio Performance</h3>

      {/* Period returns */}
      <div>
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Liquid Portfolio Returns</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {periodReturns.map((p) => {
            const positive = p.delta >= 0;
            return (
              <div key={p.label} className={`rounded-lg bg-neutral-950 border p-3 ${positive ? "border-emerald-400/30" : "border-red-400/30"}`}>
                <div className="text-xs text-neutral-400 uppercase tracking-wider">{p.label}</div>
                <div className={`text-2xl font-bold tabular-nums mt-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
                  {positive ? "+" : ""}{p.pct.toFixed(1)}%
                </div>
                <div className={`text-xs tabular-nums ${positive ? "text-emerald-400/80" : "text-red-400/80"}`}>
                  {positive ? "+" : ""}{formatCAD(p.delta)} CAD
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Winners / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Top 5 Winners (YTD)</h4>
          {loadingPerf ? (
            <div className="text-sm text-neutral-400">Loading…</div>
          ) : winners.length === 0 ? (
            <div className="text-sm text-neutral-400">No data</div>
          ) : (
            <div className="rounded-lg bg-neutral-950 border border-neutral-800 divide-y divide-neutral-800">
              {winners.map((a) => (
                <div key={a.ticker} className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{a.ticker}</div>
                    <div className="text-xs text-neutral-400">{a.name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold tabular-nums ${a.pctChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {a.pctChange >= 0 ? "+" : ""}{a.pctChange.toFixed(1)}%
                    </div>
                    <div className="text-xs text-neutral-400 tabular-nums">{formatPrice(a.startPrice)} → {formatPrice(a.endPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Top 5 Losers (YTD)</h4>
          {loadingPerf ? (
            <div className="text-sm text-neutral-400">Loading…</div>
          ) : losers.length === 0 ? (
            <div className="text-sm text-neutral-400">No data</div>
          ) : (
            <div className="rounded-lg bg-neutral-950 border border-neutral-800 divide-y divide-neutral-800">
              {losers.map((a) => (
                <div key={a.ticker} className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{a.ticker}</div>
                    <div className="text-xs text-neutral-400">{a.name}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold tabular-nums ${a.pctChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {a.pctChange >= 0 ? "+" : ""}{a.pctChange.toFixed(1)}%
                    </div>
                    <div className="text-xs text-neutral-400 tabular-nums">{formatPrice(a.startPrice)} → {formatPrice(a.endPrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div>
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Key Stats (YTD)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400 uppercase tracking-wider">Peak</div>
            <div className="text-lg font-bold text-white tabular-nums">{formatCAD(peak.liquidCAD)}</div>
            <div className="text-xs text-neutral-400">on {peak.timestamp.slice(0, 10)}</div>
          </div>
          <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400 uppercase tracking-wider">From Peak</div>
            <div className={`text-lg font-bold tabular-nums ${fromPeak >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fromPeak >= 0 ? "+" : ""}{fromPeak.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-400">Current vs peak</div>
          </div>
          <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400 uppercase tracking-wider">Max Drawdown</div>
            <div className="text-lg font-bold text-red-400 tabular-nums">-{(maxDrawdown * 100).toFixed(1)}%</div>
            <div className="text-xs text-neutral-400">Worst peak-to-trough</div>
          </div>
          <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400 uppercase tracking-wider">Best / Worst Day</div>
            <div className="text-sm font-bold tabular-nums">
              <span className="text-emerald-400">+{bestDay.pct.toFixed(1)}%</span>
              <span className="text-neutral-400 mx-1">/</span>
              <span className="text-red-400">{worstDay.pct.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-neutral-400">{bestDay.date} / {worstDay.date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
