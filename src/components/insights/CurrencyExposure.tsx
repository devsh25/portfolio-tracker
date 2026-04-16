"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { ChartSlice } from "@/lib/types";

interface Props { data: ChartSlice[] }

const FLAG: Record<string, string> = { USD: "\ud83c\uddfa\ud83c\uddf8", CAD: "\ud83c\udde8\ud83c\udde6", INR: "\ud83c\uddee\ud83c\uddf3" };

export default function CurrencyExposure({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Currency Exposure</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-56 h-56">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-4">
          {data.map(d => (
            <div key={d.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{FLAG[d.name] || ""} {d.name}</span>
                <span className="text-sm font-bold">{formatCAD(d.value)} <span className="text-gray-400 font-normal">({d.percent?.toFixed(1)}%)</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${d.percent}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
