"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CURRENCIES, formatMoney } from "@/lib/currency";

const Ctx = createContext(null);
const KEY = "sara:cur";
export const useCurrency = () => useContext(Ctx);

export default function CurrencyProvider({ children }) {
  const [code, setCodeState] = useState("USD");
  useEffect(() => {
    try { const c = localStorage.getItem(KEY); if (c && CURRENCIES[c]) setCodeState(c); } catch {}
  }, []);
  const setCode = useCallback((c) => {
    setCodeState(c);
    try { localStorage.setItem(KEY, c); } catch {}
  }, []);
  const fmt = useCallback((usd) => formatMoney(usd, code), [code]);
  return <Ctx.Provider value={{ code, setCode, fmt }}>{children}</Ctx.Provider>;
}
