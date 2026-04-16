"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { ChartSlice } from "@/lib/types";

interface Props { data: ChartSlice[] }

export default function AssetAllocation({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Asset Allocation</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-64 h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm font-medium text-gray-700">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{formatCAD(d.value)}</span>
                <span className="text-xs text-gray-400 ml-2">{d.percent?.toFixed(1)}%</span>
              </div>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCAD(total)} CAD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
