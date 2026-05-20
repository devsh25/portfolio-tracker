# Earning interest on your Ledger USDC — research

**Position size:** 48,994.46 USDC (~$49k USD) sitting in your Ledger hardware wallet.
**Date of research:** May 2026.
**Context:** You were burned by Celsius — that scar should drive the analysis. The goal here is "safe yield on USD savings", not "max APY on crypto".

## TL;DR — what I'd actually do at this size

A two-bucket split, both self-custody, both signed from your Ledger:

| Allocation | Vehicle | Expected APY | Annual yield on share |
|---|---|---|---|
| ~$25k (50%) | **Sky Savings Rate (sUSDS)** via Ledger Live | 3.75–4.5% | ~$1,000 |
| ~$24k (50%) | **Aave V3 USDC supply** via Ledger Live | 3.0–3.8% | ~$800 |
| **Total** | | **~3.5–4.1% blended** | **~$1,800/yr** |

Why this shape:
- Both are accessible **directly from Ledger Live** via its Kiln integration — no MetaMask, no WalletConnect, no extra approval surface to manage. Your hardware key still signs every transaction.
- Sky (formerly MakerDAO) and Aave are the two most battle-tested DeFi protocols by uptime, TVL, and audit history. Sky's savings rate is governance-set and backed by overcollateralized loans + T-bills; Aave is variable-rate based on utilization.
- Diversifying across two protocols caps single-smart-contract blast radius. At ~$25k each, a 100% loss in one would be painful but not catastrophic at your net worth scale.
- No KYC, no custody risk, no Celsius-shaped problems. The funds remain redeemable any time as long as the protocols function.

The honest baseline you're competing against: **a US Treasury bill or USD HYSA at ~3.5–4%**. DeFi USDC yields have compressed to the point where the risk-adjusted premium is small. Don't take much risk to chase a marginal yield bump.

---

## Why this matters — the Celsius lens

Your CLAUDE.md notes "BTC 0.7158 (from Celsius distributions)". You already learned the lesson the hard way: **CeFi platforms that promise yield are taking custody and re-lending your assets**. When they blow up, you become an unsecured creditor and recover cents on the dollar after years of bankruptcy proceedings.

Every option below is graded primarily on **how much it resembles Celsius**:
- ✅ **Self-custody, on-chain, transparent** — you sign with Ledger, funds visible on-chain, code is audited and open.
- ⚠️ **Self-custody but synthetic/complex** — funds remain yours but the yield mechanism has hidden tail risks.
- ❌ **Custodial** — you transfer ownership to a company that may rehypothecate, lose keys, or go bankrupt. Avoid for serious money.

---

## The options, ranked from safest to riskiest

### Tier 1 — Recommended: self-custody DeFi via Ledger Live

#### 1a. Sky Savings (sUSDS) — the "boring" choice

- **What it is:** Sky (formerly MakerDAO) lets you deposit USDS (their stablecoin, 1:1 swappable with USDC via the Peg Stability Module) into the Sky Savings Module. You receive sUSDS, an ERC-20 whose value increases over time.
- **Current rate:** ~3.75% APY (was 4.5% earlier this year; rate is set by SKY governance, not utilization).
- **Backing:** Overcollateralized crypto loans + ~$1B+ in real-world US Treasury allocations. Sky has run continuously since 2017 (as MakerDAO) without losing user deposits.
- **Liquidity:** Withdraw any time, no lockup.
- **How to access from Ledger:** Ledger Live → Earn → select USDC → choose Sky/Spark protocol. The integration handles the USDC→USDS swap and the deposit. Or do it manually at sky.money via Ledger + WalletConnect.
- **Risks:** Smart contract bug in Sky's contracts; USDS depeg (has held tightly since launch); governance hostile action (SKY token holders could theoretically vote to change rates to zero or attack the system — historically they have not).
- **Gas cost:** ~$5–15 in ETH per deposit/withdraw on Ethereum mainnet.

#### 1b. Aave V3 USDC supply — the most-used lending pool in DeFi

- **What it is:** You supply USDC to Aave's lending pool; borrowers post collateral (ETH, BTC, etc.) and pay interest. You earn variable rate based on utilization.
- **Current rate:** ~3.45% APY on Ethereum mainnet (was higher in 2024; DeFi yields have compressed industry-wide).
- **Backing:** Every borrower is overcollateralized (typically 125–150%). Aave has a "Safety Module" insurance backstop. The protocol has paid out continuously since 2020 across multiple market crashes.
- **Liquidity:** Withdraw any time as long as utilization is below 100% (rarely an issue for USDC).
- **How to access from Ledger:** Ledger Live → Earn → USDC → Aave V3. Or app.aave.com with Ledger via WalletConnect.
- **Risks:** Smart contract exploit (Aave's been audited heavily but it's not zero); oracle manipulation causing bad-debt buildup; mass-borrow-then-default cascade (mitigated by overcollateralization, never happened at scale).

#### 1c. Compound V3 USDC — same idea, smaller market

- ~3% APY currently. Slightly less battle-tested in V3 form than Aave but Compound V2 ran cleanly for years. Reasonable diversifier if you want to split across more protocols.

**At your size ($49k), I'd cap any single protocol at ~$25k.** Splitting between Sky and Aave is plenty; adding Compound is fine if you want extra diversification but the gas overhead eats into the marginal benefit.

---

### Tier 2 — Acceptable with caveats

#### 2a. Morpho curated vaults (Steakhouse, Gauntlet)

- **What it is:** Morpho is a lending protocol layered on top of Aave/Compound where professional risk managers ("curators") build vaults with specific risk parameters and target higher yields.
- **Rates:** 4–7% APY depending on vault. Steakhouse USDC ~4.5–6.5%; Gauntlet USDC Prime ~5–7.5%.
- **Fee:** Curators take ~15% of yield.
- **Why it's Tier 2:** You're trusting both the Morpho contracts AND the curator's parameter choices. The 1–3% yield premium over Aave reflects real (if small) extra risk. Reasonable if you understand what each vault holds.
- **Verdict:** Fine for maybe $10k of the position if you want to chase yield, but don't make this the core allocation.

#### 2b. Tokenized US Treasuries (Ondo USDY)

- **What it is:** A token backed 1:1 by short-term US Treasuries + bank deposits, held in a bankruptcy-remote SPV (Ondo USDY LLC).
- **Rate:** 5% APY currently — actually the highest in this tier and arguably the lowest-risk yield source on this list because the underlying is literally T-bills.
- **Catches:**
  - **Not available to US persons.** You're in Canada — likely accessible but you'd want to verify.
  - **KYC required** at minting/redemption (not at the secondary market level). For $49k they will absolutely want documentation.
  - **It's a security, not a stablecoin.** Tax treatment differs (interest vs. capital gains depending on how CRA classifies it). Talk to your accountant.
  - There's a 40–50 day "lockup" between purchase and ability to transfer, and redemption is T+2 with minimums.
- **Verdict:** Genuinely safe at the asset level, but the friction (KYC, lockups, tax complexity) makes it heavy for $49k. Worth considering if you'd add more idle USD later.

#### 2c. Coinbase Prime / Coinbase One

- **Rate:** 4–4.35% APY for Coinbase One subscribers ($30/mo), 3.4% for institutional Prime accounts.
- **Mechanic:** Coinbase pays you out of their own pocket as a customer-acquisition tool; they're not lending your USDC.
- **Why it's Tier 2 not Tier 4:** It's a fee/reward, not a yield product — Coinbase isn't rehypothecating. But you're still trusting Coinbase as a custodian.
- **Verdict:** Reasonable if you already keep funds on Coinbase, but moving from Ledger → Coinbase to chase 50bps over Aave is bad risk math given your Celsius history. Skip.

---

### Tier 3 — Higher yield, higher risk — not recommended at your size

#### 3a. Ethena sUSDe — synthetic dollar

- **Rate:** ~3.5–5% APY currently (was 15%+ in 2024).
- **How it works:** Ethena holds long crypto + short perpetual futures, capturing the funding rate spread. The yield comes from leveraged speculators paying funding on perps.
- **Why I'd avoid for your USDC:**
  - **Depegged to $0.65 on Binance in October 2025** due to an oracle issue (recovered, but the event happened).
  - Funding rates can go negative in bear markets, eliminating yield.
  - Reserve fund is ~1.18% of TVL — thin margin for stress events.
  - Regulatory ambiguity (not a bank deposit, not a T-bill fund, not clearly a security).
- **Verdict:** Interesting product, but it's not what you want for "safe interest on USD savings". Especially after Celsius.

#### 3b. Curve / Convex stablecoin LP

- 3–6% APY in pools like 3pool or crvUSD pools.
- Smart contract risk stacks (Curve + Convex + the pool's underlying assets), and Curve was exploited for ~$70M in mid-2023.
- Complexity-to-yield ratio is poor at this size.

---

### Tier 4 — Custodial / Celsius-shaped — avoid

#### 4a. Nexo, Crypto.com Earn, BlockFi-likes
**Hard pass.** This is exactly the Celsius model. They take custody, lend out, promise a rate. When they blow up you wait years for a partial recovery. Several have already failed (BlockFi, Voyager, Celsius). No.

#### 4b. Binance Earn / Flexible Savings
Same model as above. Even though Binance has survived this far, the failure mode is identical: you're an unsecured creditor of a custodial exchange. Skip.

---

## Risk comparison at a glance

| Option | APY | Custody | Audit-tested | Failure mode | Verdict for $49k |
|---|---|---|---|---|---|
| US T-bill / USD HYSA | 3.5–4% | Bank | Centuries | Bank failure (FDIC-insured below $250k) | **Baseline to beat** |
| Sky sUSDS (via Ledger) | 3.75–4.5% | Self | Heavy | Smart contract / governance | **Recommended core** |
| Aave V3 USDC (via Ledger) | 3.0–3.8% | Self | Heavy | Smart contract / oracle | **Recommended core** |
| Compound V3 USDC | ~3% | Self | Heavy | Smart contract | Optional diversifier |
| Morpho curated vaults | 4–7% | Self | Medium | Smart contract + curator | Tier 2, partial allocation |
| Ondo USDY (T-bill token) | 5% | Self + SPV | High | SPV / regulatory / depeg | Tier 2, friction is high |
| Coinbase One USDC | 4–4.35% | Coinbase | n/a | Coinbase insolvency | Skip given Celsius history |
| Ethena sUSDe | 3.5–5% | Self | Medium | Funding flip / depeg | **Avoid** at this size |
| Nexo / CeFi yield | 6–10% | Theirs | n/a | Insolvency (Celsius-shaped) | **Hard pass** |

---

## Concrete execution checklist

If you go with the recommended split:

1. **Update Ledger Live** to the latest version. Confirm the "Earn" / DeFi lending feature is active for your account.
2. **Send a $100 test transaction first** to whichever protocol you'll use. Verify it deposits, accrues yield over a day, and can be withdrawn. Only then move the rest.
3. **Split into two deposits** to avoid concentration:
   - Deposit ~$25k into Sky Savings via Ledger Live.
   - Deposit ~$24k into Aave V3 USDC via Ledger Live.
4. **Budget ~$30–60 in ETH for gas** across deposits + future withdrawal. Keep some ETH on the Ledger.
5. **Set a calendar reminder** to check rates and protocol health quarterly. Both Sky and Aave publish utilization dashboards.
6. **Document the position** in your portfolio tracker — sUSDS and aUSDC are receipt tokens whose value grows over time. You'll want them showing up properly in `holdings.json` (probably under a new "yield" or "DeFi" category, valued at 1.0 × underlying price for stablecoin yield receipts).

## Approval hygiene (important)

Even with self-custody, the #1 way DeFi users lose funds is **malicious token approvals** signed accidentally. Best practices:

- **Use Ledger Live's native Earn flow** when possible — it shows you exactly what's being signed, in plain English, on the device screen.
- If using WalletConnect to dApps directly, **only approve the exact amount you're depositing**, not "unlimited".
- **Revoke unused approvals** at revoke.cash every few months.
- **Never sign blind transactions** on the Ledger. Enable "Blind signing" only for the specific transaction and turn it off after.
- **Keep a separate hot wallet** (e.g., MetaMask with a small amount of ETH) for any speculative DeFi exploration. Don't connect your Ledger to anything except Aave, Sky, and Ledger Live itself.

## Tax note (Canada)

DeFi yield is interest income to the CRA, fully taxable in the year accrued, reported in CAD. With sUSDS/aUSDC, the yield accrues as the receipt token's value grows — you realize the gain on withdrawal. Track:
- USD value at deposit
- USD value at withdrawal
- CAD conversion rate at each event
- Any swap fees (USDC→USDS conversion, etc.)

This gets messy fast. Tools like Koinly or CoinTracker can ingest your Ledger transactions, but check that they handle Sky and Aave receipt tokens correctly before relying on them.

## What I'd revisit in 6 months

- If Sky's rate drops below 3% AND T-bill rates stay above 3.5%, consider moving to Ondo USDY or just an Interactive Brokers USD T-bill ladder.
- If you decide to deploy more USD savings (>$200k), the math for Ondo USDY (genuine T-bill exposure with on-chain settlement) starts looking better — the KYC friction amortizes over a larger balance.
- If a meaningful exploit hits Aave or Sky, exit the affected protocol; don't sit and wait.

## Sources

- [Aave V3 USDC pool — Aavescan](https://aavescan.com/ethereum-v3/usdc)
- [Sky Savings Rate — sky.money/susds](https://sky.money/susds)
- [Ledger Live x Kiln DeFi integration](https://www.kiln.fi/post/ledger-live-x-kiln-defi-non-custodial-approach-to-stablecoin-yield)
- [Ledger stablecoin yield via Kiln — The Block](https://www.theblock.co/post/352160/ledger-live-usdc-usdt-usds-dai-stablecoin-yield-self-custody-kiln)
- [Coinbase USDC rewards changes — DL News](https://www.dlnews.com/articles/web3/coinbase-ends-usdc-rewards-for-non-paying-customers/)
- [Kraken USDC rewards](https://www.kraken.com/en-gb/features/auto-earn/usdc)
- [Ondo USDY product page](https://ondo.finance/usdy)
- [Ethena USDe depeg post-mortem — AInvest](https://www.ainvest.com/news/ethena-usde-depeg-event-case-study-systemic-risk-algorithmic-stablecoins-2510/)
- [BlackRock BUIDL overview — RWA.xyz](https://app.rwa.xyz/assets/BUIDL)
- [Morpho Steakhouse USDC vault](https://app.morpho.org/base/vault/0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183/steakhouse-usdc)
- [2026 DeFi exploits roundup — CCN](https://www.ccn.com/education/crypto/defi-hacks-2026-137m-lost-step-finance-truebit-resolv-exploits/)
- [DeFi yields vs savings accounts — CoinDesk Apr 2026](https://www.coindesk.com/business/2026/04/07/defi-yields-are-crashing-so-hard-that-they-can-t-compete-with-a-traditional-savings-account)
