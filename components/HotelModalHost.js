"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import HotelPhoto from "./HotelPhoto";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { fa } from "@/lib/fa";

export default function HotelModalHost() {
  const { current: h, closeHotel, favs, toggle } = useFavorites();
  const router = useRouter();
  const { fmt } = useCurrency();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!h) return;
    const onKey = (e) => e.key === "Escape" && closeHotel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [h, closeHotel]);

  if (!h) return null;
  const fav = favs.has(h.id);
  const go = (room) => { router.push(`/checkout?hotel=${h.id}&room=${room}`); closeHotel(); };
  const info = [["فاصله تا مرکز شهر", `${fa(h.distance).replace(".", "٫")} کیلومتر`], ["ساعت ورود", h.checkIn], ["ساعت خروج", h.checkOut], ["آدرس", h.address]];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-night/75 sm:items-center sm:p-6" onClick={closeHotel}>
      <div role="dialog" aria-modal="true" aria-labelledby="hm-title" onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-card text-ink shadow-2xl sm:rounded-3xl">
        <div className="relative h-56 sm:h-72">
          <HotelPhoto hotel={h} />
          <button ref={closeRef} onClick={closeHotel} aria-label="بستن" className="absolute end-3 top-3 h-10 w-10 rounded-full bg-white/90 text-night dark:bg-night/80 dark:text-white">✕</button>
          <span className="absolute start-3 top-3 rounded-full bg-night/75 px-3 py-0.5 text-sm font-semibold text-white">{h.city}</span>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="hm-title" className="text-2xl font-extrabold">{h.name}</h2>
              <p className="mt-1 text-sm text-mut"><span className="text-sun">{"★".repeat(h.stars)}</span> · {fa(h.reviews)} نظر · {h.tag}</p>
            </div>
            <span className="rounded-xl bg-sun px-3 py-1 text-lg font-extrabold text-[#2a1700]">{fa(h.rating)}</span>
          </div>

          <p className="leading-8 text-mut">{h.desc}</p>

          <dl className="grid gap-3 sm:grid-cols-2">
            {info.map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line px-4 py-3">
                <dt className="text-xs text-mut">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="mb-3 font-bold">امکانات هتل</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              {h.amenities.map((a) => <li key={a} className="flex items-center gap-2"><span className="text-violet">✓</span>{a}</li>)}
            </ul>
          </section>

          <section>
            <h3 className="mb-3 font-bold">انتخاب اتاق</h3>
            <ul className="space-y-2">
              {h.rooms.map((r, i) => (
                <li key={r.name} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                  <span className="font-semibold">{r.name}</span>
                  <span className="flex items-center gap-3">
                    <span><b style={{ color: "var(--price)" }}>{fmt(r.price)}</b> <span className="text-xs text-mut">/ شب</span></span>
                    <button onClick={() => go(i)} className="rounded-[10px] bg-ink px-4 py-1.5 text-sm font-bold text-bg hover:bg-coral hover:text-white">رزرو</button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-mut">لغو رایگان تا ۴۸ ساعت قبل از ورود. قیمت‌ها شامل مالیات هستند.</p>
          </section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-line bg-card px-6 py-4">
          <div><span className="text-xs text-mut">از</span> <b className="text-2xl" style={{ color: "var(--price)" }}>{fmt(h.price)}</b> <span className="text-xs text-mut">/ هر شب</span></div>
          <div className="flex gap-2">
            <button onClick={() => toggle(h.id)} aria-pressed={fav} aria-label="ذخیره" className={`h-11 w-11 rounded-full border border-line text-xl ${fav ? "text-coral" : "text-mut"}`}>♥</button>
            <button onClick={() => go(0)} className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 font-extrabold text-white">رزرو</button>
          </div>
        </div>
      </div>
    </div>
  );
}
