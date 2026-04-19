"use client";

import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import snapshots from "../../../data/snapshots.json";
import { formatCAD } from "@/lib/calculations";

interface Snapshot {
  timestamp: string;
  liquidCAD: number;
  liquidUSD: number;
  fxRate: number;
  source: string;
}

export default function LiquidGrowth() {
  const raw = snapshots as Snapshot[];

  if (raw.length < 2) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-2">Liquid Portfolio Growth</h3>
        <p className="text-sm text-neutral-500">
          Building history — snapshots populate via GitHub Actions 3×/day. First run will backfill from Jan 1, 2026.
        </p>
      </div>
    );
  }

  const data = raw.map((s) => ({
    date: s.timestamp.slice(0, 10),
    ts: s.timestamp,
    liquidCAD: s.liquidCAD,
    liquidUSD: s.liquidUSD,
  }));

  const first = data[0];
  const last = data[data.length - 1];
  const deltaCAD = last.liquidCAD - first.liquidCAD;
  const pct = (deltaCAD / first.liquidCAD) * 100;
  const positive = deltaCAD >= 0;
  const lineColor = positive ? "#22d3ee" : "#fb923c";

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">Liquid Portfolio Growth</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Excludes real estate · {first.date} → {last.date} · {raw.length} snapshots
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? "+" : ""}{formatCAD(deltaCAD)} CAD
          </div>
          <div className={`text-sm font-semibold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? "+" : ""}{pct.toFixed(1)}% YTD
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="liquidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#737373" }}
            stroke="#404040"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#737373" }}
            stroke="#404040"
            domain={["dataMin - 20000", "dataMax + 20000"]}
            width={60}
          />
          <Tooltip
            contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 12, color: "#fff" }}
            formatter={(v) => [formatCAD(Number(v)) + " CAD", "Liquid"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area type="monotone" dataKey="liquidCAD" stroke={lineColor} strokeWidth={2} fill="url(#liquidGradient)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[11px] text-neutral-600 mt-3">
        Backfill uses today&rsquo;s quantities and cash balances against historical prices — values before the current date are approximate and do not reflect buys, sells, or deposits made during the year.
      </p>
    </div>
  );
}
