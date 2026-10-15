"use client";
import { useCurrency } from "./CurrencyProvider";

export default function Price({ usd }) {
  const { fmt } = useCurrency();
  return <>{fmt(usd)}</>;
}
