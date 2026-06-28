// Cron-driven snapshot script. On every run it produces three lines of data:
//
//   1. "backfill"  — today's holdings × historical closes (approximation line)
//   2. "live" past — git-history holdings × historical closes (reconstructed)
//   3. "live" now  — current holdings × current live prices (just appended)
//
// Output is written to data/snapshots.json. Existing live entries (including
// older actual snapshots) are discarded and replaced with the reconstruction,
// so the workflow must check out with fetch-depth: 0.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { fetchLatest, fetchHistorical, makeSnapshot, holdings as currentHoldings } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data", "snapshots.json");
const BACKFILL_START = new Date("2026-01-01T12:00:00Z");

// Commits where data/holdings.json was authoritatively updated. Listed
// chronologically. Order matters; dates are read from git.
const HOLDINGS_COMMITS = [
  "9ec5170",
  "be817b8",
  "beb1830",
  "b2b5987",
  "cc29b66",
  "4e06f89",
  "e572630",
  "1bf0a85",
];

function loadHoldingsAt(commit) {
  try {
    return JSON.parse(execSync(`git show ${commit}:data/holdings.json`, { encoding: "utf8" }));
  } catch (e) {
    console.warn(`Could not load ${commit}: ${e.message}`);
    return null;
  }
}

function commitDate(commit) {
  return new Date(execSync(`git show -s --format=%aI ${commit}`, { encoding: "utf8" }).trim());
}

function computeLiquidCAD(holdings, prices) {
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

function snapAt(holdings, prices, source, timestamp) {
  const liquidCAD = computeLiquidCAD(holdings, prices);
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

// ── 1. Load all historical holdings states from git ──
const states = HOLDINGS_COMMITS
  .map((c) => {
    const holdings = loadHoldingsAt(c);
    return holdings ? { commit: c, date: commitDate(c), holdings } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.date - b.date);

console.log(`Loaded ${states.length} historical holdings states`);

// ── 2. Fetch historical prices for the union of all tickers ever held ──
const fetchHist = await fetchHistorical(BACKFILL_START, new Date()).catch((e) => {
  console.error("Historical fetch failed:", e.message);
  return null;
});

// ── 3. Walk day-by-day from BACKFILL_START to today, emit backfill + live ──
const oneDay = 86400 * 1000;
const end = new Date();
const backfillSnaps = [];
const liveHistorySnaps = [];
const lastPrice = {};

if (fetchHist) {
  for (let t = +BACKFILL_START; t <= +end; t += oneDay) {
    const iso = new Date(t).toISOString().slice(0, 10);

    for (const tk of Object.keys(fetchHist)) {
      if (fetchHist[tk][iso] != null) lastPrice[tk] = fetchHist[tk][iso];
    }
    if (lastPrice["CAD=X"] == null) continue;

    const stamp = new Date(t + 17 * 3600 * 1000);

    // Backfill: TODAY's quantities × this day's prices
    const bSnap = snapAt(currentHoldings, lastPrice, "backfill", stamp);
    if (bSnap) backfillSnaps.push(bSnap);

    // Live history: holdings state ACTIVE on this date × this day's prices
    let active = states[0];
    for (const s of states) {
      if (s.date <= new Date(t)) active = s;
      else break;
    }
    if (active) {
      const lSnap = snapAt(active.holdings, lastPrice, "live", stamp);
      if (lSnap) liveHistorySnaps.push(lSnap);
    }
  }
}

// ── 4. Append a fresh live snapshot using current holdings + live prices ──
let nowLive = null;
try {
  const livePrices = await fetchLatest();
  nowLive = makeSnapshot(livePrices, "live");
  if (nowLive) console.log(`Live now: ${nowLive.timestamp} liquidCAD=${nowLive.liquidCAD}`);
} catch (e) {
  console.error("Live fetch failed:", e.message);
}

// ── 5. Persist ──
const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];

let backfill = backfillSnaps;
let live = liveHistorySnaps;

if (!fetchHist) {
  // Historical fetch failed — keep existing backfill + live and only append nowLive
  backfill = existing.filter((s) => s.source === "backfill");
  live = existing.filter((s) => s.source === "live");
}

if (nowLive) {
  // Avoid duplicate same-day live entries when reconstruction also produced today
  const todayIso = nowLive.timestamp.slice(0, 10);
  live = live.filter((s) => s.timestamp.slice(0, 10) !== todayIso);
  live.push(nowLive);
}

const combined = [...backfill, ...live];
fs.writeFileSync(file, JSON.stringify(combined, null, 2) + "\n");
console.log(`Saved ${backfill.length} backfill + ${live.length} live snapshots`);
