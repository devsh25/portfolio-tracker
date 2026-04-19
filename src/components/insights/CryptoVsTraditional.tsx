"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { WhatIfScenario } from "@/lib/types";

interface Props {
  current: { cryptoCAD: number; traditionalCAD: number; cryptoPct: number };
  scenarios: WhatIfScenario[];
}

export default function CryptoVsTraditional({ current, scenarios }: Props) {
  const chartData = scenarios.map(s => ({
    name: s.label,
    Crypto: Math.round(s.cryptoCAD),
    Traditional: Math.round(s.traditionalCAD),
    pct: s.cryptoPct.toFixed(1),
  }));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Crypto vs Traditional</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-orange-400">
          <div className="text-[10px] text-orange-400 uppercase tracking-widest">Crypto</div>
          <div className="text-xl font-bold text-orange-400 tabular-nums">{formatCAD(current.cryptoCAD)}</div>
          <div className="text-xs text-neutral-500 tabular-nums">{current.cryptoPct.toFixed(1)}% of portfolio</div>
        </div>
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-cyan-400">
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest">Traditional + RE</div>
          <div className="text-xl font-bold text-cyan-400 tabular-nums">{formatCAD(current.traditionalCAD)}</div>
          <div className="text-xs text-neutral-500 tabular-nums">{(100 - current.cryptoPct).toFixed(1)}% of portfolio</div>
        </div>
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-neutral-500">
          <div className="text-[10px] text-neutral-400 uppercase tracking-widest">Total</div>
          <div className="text-xl font-bold text-white tabular-nums">{formatCAD(current.cryptoCAD + current.traditionalCAD)}</div>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">What-If Scenarios</h4>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="name" tick={{ fill: "#d4d4d4", fontSize: 12 }} stroke="#404040" />
            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: "#737373", fontSize: 11 }} stroke="#404040" />
            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 12, color: "#fff" }} cursor={{ fill: "#262626" }} formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#d4d4d4" }} />
            <Bar dataKey="Crypto" fill="#fb923c" />
            <Bar dataKey="Traditional" fill="#22d3ee" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {scenarios.map(s => (
          <div key={s.label} className={`text-center p-2 rounded text-xs ${s.label === "Current" ? "bg-neutral-800 border border-neutral-700" : "bg-neutral-950"}`}>
            <div className="text-neutral-500 uppercase tracking-wider text-[10px]">{s.label}</div>
            <div className="font-bold text-white tabular-nums">Crypto: {s.cryptoPct.toFixed(0)}%</div>
            <div className="text-neutral-400 tabular-nums">{formatCAD(s.totalCAD)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
