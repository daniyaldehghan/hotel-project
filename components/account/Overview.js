"use client";
import Link from "next/link";
import HotelCard from "../HotelCard";
import HotelPhoto from "../HotelPhoto";
import { askAssistant } from "../NoResults";
import { useCurrency } from "../CurrencyProvider";
import { useFavorites } from "../FavoritesProvider";
import { Columns, HBar } from "../admin/Charts";
import { Btn, Card, Stat } from "../admin/ui";
import { CURRENCIES } from "@/lib/currency";
import { countdown, daysUntil, freeCancelUntil } from "@/lib/trips";
import { fa } from "@/lib/fa";

const compact = (n) => (n >= 1e6 ? `${fa((n / 1e6).toFixed(1)).replace(".", "٫")} م` : n >= 1e3 ? `${fa(Math.round(n / 1e3))} هزار` : fa(Math.round(n)));

export default function Overview({ hotels, sum, go, unread }) {
  const { fmt, code } = useCurrency();
  const { favs, toggle, cmp, openHotel } = useFavorites();
  const next = sum.next;
  const nextHotel = next && hotels.find((h) => h.id === next.hotelId);
  const rate = CURRENCIES[code]?.rate ?? 1;

  const alerts = [];
  if (unread) alerts.push({ icon: "💬", text: `${fa(unread)} پیام جدید از پشتیبانی داری`, tab: "messages", cta: "بخوان" });
  if (next) {
    const d = daysUntil(next.checkIn);
    if (d >= 0 && d <= 7) alerts.push({ icon: "🧳", text: d === 0 ? `سفرت به ${next.city} امروز شروع می‌شود!` : `${fa(d)} روز تا سفرت به ${next.city}`, tab: "bookings", cta: "جزئیات" });
    const f = daysUntil(freeCancelUntil(next));
    if (f >= 0 && f <= 3) alerts.push({ icon: "⏳", text: `لغو رایگان «${next.hotelName}» تا ${f === 0 ? "امروز" : `${fa(f)} روز دیگر`} ممکن است`, tab: "bookings", cta: "مدیریت" });
  }
  if (cmp.length) alerts.push({ icon: "⚖️", text: `${fa(cmp.length)} هتل در فهرست مقایسه‌ات هست`, href: "/compare", cta: "مقایسه" });
  if (!sum.total) alerts.push({ icon: "🎁", text: "اولین رزرو؟ با کد SARA20 ۲۰٪ تخفیف بگیر", href: "/hotels", cta: "دیدن هتل‌ها" });

  const booked = new Set(sum.active.map((b) => b.hotelId));
  const likedCities = [...new Set([...sum.active.map((b) => b.city), ...hotels.filter((h) => favs.has(h.id)).map((h) => h.city)])];
  const pool = hotels.filter((h) => !booked.has(h.id) && !favs.has(h.id));
  const near = pool.filter((h) => likedCities.includes(h.city));
  const recs = [...(near.length >= 3 ? near : pool)].sort((a, b) => b.rating - a.rating).slice(0, 3);

  const ACTIONS = [
    ["🔎", "جستجوی هتل", { href: "/hotels" }],
    ["✨", "دستیار سفر", { href: "/assistant" }],
    ["⚖️", `مقایسه${cmp.length ? ` (${fa(cmp.length)})` : ""}`, { href: "/compare" }],
    ["💬", "گفتگو با پشتیبانی", { fn: () => askAssistant("") }],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="رزروهای پیش‌رو" value={fa(sum.upcoming.length)} />
        <Stat label="شب‌های سفر" value={fa(sum.nights)} />
        <Stat label="مجموع خرج" value={fmt(sum.spent)} />
        <Stat label="هتل‌های ذخیره‌شده" value={fa(favs.size)} />
      </div>

      {alerts.length > 0 && (
        <Card title="🔔 یادآوری‌ها">
          <ul className="divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.text} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span><span aria-hidden="true" className="me-2">{a.icon}</span>{a.text}</span>
                {a.href ? <Link href={a.href} className="shrink-0 rounded-xl bg-violet/10 px-3 py-1 font-semibold text-violet dark:text-aqua">{a.cta}</Link>
                  : <Btn kind="soft" onClick={() => go(a.tab)} className="shrink-0 !px-3 !py-1">{a.cta}</Btn>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="✈️ سفر بعدی" className="lg:col-span-2">
          {!next ? (
            <div className="py-6 text-center">
              <div className="mb-2 text-4xl" aria-hidden="true">🗺️</div>
              <p className="font-bold">سفر پیش‌رویی نداری</p>
              <p className="mb-4 text-sm text-mut">یک مقصد انتخاب کن و اولین رزرو را انجام بده.</p>
              <Link href="/hotels" className="inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-2.5 font-extrabold text-white">رزرو هتل</Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line sm:flex">
              <div className="relative h-40 sm:h-auto sm:w-52 sm:shrink-0">
                {nextHotel && <HotelPhoto hotel={nextHotel} />}
                <span className="absolute start-3 top-3 rounded-full bg-night/85 px-3 py-1 text-sm font-bold text-white">{countdown(next)}</span>
              </div>
              <div className="flex-1 p-5">
                <h3 className="text-lg font-extrabold">{next.hotelName}</h3>
                <p className="text-sm text-mut">{next.city} · {next.rooms > 1 ? `${fa(next.rooms)} × ` : ""}{next.room}</p>
                <dl className="my-3 grid grid-cols-3 gap-3 text-sm">
                  <div><dt className="text-xs text-mut">ورود</dt><dd className="font-semibold">{fa(next.checkIn)}</dd></div>
                  <div><dt className="text-xs text-mut">خروج</dt><dd className="font-semibold">{fa(next.checkOut)}</dd></div>
                  <div><dt className="text-xs text-mut">{fa(next.nights)} شب</dt><dd className="font-bold" style={{ color: "var(--price)" }}>{fmt(next.totalUsd)}</dd></div>
                </dl>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-line px-3 py-0.5 text-xs font-bold" dir="ltr">{next.code}</span>
                  {nextHotel && <Btn onClick={() => openHotel(nextHotel)} className="!px-3 !py-1">جزئیات هتل</Btn>}
                  <Btn kind="soft" onClick={() => go("bookings")} className="!px-3 !py-1">همه‌ی رزروها</Btn>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="⚡ دسترسی سریع">
          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map(([icon, label, a]) => {
              const cls = "flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-bg p-4 text-center text-sm font-semibold transition hover:border-violet";
              const inner = <><span className="text-2xl" aria-hidden="true">{icon}</span>{label}</>;
              return a.href ? <Link key={label} href={a.href} className={cls}>{inner}</Link> : <button key={label} onClick={a.fn} className={cls}>{inner}</button>;
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={`📈 خرج ۶ ماه اخیر (${code})`}>
          {sum.active.length ? <Columns items={sum.months.map((m) => ({ label: m.label, value: m.value * rate }))} fmt={compact} /> : <p className="py-10 text-center text-sm text-mut">بعد از اولین رزرو، نمودار خرجت اینجا نشان داده می‌شود.</p>}
        </Card>
        <Card title="📍 شهرهای محبوب تو">
          <HBar items={sum.cities.slice(0, 5)} fmt={(v) => `${fa(v)} رزرو`} empty="هنوز رزروی ثبت نشده" />
          {sum.hotelsCount > 0 && <p className="mt-4 text-xs text-mut">در {fa(sum.hotelsCount)} هتل مختلف اقامت داشته‌ای.</p>}
        </Card>
      </div>

      {recs.length > 0 && (
        <section>
          <div className="mb-3"><h2 className="font-extrabold">✨ پیشنهاد برای تو</h2><p className="text-sm text-mut">{near.length >= 3 ? "بر اساس شهرهایی که دوست داری" : "پرامتیازترین هتل‌های سرا"}</p></div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            {recs.map((h) => <HotelCard key={h.id} hotel={h} fav={favs.has(h.id)} onFav={() => toggle(h.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
