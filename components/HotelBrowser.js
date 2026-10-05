"use client";

import { useHotels } from "./HotelsProvider";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/cities";
import HotelCard from "./HotelCard";
import NoResults from "./NoResults";
import { fa } from "@/lib/fa";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";

const PAGE = 12;
const RANGES = [
  { l: "همه", min: 0, max: 9999 },
  { l: "تا ۸۰$", min: 0, max: 80 },
  { l: "۸۰ تا ۱۶۰$", min: 80, max: 160 },
  { l: "لوکس", min: 160, max: 9999 },
];

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return iso(d);
};

function Field({ label, id, className = "", children }) {
  return (
    <div
      className={`flex flex-col rounded-[14px] border border-line px-3.5 py-2 ${className}`}
    >
      <label htmlFor={id} className="text-xs text-mut">
        {label}
      </label>
      {children}
    </div>
  );
}
const control = "w-full bg-transparent font-semibold text-ink outline-none";

export default function HotelBrowser({ hotels: base, intro }) {
  const hotels = useHotels(base);
  const [q, setQ] = useState("");
  const [range, setRange] = useState(0);
  const [sort, setSort] = useState("rate");
  const [guests, setGuests] = useState("۲ نفر");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [shown, setShown] = useState(PAGE);
  const { favs, toggle } = useFavorites();
  const { fmt } = useCurrency();
  const label = (i) =>
    i === 0
      ? "همه"
      : i === 1
      ? `تا ${fmt(80)}`
      : i === 2
      ? `${fmt(80)} تا ${fmt(160)}`
      : "لوکس";

  useEffect(() => {
    setCheckIn(addDays(7));
    setCheckOut(addDays(10));
  }, []);

  const router = useRouter();
  const dq = useDeferredValue(q); // فیلتر لیست پشت تایپ نمی‌ماند
  const list = useMemo(() => {
    const r = RANGES[range];
    const t = dq.trim();
    const out = hotels.filter(
      (h) =>
        h.price >= r.min &&
        h.price < r.max &&
        (!t ||
          h.city.includes(t) ||
          h.name.includes(t) ||
          (h.tag || "").includes(t))
    );
    const by = {
      rate: (a, b) => b.rating - a.rating,
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      rev: (a, b) => b.reviews - a.reviews,
    };
    return out.sort(by[sort]);
  }, [hotels, dq, range, sort]);

  const search = () => {
    const t = q.trim();
    const m = CITIES.filter((c) => c.name.includes(t));
    if (t && m.length === 1) router.push(`/city/${m[0].slug}`);
    else document.getElementById("list").scrollIntoView({ behavior: "smooth" });
  };
  const reset = (fn) => (v) => {
    fn(v);
    setShown(PAGE);
  };
  const onCheckIn = (v) => {
    setCheckIn(v);
    if (checkOut <= v) setCheckOut(addDays(1, new Date(v)));
  };

  return (
    <>
      <section
        className="relative z-10 mx-auto -mt-[70px] max-w-6xl px-5 "
        aria-label="جستجوی هتل"
      >
        <div className="grid grid-cols-2 gap-2.5 rounded-3xl border border-line bg-card p-3.5 shadow-[0_24px_60px_rgba(60,20,160,.35)] lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <Field
            label="مقصد (نام شهر)"
            id="q"
            className="col-span-2 lg:col-span-1 "
          >
            <input
              id="q"
              type="search"
              list="city-list"
              placeholder="استانبول، اصفهان،تبریز و..."
              value={q}
              onChange={(e) => reset(setQ)(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              className={`focus:outline-none ${control}`}
            />
            <datalist id="city-list">
              {CITIES.map((c) => (
                <option key={c.slug} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="ورود" id="in">
            <input
              id="in"
              type="date"
              min={addDays(0)}
              value={checkIn}
              onChange={(e) => onCheckIn(e.target.value)}
              className={`focus:outline-none ${control}`}
            />
          </Field>
          <Field label="خروج" id="out">
            <input
              id="out"
              type="date"
              min={checkIn}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className={`focus:outline-none ${control}`}
            />
          </Field>
          <Field label="مسافر" id="g" className="col-span-2 lg:col-span-1 ">
            <select
              id="g"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className={`focus:outline-none ${control}`}
            >
              {["۱ نفر", "۲ نفر", "۳ نفر", "۴ نفر"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <button
            onClick={search}
            className="col-span-2 min-h-[54px] rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 font-extrabold text-white transition hover:-translate-y-0.5 lg:col-span-1"
          >
            جستجو
          </button>
        </div>
      </section>

      {intro}

      <main className="mx-auto max-w-6xl px-5">
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="فیلتر قیمت"
          >
            {RANGES.map((r, i) => (
              <button
                key={r.l}
                onClick={() => reset(setRange)(i)}
                aria-pressed={range === i}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  range === i
                    ? "border-violet bg-violet text-white"
                    : "border-line bg-card"
                }`}
              >
                {label(i)}
              </button>
            ))}
          </div>
          <Field label="مرتب‌سازی" id="sort" className="min-w-[170px] bg-card">
            <select
              id="sort"
              value={sort}
              onChange={(e) => reset(setSort)(e.target.value)}
              className={control}
            >
              <option value="rate">بهترین امتیاز</option>
              <option value="low">ارزان‌ترین</option>
              <option value="high">گران‌ترین</option>
              <option value="rev">پرنظرترین</option>
            </select>
          </Field>
        </div>

        <h2 id="list" className="mt-6 scroll-mt-4 text-[28px] font-extrabold">
          هتل‌های پیشنهادی
        </h2>
        <p className="mb-4 min-h-[1.5em] text-sm text-mut">
          {list.length ? `${fa(list.length)} هتل پیدا شد` : ""}
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
          {list.slice(0, shown).map((h) => (
            <HotelCard
              key={h.id}
              hotel={h}
              fav={favs.has(h.id)}
              onFav={() => toggle(h.id)}
              onBook={() =>
                router.push(
                  `/checkout?hotel=${
                    h.id
                  }&in=${checkIn}&out=${checkOut}&guests=${
                    ["۱ نفر", "۲ نفر", "۳ نفر", "۴ نفر"].indexOf(guests) + 1
                  }`
                )
              }
            />
          ))}
          {!list.length && (
            <NoResults
              query={q}
              note={
                q.trim()
                  ? "شهر یا نام هتل را عوض کن، یا از دستیار بپرس."
                  : "بازه‌ی قیمت یا شهر را عوض کن."
              }
              suggestions={CITIES.slice(0, 5).map((c) => c.name)}
              onPick={reset(setQ)}
              onReset={() => {
                setQ("");
                setRange(0);
                setShown(PAGE);
              }}
              resetLabel="پاک کردن فیلترها"
            />
          )}
        </div>

        {list.length > shown && (
          <div className="my-7 text-center">
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="min-h-[54px] rounded-[14px] bg-gradient-to-br from-coral to-violet px-10 font-extrabold text-white"
            >
              نمایش بیشتر
            </button>
          </div>
        )}
      </main>
    </>
  );
}
