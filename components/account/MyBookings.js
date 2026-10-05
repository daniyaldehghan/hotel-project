"use client";
import { useState } from "react";
import Link from "next/link";
import HotelPhoto from "../HotelPhoto";
import { useCurrency } from "../CurrencyProvider";
import { useFavorites } from "../FavoritesProvider";
import { Badge, Btn } from "../admin/ui";
import { cancelBooking } from "@/lib/bookings";
import { STATUS_LABELS } from "@/lib/bookingRules";
import { countdown, freeCancelUntil, kindOf, todayIso } from "@/lib/trips";
import { fa } from "@/lib/fa";

const TABS = [["upcoming", "پیش‌رو"], ["past", "گذشته"], ["cancelled", "لغو / باطل شده"]];

export default function MyBookings({ hotels, sum, refresh }) {
  const { fmt } = useCurrency();
  const { openHotel, notify } = useFavorites();
  const [tab, setTab] = useState(sum.upcoming.length || !sum.past.length ? "upcoming" : "past");
  const [asking, setAsking] = useState(null);
  const list = sum[tab];
  const today = todayIso();

  const cancel = async (code) => {
    try { await cancelBooking(code); notify("رزرو لغو شد."); await refresh(); }
    catch (e) { notify(e.message); }
    setAsking(null);
  };
  const copy = async (code) => { try { await navigator.clipboard.writeText(code); notify("کد رزرو کپی شد."); } catch { notify(code); } };

  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto" role="tablist" aria-label="وضعیت رزرو">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${tab === k ? "border-violet bg-violet text-white" : "border-line bg-card"}`}>{l} ({fa(sum[k].length)})</button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center">
          <div className="mb-2 text-4xl" aria-hidden="true">🧳</div>
          <p className="font-bold">رزروی در این بخش نیست</p>
          <Link href="/hotels" className="mt-4 inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-2.5 font-extrabold text-white">رزرو هتل</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((b) => {
            const hotel = hotels.find((h) => h.id === b.hotelId);
            const canFree = today <= freeCancelUntil(b);
            const k = kindOf(b, today);
            return (
              <li key={b.code} className="overflow-hidden rounded-3xl border border-line bg-card sm:flex">
                <div className="relative h-36 sm:h-auto sm:w-48 sm:shrink-0">
                  {hotel && <HotelPhoto hotel={hotel} />}
                  {k === "upcoming" && <span className="absolute start-3 top-3 rounded-full bg-night/85 px-3 py-0.5 text-xs font-bold text-white">{countdown(b)}</span>}
                </div>
                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h2 className="text-lg font-extrabold">{b.hotelName}</h2><p className="text-sm text-mut">{b.city} · {b.rooms > 1 ? `${fa(b.rooms)} × ` : ""}{b.room}{b.status !== "confirmed" && <span className="ms-2 font-bold text-coral">{STATUS_LABELS[b.status]}</span>}</p></div>
                    <button onClick={() => copy(b.code)} title="کپی کد رزرو" className="rounded-lg border border-line px-3 py-0.5 text-xs font-bold" dir="ltr">{b.code} ⧉</button>
                  </div>
                  <dl className="my-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-mut">ورود</dt><dd className="font-semibold">{fa(b.checkIn)}</dd></div>
                    <div><dt className="text-xs text-mut">خروج</dt><dd className="font-semibold">{fa(b.checkOut)}</dd></div>
                    <div><dt className="text-xs text-mut">{fa(b.nights)} شب · {fa(b.guests)} مهمان</dt><dd className="font-bold" style={{ color: "var(--price)" }}>{fmt(b.totalUsd)}</dd></div>
                    <div><dt className="text-xs text-mut">پرداخت</dt><dd><Badge tone={b.pay === "online" ? "info" : "mut"}>{b.pay === "online" ? "آنلاین" : "در هتل"}</Badge></dd></div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2">
                    {hotel && <Btn onClick={() => openHotel(hotel)} className="!px-3 !py-1.5">جزئیات هتل</Btn>}
                    <Link href={`/track?code=${b.code}`} className="rounded-xl border border-line px-3 py-1.5 text-sm font-semibold">پیگیری</Link>
                    {hotel && k !== "upcoming" && <Link href={`/checkout?hotel=${hotel.id}`} className="rounded-xl bg-violet/10 px-3 py-1.5 text-sm font-semibold text-violet dark:text-aqua">رزرو دوباره</Link>}
                    {k === "upcoming" && (asking === b.code ? (
                      <><span className="text-sm">لغو شود؟</span>
                        <Btn kind="danger" onClick={() => cancel(b.code)} className="!px-3 !py-1.5">بله، لغو کن</Btn>
                        <Btn onClick={() => setAsking(null)} className="!px-3 !py-1.5">نه</Btn></>
                    ) : canFree ? <Btn onClick={() => setAsking(b.code)} className="!px-3 !py-1.5 text-mut hover:text-coral">لغو رایگان</Btn>
                      : <Link href="/contact" className="text-sm text-mut underline">لغو رایگان تمام شده؛ با پشتیبانی تماس بگیر</Link>)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
