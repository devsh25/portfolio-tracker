# Portfolio Tracker - Claude Context

## CRITICAL: Sync rule — read this first, every session

Dev edits this repo from both **mobile (Claude sessions)** and **laptop (direct git)**. `main` on GitHub is the single source of truth; Vercel auto-deploys it. Before ANY edit:

1. **Fetch and inspect `main` first.** Run `git fetch origin main` and review `git log origin/main -20` to see what the laptop (or a previous mobile session) has pushed. NEVER assume the local working copy is up to date.
2. **Branch off the latest `origin/main`**, not whatever HEAD happens to be.
3. **Check if the feature already exists on main** before implementing. The laptop may have already added the thing the user is asking about, in which case the right action is to point that out (and fix/refresh, not reimplement).
4. **Never push to a stale designated branch without rebasing onto `origin/main` first.** If the assigned branch has diverged from main, reset it to main before adding new commits.
5. **Always open a PR targeting `main`** and offer to merge it (or set auto-merge if enabled) so both devices converge.

This rule must NEVER be ignored. Skipping it causes duplicate/conflicting implementations that the user then has to untangle.

## What This Is
A personal portfolio tracker for Dev Sharma's household investments across Questrade, crypto wallets, and bank accounts. Deployed on Vercel with live Yahoo Finance prices.

## Owners
- **Dev** - Primary account holder. Holds stocks (RRSP), ETFs (TFSA/Cash), all crypto, and multiple bank accounts
- **Shalini** - Holds stocks (RRSP), ETFs (TFSA/Cash), one bank account
- **Vegrow** - Business entity. Holds ETFs + CASH.TO in a Questrade Cash account, one BMO bank account

## Data Sources

### Questrade (Stocks + ETFs)
- **Source of truth for quantities**: Portfolio CSV at `~/Claude Folder/personal/Finance/portfolio/Questrade/April 15 2025.csv`
- **Account type mapping** (RRSP/TFSA/Cash): From Questrade PDF statements at `~/Claude Folder/personal/Finance/quest/`
- **Vegrow holdings**: Confirmed via live Questrade screenshot (April 16, 2026)
- The portfolio CSV has owner-level totals (Dev/Shalini/Vegrow). The PDF statements have account-level detail.
- When CSV says "Dev VFV.TO = 2247", that's the TOTAL across RRSP+TFSA+Cash. Use PDFs to split:
  - Dev TFSA: 213 VFV, 271 ZID
  - Dev Cash: 2034 VFV, 52.03 MSFT (remaining after RRSP's 8)

### Crypto
- **Ledger wallet**: Transaction history at `~/Claude Folder/personal/Finance/portfolio/crypto/ledgerwallet-operations-2026.04.16.csv`
  - Calculate net balances from IN/OUT/FEES transactions
  - Main holdings: BTC 4.9485, ETH 38.547, SOL 84.894, XRP 369.5, LTC 2.62, MANA 2222.76, SAND 2469.47
  - Stablecoins: USDC 48994.46, USDT 55.73
  - Small/negligible: HEX, MALLY, AVA_, MTV
- **Coinbase**: CSVs at `~/Claude Folder/personal/Finance/portfolio/crypto/coinbase/`
  - Main holding: BTC 0.7158 (from Celsius distributions)
  - Most other crypto was sold in 2024
- **Binance**: Not in files, quantities from portfolio CSV
  - BNB 22.63, TRX 35865

### Bank Cash (user-provided balances, April 16 2026)
- Dev: Blockwiz Wise $5,508 CAD, Dev Scotia $15,675 CAD, Blockwiz Scotia $28,981 CAD, Seglitix BMO $13,772 CAD, Blockwiz BMO $2,474 CAD
- Shalini: Shalini Scotia $5,305 CAD
- Vegrow: Vegrow BMO $13,581 CAD
- Questrade cash: Dev $396, Shalini $568, Vegrow $188.68 (all CAD)

## Key Learnings / Pitfalls

### VFV.TO Double-Counting
The portfolio CSV has owner-level totals. When splitting into account types (RRSP/TFSA/Cash) using PDF statements, do NOT add CSV total to Cash AND also add TFSA qty separately. The CSV total INCLUDES TFSA.
- WRONG: Dev TFSA 213 + Dev Cash 2247 = 2460
- RIGHT: Dev TFSA 213 + Dev Cash (2247-213=2034) = 2247

### Crypto Wallet Calculation
- Ledger CSV is a transaction log, not a balance sheet. Must calculate net: sum(IN) - sum(OUT) - sum(FEES)
- Coinbase CSVs have signed quantities (negative for sells/sends)
- The portfolio CSV BTC total (5.662) closely matches Ledger (4.9485) + Coinbase (0.7158) = 5.6643

### USDC/USDT are Cash
The user considers stablecoins (USDC, USDT) as cash positions, not crypto investments. Display them under Cash category, not Crypto.

### CASH.TO is Cash
CASH.TO (Global X High Interest Savings ETF) is treated as a cash-equivalent, shown under Cash category.

### Questrade Cash Balances
Don't use Feb 2026 PDF statement cash balances - they're stale. Use user-provided current balances.

### FX Rate
- Yahoo Finance ticker: CAD=X (returns how many CAD per 1 USD)
- USD to CAD: multiply by rate
- CAD to USD: divide by rate

### Yahoo Finance API
- URL: `https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?interval=1d&range=1d`
- TSX tickers: append .TO (VFV.TO, ZID.TO, CASH.TO)
- Crypto: append -USD (BTC-USD, ETH-USD)
- No API key needed, but use User-Agent header
- Call server-side to avoid CORS

## Verified Totals (April 16, 2026)
- Dev: $1,009,147 USD / $1,385,558 CAD
- Shalini: $169,046 USD / $232,099 CAD
- Vegrow: $80,217 USD / $110,138 CAD
- Grand: $1,258,409 USD / $1,727,796 CAD

## Architecture
- Next.js App Router on Vercel
- `/api/prices` - server-side Yahoo Finance fetcher with 5-min cache
- `data/holdings.json` - all holdings config (edit this to update portfolio)
- Client fetches prices, calculates values, renders tables
- Auto-refreshes every 5 minutes

## Entity Mapping (expanded owners)
The original 3 owners (Dev, Shalini, Vegrow) are expanded to 5 entities for insights:
- **Dev** — Personal Questrade (RRSP/TFSA/Cash), Ledger, Coinbase, Binance (BNB/TRX), Dev Scotia, 50% real estate
- **Shalini** — Personal Questrade (RRSP/TFSA/Cash), Shalini Scotia, 50% real estate
- **Vegrow** — Vegrow Questrade Cash, Vegrow BMO
- **Blockwiz** — Blockwiz Scotia, Blockwiz Wise, Blockwiz BMO
- **Seglitix** — Seglitix BMO

## Real Estate
- **Ireo Grand Arch** (India): 5.35 crore INR, owned by Dev & Shalini (50/50)
- **Garvin Mews** (Canada): $1.1M CAD, owned by Dev & Shalini (50/50)
- INR/CAD rate fetched from Yahoo Finance (CADINR=X)

## Country Mapping
- India: ZID.TO + Ireo Grand Arch
- USA: GOOG, META, MSFT, NFLX, TSLA, VFV.TO
- Canada: CASH.TO, Garvin Mews, bank cash
- Global: All crypto

## Insights Page (/insights)
8 visual analysis sections using Recharts:
1. Asset Allocation (donut chart)
2. Owner/Entity Comparison (stacked bar)
3. Concentration Risk (pie with warnings)
4. Currency Exposure (USD/CAD/INR)
5. Crypto vs Traditional (what-if scenarios)
6. Idle Cash Analysis (opportunity cost)
7. Net Worth Trend (placeholder, needs monthly snapshots)
8. Country Exposure (bar + cards)

## How to Update Holdings

### Automated (recommended): `npm run sync`
Run this on Dev's local machine where `~/Claude Folder/personal/Finance/` exists.

1. Update files in `~/Claude Folder/personal/Finance/`:
   - Drop new bank statement PDFs in `scotia/`, `bmo/`, `wise/`
   - Drop new banking app screenshots (PNG/JPG) in any of those folders
   - Replace the Questrade portfolio CSV in `portfolio/Questrade/`
   - Drop the latest Ledger transaction CSV in `portfolio/crypto/`
   - Drop new Coinbase CSVs in `portfolio/crypto/coinbase/`
2. Maintain `~/Claude Folder/personal/Finance/manual.yaml` (copy from `scripts/manual.yaml.example` once). This holds RRSP/TFSA/Cash splits, real-estate values, ticker metadata, entity mappings, and the `bankAccountMap` that resolves "BMO 9037" → "Vegrow BMO". Update splits when share quantities change between accounts.
3. Set `ANTHROPIC_API_KEY` in your shell.
4. `npm run sync` — reads files, sends PDFs/images to Claude Sonnet 4.6 (vision), parses CSVs, regenerates `data/holdings.json`. Prints a summary including any unmatched bank records (add those to `bankAccountMap`).
5. `git add data/holdings.json && git commit && git push` — Vercel auto-deploys.

### Manual fallback
Edit `data/holdings.json` directly, push to GitHub, Vercel auto-deploys.

## File Locations (on Dev's machine)
- Finance data: `~/Claude Folder/personal/Finance/`
- Questrade PDFs: `~/Claude Folder/personal/Finance/quest/`
- Portfolio CSV: `~/Claude Folder/personal/Finance/portfolio/Questrade/April 15 2025.csv`
- Crypto Ledger: `~/Claude Folder/personal/Finance/portfolio/crypto/ledgerwallet-operations-2026.04.16.csv`
- Crypto Coinbase: `~/Claude Folder/personal/Finance/portfolio/crypto/coinbase/`
- Bank statements: `~/Claude Folder/personal/Finance/scotia/`, `~/Claude Folder/personal/Finance/bmo/`
