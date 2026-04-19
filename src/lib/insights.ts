import type { HoldingsData, PortfolioRow, OwnerSummary, ChartSlice, EntityTotal, CountryTotal } from "./types";
import { buildPortfolio } from "./calculations";

const COLORS = {
  blue: "#3B82F6", purple: "#8B5CF6", emerald: "#10B981", orange: "#F97316",
  red: "#EF4444", yellow: "#EAB308", pink: "#EC4899", cyan: "#06B6D4",
  indigo: "#6366F1", lime: "#84CC16", amber: "#F59E0B", teal: "#14B8A6",
};

// ── Real Estate ──
export function getRealEstateCAD(holdings: HoldingsData, fxRate: number, inrRate: number): number {
  let total = 0;
  for (const prop of Object.values(holdings.realEstate)) {
    if (prop.currency === "CAD") total += prop.value;
    else if (prop.currency === "INR") total += prop.value / inrRate; // inrRate = INR per 1 CAD
    else if (prop.currency === "USD") total += prop.value * fxRate;
  }
  return total;
}

// ── 1. Asset Allocation ──
export function getAssetAllocation(
  summaries: OwnerSummary[], holdings: HoldingsData, fxRate: number, inrRate: number
): ChartSlice[] {
  const allRows = summaries.flatMap(s => s.rows);

  const stocks = allRows.filter(r => r.accountType === "questrade" && !["VFV.TO","ZID.TO","CASH.TO"].includes(r.asset))
    .reduce((s, r) => s + r.valueCAD, 0);
  const etfs = allRows.filter(r => r.accountType === "questrade" && ["VFV.TO","ZID.TO"].includes(r.asset))
    .reduce((s, r) => s + r.valueCAD, 0);
  const cashETF = allRows.filter(r => r.asset === "CASH.TO").reduce((s, r) => s + r.valueCAD, 0);
  const crypto = allRows.filter(r => r.accountType === "crypto").reduce((s, r) => s + r.valueCAD, 0);
  const cash = allRows.filter(r => r.accountType === "cash").reduce((s, r) => s + r.valueCAD, 0) + cashETF;
  const realEstate = getRealEstateCAD(holdings, fxRate, inrRate);

  const total = stocks + etfs + crypto + cash + realEstate;
  const slices = [
    { name: "Real Estate", value: realEstate, color: COLORS.amber },
    { name: "ETFs", value: etfs, color: COLORS.blue },
    { name: "Crypto", value: crypto, color: COLORS.orange },
    { name: "Stocks", value: stocks, color: COLORS.purple },
    { name: "Cash", value: cash, color: COLORS.emerald },
  ];

  return slices.map(s => ({ ...s, percent: total > 0 ? (s.value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

// Build per-entity OwnerSummary-shaped data (liquid only; no real estate)
// Splits crypto across multiple owners when cryptoEntityMapping is an array,
// and re-attributes cash accounts via entityMapping.
export function getEntitySummaries(
  summaries: OwnerSummary[], holdings: HoldingsData
): OwnerSummary[] {
  const entities: Record<string, { rows: PortfolioRow[]; totalCAD: number; totalUSD: number }> = {};
  const ensure = (e: string) => {
    if (!entities[e]) entities[e] = { rows: [], totalCAD: 0, totalUSD: 0 };
  };

  for (const summary of summaries) {
    for (const row of summary.rows) {
      if (row.accountType === "crypto") {
        const mapped = holdings.cryptoEntityMapping[row.account];
        const owners = Array.isArray(mapped) ? mapped : mapped ? [mapped] : [summary.owner];
        const n = owners.length;
        for (const o of owners) {
          ensure(o);
          const share: PortfolioRow = {
            ...row,
            owner: o,
            qty: row.qty / n,
            valueUSD: row.valueUSD / n,
            valueCAD: row.valueCAD / n,
          };
          entities[o].rows.push(share);
          entities[o].totalCAD += share.valueCAD;
          entities[o].totalUSD += share.valueUSD;
        }
        continue;
      }

      let entity = summary.owner;
      if (row.accountType === "cash") {
        const mapped = holdings.entityMapping[row.account];
        if (mapped && mapped !== "same") entity = mapped;
      }
      ensure(entity);
      entities[entity].rows.push({ ...row, owner: entity });
      entities[entity].totalCAD += row.valueCAD;
      entities[entity].totalUSD += row.valueUSD;
    }
  }

  return Object.entries(entities)
    .map(([owner, data]) => ({ owner, totalCAD: data.totalCAD, totalUSD: data.totalUSD, rows: data.rows }))
    .sort((a, b) => b.totalCAD - a.totalCAD);
}

// ── 2. Entity/Owner Comparison ──
export function getEntityTotals(
  summaries: OwnerSummary[], holdings: HoldingsData, fxRate: number, inrRate: number
): EntityTotal[] {
  const entities: Record<string, { totalCAD: number; totalUSD: number; breakdown: Record<string, number> }> = {};

  const ensure = (e: string) => {
    if (!entities[e]) entities[e] = { totalCAD: 0, totalUSD: 0, breakdown: {} };
  };

  for (const summary of summaries) {
    for (const row of summary.rows) {
      const cat = row.accountType === "questrade" ? "Questrade" : row.accountType === "crypto" ? "Crypto" : "Cash";

      // Crypto entity mapping - supports single owner OR array for splits
      if (row.accountType === "crypto") {
        const mapped = holdings.cryptoEntityMapping[row.account];
        const owners = Array.isArray(mapped) ? mapped : mapped ? [mapped] : [summary.owner];
        const shareCAD = row.valueCAD / owners.length;
        const shareUSD = row.valueUSD / owners.length;
        for (const o of owners) {
          ensure(o);
          entities[o].totalCAD += shareCAD;
          entities[o].totalUSD += shareUSD;
          entities[o].breakdown[cat] = (entities[o].breakdown[cat] || 0) + shareCAD;
        }
        continue;
      }

      let entity = summary.owner;
      // Cash entity mapping
      if (row.accountType === "cash") {
        const mapped = holdings.entityMapping[row.account];
        if (mapped && mapped !== "same") entity = mapped;
      }

      ensure(entity);
      entities[entity].totalCAD += row.valueCAD;
      entities[entity].totalUSD += row.valueUSD;
      entities[entity].breakdown[cat] = (entities[entity].breakdown[cat] || 0) + row.valueCAD;
    }
  }

  // Real estate split
  for (const [name, prop] of Object.entries(holdings.realEstate)) {
    let valueCAD = 0;
    if (prop.currency === "CAD") valueCAD = prop.value;
    else if (prop.currency === "INR") valueCAD = prop.value / inrRate;
    else if (prop.currency === "USD") valueCAD = prop.value * fxRate;

    const perOwner = valueCAD / prop.owners.length;
    const perOwnerUSD = perOwner / fxRate;

    for (const owner of prop.owners) {
      ensure(owner);
      entities[owner].totalCAD += perOwner;
      entities[owner].totalUSD += perOwnerUSD;
      entities[owner].breakdown["Real Estate"] = (entities[owner].breakdown["Real Estate"] || 0) + perOwner;
    }
  }

  return Object.entries(entities)
    .map(([entity, data]) => ({
      entity,
      totalCAD: data.totalCAD,
      totalUSD: data.totalUSD,
      breakdown: Object.entries(data.breakdown).map(([category, valueCAD]) => ({ category, valueCAD })),
    }))
    .sort((a, b) => b.totalCAD - a.totalCAD);
}

// ── 3. Concentration Risk ──
export function getConcentrationRisk(
  summaries: OwnerSummary[], holdings: HoldingsData, fxRate: number, inrRate: number
): ChartSlice[] {
  const allRows = summaries.flatMap(s => s.rows);
  const agg: Record<string, number> = {};

  for (const r of allRows) {
    if (r.accountType === "cash") continue;
    const key = r.asset;
    agg[key] = (agg[key] || 0) + r.valueCAD;
  }

  // Add real estate
  for (const [name, prop] of Object.entries(holdings.realEstate)) {
    let v = 0;
    if (prop.currency === "CAD") v = prop.value;
    else if (prop.currency === "INR") v = prop.value / inrRate;
    agg[name] = v;
  }

  const total = Object.values(agg).reduce((s, v) => s + v, 0);
  const colors = [COLORS.blue, COLORS.orange, COLORS.purple, COLORS.emerald, COLORS.red, COLORS.yellow, COLORS.pink, COLORS.cyan, COLORS.indigo, COLORS.lime];

  return Object.entries(agg)
    .map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
      percent: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

// ── 4. Currency Exposure (underlying economic exposure) ──
// Maps ticker to the currency of the underlying asset (not the ticker's quoted currency).
// VFV.TO is quoted in CAD but holds US stocks → USD exposure.
// ZID.TO is quoted in CAD but holds Indian stocks → INR exposure.
// CASH.TO is Canadian high-interest savings → CAD exposure.
function underlyingCurrency(asset: string, holdings: HoldingsData): "USD" | "CAD" | "INR" {
  const country = holdings.countryMapping[asset];
  if (country === "India") return "INR";
  if (country === "Canada") return "CAD";
  if (country === "USA") return "USD";
  if (country === "Global") return "USD"; // crypto
  // Fallback to quoted currency
  const meta = holdings.tickerMeta[asset];
  return meta?.currency === "CAD" ? "CAD" : "USD";
}

export function getCurrencyExposure(
  summaries: OwnerSummary[], holdings: HoldingsData, fxRate: number, inrRate: number
): ChartSlice[] {
  let usd = 0, cad = 0, inr = 0;

  for (const summary of summaries) {
    for (const row of summary.rows) {
      if (row.accountType === "questrade") {
        const cur = underlyingCurrency(row.asset, holdings);
        if (cur === "CAD") cad += row.valueCAD;
        else if (cur === "INR") inr += row.valueCAD;
        else usd += row.valueCAD;
      } else if (row.accountType === "crypto") {
        usd += row.valueCAD; // crypto is USD-denominated
      } else {
        const cur = holdings.cashCurrencies[row.account];
        if (cur === "USD") usd += row.valueCAD;
        else cad += row.valueCAD;
      }
    }
  }

  // Real estate
  for (const prop of Object.values(holdings.realEstate)) {
    let v = 0;
    if (prop.currency === "CAD") { v = prop.value; cad += v; }
    else if (prop.currency === "INR") { v = prop.value / inrRate; inr += v; }
    else if (prop.currency === "USD") { v = prop.value * fxRate; usd += v; }
  }

  const total = usd + cad + inr;
  return [
    { name: "USD", value: usd, color: COLORS.blue, percent: (usd / total) * 100 },
    { name: "CAD", value: cad, color: COLORS.red, percent: (cad / total) * 100 },
    { name: "INR", value: inr, color: COLORS.orange, percent: (inr / total) * 100 },
  ].filter(s => s.value > 0);
}

// ── 6. Idle Cash Analysis ──
export function getIdleCashAnalysis(summaries: OwnerSummary[]): {
  totalCashCAD: number;
  projections: { years: number; at7pct: number; at10pct: number; at12pct: number }[];
} {
  const allRows = summaries.flatMap(s => s.rows);
  const totalCashCAD = allRows.filter(r => r.accountType === "cash").reduce((s, r) => s + r.valueCAD, 0)
    + allRows.filter(r => r.asset === "CASH.TO").reduce((s, r) => s + r.valueCAD, 0);

  const projections = [1, 3, 5, 10].map(years => ({
    years,
    at7pct: totalCashCAD * Math.pow(1.07, years),
    at10pct: totalCashCAD * Math.pow(1.10, years),
    at12pct: totalCashCAD * Math.pow(1.12, years),
  }));

  return { totalCashCAD, projections };
}

// ── 7. Net Worth Trend (snapshot-based, placeholder data for now) ──
export function getNetWorthTrend(currentCAD: number): { date: string; valueCAD: number }[] {
  // For now return a single data point. Future: store monthly snapshots in a JSON file
  return [{ date: new Date().toISOString().slice(0, 10), valueCAD: currentCAD }];
}

// ── 8. Country Exposure ──
export function getCountryExposure(
  summaries: OwnerSummary[], holdings: HoldingsData, fxRate: number, inrRate: number
): CountryTotal[] {
  const countries: Record<string, { totalCAD: number; totalUSD: number; assets: Set<string> }> = {};

  const ensure = (c: string) => {
    if (!countries[c]) countries[c] = { totalCAD: 0, totalUSD: 0, assets: new Set() };
  };

  for (const summary of summaries) {
    for (const row of summary.rows) {
      if (row.accountType === "cash") {
        // USD-denominated cash (USDC, USDT) → USA; CAD cash → Canada
        const cashCur = holdings.cashCurrencies[row.account];
        const country = cashCur === "USD" ? "USA" : "Canada";
        ensure(country);
        countries[country].totalCAD += row.valueCAD;
        countries[country].totalUSD += row.valueUSD;
        countries[country].assets.add(row.account);
        continue;
      }

      const country = holdings.countryMapping[row.asset] || "Other";
      ensure(country);
      countries[country].totalCAD += row.valueCAD;
      countries[country].totalUSD += row.valueUSD;
      countries[country].assets.add(row.asset);
    }
  }

  // Real estate
  for (const [name, prop] of Object.entries(holdings.realEstate)) {
    let valueCAD = 0;
    if (prop.currency === "CAD") valueCAD = prop.value;
    else if (prop.currency === "INR") valueCAD = prop.value / inrRate;
    else if (prop.currency === "USD") valueCAD = prop.value * fxRate;

    ensure(prop.country);
    countries[prop.country].totalCAD += valueCAD;
    countries[prop.country].totalUSD += valueCAD / fxRate;
    countries[prop.country].assets.add(name);
  }

  return Object.entries(countries)
    .map(([country, data]) => ({
      country,
      totalCAD: data.totalCAD,
      totalUSD: data.totalUSD,
      assets: Array.from(data.assets),
    }))
    .sort((a, b) => b.totalCAD - a.totalCAD);
}
