"use client";
import { useCurrency } from "./CurrencyProvider";
import { CURRENCIES } from "@/lib/currency";

export default function CurrencySelect({ className = "" }) {
  const { code, setCode } = useCurrency();
  return (
    <select
      aria-label="واحد پول"
      value={code}
      onChange={(e) => setCode(e.target.value)}
      className={`rounded-full border focus:outline-none  border-white/30 bg-transparent px-3 py-1.5 text-sm text-white ${className}`}
    >
      {Object.entries(CURRENCIES).map(([k, c]) => (
        <option key={k} value={k}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
