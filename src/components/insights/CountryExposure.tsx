"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { CountryTotal } from "@/lib/types";

interface Props { data: CountryTotal[] }

const FLAG: Record<string, string> = { USA: "\ud83c\uddfa\ud83c\uddf8", Canada: "\ud83c\udde8\ud83c\udde6", India: "\ud83c\uddee\ud83c\uddf3", Global: "\ud83c\udf0d" };
const COLORS: Record<string, string> = { USA: "#22d3ee", Canada: "#f87171", India: "#fb923c", Global: "#a78bfa" };

export default function CountryExposure({ data }: Props) {
  const total = data.reduce((s, d) => s + d.totalCAD, 0);
  const chartData = data.map(d => ({ name: d.country, value: Math.round(d.totalCAD) }));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Country Exposure</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {data.map(d => {
          const pct = ((d.totalCAD / total) * 100).toFixed(1);
          return (
            <div key={d.country} className="rounded-lg p-4 bg-neutral-950 border-l-4" style={{ borderLeftColor: COLORS[d.country] || "#525252" }}>
              <div className="text-2xl mb-1">{FLAG[d.country] || "\ud83c\udf10"}</div>
              <div className="text-sm font-semibold text-neutral-200">{d.country}</div>
              <div className="text-lg font-bold text-white tabular-nums">{formatCAD(d.totalCAD)}</div>
              <div className="text-xs text-neutral-400 tabular-nums">{pct}% of total</div>
              <div className="text-[10px] text-neutral-400 mt-1">{d.assets.slice(0, 4).join(", ")}{d.assets.length > 4 ? "..." : ""}</div>
            </div>
          );
        })}
      </div>
      <div className="h-48">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="name" tick={{ fill: "#d4d4d4", fontSize: 14 }} stroke="#404040" />
            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: "#a3a3a3", fontSize: 13 }} stroke="#404040" />
            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 14, color: "#fff" }} cursor={{ fill: "#262626" }} formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Bar dataKey="value">
              {chartData.map((d, i) => (
                <Cell key={i} fill={COLORS[d.name] || "#a3a3a3"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
