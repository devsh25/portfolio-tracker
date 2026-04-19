import type { HoldingsData, PriceData, PortfolioRow, OwnerSummary, CategorySummary, CategoryItem } from "./types";

export function buildPortfolio(holdings: HoldingsData, prices: PriceData, fxRate: number): OwnerSummary[] {
  const summaries: OwnerSummary[] = [];

  for (const [ownerName, ownerData] of Object.entries(holdings.owners)) {
    const rows: PortfolioRow[] = [];

    // Questrade holdings
    for (const [acctType, tickers] of Object.entries(ownerData.questrade)) {
      for (const [ticker, qty] of Object.entries(tickers)) {
        const meta = holdings.tickerMeta[ticker];
        const priceInfo = prices[ticker];
        if (!meta || !priceInfo) continue;

        const nativeValue = qty * priceInfo.price;
        let valueUSD: number, valueCAD: number;
        if (meta.currency === "CAD") {
          valueCAD = nativeValue;
          valueUSD = nativeValue / fxRate;
        } else {
          valueUSD = nativeValue;
          valueCAD = nativeValue * fxRate;
        }

        rows.push({
          owner: ownerName,
          asset: ticker,
          account: `Quest ${acctType}`,
          accountType: "questrade",
          qty,
          valueUSD,
          valueCAD,
        });
      }
    }

    // Crypto holdings
    for (const [wallet, tickers] of Object.entries(ownerData.crypto)) {
      for (const [ticker, qty] of Object.entries(tickers)) {
        const meta = holdings.tickerMeta[ticker];
        const priceInfo = prices[ticker];
        if (!meta || !priceInfo) continue;

        const valueUSD = qty * priceInfo.price;
        const valueCAD = valueUSD * fxRate;

        rows.push({
          owner: ownerName,
          asset: ticker,
          account: wallet,
          accountType: "crypto",
          qty,
          valueUSD,
          valueCAD,
        });
      }
    }

    // Cash positions
    for (const [label, amount] of Object.entries(ownerData.cash)) {
      const currency = holdings.cashCurrencies[label] || "CAD";
      let valueUSD: number, valueCAD: number;

      if (currency === "USD") {
        valueUSD = amount;
        valueCAD = amount * fxRate;
      } else {
        valueCAD = amount;
        valueUSD = amount / fxRate;
      }

      rows.push({
        owner: ownerName,
        asset: label,
        account: label,
        accountType: "cash",
        qty: 0,
        valueUSD,
        valueCAD,
      });
    }

    const totalUSD = rows.reduce((sum, r) => sum + r.valueUSD, 0);
    const totalCAD = rows.reduce((sum, r) => sum + r.valueCAD, 0);

    summaries.push({ owner: ownerName, totalUSD, totalCAD, rows });
  }

  return summaries;
}

export function buildCategories(summaries: OwnerSummary[]): CategorySummary[] {
  const allRows = summaries.flatMap((s) => s.rows);

  // Questrade Investments
  const questRows = allRows.filter((r) => r.accountType === "questrade");
  const questAgg: Record<string, { qty: number; usd: number; cad: number }> = {};
  for (const r of questRows) {
    if (!questAgg[r.asset]) questAgg[r.asset] = { qty: 0, usd: 0, cad: 0 };
    questAgg[r.asset].qty += r.qty;
    questAgg[r.asset].usd += r.valueUSD;
    questAgg[r.asset].cad += r.valueCAD;
  }
  const questItems: CategoryItem[] = Object.entries(questAgg)
    .map(([asset, v]) => ({ asset, qty: v.qty, valueUSD: v.usd, valueCAD: v.cad }))
    .sort((a, b) => b.valueUSD - a.valueUSD);

  // Crypto
  const cryptoRows = allRows.filter((r) => r.accountType === "crypto");
  const cryptoAgg: Record<string, { qty: number; usd: number; cad: number }> = {};
  for (const r of cryptoRows) {
    if (!cryptoAgg[r.asset]) cryptoAgg[r.asset] = { qty: 0, usd: 0, cad: 0 };
    cryptoAgg[r.asset].qty += r.qty;
    cryptoAgg[r.asset].usd += r.valueUSD;
    cryptoAgg[r.asset].cad += r.valueCAD;
  }
  const cryptoItems: CategoryItem[] = Object.entries(cryptoAgg)
    .map(([asset, v]) => ({ asset, qty: v.qty, valueUSD: v.usd, valueCAD: v.cad }))
    .sort((a, b) => b.valueUSD - a.valueUSD);

  // Cash
  const cashRows = allRows.filter((r) => r.accountType === "cash");
  const cashItems: CategoryItem[] = cashRows
    .map((r) => ({ asset: r.asset, qty: 0, valueUSD: r.valueUSD, valueCAD: r.valueCAD }))
    .sort((a, b) => b.valueUSD - a.valueUSD);

  const sumCat = (items: CategoryItem[]) => ({
    totalUSD: items.reduce((s, i) => s + i.valueUSD, 0),
    totalCAD: items.reduce((s, i) => s + i.valueCAD, 0),
  });

  return [
    { name: "Questrade Investments", ...sumCat(questItems), items: questItems },
    { name: "Crypto", ...sumCat(cryptoItems), items: cryptoItems },
    { name: "Cash (All)", ...sumCat(cashItems), items: cashItems },
  ];
}

export function formatUSD(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "$" + abs.toFixed(0);
  return n < 0 ? `-${formatted}` : formatted;
}

export function formatCAD(n: number): string {
  return formatUSD(n);
}

export function formatQty(qty: number): string {
  if (qty === 0) return "\u2014";
  if (qty >= 1000) return qty.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (qty >= 1) return qty.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return qty.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function formatPrice(n: number): string {
  if (!isFinite(n) || n <= 0) return "\u2014";
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return "$" + n.toFixed(3);
  return "$" + n.toFixed(6);
}
