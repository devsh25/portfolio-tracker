export interface TickerMeta {
  name: string;
  currency: "USD" | "CAD";
  yahoo: string;
}

export interface HoldingsData {
  lastUpdated: string;
  notes: string;
  owners: Record<string, OwnerData>;
  tickerMeta: Record<string, TickerMeta>;
  cashCurrencies: Record<string, "USD" | "CAD">;
}

export interface OwnerData {
  questrade: Record<string, Record<string, number>>;
  crypto: Record<string, Record<string, number>>;
  cash: Record<string, number>;
}

export interface PriceData {
  [ticker: string]: {
    price: number;
    currency: "USD" | "CAD";
  };
}

export interface PortfolioRow {
  owner: string;
  asset: string;
  account: string;
  accountType: "questrade" | "crypto" | "cash";
  qty: number;
  valueUSD: number;
  valueCAD: number;
}

export interface OwnerSummary {
  owner: string;
  totalUSD: number;
  totalCAD: number;
  rows: PortfolioRow[];
}

export interface CategoryItem {
  asset: string;
  qty: number;
  valueUSD: number;
  valueCAD: number;
  detail?: string;
}

export interface CategorySummary {
  name: string;
  totalUSD: number;
  totalCAD: number;
  items: CategoryItem[];
}
