"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { ChartSlice } from "@/lib/types";

interface Props { data: ChartSlice[] }

export default function ConcentrationRisk({ data }: Props) {
  const highRisk = data.filter(d => (d.percent || 0) > 20);
  const moderate = data.filter(d => (d.percent || 0) > 10 && (d.percent || 0) <= 20);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Concentration Risk</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-64 h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={100} paddingAngle={1}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-gray-700">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold">{d.percent?.toFixed(1)}%</span>
                {(d.percent || 0) > 20 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">HIGH</span>}
                {(d.percent || 0) > 10 && (d.percent || 0) <= 20 && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">MODERATE</span>}
              </div>
            </div>
          ))}
          {highRisk.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <strong>Warning:</strong> {highRisk.map(d => d.name).join(", ")} exceed{highRisk.length === 1 ? "s" : ""} 20% of your portfolio
            </div>
          )}
          {moderate.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
              <strong>Watch:</strong> {moderate.map(d => d.name).join(", ")} at 10-20%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
