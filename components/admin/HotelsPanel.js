"use client";
import { useMemo, useState } from "react";
import HotelPhoto from "../HotelPhoto";
import { useCurrency } from "../CurrencyProvider";
import { useAdmin } from "../HotelsProvider";
import HotelForm from "./HotelForm";
import { Badge, Btn, Card, Modal, inputCls } from "./ui";
import { fa } from "@/lib/fa";

const PAGE = 12;
const SORTS = {
  new: ["جدیدترین", (a, b) => b.id - a.id],
  name: ["نام (الفبا)", (a, b) => a.name.localeCompare(b.name, "fa")],
  low: ["ارزان‌ترین", (a, b) => a.price - b.price],
  high: ["گران‌ترین", (a, b) => b.price - a.price],
  rate: ["بهترین امتیاز", (a, b) => b.rating - a.rating],
  book: ["بیشترین رزرو", (a, b) => b._b - a._b],
};

export default function HotelsPanel({ bookings, notify }) {
  const { hotels, categories, cities, removedHotels, addHotel, updateHotel, removeHotels, setTagMany, restoreHotels } = useAdmin();
  const { fmt } = useCurrency();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState(() => new Set());
  const [form, setForm] = useState(null); // "new" | hotel
  const [asking, setAsking] = useState(null); // id | "bulk"
  const [showRemoved, setShowRemoved] = useState(false);
  const [bulkCat, setBulkCat] = useState("");

  const counts = useMemo(() => {
    const m = new Map();
    (bookings || []).forEach((b) => m.set(b.hotelId, (m.get(b.hotelId) || 0) + 1));
    return m;
  }, [bookings]);

  const list = useMemo(() => {
    const s = q.trim();
    return hotels
      .filter((h) => (!s || h.name.includes(s) || String(h.id) === s) && (!city || h.city === city) && (!cat || h.tag === cat))
      .map((h) => ({ ...h, _b: counts.get(h.id) || 0 }))
      .sort(SORTS[sort][1]);
  }, [hotels, q, city, cat, sort, counts]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const rows = list.slice(cur * PAGE, cur * PAGE + PAGE);
  const allOn = rows.length > 0 && rows.every((h) => sel.has(h.id));
  const f = (fn) => (v) => { fn(v); setPage(0); };
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const done = (ok, msg) => notify(ok ? msg : "حافظه‌ی مرورگر پر است؛ عکس‌های سنگین را کوچک‌تر کن.");

  const save = (data) => {
    if (form === "new") { const r = addHotel(data); done(r.ok, "هتل اضافه شد و همین الان در سایت دیده می‌شود."); }
    else done(updateHotel(form.id, data), "تغییرات ذخیره شد.");
    setForm(null);
  };
  const del = (ids) => {
    const used = ids.reduce((s, id) => s + (counts.get(id) || 0), 0);
    done(removeHotels(ids), `${fa(ids.length)} هتل حذف شد${used ? ` (${fa(used)} رزرو قبلی حفظ شد)` : ""}.`);
    setSel((s) => { const n = new Set(s); ids.forEach((i) => n.delete(i)); return n; });
    setAsking(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1"><span className="mb-1 block text-xs font-semibold text-mut">جستجو (نام یا شماره)</span>
            <input className={inputCls} value={q} onChange={(e) => f(setQ)(e.target.value)} placeholder="مثلاً لوتوس" /></label>
          <label><span className="mb-1 block text-xs font-semibold text-mut">شهر</span>
            <select className={inputCls} value={city} onChange={(e) => f(setCity)(e.target.value)}><option value="">همه</option>{cities.map((c) => <option key={c.slug}>{c.name}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-mut">دسته‌بندی</span>
            <select className={inputCls} value={cat} onChange={(e) => f(setCat)(e.target.value)}><option value="">همه</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-semibold text-mut">مرتب‌سازی</span>
            <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)}>{Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <Btn kind="primary" onClick={() => setForm("new")}>+ هتل جدید</Btn>
        </div>
        {removedHotels.length > 0 && (
          <p className="mt-3 text-sm text-mut">{fa(removedHotels.length)} هتل حذف‌شده دارید. <button onClick={() => setShowRemoved(true)} className="font-bold text-violet underline dark:text-aqua">مشاهده و بازیابی</button></p>
        )}
      </Card>

      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-violet bg-violet/10 px-4 py-3 text-sm">
          <b>{fa(sel.size)} هتل انتخاب شده</b>
          <select aria-label="انتقال به دسته" className={`${inputCls} !w-auto`} value={bulkCat} onChange={(e) => setBulkCat(e.target.value)}>
            <option value="">انتقال به دسته…</option>{categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Btn disabled={!bulkCat} onClick={() => { done(setTagMany([...sel], bulkCat), "دسته‌ی هتل‌ها عوض شد."); setBulkCat(""); }} className="!py-1.5">اعمال</Btn>
          {asking === "bulk" ? (
            <><span>حذف {fa(sel.size)} هتل؟</span><Btn kind="danger" onClick={() => del([...sel])} className="!py-1.5">بله، حذف</Btn><Btn onClick={() => setAsking(null)} className="!py-1.5">نه</Btn></>
          ) : <Btn onClick={() => setAsking("bulk")} className="!py-1.5 text-coral">حذف انتخاب‌شده‌ها</Btn>}
          <button onClick={() => setSel(new Set())} className="ms-auto text-mut underline">لغو انتخاب</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line text-start text-xs text-mut">
            <tr>
              <th className="w-10 p-3"><input type="checkbox" aria-label="انتخاب همه‌ی این صفحه" checked={allOn} onChange={() => setSel((s) => { const n = new Set(s); rows.forEach((h) => (allOn ? n.delete(h.id) : n.add(h.id))); return n; })} className="accent-violet" /></th>
              {["هتل", "شهر", "دسته", "ستاره", "قیمت از", "امتیاز", "رزرو", ""].map((h, i) => <th key={i} className="p-3 text-start font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-b border-line last:border-0 hover:bg-bg">
                <td className="p-3"><input type="checkbox" aria-label={`انتخاب ${h.name}`} checked={sel.has(h.id)} onChange={() => toggle(h.id)} className="accent-violet" /></td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg"><HotelPhoto hotel={h} /></div>
                    <div><b className="block">{h.name}</b><span className="text-xs text-mut">#{fa(h.id)}{h.id > 1000 && " · افزوده‌شده"}</span></div>
                  </div>
                </td>
                <td className="p-3">{h.city}</td>
                <td className="p-3 text-mut">{h.tag}</td>
                <td className="p-3 text-sun">{"★".repeat(h.stars)}</td>
                <td className="p-3 font-bold">{fmt(h.price)}</td>
                <td className="p-3">{fa(h.rating)}</td>
                <td className="p-3">{h._b ? <Badge tone="info">{fa(h._b)}</Badge> : <span className="text-mut">—</span>}</td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {asking === h.id ? (
                      <><span className="self-center text-xs">حذف شود؟</span><Btn kind="danger" onClick={() => del([h.id])} className="!px-3 !py-1">بله</Btn><Btn onClick={() => setAsking(null)} className="!px-3 !py-1">نه</Btn></>
                    ) : (
                      <><Btn onClick={() => setForm(h)} className="!px-3 !py-1">ویرایش</Btn><Btn onClick={() => setAsking(h.id)} className="!px-3 !py-1 text-coral">حذف</Btn></>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={9} className="p-10 text-center text-mut">هتلی پیدا نشد.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-mut">
        <span>{fa(list.length)} هتل · صفحه‌ی {fa(cur + 1)} از {fa(pages)}</span>
        <div className="flex gap-2">
          <Btn disabled={cur === 0} onClick={() => setPage(cur - 1)} className="!py-1.5">قبلی</Btn>
          <Btn disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="!py-1.5">بعدی</Btn>
        </div>
      </div>

      {form && <HotelForm hotel={form === "new" ? null : form} cities={cities} categories={categories} onSave={save} onClose={() => setForm(null)} />}

      {showRemoved && (
        <Modal title="هتل‌های حذف‌شده" onClose={() => setShowRemoved(false)}>
          {removedHotels.length === 0 ? <p className="text-mut">هتل حذف‌شده‌ای نیست.</p> : (
            <>
              <ul className="divide-y divide-line">
                {removedHotels.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span><b>{h.name}</b> <span className="text-mut">· {h.city}</span></span>
                    <Btn onClick={() => done(restoreHotels([h.id]), "هتل بازیابی شد.")} className="!py-1">بازیابی</Btn>
                  </li>
                ))}
              </ul>
              <Btn kind="primary" className="mt-4" onClick={() => { done(restoreHotels(), "همه‌ی هتل‌ها بازیابی شدند."); setShowRemoved(false); }}>بازیابی همه</Btn>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
