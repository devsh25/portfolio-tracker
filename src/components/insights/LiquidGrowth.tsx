"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Liquid Portfolio Growth</h3>
        <p className="text-sm text-gray-500">
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

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Liquid Portfolio Growth</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Excludes real estate · {first.date} → {last.date} · {raw.length} snapshots
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>
            {positive ? "+" : ""}{formatCAD(deltaCAD)} CAD
          </div>
          <div className={`text-sm font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
            {positive ? "+" : ""}{pct.toFixed(1)}% YTD
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            domain={["dataMin - 20000", "dataMax + 20000"]}
            width={60}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v) => [formatCAD(Number(v)) + " CAD", "Liquid"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line type="monotone" dataKey="liquidCAD" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[11px] text-gray-400 mt-3">
        Backfill uses today&rsquo;s quantities and cash balances against historical prices — values before the current date are approximate and do not reflect buys, sells, or deposits made during the year.
      </p>
    </div>
  );
}
