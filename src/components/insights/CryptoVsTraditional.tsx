"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCAD } from "@/lib/calculations";
import type { WhatIfScenario } from "@/lib/types";

interface Props {
  current: { cryptoCAD: number; traditionalCAD: number; cryptoPct: number };
  scenarios: WhatIfScenario[];
}

export default function CryptoVsTraditional({ current, scenarios }: Props) {
  const chartData = scenarios.map(s => ({
    name: s.label,
    Crypto: Math.round(s.cryptoCAD),
    Traditional: Math.round(s.traditionalCAD),
    pct: s.cryptoPct.toFixed(1),
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Crypto vs Traditional</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-xs text-orange-600 uppercase tracking-wide">Crypto</div>
          <div className="text-xl font-bold text-orange-700">{formatCAD(current.cryptoCAD)}</div>
          <div className="text-sm text-orange-500">{current.cryptoPct.toFixed(1)}% of portfolio</div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <div className="text-xs text-indigo-600 uppercase tracking-wide">Traditional + RE</div>
          <div className="text-xl font-bold text-indigo-700">{formatCAD(current.traditionalCAD)}</div>
          <div className="text-sm text-indigo-500">{(100 - current.cryptoPct).toFixed(1)}% of portfolio</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
          <div className="text-xl font-bold text-gray-900">{formatCAD(current.cryptoCAD + current.traditionalCAD)}</div>
        </div>
      </div>
      <h4 className="text-sm font-semibold text-gray-600 mb-3">What-If Scenarios</h4>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
            <Tooltip formatter={(v) => formatCAD(Number(v)) + " CAD"} />
            <Legend />
            <Bar dataKey="Crypto" fill="#F97316" />
            <Bar dataKey="Traditional" fill="#6366F1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {scenarios.map(s => (
          <div key={s.label} className={`text-center p-2 rounded text-xs ${s.label === "Current" ? "bg-gray-100 font-bold" : "bg-gray-50"}`}>
            <div className="text-gray-500">{s.label}</div>
            <div className="font-bold text-gray-800">Crypto: {s.cryptoPct.toFixed(0)}%</div>
            <div className="text-gray-500">{formatCAD(s.totalCAD)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
