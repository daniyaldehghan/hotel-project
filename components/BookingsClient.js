"use client";
import { useHotels } from "./HotelsProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import HotelPhoto from "./HotelPhoto";
import { useFavorites } from "./FavoritesProvider";
import { useCurrency } from "./CurrencyProvider";
import { useSession } from "next-auth/react";
import { cancelBooking, fetchMyBookings } from "@/lib/bookings";
import { STATUS_LABELS } from "@/lib/bookingRules";
import { fa } from "@/lib/fa";

const TABS = [["upcoming", "آینده"], ["past", "گذشته"], ["cancelled", "لغو / باطل شده"]];
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export default function BookingsClient({ hotels: base }) {
  const hotels = useHotels(base);
  const { openHotel } = useFavorites();
  const { fmt } = useCurrency();
  const [list, setList] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [asking, setAsking] = useState(null);
  const [err, setErr] = useState("");
  const { status: auth } = useSession();
  const today = new Date().toISOString().slice(0, 10);

  // رزروها از سرور (مونگو) خوانده می‌شوند؛ فقط برای کاربر واردشده
  useEffect(() => {
    if (auth === "unauthenticated") { setList([]); return; }
    if (auth !== "authenticated") return;
    fetchMyBookings().then(setList).catch((e) => { setList([]); setErr(e.message); });
  }, [auth]);

  const cancel = async (code) => {
    setErr("");
    try {
      const upd = await cancelBooking(code);
      setList((l) => l.map((b) => (b.code === code ? { ...b, ...upd } : b)));
    } catch (e) { setErr(e.message); }
    setAsking(null);
  };

  const kind = (b) => (b.status === "cancelled" || b.status === "voided" ? "cancelled" : b.checkOut < today ? "past" : "upcoming");
  const shown = (list || []).filter((b) => kind(b) === tab);
  const count = (k) => (list || []).filter((b) => kind(b) === k).length;

  return (
    <>
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-12 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,48px)] font-black">رزروهای من</h1>
          <p className="mt-1 text-white/80">رزروهای حسابت اینجا هستند؛ با کد پیگیری هم می‌توانی هر رزروی را ببینی.</p>
        </div>
      </header>

      <main className="mx-auto min-h-[50vh] max-w-4xl px-5 py-8">
        <Link href="/track" className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-5 py-3 text-sm">
          <span>کد پیگیری داری؟ وضعیت رزرو را همین الان ببین.</span><b className="text-violet dark:text-aqua">پیگیری رزرو ←</b>
        </Link>
        {err && <p role="alert" className="mb-4 rounded-2xl border border-coral px-4 py-2 text-sm text-coral">{err}</p>}
        <div className="mb-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="وضعیت رزرو">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`shrink-0 rounded-full border px-5 py-1.5 text-sm ${tab === k ? "border-violet bg-violet text-white" : "border-line bg-card"}`}>
              {l} ({fa(count(k))})
            </button>
          ))}
        </div>

        {list === null || auth === "loading" ? (
          <p className="text-mut">در حال بارگذاری…</p>
        ) : auth === "unauthenticated" ? (
          <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center sm:p-12">
            <p className="font-bold">برای دیدن رزروهای حسابت وارد شو</p>
            <p className="mt-1 text-sm text-mut">رزرو را بدون حساب هم ثبت کرده‌ای؟ با کد پیگیری وضعیتش را ببین.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/signin" className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">ورود</Link>
              <Link href="/track" className="rounded-[14px] border border-line px-8 py-3 font-bold">پیگیری با کد</Link>
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line p-10 text-center sm:p-12">
            <p className="font-bold">رزروی در این بخش نیست</p>
            <Link href="/hotels" className="mt-4 inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">رزرو هتل</Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {shown.map((b) => {
              const hotel = hotels.find((h) => h.id === b.hotelId);
              const freeUntil = addDays(b.checkIn, -2);
              const canFree = today <= freeUntil;
              return (
                <li key={b.code} className="overflow-hidden rounded-3xl border border-line bg-card sm:flex">
                  <div className="h-40 sm:h-auto sm:w-56 sm:shrink-0">{hotel && <HotelPhoto hotel={hotel} />}</div>
                  <div className="flex-1 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-extrabold">{b.hotelName}</h2>
                        <p className="text-sm text-mut">{b.city} · {b.rooms > 1 ? `${fa(b.rooms)} × ` : ""}{b.room}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.status !== "confirmed" && <span className="rounded-lg bg-coral/10 px-2.5 py-0.5 text-xs font-bold text-coral">{STATUS_LABELS[b.status]}</span>}
                        <Link href={`/track?code=${b.code}`} title="پیگیری رزرو" className="rounded-lg border border-line px-3 py-0.5 text-xs font-bold" dir="ltr">{b.code}</Link>
                      </div>
                    </div>
                    <dl className="my-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div><dt className="text-xs text-mut">ورود</dt><dd className="font-semibold">{fa(b.checkIn)}</dd></div>
                      <div><dt className="text-xs text-mut">خروج</dt><dd className="font-semibold">{fa(b.checkOut)}</dd></div>
                      <div className="col-span-2 sm:col-span-1"><dt className="text-xs text-mut">{fa(b.nights)} شب · {fa(b.guests)} مهمان</dt><dd className="font-bold" style={{ color: "var(--price)" }}>{fmt(b.totalUsd)}</dd></div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-2">
                      {hotel && <button onClick={() => openHotel(hotel)} className="rounded-[10px] border border-line px-4 py-1.5 text-sm font-semibold">جزئیات هتل</button>}
                      {kind(b) === "upcoming" && (asking === b.code ? (
                        <>
                          <span className="text-sm">لغو شود؟</span>
                          <button onClick={() => cancel(b.code)} className="rounded-[10px] bg-coral px-4 py-1.5 text-sm font-bold text-white">بله، لغو کن</button>
                          <button onClick={() => setAsking(null)} className="rounded-[10px] border border-line px-4 py-1.5 text-sm">نه</button>
                        </>
                      ) : canFree ? (
                        <button onClick={() => setAsking(b.code)} className="rounded-[10px] border border-line px-4 py-1.5 text-sm text-mut hover:text-coral">لغو رایگان</button>
                      ) : (
                        <Link href="/contact" className="text-sm text-mut underline">لغو رایگان تمام شده؛ با پشتیبانی تماس بگیر</Link>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
