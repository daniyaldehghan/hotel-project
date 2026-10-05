"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);
const KEY = "sara:favs";
export const useFavorites = () => useContext(Ctx);

export default function FavoritesProvider({ children }) {
  const [favs, setFavs] = useState(() => new Set());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [current, setCurrent] = useState(null);
  const closeHotel = useCallback(() => setCurrent(null), []);
  const [cmp, setCmp] = useState([]);
  useEffect(() => {
    try { const r = localStorage.getItem("sara:cmp"); if (r) setCmp(JSON.parse(r)); } catch {}
  }, []);
  const toggleCmp = useCallback((id) => {
    if (!cmp.includes(id) && cmp.length >= 3) { setToast("حداکثر ۳ هتل را می‌شود مقایسه کرد."); return; }
    const n = cmp.includes(id) ? cmp.filter((x) => x !== id) : [...cmp, id];
    setCmp(n);
    try { localStorage.setItem("sara:cmp", JSON.stringify(n)); } catch {}
  }, [cmp]);
  const clearCmp = useCallback(() => {
    setCmp([]);
    try { localStorage.removeItem("sara:cmp"); } catch {}
  }, []);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setFavs(new Set(JSON.parse(raw))); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify([...favs])); } catch {}
  }, [favs, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = useCallback((id) => setFavs((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const clear = useCallback(() => setFavs(new Set()), []);

  // بدون useMemo، با هر بار نمایش/مخفی شدن پیام (toast) همه‌ی کارت‌های هتل دوباره رندر می‌شدند
  const value = useMemo(
    () => ({ favs, toggle, clear, notify: setToast, ready, current, openHotel: setCurrent, closeHotel, cmp, toggleCmp, clearCmp }),
    [favs, toggle, clear, ready, current, closeHotel, cmp, toggleCmp, clearCmp]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-2xl bg-ink px-5 py-3.5 font-semibold text-bg transition-transform duration-200 ${toast ? "translate-y-0" : "translate-y-[160%]"}`}
      >
        {toast}
      </div>
    </Ctx.Provider>
  );
}
