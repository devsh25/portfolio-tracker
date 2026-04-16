"use client";

import { formatCAD } from "@/lib/calculations";

interface Props {
  currentCAD: number;
  currentUSD: number;
}

export default function NetWorthTrend({ currentCAD, currentUSD }: Props) {
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Net Worth Trend</h3>
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-8 text-center text-white mb-4">
        <div className="text-sm text-gray-300 uppercase tracking-wide">Total Net Worth</div>
        <div className="text-4xl font-bold mt-2">{formatCAD(currentCAD)} CAD</div>
        <div className="text-lg text-gray-300 mt-1">{formatCAD(currentUSD)} USD</div>
        <div className="text-xs text-gray-400 mt-3">As of {today}</div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>Coming soon:</strong> Monthly snapshots will be stored automatically. After 2+ months of data, a trend line chart will appear here showing your net worth over time.
      </div>
    </div>
  );
}
