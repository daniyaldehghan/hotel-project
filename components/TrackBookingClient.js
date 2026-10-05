"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCurrency } from "./CurrencyProvider";
import { trackBooking } from "@/lib/bookings";
import { STATUS_HINTS, STATUS_LABELS, normalizeCode } from "@/lib/bookingRules";
import { addDaysIso, countdown, todayIso } from "@/lib/trips";
import { fa } from "@/lib/fa";

const TONE = {
  confirmed: "bg-[#22C79A]/15 text-[#128a6a] dark:text-[#22E3D2]",
  cancelled: "bg-sun/25 text-[#8a5a00] dark:text-sun",
  voided: "bg-coral/15 text-coral",
};
const ICON = { confirmed: "✓", cancelled: "✕", voided: "⊘" };
const when = (d) => fa(new Date(d).toLocaleString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));

// پیگیری رزرو با کد پیگیری: وضعیت فعال / لغو شده / باطل شده
export default function TrackBookingClient({ initialCode = "" }) {
  const { fmt } = useCurrency();
  const [code, setCode] = useState(initialCode);
  const [b, setB] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const lookup = useCallback(async (raw, silent = false) => {
    const c = normalizeCode(raw);
    if (!c) { if (!silent) { setB(null); setErr("کد پیگیری درست نیست. شکلش مثل SR-7K2QX9 است."); } return; }
    if (!silent) { setBusy(true); setErr(""); }
    try {
      const d = await trackBooking(c);
      setB(d); setCode(d.code);
    } catch (e) {
      if (!silent) { setB(null); setErr(e.message); }
    } finally {
      if (!silent) setBusy(false);
    }
  }, []);

  // اگر با لینک (?code=...) آمده، همان‌جا باز شود
  useEffect(() => { if (initialCode) lookup(initialCode); }, [initialCode, lookup]);

  // اگر ادمین کد را باطل کرد، بدون رفرش دیده شود: هر ۲۰ ثانیه، فقط وقتی تب دیده می‌شود
  const current = b?.code;
  useEffect(() => {
    if (!current) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") lookup(current, true); }, 20000);
    return () => clearInterval(t);
  }, [current, lookup]);

  const submit = (e) => { e.preventDefault(); if (!busy && code.trim()) lookup(code); };
  const today = todayIso();

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-3xl border border-line bg-card p-5 sm:p-6">
        <h2 className="text-xl font-extrabold">پیگیری رزرو</h2>
        <p className="mt-1 text-sm text-mut">کد پیگیری‌ای که بعد از ثبت رزرو گرفتی را وارد کن تا وضعیتش را ببینی.</p>
        <div className="mt-4 flex gap-2">
          <div className={`flex-1 rounded-[14px] border px-3.5 py-2 ${err ? "border-coral" : "border-line"}`}>
            <label htmlFor="track-code" className="block text-xs text-mut">کد پیگیری</label>
            <input id="track-code" dir="ltr" autoComplete="off" spellCheck={false} placeholder="SR-7K2QX9" value={code}
              onChange={(e) => { setCode(e.target.value); setErr(""); }} aria-invalid={!!err}
              className="w-full bg-transparent font-bold tracking-widest outline-none" />
          </div>
          <button type="submit" disabled={busy || !code.trim()} className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-6 font-extrabold text-white disabled:opacity-50">
            {busy ? "…" : "پیگیری"}
          </button>
        </div>
        {err && <p role="alert" className="mt-2 text-sm text-coral">{err}</p>}
      </form>

      {b && (
        <section className="rounded-3xl border border-line bg-card p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-mut">کد پیگیری</p>
              <b className="text-2xl tracking-widest" dir="ltr">{b.code}</b>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-extrabold ${TONE[b.status]}`}>
              <span aria-hidden="true">{ICON[b.status]}</span>{STATUS_LABELS[b.status]}
            </span>
          </div>
          <p className="mt-3 text-sm">
            {b.firstName ? `${b.firstName} عزیز، ` : ""}{STATUS_HINTS[b.status]}
            {b.status === "voided" && b.voidedAt ? ` (${when(b.voidedAt)})` : ""}
          </p>
          {b.status === "confirmed" && b.checkOut >= today && <p className="mt-1 text-sm text-mut">{countdown(b)}</p>}

          <dl className="mt-5 grid gap-2 text-sm">
            {[
              ["هتل", `${b.hotelName}، ${b.city}`],
              ["اتاق", `${b.rooms > 1 ? `${fa(b.rooms)} × ` : ""}${b.room}`],
              ["مهمان", `${fa(b.guests)} نفر`],
              ["تاریخ", `${fa(b.checkIn)} تا ${fa(b.checkOut)} (${fa(b.nights)} شب)`],
              ["پرداخت", b.pay === "online" ? "پرداخت آنلاین" : "پرداخت در هتل"],
              ["مبلغ نهایی", fmt(b.totalUsd)],
              ["تاریخ ثبت", when(b.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line py-1.5 last:border-0"><dt className="text-mut">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>

          {b.status === "confirmed" && b.checkIn >= today && (
            <p className="mt-4 text-xs text-mut">لغو رایگان تا {fa(addDaysIso(b.checkIn, -2))}. برای لغو، وارد حسابت شو (رزروها) یا با <Link href="/contact" className="underline">پشتیبانی</Link> تماس بگیر.</p>
          )}
          {b.status !== "confirmed" && (
            <p className="mt-4 text-xs text-mut">سؤالی داری؟ از <Link href="/contact" className="underline">ارتباط با ما</Link> با کد پیگیری پیام بده.</p>
          )}
        </section>
      )}
    </div>
  );
}
