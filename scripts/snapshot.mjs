import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchLatest, fetchHistorical, makeSnapshot } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data", "snapshots.json");
const BACKFILL_START = new Date("2026-01-01T12:00:00Z");

async function backfill() {
  console.log("Empty snapshots — running one-time backfill from 2026-01-01");
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

  fs.writeFileSync(file, JSON.stringify(snapshots, null, 2) + "\n");
  console.log(`Backfilled ${snapshots.length} daily snapshots`);
}

async function appendLive() {
  const existing = JSON.parse(fs.readFileSync(file, "utf8"));
  const prices = await fetchLatest();
  const snap = makeSnapshot(prices, "live");
  if (!snap) {
    console.error("Live fetch incomplete — skipping append");
    process.exit(1);
  }
  existing.push(snap);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2) + "\n");
  console.log(`Appended: ${snap.timestamp} liquidCAD=${snap.liquidCAD}`);
}

const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
if (current.length === 0) {
  await backfill();
} else {
  await appendLive();
}
