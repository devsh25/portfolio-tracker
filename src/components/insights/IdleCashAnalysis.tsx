"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCAD } from "@/lib/calculations";

interface Props {
  totalCashCAD: number;
  projections: { years: number; at7pct: number; at10pct: number; at12pct: number }[];
}

export default function IdleCashAnalysis({ totalCashCAD, projections }: Props) {
  const chartData = projections.map(p => ({
    name: `${p.years}Y`,
    "7% (Conservative)": Math.round(p.at7pct),
    "10% (S&P 500 Avg)": Math.round(p.at10pct),
    "12% (Aggressive)": Math.round(p.at12pct),
  }));

  const gain10y = projections[3]?.at10pct - totalCashCAD;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Idle Cash Analysis</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs text-green-600 uppercase tracking-wide">Cash Sitting Idle</div>
          <div className="text-2xl font-bold text-green-700">{formatCAD(totalCashCAD)} CAD</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="text-xs text-amber-600 uppercase tracking-wide">Opportunity Cost (10Y @ 10%)</div>
          <div className="text-2xl font-bold text-amber-700">+{formatCAD(gain10y)} CAD</div>
          <div className="text-xs text-amber-500">Could grow to {formatCAD(projections[3]?.at10pct)}</div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Legend />
            <Bar dataKey="7% (Conservative)" fill="#10B981" />
            <Bar dataKey="10% (S&P 500 Avg)" fill="#3B82F6" />
            <Bar dataKey="12% (Aggressive)" fill="#F97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
