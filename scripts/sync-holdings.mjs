// scripts/sync-holdings.mjs
//
// Reads files from ~/Claude Folder/personal/Finance/ (configurable via
// FINANCE_DIR env var) and regenerates data/holdings.json. Uses Claude
// Sonnet 4.6 with vision for PDFs and images; parses CSVs as text.
//
// Inputs:
//   <FINANCE_DIR>/manual.yaml                       — canonical config (RRSP/TFSA splits,
//                                                     real estate, ticker metadata, entity mappings)
//   <FINANCE_DIR>/portfolio/Questrade/*.{csv,png,jpg,pdf}  — Questrade holdings
//   <FINANCE_DIR>/portfolio/crypto/ledgerwallet-*.csv     — Ledger transaction log
//   <FINANCE_DIR>/portfolio/crypto/coinbase/*.csv         — Coinbase transactions
//   <FINANCE_DIR>/{scotia,bmo,wise,bank}/*.{pdf,png,jpg}  — bank statements/screenshots
//
// Output: data/holdings.json (regenerated; includes lastUpdated)
//
// Setup: ANTHROPIC_API_KEY must be set. Run with `npm run sync`.

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import Anthropic from "@anthropic-ai/sdk";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FINANCE_DIR = process.env.FINANCE_DIR || path.join(os.homedir(), "Claude Folder", "personal", "Finance");
const HOLDINGS_OUT = path.join(REPO_ROOT, "data", "holdings.json");
const MANUAL_YAML = path.join(FINANCE_DIR, "manual.yaml");

const MODEL = "claude-sonnet-4-6";
const client = new Anthropic();

// ── Claude extraction with prompt caching ──────────────────────────────────
const EXTRACT_SYSTEM = `You extract structured financial data from files (PDFs, images, CSVs).
Return ONLY valid JSON matching the schema in the user message. No prose, no markdown.
- Numbers must be numbers (not strings). For "$1,234.56" return 1234.56.
- Use null for unclear/missing fields.
- Quantities: preserve full precision.
- For transaction logs, compute net balance per asset: sum(IN) - sum(OUT) - sum(FEES).
- For bank statements, extract the most recent / current / closing / available balance.
- Bank names: "BMO" not "Bank of Montreal", "Scotia" not "Scotiabank", "Wise" not "TransferWise".`;

function makeContentBlock(ext, data) {
  if (ext === ".pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: data.toString("base64") },
    };
  }
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
    const mt =
      ext === ".png" ? "image/png" :
      ext === ".webp" ? "image/webp" :
      ext === ".gif" ? "image/gif" : "image/jpeg";
    return {
      type: "image",
      source: { type: "base64", media_type: mt, data: data.toString("base64") },
    };
  }
  return { type: "text", text: data.toString("utf8") };
}

async function extract(filePath, instruction, schema, maxTokens = 4096) {
  const ext = path.extname(filePath).toLowerCase();
  const data = await fs.readFile(filePath);
  const block = makeContentBlock(ext, data);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [
      { type: "text", text: EXTRACT_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    output_config: { format: { type: "json_schema", schema } },
    messages: [
      { role: "user", content: [block, { type: "text", text: instruction }] },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("No text in response");
  return JSON.parse(text);
}

// ── Per-file-type schemas + instructions ───────────────────────────────────

const BANK_SCHEMA = {
  type: "object",
  properties: {
    bank: { type: "string", description: "BMO, Scotia, Wise, etc." },
    account_holder: { type: ["string", "null"], description: "Name on the account if visible" },
    account_number_last4: { type: ["string", "null"], description: "Last 4 of account number if shown" },
    account_type: { type: ["string", "null"], description: "Chequing, Savings, etc" },
    currency: { type: "string", enum: ["CAD", "USD"] },
    balance: { type: "number" },
  },
  required: ["bank", "currency", "balance"],
  additionalProperties: false,
};

const LEDGER_SCHEMA = {
  type: "object",
  properties: {
    balances: {
      type: "object",
      description: "Asset symbol -> net balance",
      additionalProperties: { type: "number" },
    },
  },
  required: ["balances"],
  additionalProperties: false,
};

const QUEST_SCHEMA = {
  type: "object",
  properties: {
    account_holder: { type: ["string", "null"] },
    account_type: { type: ["string", "null"], description: "RRSP, TFSA, Cash, or Margin" },
    holdings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          quantity: { type: "number" },
        },
        required: ["symbol", "quantity"],
        additionalProperties: false,
      },
    },
    cash_balance: { type: ["number", "null"] },
  },
  required: ["holdings"],
  additionalProperties: false,
};

const extractBank = (f) =>
  extract(f, "Extract the current/closing/available balance from this bank statement or banking app screenshot. If multiple accounts are shown, pick the chequing account. Return JSON.", BANK_SCHEMA);

const extractLedger = (f) =>
  extract(f, "This is a Ledger Live transaction CSV. Compute net balance per asset (sum IN - OUT - FEES). Return {balances: {SYMBOL: amount}}.", LEDGER_SCHEMA, 8192);

const extractCoinbase = (f) =>
  extract(f, "This is a Coinbase transaction CSV. Compute net balance per asset across all transactions (buys add, sells/sends subtract, conversions both, rewards add). Return {balances: {SYMBOL: amount}}.", LEDGER_SCHEMA, 8192);

const extractQuestrade = (f) =>
  extract(f, "Extract Questrade account holdings (symbol + quantity per row). Identify the account holder and account type (RRSP/TFSA/Cash). For multi-account screens, return the largest single account. Return JSON.", QUEST_SCHEMA, 4096);

// ── File discovery ─────────────────────────────────────────────────────────
async function findFiles(dir, extensions) {
  if (!fssync.existsSync(dir)) return [];
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findFiles(p, extensions)));
    else if (extensions.some((x) => e.name.toLowerCase().endsWith(x))) out.push(p);
  }
  return out;
}

async function newest(files) {
  if (files.length === 0) return null;
  const stats = await Promise.all(
    files.map(async (f) => ({ f, m: (await fs.stat(f)).mtimeMs })),
  );
  stats.sort((a, b) => b.m - a.m);
  return stats[0].f;
}

// ── Bank account matching ──────────────────────────────────────────────────
function matchBankAccount(rec, bankMap, holdings) {
  // Try explicit map first: "BMO 9037" → "Vegrow BMO"
  const keys = [
    `${rec.bank}-${rec.account_number_last4}`,
    `${rec.bank} ${rec.account_number_last4}`,
    rec.account_holder ? `${rec.account_holder}-${rec.bank}` : null,
  ].filter(Boolean);
  for (const k of keys) if (bankMap[k]) return bankMap[k];

  // Fuzzy: match account name in holdings.json against bank + holder
  const bank = rec.bank.toLowerCase();
  const holder = (rec.account_holder || "").toLowerCase();
  for (const owner of Object.values(holdings.owners || {})) {
    for (const name of Object.keys(owner.cash || {})) {
      const lower = name.toLowerCase();
      if (!lower.includes(bank)) continue;
      // Strong match: account name contains bank AND a holder/entity word
      if (holder) {
        const firstWord = holder.split(/\s+/)[0];
        if (firstWord && lower.includes(firstWord)) return name;
      }
      // Weak match: only one cash account with this bank — assume it
    }
  }
  return null;
}

// ── Build final holdings.json ──────────────────────────────────────────────
function buildHoldings({ manual, ledgerBalances, coinbaseBalances, bankRecords }) {
  const today = new Date().toISOString().slice(0, 10);
  const holdings = JSON.parse(JSON.stringify(manual.holdingsScaffold || {}));
  holdings.lastUpdated = today;
  holdings.notes = `Auto-generated by scripts/sync-holdings.mjs on ${today}`;

  // Apply crypto balances under Dev (per current entity mapping)
  if (holdings.owners?.Dev) {
    holdings.owners.Dev.crypto = holdings.owners.Dev.crypto || {};
    if (Object.keys(ledgerBalances).length > 0) {
      holdings.owners.Dev.crypto.Ledger = ledgerBalances;
    }
    if (Object.keys(coinbaseBalances).length > 0) {
      holdings.owners.Dev.crypto.Coinbase = coinbaseBalances;
    }
    // Binance stays from scaffold (manual maintenance)
  }

  // Apply bank balances by matching account labels
  const bankMap = manual.bankAccountMap || {};
  const bankUpdates = [];
  for (const rec of bankRecords) {
    const key = matchBankAccount(rec, bankMap, holdings);
    if (!key) {
      bankUpdates.push({ ...rec, matched: null });
      continue;
    }
    for (const o of Object.values(holdings.owners)) {
      if (o.cash && key in o.cash) {
        const before = o.cash[key];
        o.cash[key] = rec.balance;
        bankUpdates.push({ ...rec, matched: key, before });
        break;
      }
    }
  }

  return { holdings, bankUpdates };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set. Export it first: `export ANTHROPIC_API_KEY=sk-ant-...`");
  }
  if (!fssync.existsSync(FINANCE_DIR)) {
    throw new Error(`Finance dir not found: ${FINANCE_DIR}\nSet FINANCE_DIR env var to override.`);
  }
  if (!fssync.existsSync(MANUAL_YAML)) {
    throw new Error(
      `${MANUAL_YAML} not found.\n` +
      `Copy scripts/manual.yaml.example to that path and fill in your account mappings + scaffold.`,
    );
  }

  console.log(`Reading from ${FINANCE_DIR}`);
  const manual = yaml.load(await fs.readFile(MANUAL_YAML, "utf8")) || {};

  // ── Crypto: Ledger ────────────────────────────────
  console.log("→ Ledger CSV...");
  const cryptoDir = path.join(FINANCE_DIR, "portfolio", "crypto");
  const ledgerCSVs = (await findFiles(cryptoDir, [".csv"])).filter((f) =>
    path.basename(f).toLowerCase().startsWith("ledgerwallet"),
  );
  const ledgerLatest = await newest(ledgerCSVs);
  const ledgerBalances = ledgerLatest ? (await extractLedger(ledgerLatest)).balances : {};
  console.log(`  ${ledgerLatest ? path.basename(ledgerLatest) : "(none)"}: ${Object.keys(ledgerBalances).length} assets`);

  // ── Crypto: Coinbase ──────────────────────────────
  console.log("→ Coinbase CSVs...");
  const coinbaseCSVs = await findFiles(path.join(cryptoDir, "coinbase"), [".csv"]);
  const coinbaseBalances = {};
  for (const csv of coinbaseCSVs) {
    try {
      const r = await extractCoinbase(csv);
      for (const [a, b] of Object.entries(r.balances)) {
        coinbaseBalances[a] = (coinbaseBalances[a] || 0) + b;
      }
    } catch (e) {
      console.warn(`  ! ${path.basename(csv)}: ${e.message}`);
    }
  }
  console.log(`  ${coinbaseCSVs.length} files → ${Object.keys(coinbaseBalances).length} assets`);

  // ── Bank statements/screenshots ───────────────────
  console.log("→ Bank files...");
  const bankFiles = [];
  for (const sub of ["scotia", "bmo", "wise", "bank"]) {
    bankFiles.push(...(await findFiles(path.join(FINANCE_DIR, sub), [".pdf", ".png", ".jpg", ".jpeg", ".webp"])));
  }
  const bankRecords = [];
  for (const f of bankFiles) {
    try {
      const r = await extractBank(f);
      bankRecords.push({ ...r, source: path.relative(FINANCE_DIR, f) });
    } catch (e) {
      console.warn(`  ! ${path.basename(f)}: ${e.message}`);
    }
  }
  console.log(`  ${bankFiles.length} files → ${bankRecords.length} records`);

  // ── Build & write ─────────────────────────────────
  const { holdings, bankUpdates } = buildHoldings({
    manual,
    ledgerBalances,
    coinbaseBalances,
    bankRecords,
  });

  await fs.writeFile(HOLDINGS_OUT, JSON.stringify(holdings, null, 2) + "\n");
  console.log(`\n✓ Wrote ${path.relative(REPO_ROOT, HOLDINGS_OUT)}`);

  // ── Summary report ────────────────────────────────
  console.log("\n— Crypto (Ledger) —");
  for (const [k, v] of Object.entries(ledgerBalances)) console.log(`  ${k}: ${v}`);
  console.log("— Crypto (Coinbase) —");
  for (const [k, v] of Object.entries(coinbaseBalances)) console.log(`  ${k}: ${v}`);
  console.log("— Bank updates —");
  for (const u of bankUpdates) {
    if (u.matched) {
      const delta = u.before != null ? ` (was ${u.before})` : "";
      console.log(`  ✓ ${u.matched}: ${u.balance} ${u.currency}${delta} ← ${u.source}`);
    } else {
      console.log(`  ? unmatched: ${u.bank} ${u.account_holder || ""} ${u.account_number_last4 || ""} = ${u.balance} ${u.currency} ← ${u.source}`);
    }
  }
  if (bankUpdates.some((u) => !u.matched)) {
    console.log(
      "\nUnmatched bank records — add an entry to manual.yaml > bankAccountMap.\n" +
      "  Format: \"BMO 9037\": \"Vegrow BMO\"  (where 9037 is account_number_last4 from extraction)",
    );
  }
}

main().catch((e) => {
  console.error(e.stack || e);
  process.exit(1);
});
