import { NextResponse } from "next/server";
import holdingsData from "../../../../data/holdings.json";

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        currency: string;
      };
    }>;
  };
}

let cachedPrices: Record<string, { price: number; currency: "USD" | "CAD" }> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();
  if (cachedPrices && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ prices: cachedPrices, cached: true, timestamp: cacheTimestamp });
  }

  const tickers = Object.values(holdingsData.tickerMeta).map((m) => m.yahoo);
  tickers.push("CAD=X"); // USD/CAD FX rate
  tickers.push("CADINR=X"); // CAD/INR FX rate

  const prices: Record<string, { price: number; currency: "USD" | "CAD" }> = {};
  const yahooToLocal: Record<string, string> = {};
  for (const [local, meta] of Object.entries(holdingsData.tickerMeta)) {
    yahooToLocal[meta.yahoo] = local;
  }

  await Promise.all(
    tickers.map(async (yahooTicker) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 300 },
        });
        const data: YahooChartResult = await res.json();
        const meta = data.chart.result[0].meta;
        const price = meta.regularMarketPrice;
        const currency = meta.currency === "CAD" ? "CAD" as const : "USD" as const;

        if (yahooTicker === "CAD=X") {
          prices["CAD=X"] = { price, currency: "CAD" };
        } else if (yahooTicker === "CADINR=X") {
          prices["CADINR=X"] = { price, currency: "CAD" };
        } else {
          const localTicker = yahooToLocal[yahooTicker];
          if (localTicker) {
            prices[localTicker] = { price, currency };
          }
        }
      } catch (e) {
        console.error(`Failed to fetch ${yahooTicker}:`, e);
      }
    })
  );

  cachedPrices = prices;
  cacheTimestamp = now;

  return NextResponse.json({ prices, cached: false, timestamp: now });
}
