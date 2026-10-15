"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHotels } from "./HotelsProvider";
import { useCurrency } from "./CurrencyProvider";
import HotelPhoto from "./HotelPhoto";
import OfferCountdown from "./OfferCountdown";
import Section from "./Section";
import { useNow } from "./useNow";
import { fetchOffers } from "@/lib/offers";
import { fa } from "@/lib/fa";

const AUTOPLAY_MS = 6000;
const REFRESH_MS = 60000; // تغییرهای ادمین (خاموش/حذف/تمدید) حداکثر یک دقیقه‌ی بعد دیده می‌شود

export default function OfferSlider({ hotels: base }) {
  const all = useHotels(base);
  const { fmt } = useCurrency();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [i, setI] = useState(0);
  const hover = useRef(false);
  const now = useNow(data?.offset || 0);

  useEffect(() => {
    let off = false;
    const load = () => fetchOffers()
      .then((d) => !off && setData({ items: d.items, offset: d.now - Date.now() }))
      .catch(() => {});
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    return () => { off = true; clearInterval(t); };
  }, []);

  const slides = useMemo(() => {
    const byId = new Map(all.map((h) => [h.id, h]));
    return (data?.items || []).map((o) => ({ o, h: byId.get(o.hotelId) })).filter((x) => x.h);
  }, [data, all]);

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!hover.current) setI((v) => (v + 1) % slides.length); }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;
  const idx = Math.min(i, slides.length - 1);
  const go = (n) => setI((n + slides.length) % slides.length);

  return (
    <Section id="offers" title="پیشنهادهای ویژه" sub="تخفیف‌های زمان‌دار؛ تا وقتی تایمر تمام نشده می‌توانی با قیمت ویژه رزرو کنی.">
      <div
        className="relative"
        onPointerEnter={() => (hover.current = true)}
        onPointerLeave={() => (hover.current = false)}
      >
        <div className="overflow-hidden rounded-[28px]">
          {/* صفحه RTL است؛ اسلاید بعدی سمت چپ می‌آید و با translateX مثبت دیده می‌شود */}
          <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${idx * 100}%)` }}>
            {slides.map(({ o, h }, n) => {
              const left = new Date(o.endsAt).getTime() - now;
              const ended = left <= 0;
              const sale = h.price * (1 - o.discountPct / 100);
              return (
                <article key={o.id} aria-hidden={n !== idx} className="w-full shrink-0 border border-line bg-card first:rounded-s-[28px] last:rounded-e-[28px]">
                  <div className="grid md:grid-cols-2">
                    <div className="relative min-h-[220px] md:min-h-[340px]">
                      <div className="absolute inset-0"><HotelPhoto hotel={h} /></div>
                      <span className="absolute start-4 top-4 rounded-full bg-coral px-4 py-1 text-lg font-black text-white shadow-lg">
                        {fa(o.discountPct)}٪ تخفیف
                      </span>
                      {ended && (
                        <div className="absolute inset-0 grid place-items-center bg-night/70 text-xl font-extrabold text-white">پایان یافته</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                      <div>
                        <span className="text-sm text-mut">{h.city} · <span className="text-sun">{"★".repeat(h.stars)}</span></span>
                        <h3 className="mt-1 text-2xl font-black sm:text-3xl">{h.name}</h3>
                        {o.title && <p className="mt-1 text-mut">{o.title}</p>}
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <b className="text-3xl" style={{ color: "var(--price)" }}>{fmt(sale)}</b>
                        <span className="text-mut line-through">{fmt(h.price)}</span>
                        <span className="text-xs text-mut">/ هر شب</span>
                      </div>
                      {!ended ? (
                        <div>
                          <p className="mb-2 text-sm font-semibold text-mut">زمان باقی‌مانده تا پایان پیشنهاد</p>
                          <OfferCountdown ms={left} />
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-coral">زمان این پیشنهاد تمام شده و رزرو با این تخفیف بسته است.</p>
                      )}
                      <div>
                        <button
                          type="button"
                          disabled={ended}
                          tabIndex={n === idx ? 0 : -1}
                          onClick={() => router.push(`/checkout?hotel=${h.id}&offer=${o.id}`)}
                          className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                        >
                          {ended ? "پیشنهاد پایان یافته" : "رزرو با تخفیف"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button type="button" onClick={() => go(idx - 1)} aria-label="پیشنهاد قبلی" className="absolute start-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-2xl leading-none text-night shadow dark:bg-night/80 dark:text-white">›</button>
            <button type="button" onClick={() => go(idx + 1)} aria-label="پیشنهاد بعدی" className="absolute end-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-2xl leading-none text-night shadow dark:bg-night/80 dark:text-white">‹</button>
            <div className="mt-4 flex justify-center gap-2">
              {slides.map(({ o }, n) => (
                <button key={o.id} type="button" onClick={() => setI(n)} aria-label={`پیشنهاد ${fa(n + 1)}`} aria-current={n === idx}
                  className={`h-2.5 rounded-full transition-all ${n === idx ? "w-7 bg-coral" : "w-2.5 bg-line"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
