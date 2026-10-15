"use client";
import Link from "next/link";
import HotelCard from "../HotelCard";
import { useCurrency } from "../CurrencyProvider";
import { useFavorites } from "../FavoritesProvider";
import { Btn, Card } from "../admin/ui";
import { fa } from "@/lib/fa";

export default function Saved({ hotels }) {
  const { favs, toggle, clear, cmp, toggleCmp, clearCmp } = useFavorites();
  const { fmt } = useCurrency();
  const list = hotels.filter((h) => favs.has(h.id));
  const picked = cmp.map((id) => hotels.find((h) => h.id === id)).filter(Boolean);
  const avg = list.length ? list.reduce((s, h) => s + h.price, 0) / list.length : 0;

  return (
    <div className="space-y-5">
      <Card title={`⚖️ فهرست مقایسه (${fa(picked.length)} از ۳)`} action={picked.length > 0 && <Btn onClick={clearCmp} className="!py-1 text-xs">خالی کردن</Btn>}>
        {picked.length === 0 ? <p className="text-sm text-mut">روی «+ مقایسه» کارت هتل‌ها بزن تا تا ۳ هتل را کنار هم ببینی.</p> : (
          <div className="flex flex-wrap items-center gap-2">
            {picked.map((h) => <span key={h.id} className="flex items-center gap-2 rounded-full border border-line bg-bg py-1 pe-1 ps-4 text-sm">{h.name}<button onClick={() => toggleCmp(h.id)} aria-label={`حذف ${h.name} از مقایسه`} className="h-7 w-7 rounded-full border border-line">✕</button></span>)}
            <Link href="/compare" className="rounded-xl bg-gradient-to-br from-coral to-violet px-5 py-2 text-sm font-extrabold text-white">مقایسه‌ی {fa(picked.length)} هتل</Link>
          </div>
        )}
      </Card>

      {list.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line p-12 text-center">
          <div className="mb-2 text-4xl" aria-hidden="true">💜</div>
          <p className="text-lg font-bold">هنوز هتلی ذخیره نکرده‌ای</p>
          <p className="mb-5 mt-1 text-mut">روی قلب کارت هتل بزن تا اینجا ذخیره شود.</p>
          <Link href="/hotels" className="inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">دیدن هتل‌ها</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mut">{fa(list.length)} هتل ذخیره‌شده · میانگین قیمت {fmt(avg)} در هر شب</p>
            <Btn onClick={clear} className="!py-1.5 text-mut hover:text-coral">پاک کردن همه</Btn>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            {list.map((h) => <HotelCard key={h.id} hotel={h} fav onFav={() => toggle(h.id)} />)}
          </div>
        </>
      )}
    </div>
  );
}
