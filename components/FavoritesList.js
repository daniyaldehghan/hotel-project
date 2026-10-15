"use client";
import { useHotels } from "./HotelsProvider";
import Link from "next/link";
import HotelCard from "./HotelCard";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { fa } from "@/lib/fa";

export default function FavoritesList({ hotels: base }) {
  const hotels = useHotels(base);
  const { favs, toggle, clear, ready } = useFavorites();
  const { fmt } = useCurrency();
  const list = hotels.filter((h) => favs.has(h.id));
  const avg = list.length ? Math.round(list.reduce((s, h) => s + h.price, 0) / list.length) : 0;

  return (
    <>
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-14 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,48px)] font-black">هتل‌های موردعلاقه</h1>
          <p className="mt-1 text-white/80">
            {ready && list.length ? `${fa(list.length)} هتل ذخیره کرده‌ای · میانگین قیمت ${fmt(avg)} در هر شب` : "هتل‌هایی که قلبشان را زده‌ای اینجا جمع می‌شوند."}
          </p>
        </div>
      </header>

      <main className="mx-auto min-h-[50vh] max-w-6xl px-5 py-10">
        {!ready ? (
          <p className="text-mut">در حال بارگذاری…</p>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line p-12 text-center">
            <p className="text-lg font-bold">هنوز هتلی ذخیره نکرده‌ای</p>
            <p className="mb-5 mt-1 text-mut">روی قلب کارت هتل بزن تا اینجا ذخیره شود.</p>
            <Link href="/#list" className="inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">دیدن هتل‌ها</Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex justify-end">
              <button onClick={clear} className="rounded-full border border-line px-4 py-1.5 text-sm text-mut hover:text-coral">پاک کردن همه</button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
              {list.map((h) => (
                <HotelCard key={h.id} hotel={h} fav onFav={() => toggle(h.id)} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
