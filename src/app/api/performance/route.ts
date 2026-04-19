import { NextResponse } from "next/server";
import holdingsData from "../../../../data/holdings.json";

interface YahooChartResult {
  chart: {
    result: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: (number | null)[] }> };
    }>;
  };
}

interface AssetPerformance {
  ticker: string;
  name: string;
  pctChange: number;
  startPrice: number;
  endPrice: number;
  startDate: string;
  endDate: string;
}

let cached: AssetPerformance[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const YEAR_START_UNIX = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);

export async function GET() {
  const now = Date.now();
  if (cached && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ data: cached, cached: true });
  }

  const tickers = Object.entries(holdingsData.tickerMeta);
  const nowUnix = Math.floor(now / 1000);
  const results: AssetPerformance[] = [];

  await Promise.all(
    tickers.map(async ([local, meta]) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${meta.yahoo}?period1=${YEAR_START_UNIX}&period2=${nowUnix}&interval=1d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 3600 },
        });
        const data: YahooChartResult = await res.json();
        const r = data.chart.result?.[0];
        const ts = r?.timestamp || [];
        const closes = (r?.indicators?.quote?.[0]?.close || []).filter((c): c is number => c != null);
        if (closes.length < 2 || ts.length < 2) return;

        const startPrice = closes[0];
        const endPrice = closes[closes.length - 1];
        const pctChange = ((endPrice - startPrice) / startPrice) * 100;

        results.push({
          ticker: local,
          name: meta.name,
          pctChange,
          startPrice,
          endPrice,
          startDate: new Date(ts[0] * 1000).toISOString().slice(0, 10),
          endDate: new Date(ts[ts.length - 1] * 1000).toISOString().slice(0, 10),
        });
      } catch (e) {
        console.error(`Performance fetch failed for ${meta.yahoo}:`, e);
      }
    })
  );

  results.sort((a, b) => b.pctChange - a.pctChange);
  cached = results;
  cacheTimestamp = now;

  return NextResponse.json({ data: results, cached: false });
}
