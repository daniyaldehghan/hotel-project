"use client";
import { useRouter } from "next/navigation";
import HotelPhoto from "./HotelPhoto";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { fa } from "@/lib/fa";

export default function HotelCard({ hotel: h, fav, onFav, onBook }) {
  const { openHotel, cmp, toggleCmp } = useFavorites();
  const { fmt } = useCurrency();
  const router = useRouter();
  const book = onBook ?? (() => router.push(`/checkout?hotel=${h.id}`));
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const inCmp = cmp.includes(h.id);
  const more = h.amenities.length - 3;

  return (
    <article
      onClick={() => openHotel(h)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-line bg-card transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(108,59,255,.22)]"
    >
      <div className="relative h-40">
        <HotelPhoto hotel={h} />
        <span className="absolute start-2.5 top-2.5 rounded-full bg-night/75 px-3 text-xs font-semibold text-white">{h.city}</span>
        <button onClick={stop(onFav)} aria-pressed={fav} aria-label="ذخیره"
          className={`absolute end-2 top-2 h-9 w-9 rounded-full bg-white/90 text-lg leading-none dark:bg-night/80 ${fav ? "text-coral" : "text-[#9a8fc7]"}`}>♥</button>
        <button onClick={stop(() => toggleCmp(h.id))} aria-pressed={inCmp}
          className={`absolute bottom-2.5 start-2.5 rounded-full px-3 py-1 text-xs font-semibold ${inCmp ? "bg-violet text-white" : "bg-white/90 text-night dark:bg-night/80 dark:text-white"}`}>
          {inCmp ? "✓ در مقایسه" : "+ مقایسه"}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[17px] font-bold"><button type="button" className="text-start">{h.name}</button></h3>
          <span className="rounded-lg bg-sun px-2 text-[13px] font-extrabold text-[#2a1700]">{fa(h.rating)}</span>
        </div>
        <div className="text-[13px] text-mut">{"★".repeat(h.stars)} · {fa(h.reviews)} نظر · {h.tag}</div>
        <div className="my-1 flex flex-wrap gap-1.5">
          {h.amenities.slice(0, 3).map((a) => <span key={a} className="rounded-md border border-line bg-bg px-2 text-[11px] text-mut">{a}</span>)}
          {more > 0 && <span className="rounded-md border border-line bg-bg px-2 text-[11px] text-violet dark:text-aqua">+{fa(more)}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <b className="break-words text-xl" style={{ color: "var(--price)" }}>{fmt(h.price)}</b> <span className="text-xs text-mut">/ هر شب</span>
          </div>
          <button onClick={stop(book)} className="shrink-0 rounded-[10px] bg-ink px-4 py-1.5 font-bold text-bg hover:bg-coral hover:text-white">رزرو</button>
        </div>
      </div>
    </article>
  );
}
