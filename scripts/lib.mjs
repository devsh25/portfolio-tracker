import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const holdingsPath = path.join(__dirname, "..", "data", "holdings.json");
export const holdings = JSON.parse(fs.readFileSync(holdingsPath, "utf8"));

const BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const UA = { "User-Agent": "Mozilla/5.0" };

async function yahoo(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function tickerList() {
  return Object.entries(holdings.tickerMeta).map(([local, m]) => ({
    local,
    yahoo: m.yahoo,
    currency: m.currency,
  }));
}

export async function fetchLatest() {
  const tickers = tickerList();
  const result = {};
  const jobs = [
    ...tickers.map(async (t) => {
      const d = await yahoo(`${BASE}/${t.yahoo}?interval=1d&range=1d`);
      const p = d.chart.result?.[0]?.meta?.regularMarketPrice;
      if (p != null) result[t.local] = p;
    }),
    (async () => {
      const d = await yahoo(`${BASE}/CAD=X?interval=1d&range=1d`);
      const p = d.chart.result?.[0]?.meta?.regularMarketPrice;
      if (p != null) result["CAD=X"] = p;
    })(),
  ];
  await Promise.all(jobs);
  return result;
}

export async function fetchHistorical(fromDate, toDate) {
  const p1 = Math.floor(fromDate.getTime() / 1000);
  const p2 = Math.floor(toDate.getTime() / 1000);
  const tickers = [
    ...tickerList().map((t) => ({ local: t.local, yahoo: t.yahoo })),
    { local: "CAD=X", yahoo: "CAD=X" },
  ];
  const out = {};
  for (const { local, yahoo: y } of tickers) {
    try {
      const d = await yahoo(`${BASE}/${y}?period1=${p1}&period2=${p2}&interval=1d`);
      const r = d.chart.result?.[0];
      const map = {};
      if (r) {
        const ts = r.timestamp || [];
        const closes = r.indicators?.quote?.[0]?.close || [];
        for (let i = 0; i < ts.length; i++) {
          if (closes[i] != null) {
            const iso = new Date(ts[i] * 1000).toISOString().slice(0, 10);
            map[iso] = closes[i];
          }
        }
      }
      out[local] = map;
    } catch (e) {
      console.error(`Historical fetch failed for ${y}: ${e.message}`);
      out[local] = {};
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}

export function computeLiquidCAD(prices) {
  const fx = prices["CAD=X"];
  if (!fx) return null;
  let total = 0;
  for (const owner of Object.values(holdings.owners)) {
    for (const acct of Object.values(owner.questrade || {})) {
      for (const [tk, qty] of Object.entries(acct)) {
        const p = prices[tk];
        const meta = holdings.tickerMeta[tk];
        if (p == null || !meta) continue;
        total += meta.currency === "CAD" ? qty * p : qty * p * fx;
      }
    }
    for (const wallet of Object.values(owner.crypto || {})) {
      for (const [tk, qty] of Object.entries(wallet)) {
        const p = prices[tk];
        if (p == null) continue;
        total += qty * p * fx;
      }
    }
    for (const [label, amt] of Object.entries(owner.cash || {})) {
      const cur = holdings.cashCurrencies[label] || "CAD";
      total += cur === "USD" ? amt * fx : amt;
    }
  }
  return total;
}

export function makeSnapshot(prices, source, timestamp = new Date()) {
  const liquidCAD = computeLiquidCAD(prices);
  if (liquidCAD == null) return null;
  const fx = prices["CAD=X"];
  return {
    timestamp: timestamp.toISOString(),
    liquidCAD: Math.round(liquidCAD),
    liquidUSD: Math.round(liquidCAD / fx),
    fxRate: +fx.toFixed(4),
    source,
  };
}
