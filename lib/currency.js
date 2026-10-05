import { fa } from "./fa";

// نرخ‌های نمونه (به‌ازای هر ۱ دلار). برای نرخ واقعی باید از یک API ارز استفاده شود.
export const CURRENCIES = {
  USD: { label: "دلار", sym: "$", rate: 1 },
  EUR: { label: "یورو", sym: "€", rate: 0.92 },
  TRY: { label: "لیر", sym: "₺", rate: 34 },
  AED: { label: "درهم", sym: "د.إ", rate: 3.67 },
  IRT: { label: "تومان", sym: "تومان", rate: 100000, after: true },
};

export function formatMoney(usd, code = "USD") {
  const c = CURRENCIES[code] ?? CURRENCIES.USD;
  const v = code === "IRT" ? Math.round((usd * c.rate) / 1000) * 1000 : Math.round(usd * c.rate * 100) / 100;
  const num = fa(v.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }))
    .replace(/,/g, "٬")
    .replace(".", "٫");
  return c.after ? `${num} ${c.sym}` : `${c.sym}${num}`;
}
