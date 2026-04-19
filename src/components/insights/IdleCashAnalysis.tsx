"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCAD } from "@/lib/calculations";

interface Props {
  totalCashCAD: number;
  projections: { years: number; at7pct: number; at10pct: number; at12pct: number }[];
}

export default function IdleCashAnalysis({ totalCashCAD, projections }: Props) {
  const chartData = projections.map(p => ({
    name: `${p.years}Y`,
    "7% (Conservative)": Math.round(p.at7pct),
    "10% (S&P 500 Avg)": Math.round(p.at10pct),
    "12% (Aggressive)": Math.round(p.at12pct),
  }));

  const gain10y = projections[3]?.at10pct - totalCashCAD;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Idle Cash Analysis</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-emerald-400">
          <div className="text-[10px] text-emerald-400 uppercase tracking-widest">Cash Sitting Idle</div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{formatCAD(totalCashCAD)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
        </div>
        <div className="rounded-lg p-4 bg-neutral-950 border-l-4 border-amber-400">
          <div className="text-[10px] text-amber-400 uppercase tracking-widest">Opportunity Cost (10Y @ 10%)</div>
          <div className="text-2xl font-bold text-amber-400 tabular-nums">+{formatCAD(gain10y)} <span className="text-sm font-normal text-neutral-400">CAD</span></div>
          <div className="text-xs text-neutral-400 tabular-nums">Could grow to {formatCAD(projections[3]?.at10pct)}</div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="name" tick={{ fill: "#d4d4d4", fontSize: 14 }} stroke="#404040" />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: "#a3a3a3", fontSize: 13 }} stroke="#404040" />
            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 14, color: "#fff" }} cursor={{ fill: "#262626" }} formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Legend wrapperStyle={{ fontSize: 14, color: "#d4d4d4" }} />
            <Bar dataKey="7% (Conservative)" fill="#34d399" />
            <Bar dataKey="10% (S&P 500 Avg)" fill="#22d3ee" />
            <Bar dataKey="12% (Aggressive)" fill="#fb923c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
