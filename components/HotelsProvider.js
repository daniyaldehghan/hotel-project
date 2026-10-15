"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { HOTELS } from "@/data/hotels";
import { CITIES } from "@/lib/cities";
import { EMPTY, KEY, clearOverrides, deriveCategories, loadOverrides, mergeHotels, minRoomPrice, saveOverrides } from "@/lib/store";

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);
// در کامپوننت‌های عمومی: لیست هتل‌ها با اعمال تغییرات ادمین (قبل از mount همان داده‌ی اصلی)
export const useHotels = (fallback) => { const c = useContext(Ctx); return c ? c.hotels : fallback; };

export default function HotelsProvider({ children }) {
  const [ov, setOv] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const ref = useRef(EMPTY);

  useEffect(() => {
    const load = () => { const o = loadOverrides(); ref.current = o; setOv(o); };
    load(); setReady(true);
    const onStorage = (e) => { if (e.key === KEY || e.key === null) load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // هر تغییر را روی نسخه‌ی فعلی اعمال و ذخیره می‌کند؛ اگر حافظه‌ی مرورگر پر باشد false برمی‌گرداند
  const update = useCallback((fn) => {
    const n = fn(ref.current);
    ref.current = n; setOv(n);
    return saveOverrides(n);
  }, []);

  const hotels = useMemo(() => mergeHotels(HOTELS, ov), [ov]);
  const categories = useMemo(() => deriveCategories(HOTELS, ov, hotels), [ov, hotels]);
  const removedHotels = useMemo(() => HOTELS.filter((h) => ov.removed.includes(h.id)), [ov]);
  const catsNow = () => deriveCategories(HOTELS, ref.current, mergeHotels(HOTELS, ref.current));

  const api = useMemo(() => ({
    addHotel(data) {
      const id = Math.max(ref.current.seq || 1001, ...ref.current.added.map((h) => h.id + 1));
      const h = { ...data, id, price: minRoomPrice(data.rooms), image: `/hotels/${id}.svg` };
      const ok = update((o) => ({ ...o, added: [...o.added, h], seq: id + 1 }));
      return { ok, id };
    },
    updateHotel(id, patch) {
      const p = { ...patch, ...(patch.rooms ? { price: minRoomPrice(patch.rooms) } : {}) };
      return update((o) => o.added.some((h) => h.id === id)
        ? { ...o, added: o.added.map((h) => (h.id === id ? { ...h, ...p } : h)) }
        : { ...o, edits: { ...o.edits, [id]: { ...o.edits[id], ...p } } });
    },
    removeHotels(ids) {
      const set = new Set(ids);
      return update((o) => ({
        ...o,
        added: o.added.filter((h) => !set.has(h.id)),
        removed: [...new Set([...o.removed, ...ids.filter((id) => HOTELS.some((h) => h.id === id))])],
      }));
    },
    setTagMany(ids, tag) {
      const set = new Set(ids);
      return update((o) => {
        const edits = { ...o.edits };
        ids.filter((id) => !o.added.some((h) => h.id === id)).forEach((id) => { edits[id] = { ...edits[id], tag }; });
        return { ...o, edits, added: o.added.map((h) => (set.has(h.id) ? { ...h, tag } : h)) };
      });
    },
    restoreHotels: (ids) => update((o) => ({ ...o, removed: ids ? o.removed.filter((id) => !ids.includes(id)) : [] })),
    addCategory(name) {
      const t = name.trim();
      return update((o) => {
        const tagMap = { ...o.tagMap }; delete tagMap[t];
        return { ...o, tagMap, cats: [...new Set([...catsNow(), t])] };
      });
    },
    renameCategory(oldName, newName) {
      const t = newName.trim();
      return update((o) => {
        const tagMap = Object.fromEntries(Object.entries(o.tagMap).map(([k, v]) => [k, v === oldName ? t : v]));
        tagMap[oldName] = t; delete tagMap[t];
        return { ...o, tagMap, cats: [...new Set(catsNow().map((c) => (c === oldName ? t : c)))] };
      });
    },
    deleteCategory(oldName, target) {
      return update((o) => {
        const tagMap = Object.fromEntries(Object.entries(o.tagMap).map(([k, v]) => [k, v === oldName ? target : v]));
        tagMap[oldName] = target;
        return { ...o, tagMap, cats: catsNow().filter((c) => c !== oldName) };
      });
    },
    importOverrides(obj) { return update(() => ({ ...EMPTY, ...obj })); },
    resetAll() { clearOverrides(); ref.current = EMPTY; setOv(EMPTY); },
    getOverrides: () => ref.current,
  }), [update]);

  const value = useMemo(() => ({ hotels, categories, cities: CITIES, removedHotels, ov, ready, ...api }), [hotels, categories, removedHotels, ov, ready, api]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
