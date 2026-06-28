"use client";

import { useMemo, useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, ComposedChart, Line, Legend } from "recharts";
import snapshots from "../../../data/snapshots.json";
import { formatCAD } from "@/lib/calculations";

interface Snapshot {
  timestamp: string;
  liquidCAD: number;
  liquidUSD: number;
  fxRate: number;
  source: "backfill" | "live";
}

type Granularity = "day" | "week" | "month";

function bucketKey(iso: string, g: Granularity): string {
  const d = iso.slice(0, 10);
  if (g === "day") return d;
  const date = new Date(d + "T12:00:00Z");
  if (g === "month") return d.slice(0, 7);
  // week — ISO week starting Monday
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // Mon=0 .. Sun=6
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

function aggregate(snaps: Snapshot[], g: Granularity): { bucket: string; value: number; ts: string }[] {
  const byBucket = new Map<string, Snapshot>();
  for (const s of snaps) {
    const k = bucketKey(s.timestamp, g);
    const existing = byBucket.get(k);
    if (!existing || s.timestamp > existing.timestamp) byBucket.set(k, s);
  }
  return Array.from(byBucket.entries())
    .map(([bucket, s]) => ({ bucket, value: s.liquidCAD, ts: s.timestamp }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}

export default function LiquidGrowth() {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const raw = snapshots as Snapshot[];

  const { merged, backfillStats, liveStats } = useMemo(() => {
    const backfill = raw.filter((s) => s.source === "backfill");
    const live = raw.filter((s) => s.source === "live");

    const bAgg = aggregate(backfill, granularity);
    const lAgg = aggregate(live, granularity);

    const all = new Map<string, { bucket: string; backfill?: number; live?: number }>();
    for (const b of bAgg) all.set(b.bucket, { bucket: b.bucket, backfill: b.value });
    for (const l of lAgg) {
      const ex = all.get(l.bucket) || { bucket: l.bucket };
      ex.live = l.value;
      all.set(l.bucket, ex);
    }

    const merged = Array.from(all.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));

    const stat = (arr: { value: number }[]) => {
      if (arr.length < 2) return null;
      const first = arr[0].value;
      const last = arr[arr.length - 1].value;
      const delta = last - first;
      const pct = (delta / first) * 100;
      return { first, last, delta, pct };
    };

    return { merged, backfillStats: stat(bAgg), liveStats: stat(lAgg) };
  }, [raw, granularity]);

  if (raw.length < 2) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-2">Liquid Portfolio Growth</h3>
        <p className="text-sm text-neutral-400">
          Building history — snapshots populate via GitHub Actions 3×/day.
        </p>
      </div>
    );
  }

  const firstBucket = merged[0]?.bucket;
  const lastBucket = merged[merged.length - 1]?.bucket;
  const livePositive = (liveStats?.delta ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Liquid Portfolio Growth</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Excludes real estate · {firstBucket} → {lastBucket}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-neutral-950/60 border border-neutral-800 p-0.5">
          {(["day", "week", "month"] as Granularity[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                granularity === g ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {g === "day" ? "Daily" : g === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {backfillStats && (
          <div className="rounded-lg bg-neutral-950/60 border border-neutral-800 p-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-neutral-400" style={{ borderTop: "1px dashed #a3a3a3" }} />
              Backfill (approx)
            </div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${backfillStats.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {backfillStats.delta >= 0 ? "+" : ""}{formatCAD(backfillStats.delta)}
            </div>
            <div className="text-xs text-neutral-400 tabular-nums">
              {backfillStats.pct >= 0 ? "+" : ""}{backfillStats.pct.toFixed(1)}% · today&rsquo;s holdings
            </div>
          </div>
        )}
        {liveStats && (
          <div className="rounded-lg bg-neutral-950/60 border border-neutral-800 p-3">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-emerald-400" />
              True value (actual)
            </div>
            <div className={`text-xl font-bold tabular-nums mt-1 ${livePositive ? "text-emerald-400" : "text-red-400"}`}>
              {livePositive ? "+" : ""}{formatCAD(liveStats.delta)}
            </div>
            <div className="text-xs text-neutral-400 tabular-nums">
              {liveStats.pct >= 0 ? "+" : ""}{liveStats.pct.toFixed(1)}% · captured daily
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={merged} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 13, fill: "#a3a3a3" }}
            stroke="#404040"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 13, fill: "#a3a3a3" }}
            stroke="#404040"
            domain={["dataMin - 20000", "dataMax + 20000"]}
            width={60}
          />
          <Tooltip
            contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 14, color: "#fff" }}
            formatter={(v, name) => [formatCAD(Number(v)) + " CAD", name === "backfill" ? "Backfill" : "True value"]}
            labelFormatter={(label) => `${granularity === "month" ? "Month" : granularity === "week" ? "Week of" : "Date"}: ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#a3a3a3" }}
            formatter={(v) => (v === "backfill" ? "Backfill (today's holdings × historical prices)" : "True value (actual snapshots)")}
          />
          <Area type="monotone" dataKey="live" stroke="#22d3ee" strokeWidth={2} fill="url(#liveGradient)" connectNulls dot={false} />
          <Line type="monotone" dataKey="backfill" stroke="#a3a3a3" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="text-sm text-neutral-400 mt-3">
        <span className="text-neutral-300 font-semibold">Backfill</span> uses today&rsquo;s quantities and cash balances against historical prices — values before the current date are approximate and do not reflect buys, sells, or deposits made during the year.
        <br className="hidden sm:inline" />
        <span className="text-neutral-300 font-semibold">True value</span> is the actual portfolio value captured once per day from live prices.
      </p>
    </div>
  );
}
