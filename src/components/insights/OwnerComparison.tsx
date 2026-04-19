"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { EntityTotal } from "@/lib/types";

interface Props { data: EntityTotal[] }

const ENTITY_ACCENT: Record<string, string> = {
  Dev: "#22d3ee", Shalini: "#60a5fa", Vegrow: "#fb923c", Blockwiz: "#a78bfa", Seglitix: "#f472b6",
};

export default function OwnerComparison({ data }: Props) {
  const chartData = data.map(d => {
    const row: Record<string, string | number> = { name: d.entity };
    for (const b of d.breakdown) row[b.category] = Math.round(b.valueCAD);
    return row;
  });

  const allCategories = [...new Set(data.flatMap(d => d.breakdown.map(b => b.category)))];
  const catColors: Record<string, string> = {
    Questrade: "#22d3ee", Crypto: "#fb923c", Cash: "#34d399", "Real Estate": "#facc15",
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Owner / Entity Comparison</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {data.map(d => (
          <div key={d.entity} className="rounded-lg p-3 bg-neutral-950 border-l-4" style={{ borderLeftColor: ENTITY_ACCENT[d.entity] || "#525252" }}>
            <div className="text-xs text-neutral-400 uppercase tracking-widest">{d.entity}</div>
            <div className="text-base font-bold text-white mt-0.5 tabular-nums">{formatCAD(d.totalCAD)}</div>
            <div className="text-xs text-neutral-400 tabular-nums">{formatCAD(d.totalUSD)} USD</div>
          </div>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: "#a3a3a3", fontSize: 13 }} stroke="#404040" />
            <YAxis type="category" dataKey="name" width={80} tick={{ fill: "#d4d4d4", fontSize: 14 }} stroke="#404040" />
            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 14, color: "#fff" }} formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Legend wrapperStyle={{ fontSize: 14, color: "#d4d4d4" }} />
            {allCategories.map(cat => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={catColors[cat] || "#a3a3a3"} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
