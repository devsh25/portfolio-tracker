"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { CountryTotal } from "@/lib/types";

interface Props { data: CountryTotal[] }

const FLAG: Record<string, string> = { USA: "\ud83c\uddfa\ud83c\uddf8", Canada: "\ud83c\udde8\ud83c\udde6", India: "\ud83c\uddee\ud83c\uddf3", Global: "\ud83c\udf0d" };
const COLORS: Record<string, string> = { USA: "#3B82F6", Canada: "#EF4444", India: "#F97316", Global: "#8B5CF6" };

export default function CountryExposure({ data }: Props) {
  const total = data.reduce((s, d) => s + d.totalCAD, 0);
  const chartData = data.map(d => ({ name: d.country, value: Math.round(d.totalCAD) }));

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Country Exposure</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {data.map(d => {
          const pct = ((d.totalCAD / total) * 100).toFixed(1);
          return (
            <div key={d.country} className="rounded-lg p-4 bg-gray-50 border" style={{ borderLeftColor: COLORS[d.country] || "#9CA3AF", borderLeftWidth: 4 }}>
              <div className="text-2xl mb-1">{FLAG[d.country] || "\ud83c\udf10"}</div>
              <div className="text-sm font-bold text-gray-800">{d.country}</div>
              <div className="text-lg font-bold text-gray-900">{formatCAD(d.totalCAD)}</div>
              <div className="text-xs text-gray-500">{pct}% of total</div>
              <div className="text-xs text-gray-400 mt-1">{d.assets.slice(0, 4).join(", ")}{d.assets.length > 4 ? "..." : ""}</div>
            </div>
          );
        })}
      </div>
      <div className="h-48">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Bar dataKey="value" fill="#6366F1">
              {chartData.map((d, i) => (
                <Cell key={i} fill={COLORS[d.name] || "#9CA3AF"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
