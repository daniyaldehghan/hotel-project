"use client";
import { useMemo, useState } from "react";
import { useCurrency } from "../CurrencyProvider";
import { Badge, Btn, Card, inputCls } from "./ui";
import { deleteBooking, lookupBookingForVoid, setBookingStatus, voidBooking } from "@/lib/bookings";
import { normalizeCode } from "@/lib/bookingRules";
import { fa } from "@/lib/fa";

const PAGE = 15;
const today = () => new Date().toISOString().slice(0, 10);
const kindOf = (b) => (b.status === "voided" ? "voided" : b.status === "cancelled" ? "cancelled" : b.checkOut < today() ? "past" : "upcoming");
const LABEL = { upcoming: ["آینده", "info"], past: ["گذشته", "mut"], cancelled: ["لغو شده", "bad"], voided: ["باطل شده", "bad"] };

// ───── باطل‌کردن رزرو با کد پیگیری: ادمین کد را وارد می‌کند، مشخصات را می‌بیند و تأیید می‌کند ─────
function VoidByCode({ refresh, notify }) {
  const [code, setCode] = useState("");
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { fmt } = useCurrency();

  const search = async (e) => {
    e.preventDefault();
    if (busy) return;
    const c = normalizeCode(code);
    setFound(null); setErr("");
    if (!c) return setErr("کد پیگیری درست نیست. شکلش مثل SR-7K2QX9 است.");
    setBusy(true);
    try { setFound(await lookupBookingForVoid(c)); setCode(c); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const doVoid = async () => {
    if (busy || !found) return;
    setBusy(true); setErr("");
    try {
      const upd = await voidBooking(found.code);
      setFound(upd); await refresh(); notify(`کد ${upd.code} باطل شد.`);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const [lbl, tone] = found ? LABEL[kindOf(found)] : [];

  return (
    <Card title="ابطال رزرو با کد پیگیری">
      <form onSubmit={search} className="flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1"><span className="mb-1 block text-xs font-semibold text-mut">کد پیگیری‌ای که مهمان داده</span>
          <input className={inputCls} dir="ltr" placeholder="SR-7K2QX9" value={code} onChange={(e) => { setCode(e.target.value); setFound(null); setErr(""); }} /></label>
        <Btn kind="primary" type="submit" disabled={busy || !code.trim()}>{busy && !found ? "در حال جست‌وجو…" : "جست‌وجو"}</Btn>
      </form>
      {err && <p role="alert" className="mt-3 text-sm text-coral">{err}</p>}
      {found && (
        <div className="mt-4 rounded-2xl border border-line p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b dir="ltr" className="text-base">{found.code}</b><Badge tone={tone}>{lbl}</Badge>
          </div>
          <p className="mt-2"><b>{found.hotelName}</b> <span className="text-mut">· {found.city} · {found.rooms > 1 ? `${fa(found.rooms)} × ` : ""}{found.room}</span></p>
          <p className="text-mut">{fa(found.checkIn)} تا {fa(found.checkOut)} ({fa(found.nights)} شب) · {fa(found.guests)} مهمان · {fmt(found.totalUsd)}</p>
          {found.guestName && <p className="text-mut">مهمان: {found.guestName}{found.guestPhone ? ` · ${found.guestPhone}` : ""}</p>}
          {found.status === "confirmed" ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-coral">با باطل‌کردن، این کد نهایی از کار می‌افتد و برگشت ندارد.</span>
              <Btn kind="danger" onClick={doVoid} disabled={busy}>{busy ? "…" : "باطل کن"}</Btn>
            </div>
          ) : (
            <p className="mt-3 text-mut">{found.status === "voided" ? "این کد باطل شده و دیگر معتبر نیست." : "این رزرو لغو شده است و نیازی به ابطال ندارد."}</p>
          )}
        </div>
      )}
    </Card>
  );
}

export function downloadFile(name, text, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const csvOf = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

export default function BookingsPanel({ bookings, refresh, notify }) {
  const act = async (fn, okMsg) => {
    try { await fn(); await refresh(); if (okMsg) notify(okMsg); } catch (e) { notify(e.message); }
  };
  const { fmt } = useCurrency();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("");
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(0);
  const [asking, setAsking] = useState(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (bookings || [])
      .filter((b) => (!s || b.code.toLowerCase().includes(s) || b.hotelName.includes(s) || b.city.includes(s) || (b.guestName || "").toLowerCase().includes(s) || (b.guestPhone || "").includes(s)) && (!st || kindOf(b) === st))
      .sort(sort === "new" ? (a, b) => b.createdAt.localeCompare(a.createdAt) : (a, b) => (b.totalUsd || 0) - (a.totalUsd || 0));
  }, [bookings, q, st, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const rows = list.slice(cur * PAGE, cur * PAGE + PAGE);
  const total = list.filter((b) => b.status === "confirmed").reduce((s, b) => s + (b.totalUsd || 0), 0);

  const exportCsv = () => downloadFile("bookings.csv", csvOf([
    ["کد", "هتل", "شهر", "اتاق", "تعداد اتاق", "مهمان", "ورود", "خروج", "شب", "مبلغ (USD)", "پرداخت", "وضعیت", "تاریخ ثبت", "مهمان", "تلفن"],
    ...list.map((b) => [b.code, b.hotelName, b.city, b.room, b.rooms, b.guests, b.checkIn, b.checkOut, b.nights, b.totalUsd, b.pay === "online" ? "آنلاین" : "در هتل", LABEL[kindOf(b)][0], b.createdAt.slice(0, 10), b.guestName || "", b.guestPhone || ""]),
  ]));

  return (
    <div className="space-y-4">
      <VoidByCode refresh={refresh} notify={notify} />
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[180px] flex-1"><span className="mb-1 block text-xs font-semibold text-mut">جستجو (کد، هتل، شهر، نام یا تلفن مهمان)</span>
            <input className={inputCls} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /></label>
          <label><span className="mb-1 block text-xs font-semibold text-mut">وضعیت</span>
            <select className={inputCls} value={st} onChange={(e) => { setSt(e.target.value); setPage(0); }}><option value="">همه</option><option value="upcoming">آینده</option><option value="past">گذشته</option><option value="cancelled">لغو شده</option><option value="voided">باطل شده</option></select></label>
          <label><span className="mb-1 block text-xs font-semibold text-mut">مرتب‌سازی</span>
            <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">جدیدترین</option><option value="val">بیشترین مبلغ</option></select></label>
          <Btn onClick={exportCsv} disabled={!list.length}>خروجی CSV</Btn>
        </div>
        <p className="mt-3 text-sm text-mut">{fa(list.length)} رزرو · مجموع مبلغ رزروهای فعال: <b className="text-ink">{fmt(total)}</b></p>
      </Card>

      <div className="overflow-x-auto rounded-3xl border border-line bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-line text-xs text-mut"><tr>{["کد", "هتل", "اتاق", "ورود تا خروج", "مهمان", "مبلغ", "پرداخت", "وضعیت", ""].map((h, i) => <th key={i} className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((b) => {
              const k = kindOf(b);
              return (
                <tr key={b.code} className="border-b border-line last:border-0 hover:bg-bg">
                  <td className="p-3 font-bold" dir="ltr">{b.code}{b.demo && <span className="ms-1 text-[10px] text-mut">demo</span>}</td>
                  <td className="p-3"><b className="block">{b.hotelName}</b><span className="text-xs text-mut">{b.city}{b.guestName ? ` · ${b.guestName}` : ""}</span></td>
                  <td className="p-3 text-mut">{b.rooms > 1 ? `${fa(b.rooms)} × ` : ""}{b.room}</td>
                  <td className="p-3">{fa(b.checkIn)} <span className="text-mut">←</span> {fa(b.checkOut)}<span className="block text-xs text-mut">{fa(b.nights)} شب</span></td>
                  <td className="p-3">{fa(b.guests)}</td>
                  <td className="p-3 font-bold">{fmt(b.totalUsd)}</td>
                  <td className="p-3 text-mut">{b.pay === "online" ? "آنلاین" : "در هتل"}</td>
                  <td className="p-3"><Badge tone={LABEL[k][1]}>{LABEL[k][0]}</Badge></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      {asking === b.code ? (
                        <><Btn kind="danger" onClick={() => { act(() => deleteBooking(b.code), "رزرو حذف شد."); setAsking(null); }} className="!px-3 !py-1">حذف قطعی</Btn><Btn onClick={() => setAsking(null)} className="!px-3 !py-1">نه</Btn></>
                      ) : (
                        <>
                          {b.status !== "voided" && <Btn onClick={() => act(() => setBookingStatus(b.code, b.status === "cancelled" ? "confirmed" : "cancelled"))} className="!px-3 !py-1">{b.status === "cancelled" ? "فعال‌سازی" : "لغو"}</Btn>}
                          <Btn onClick={() => setAsking(b.code)} className="!px-3 !py-1 text-coral">حذف</Btn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={9} className="p-10 text-center text-mut">رزروی پیدا نشد.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-mut">
        <span>صفحه‌ی {fa(cur + 1)} از {fa(pages)}</span>
        <div className="flex gap-2"><Btn disabled={cur === 0} onClick={() => setPage(cur - 1)} className="!py-1.5">قبلی</Btn><Btn disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="!py-1.5">بعدی</Btn></div>
      </div>
    </div>
  );
}
