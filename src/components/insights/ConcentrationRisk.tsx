"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { ChartSlice } from "@/lib/types";

interface Props { data: ChartSlice[] }

export default function ConcentrationRisk({ data }: Props) {
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
              <span className="text-sm font-mono font-semibold text-white tabular-nums">{d.percent?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
