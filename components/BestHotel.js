"use client";
import { useEffect, useMemo, useRef } from "react";
import { useHotels } from "./HotelsProvider";
import { useFavorites } from "./FavoritesProvider";
import HotelPhoto from "./HotelPhoto";
import Price from "./Price";
import Section from "./Section";
import { fa } from "@/lib/fa";

const COUNT = 12; // تعداد هتل‌های اسلایدر
const SPEED = 40; // پیکسل بر ثانیه؛ کمتر = آرام‌تر
const EASE = 6; // سرعت نرم شدن توقف / شروع دوباره

export default function BestHotels({ hotels: base }) {
  const all = useHotels(base);
  const { openHotel } = useFavorites();
  const best = useMemo(
    () => [...all].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, COUNT),
    [all]
  );
  const trackRef = useRef(null);
  const hover = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let offset = 0, speed = SPEED, last = performance.now(), raf;
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      speed += ((hover.current ? 0 : SPEED) - speed) * Math.min(1, EASE * dt); // نرم
      offset = (offset + speed * dt) % (el.scrollWidth / 2);
      el.style.transform = `translate3d(${-offset}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [best.length]);

  if (!best.length) return null;
  const loop = [...best, ...best];

  return (
    <Section id="best" title="بهترین هتل‌ها" sub="هتل‌هایی که بالاترین امتیاز مهمان‌ها را گرفتند.">
      {/* dir=ltr فقط برای مکانیک حرکت است؛ متن کارت‌ها راست‌به‌چپ می‌ماند */}
      <div
        dir="ltr"
        className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
        onPointerEnter={() => (hover.current = true)}
        onPointerLeave={() => (hover.current = false)}
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          {loop.map((h, i) => (
            <div key={`${h.id}-${i}`} dir="rtl" className="w-64 shrink-0 pe-5 sm:w-72" aria-hidden={i >= best.length}>
              <article
                onClick={() => openHotel(h)}
                className="cursor-pointer overflow-hidden rounded-[20px] border border-line bg-card transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(108,59,255,.22)]"
              >
                <div className="relative h-40">
                  <HotelPhoto hotel={h} />
                  <span className="absolute start-2.5 top-2.5 rounded-full bg-night/70 px-3 text-xs font-semibold text-white backdrop-blur">{h.city}</span>
                </div>
                <div className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[17px] font-bold">{h.name}</h3>
                    <span className="rounded-lg bg-sun px-2 text-[13px] font-extrabold text-[#2a1700]">{fa(h.rating)}</span>
                  </div>
                  <div className="text-[13px] text-mut">{"★".repeat(h.stars)} · {fa(h.reviews)} نظر</div>
                  <div className="pt-1">
                    <b className="text-lg" style={{ color: "var(--price)" }}><Price usd={h.price} /></b>{" "}
                    <span className="text-xs text-mut">/ هر شب</span>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
