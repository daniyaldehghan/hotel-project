"use client";
import { useHotels } from "./HotelsProvider";
import { useMemo, useState } from "react";
import Link from "next/link";
import HotelCard from "./HotelCard";
import NoResults from "./NoResults";
import { THEMES } from "./HotelArt";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { CITIES } from "@/lib/cities";
import { fa } from "@/lib/fa";

const PAGE = 12;
const AMENITIES = ["وای‌فای", "صبحانه", "استخر", "پارکینگ", "اسپا", "سالن ورزش", "ترانسفر فرودگاه"];
const RATINGS = [["همه", 0], ["۸+", 8], ["۸٫۵+", 8.5], ["۹+", 9]];

const chip = (on) => `shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${on ? "border-violet bg-violet text-white" : "border-line bg-card hover:border-violet"}`;

function Block({ title, children }) {
  return (
    <fieldset className="border-t border-line pt-4">
      <legend className="mb-2 float-start w-full text-sm font-bold">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

export default function CityExplorer({ hotels: base, initial = "all"  }) {
  const hotels = useHotels(base);
  const { favs, toggle } = useFavorites();
  const { fmt } = useCurrency();
  const [slug, setSlug] = useState(initial);
  const [cs, setCs] = useState("");
  const [stars, setStars] = useState([]);
  const [minRate, setMinRate] = useState(0);
  const [ams, setAms] = useState([]);
  const [tags, setTags] = useState([]);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState("rate");
  const [shown, setShown] = useState(PAGE);
  const [panel, setPanel] = useState(false);

  const city = CITIES.find((c) => c.slug === slug);
  const inCity = useMemo(() => (city ? hotels.filter((h) => h.city === city.name) : hotels), [hotels, city]);
  const counts = useMemo(() => Object.fromEntries(CITIES.map((c) => [c.slug, hotels.filter((h) => h.city === c.name).length])), [hotels]);

  const prices = inCity.length ? inCity.map((h) => h.price) : [0];
  const cats = useMemo(() => [...new Set(inCity.map((h) => h.tag).filter(Boolean))], [inCity]);
  const lo = Math.floor(Math.min(...prices) / 10) * 10;
  const cap = Math.ceil(Math.max(...prices) / 10) * 10;
  const limit = Math.min(maxPrice ?? cap, cap);

  const list = useMemo(() => {
    const out = inCity.filter(
      (h) => h.price <= limit && h.rating >= minRate && (!stars.length || stars.includes(h.stars)) && (!tags.length || tags.includes(h.tag)) &&
        ams.every((a) => h.amenities.includes(a))
    );
    const by = { rate: (a, b) => b.rating - a.rating, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rev: (a, b) => b.reviews - a.reviews };
    return out.sort(by[sort]);
  }, [inCity, limit, minRate, stars, ams, tags, sort]);

  const active = (stars.length ? 1 : 0) + (minRate ? 1 : 0) + (ams.length ? 1 : 0) + (tags.length ? 1 : 0) + (limit < cap ? 1 : 0);
  const touch = (fn) => (v) => { fn(v); setShown(PAGE); };
  const pick = (arr, set, v) => touch(set)(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const resetFilters = () => { setStars([]); setMinRate(0); setAms([]); setTags([]); setMaxPrice(null); setShown(PAGE); };
  const changeCity = (s) => {
    setSlug(s); setMaxPrice(null); setShown(PAGE);
    window.history.replaceState(null, "", s === "all" ? "/hotels" : `/city/${s}`);
  };

  const [a, b] = city ? THEMES[city.name] : ["#6C3BFF", "#FF5E7A"];

  return (
    <>
      <header className="relative overflow-hidden pb-12 pt-10 text-white" style={{ backgroundImage: `linear-gradient(135deg, ${a}, ${b})` }}>
        <div className="absolute inset-0 bg-night/50" />
        <div className="relative mx-auto max-w-6xl px-5">
          <nav aria-label="مسیر صفحه" className="mb-4 text-sm opacity-85">
            <Link href="/">خانه</Link> › <Link href="/hotels">هتل‌ها</Link>{city && <> › {city.name}</>}
          </nav>
          <h1 className="text-[clamp(32px,6vw,56px)] font-black leading-tight">{city ? `هتل‌های ${city.name}` : "همه‌ی هتل‌ها"}</h1>
          <p className="mt-2 max-w-xl text-white/90">{city ? city.blurb : `${fa(hotels.length)} هتل در ${fa(CITIES.length)} شهر؛ شهر را انتخاب کن و با فیلترها دقیق‌تر جستجو کن.`}</p>
          <p className="mt-3 text-sm text-white/80">{fa(inCity.length)} هتل · از {fmt(Math.min(...prices))} در هر شب</p>
        </div>
      </header>

      <div className="sticky top-16 z-30 border-b border-line bg-bg/95">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3" role="group" aria-label="انتخاب شهر">
          <div className="shrink-0 rounded-full border border-line bg-card px-3">
            <label htmlFor="csearch" className="sr-only">جستجوی شهر</label>
            <input id="csearch" type="search" value={cs} onChange={(e) => setCs(e.target.value)} placeholder="جستجوی شهر…"
              onKeyDown={(e) => { if (e.key === "Enter") { const m = CITIES.find((c) => c.name.includes(cs.trim())); if (m) { changeCity(m.slug); setCs(""); } } }}
              className="w-32 bg-transparent py-1.5 text-sm outline-none" />
          </div>
          <button onClick={() => changeCity("all")} aria-pressed={slug === "all"} className={chip(slug === "all")}>همه شهرها ({fa(hotels.length)})</button>
          {CITIES.filter((c) => c.name.includes(cs.trim())).map((c) => (
            <button key={c.slug} onClick={() => changeCity(c.slug)} aria-pressed={slug === c.slug} className={chip(slug === c.slug)}>
              {c.name} ({fa(counts[c.slug])})
            </button>
          ))}
          {cs.trim() && !CITIES.some((c) => c.name.includes(cs.trim())) && <NoResults compact query={cs} title="شهری پیدا نشد" ask={cs.trim()} />}
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside className={`${panel ? "block" : "hidden"} h-fit space-y-4 rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-36 lg:block`} aria-label="فیلترها">
          <div className="flex items-center justify-between">
            <b>فیلترها</b>
            {active > 0 && <button onClick={resetFilters} className="text-sm text-coral">پاک کردن ({fa(active)})</button>}
          </div>
          <Block title={`حداکثر قیمت: ${fmt(limit)}`}>
            <input type="range" min={lo} max={cap} step={5} value={limit} onChange={(e) => touch(setMaxPrice)(+e.target.value)} aria-label="حداکثر قیمت هر شب" className="w-full accent-violet" />
            <div className="flex justify-between text-xs text-mut"><span>{fmt(lo)}</span><span>{fmt(cap)}</span></div>
          </Block>
          <Block title="ستاره">
            <div className="flex flex-wrap gap-2">
              {[5, 4, 3].map((s) => <button key={s} onClick={() => pick(stars, setStars, s)} aria-pressed={stars.includes(s)} className={chip(stars.includes(s))}>{fa(s)} ★</button>)}
            </div>
          </Block>
          {cats.length > 1 && (
            <Block title="دسته‌بندی">
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => <button key={c} onClick={() => pick(tags, setTags, c)} aria-pressed={tags.includes(c)} className={chip(tags.includes(c))}>{c}</button>)}
              </div>
            </Block>
          )}
          <Block title="حداقل امتیاز">
            <div className="flex flex-wrap gap-2">
              {RATINGS.map(([l, v]) => <button key={l} onClick={() => touch(setMinRate)(v)} aria-pressed={minRate === v} className={chip(minRate === v)}>{l}</button>)}
            </div>
          </Block>
          <Block title="امکانات">
            <div className="space-y-2">
              {AMENITIES.map((am) => (
                <label key={am} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={ams.includes(am)} onChange={() => pick(ams, setAms, am)} className="h-4 w-4 accent-violet" />{am}
                </label>
              ))}
            </div>
          </Block>
        </aside>

        <section aria-label="نتایج">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setPanel(!panel)} aria-expanded={panel} className="rounded-full border border-line bg-card px-4 py-1.5 text-sm lg:hidden">
                فیلترها{active > 0 && <span className="ms-1.5 rounded-full bg-coral px-2 text-xs font-bold text-white">{fa(active)}</span>}
              </button>
              <p className="text-sm text-mut">{fa(list.length)} هتل پیدا شد</p>
            </div>
            <div className="rounded-[14px] border border-line bg-card px-3.5 py-1.5">
              <label htmlFor="cs" className="sr-only">مرتب‌سازی</label>
              <select id="cs" value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent text-sm font-semibold outline-none">
                <option value="rate">بهترین امتیاز</option>
                <option value="low">ارزان‌ترین</option>
                <option value="high">گران‌ترین</option>
                <option value="rev">پرنظرترین</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            {list.slice(0, shown).map((h) => (
              <HotelCard key={h.id} hotel={h} fav={favs.has(h.id)} onFav={() => toggle(h.id)} />
            ))}
          </div>
          {!list.length && (
            <NoResults emoji="🔍" title="هتلی با این فیلترها پیدا نشد" note="فیلترها را کم کن یا شهر دیگری را انتخاب کن."
              ask={city ? `هتل در ${city.name}` : "هتل ارزان"} onReset={resetFilters} resetLabel="پاک کردن فیلترها" />
          )}
          {list.length > shown && (
            <div className="my-8 text-center">
              <button onClick={() => setShown((n) => n + PAGE)} className="min-h-[54px] rounded-[14px] bg-gradient-to-br from-coral to-violet px-10 font-extrabold text-white">نمایش بیشتر</button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
