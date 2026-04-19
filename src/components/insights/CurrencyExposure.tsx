"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { ChartSlice } from "@/lib/types";

interface Props { data: ChartSlice[] }

const FLAG: Record<string, string> = { USD: "\ud83c\uddfa\ud83c\uddf8", CAD: "\ud83c\udde8\ud83c\udde6", INR: "\ud83c\uddee\ud83c\uddf3" };

export default function CurrencyExposure({ data }: Props) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-4">Currency Exposure</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-56 h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} stroke="#0a0a0a">
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 8, fontSize: 14, color: "#fff" }} formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-4">
          {data.map(d => (
            <div key={d.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-neutral-200">{FLAG[d.name] || ""} {d.name}</span>
                <span className="text-sm font-semibold text-white tabular-nums">{formatCAD(d.value)} <span className="text-neutral-400 font-normal">({d.percent?.toFixed(1)}%)</span></span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${d.percent}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
