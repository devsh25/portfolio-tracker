import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchLatest, fetchHistorical, makeSnapshot } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data", "snapshots.json");
const BACKFILL_START = new Date("2026-01-01T12:00:00Z");

async function regenBackfill() {
  const end = new Date();
  const hist = await fetchHistorical(BACKFILL_START, end);
  const tickers = Object.keys(hist);
  const last = {};
  const snapshots = [];
  const oneDay = 86400 * 1000;

  for (let t = +BACKFILL_START; t <= +end; t += oneDay) {
    const iso = new Date(t).toISOString().slice(0, 10);
    const prices = {};
    for (const tk of tickers) {
      if (hist[tk][iso] != null) last[tk] = hist[tk][iso];
      if (last[tk] != null) prices[tk] = last[tk];
    }
    const stamp = new Date(t + 17 * 3600 * 1000);
    const snap = makeSnapshot(prices, "backfill", stamp);
    if (snap) snapshots.push(snap);
  }
  return snapshots;
}

async function liveSnap() {
  const prices = await fetchLatest();
  return makeSnapshot(prices, "live");
}

const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
const existingLive = current.filter((s) => s.source === "live");

const [backfillRes, liveRes] = await Promise.allSettled([regenBackfill(), liveSnap()]);

const backfill = backfillRes.status === "fulfilled"
  ? backfillRes.value
  : (console.error("Backfill failed:", backfillRes.reason?.message), current.filter((s) => s.source === "backfill"));

const liveSnaps = [...existingLive];
if (liveRes.status === "fulfilled" && liveRes.value) {
  liveSnaps.push(liveRes.value);
  console.log(`Live append: ${liveRes.value.timestamp} liquidCAD=${liveRes.value.liquidCAD}`);
} else if (liveRes.status === "rejected") {
  console.error("Live fetch failed:", liveRes.reason?.message);
}

const combined = [...backfill, ...liveSnaps];
fs.writeFileSync(file, JSON.stringify(combined, null, 2) + "\n");
console.log(`Saved ${backfill.length} backfill + ${liveSnaps.length} live snapshots`);
