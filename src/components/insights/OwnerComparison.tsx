"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { EntityTotal } from "@/lib/types";

interface Props { data: EntityTotal[] }

const ENTITY_COLORS: Record<string, string> = {
  Dev: "#3B82F6", Shalini: "#8B5CF6", Vegrow: "#10B981", Blockwiz: "#F97316", Seglitix: "#EC4899",
};

export default function OwnerComparison({ data }: Props) {
  const chartData = data.map(d => {
    const row: Record<string, string | number> = { name: d.entity };
    for (const b of d.breakdown) row[b.category] = Math.round(b.valueCAD);
    return row;
  });

  const allCategories = [...new Set(data.flatMap(d => d.breakdown.map(b => b.category)))];
  const catColors: Record<string, string> = {
    Questrade: "#6366F1", Crypto: "#F97316", Cash: "#10B981", "Real Estate": "#EAB308",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Owner / Entity Comparison</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {data.map(d => (
          <div key={d.entity} className="rounded-lg p-3 text-center" style={{ borderLeft: `4px solid ${ENTITY_COLORS[d.entity] || "#9CA3AF"}` }}>
            <div className="text-xs text-gray-500 uppercase tracking-wide">{d.entity}</div>
            <div className="text-lg font-bold text-gray-900">{formatCAD(d.totalCAD)}</div>
            <div className="text-xs text-gray-400">{formatCAD(d.totalUSD)} USD</div>
          </div>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Legend />
            {allCategories.map(cat => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={catColors[cat] || "#9CA3AF"} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
