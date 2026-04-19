"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { ChartSlice } from "@/lib/types";

interface Props { data: ChartSlice[] }

export default function ConcentrationRisk({ data }: Props) {
  const highRisk = data.filter(d => (d.percent || 0) > 20);
  const moderate = data.filter(d => (d.percent || 0) > 10 && (d.percent || 0) <= 20);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Concentration Risk</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-64 h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={100} paddingAngle={1} stroke="#0a0a0a">
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 14, color: "#fff" }} formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-neutral-300">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold text-white tabular-nums">{d.percent?.toFixed(1)}%</span>
                {(d.percent || 0) > 20 && <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">High</span>}
                {(d.percent || 0) > 10 && (d.percent || 0) <= 20 && <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Mod</span>}
              </div>
            </div>
          ))}
          {highRisk.length > 0 && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              <strong className="text-red-400">Warning:</strong> {highRisk.map(d => d.name).join(", ")} exceed{highRisk.length === 1 ? "s" : ""} 20% of your portfolio
            </div>
          )}
          {moderate.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
              <strong className="text-amber-400">Watch:</strong> {moderate.map(d => d.name).join(", ")} at 10-20%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
