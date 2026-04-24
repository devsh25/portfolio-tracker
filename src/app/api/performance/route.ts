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

interface PeriodChanges {
  "7d": number | null;
  "30d": number | null;
  "3m": number | null;
  "6m": number | null;
  "1y": number | null;
  ytd: number | null;
}

export interface AssetPerformance {
  ticker: string;
  name: string;
  startPrice: number;
  endPrice: number;
  startDate: string;
  endDate: string;
  pctChange: number; // YTD, kept for backward compat
  changes: PeriodChanges;
}

let cached: AssetPerformance[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const DAY = 86400;
const YEAR_START_UNIX = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);

function pctChangeAtOffset(timestamps: number[], closes: number[], targetUnix: number): number | null {
  let idx = -1;
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (timestamps[i] <= targetUnix) { idx = i; break; }
  }
  if (idx < 0) return null;
  const older = closes[idx];
  const latest = closes[closes.length - 1];
  if (older == null || latest == null || older === 0) return null;
  return ((latest - older) / older) * 100;
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ data: cached, cached: true });
  }

  const tickers = Object.entries(holdingsData.tickerMeta);
  const nowUnix = Math.floor(now / 1000);
  const startUnix = nowUnix - 400 * DAY; // cover 1y period with buffer
  const results: AssetPerformance[] = [];

  await Promise.all(
    tickers.map(async ([local, meta]) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${meta.yahoo}?period1=${startUnix}&period2=${nowUnix}&interval=1d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 3600 },
        });
        const data: YahooChartResult = await res.json();
        const r = data.chart.result?.[0];
        const tsAll = r?.timestamp || [];
        const closesAll = (r?.indicators?.quote?.[0]?.close || []);
        // Filter out null closes but keep aligned timestamps
        const timestamps: number[] = [];
        const closes: number[] = [];
        for (let i = 0; i < tsAll.length; i++) {
          if (closesAll[i] != null) {
            timestamps.push(tsAll[i]);
            closes.push(closesAll[i] as number);
          }
        }
        if (closes.length < 2) return;

        // YTD: first close at or after Jan 1, 2026
        let ytdIdx = 0;
        for (let i = 0; i < timestamps.length; i++) {
          if (timestamps[i] >= YEAR_START_UNIX) { ytdIdx = i; break; }
        }
        const ytdStartPrice = closes[ytdIdx];
        const endPrice = closes[closes.length - 1];
        const ytdPct = ((endPrice - ytdStartPrice) / ytdStartPrice) * 100;

        const changes: PeriodChanges = {
          "7d": pctChangeAtOffset(timestamps, closes, nowUnix - 7 * DAY),
          "30d": pctChangeAtOffset(timestamps, closes, nowUnix - 30 * DAY),
          "3m": pctChangeAtOffset(timestamps, closes, nowUnix - 90 * DAY),
          "6m": pctChangeAtOffset(timestamps, closes, nowUnix - 180 * DAY),
          "1y": pctChangeAtOffset(timestamps, closes, nowUnix - 365 * DAY),
          ytd: ytdPct,
        };

        results.push({
          ticker: local,
          name: meta.name,
          startPrice: ytdStartPrice,
          endPrice,
          startDate: new Date(timestamps[ytdIdx] * 1000).toISOString().slice(0, 10),
          endDate: new Date(timestamps[timestamps.length - 1] * 1000).toISOString().slice(0, 10),
          pctChange: ytdPct,
          changes,
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
