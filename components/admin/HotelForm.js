"use client";
import { useState } from "react";
import { ALL_AMENITIES } from "@/lib/store";
import { Btn, Field, Modal, inputCls } from "./ui";

const blank = (cities, categories) => ({
  name: "", city: cities[0].name, stars: 4, rating: 8, reviews: 0, tag: categories[0] || "", amenities: [],
  rooms: [{ name: "اتاق استاندارد دو تخته", price: 80 }], desc: "", distance: 2, checkIn: "۱۴:۰۰", checkOut: "۱۲:۰۰", address: "", photo: "",
});

export default function HotelForm({ hotel, cities, categories, onSave, onClose }) {
  const [f, setF] = useState(() => (hotel ? { ...hotel, photo: hotel.photo || "", rooms: hotel.rooms.map((r) => ({ ...r })) } : blank(cities, categories)));
  const [err, setErr] = useState({});
  const [extra, setExtra] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amenityPool = [...new Set([...ALL_AMENITIES, ...f.amenities])];
  const toggleAm = (a) => set("amenities", f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a]);
  const setRoom = (i, k, v) => set("rooms", f.rooms.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const onFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 900 / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      set("photo", c.toDataURL("image/jpeg", 0.72));
      setErr((e) => ({ ...e, photo: "" }));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setErr((e) => ({ ...e, photo: "فایل تصویر معتبر نیست." })); };
    img.src = url;
  };

  const submit = () => {
    const e = {};
    if (!f.name.trim()) e.name = "نام هتل را بنویس.";
    if (!Number.isFinite(+f.stars) || f.stars < 1 || f.stars > 5) e.stars = "۱ تا ۵";
    if (!(+f.rating >= 0 && +f.rating <= 10)) e.rating = "بین ۰ تا ۱۰";
    if (!(+f.distance >= 0)) e.distance = "عدد معتبر بنویس.";
    const rooms = f.rooms.filter((r) => r.name.trim() || r.price);
    if (!rooms.length || rooms.some((r) => !r.name.trim() || !(+r.price > 0))) e.rooms = "هر اتاق نام و قیمت (بیشتر از صفر) می‌خواهد.";
    setErr(e);
    if (Object.keys(e).length) return;
    const clean = {
      name: f.name.trim(), city: f.city, stars: +f.stars, rating: Math.round(+f.rating * 10) / 10, reviews: Math.max(0, Math.round(+f.reviews) || 0),
      tag: f.tag, amenities: f.amenities, rooms: rooms.map((r) => ({ name: r.name.trim(), price: +r.price })),
      desc: f.desc.trim() || `هتل ${f.name.trim()} با درجه‌ی ${f.stars} ستاره در ${f.city}؛ اتاق‌های راحت و دسترسی آسان به مراکز دیدنی شهر.`,
      distance: +f.distance, checkIn: f.checkIn, checkOut: f.checkOut, address: f.address.trim() || f.city, photo: f.photo,
    };
    onSave(clean);
  };

  return (
    <Modal title={hotel ? `ویرایش «${hotel.name}»` : "افزودن هتل جدید"} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام هتل *" error={err.name} className="sm:col-span-2"><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="شهر"><select className={inputCls} value={f.city} onChange={(e) => set("city", e.target.value)}>{cities.map((c) => <option key={c.slug}>{c.name}</option>)}</select></Field>
          <Field label="دسته‌بندی"><select className={inputCls} value={f.tag} onChange={(e) => set("tag", e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="ستاره" error={err.stars}><select className={inputCls} value={f.stars} onChange={(e) => set("stars", +e.target.value)}>{[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{"★".repeat(s)}</option>)}</select></Field>
          <Field label="امتیاز (۰ تا ۱۰)" error={err.rating}><input type="number" step="0.1" min="0" max="10" className={inputCls} value={f.rating} onChange={(e) => set("rating", e.target.value)} /></Field>
          <Field label="تعداد نظرها"><input type="number" min="0" className={inputCls} value={f.reviews} onChange={(e) => set("reviews", e.target.value)} /></Field>
          <Field label="فاصله تا مرکز شهر (کیلومتر)" error={err.distance}><input type="number" step="0.1" min="0" className={inputCls} value={f.distance} onChange={(e) => set("distance", e.target.value)} /></Field>
          <Field label="ساعت ورود"><input className={inputCls} value={f.checkIn} onChange={(e) => set("checkIn", e.target.value)} /></Field>
          <Field label="ساعت خروج"><input className={inputCls} value={f.checkOut} onChange={(e) => set("checkOut", e.target.value)} /></Field>
          <Field label="آدرس" className="sm:col-span-2"><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="توضیحات" className="sm:col-span-2" hint="خالی بماند، متن پیش‌فرض ساخته می‌شود."><textarea rows={3} className={inputCls} value={f.desc} onChange={(e) => set("desc", e.target.value)} /></Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">اتاق‌ها و قیمت هر شب (دلار)</legend>
          <div className="space-y-2">
            {f.rooms.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label="نام اتاق" placeholder="نام اتاق" className={inputCls} value={r.name} onChange={(e) => setRoom(i, "name", e.target.value)} />
                <input aria-label="قیمت" type="number" min="1" placeholder="قیمت" className={`${inputCls} !w-28`} value={r.price} onChange={(e) => setRoom(i, "price", e.target.value)} />
                <button type="button" disabled={f.rooms.length < 2} onClick={() => set("rooms", f.rooms.filter((_, j) => j !== i))} aria-label="حذف اتاق" className="w-10 shrink-0 rounded-xl border border-line text-coral disabled:opacity-30">✕</button>
              </div>
            ))}
          </div>
          {err.rooms && <p className="mt-1 text-xs text-coral">{err.rooms}</p>}
          <Btn onClick={() => set("rooms", [...f.rooms, { name: "", price: "" }])} className="mt-2 !py-1.5">+ اتاق جدید</Btn>
          <p className="mt-1 text-[11px] text-mut">قیمت «از …» هتل خودکار کمترین قیمت اتاق‌هاست.</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">امکانات</legend>
          <div className="flex flex-wrap gap-2">
            {amenityPool.map((a) => (
              <button key={a} type="button" onClick={() => toggleAm(a)} aria-pressed={f.amenities.includes(a)}
                className={`rounded-full border px-3 py-1 text-sm ${f.amenities.includes(a) ? "border-violet bg-violet text-white" : "border-line"}`}>{a}</button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input placeholder="امکانات دیگر…" className={inputCls} value={extra} onChange={(e) => setExtra(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && extra.trim()) { e.preventDefault(); toggleAm(extra.trim()); setExtra(""); } }} />
            <Btn onClick={() => { if (extra.trim()) { toggleAm(extra.trim()); setExtra(""); } }}>افزودن</Btn>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-bold">عکس هتل</legend>
          <div className="flex flex-wrap items-center gap-3">
            {f.photo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.photo} alt="پیش‌نمایش" className="h-20 w-32 rounded-xl object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" aria-label="انتخاب عکس" />
            {f.photo && <Btn onClick={() => set("photo", "")} className="!py-1.5">حذف عکس</Btn>}
          </div>
          {err.photo && <p className="mt-1 text-xs text-coral">{err.photo}</p>}
          <p className="mt-1 text-[11px] text-mut">عکس کوچک می‌شود و روی مرورگر ذخیره می‌گردد. بدون عکس، تصویر رنگی پیش‌فرض نمایش داده می‌شود.</p>
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Btn onClick={onClose}>انصراف</Btn>
          <Btn kind="primary" onClick={submit}>{hotel ? "ذخیره‌ی تغییرات" : "افزودن هتل"}</Btn>
        </div>
      </div>
    </Modal>
  );
}
