"use client";
import { useMemo, useState } from "react";
import { useCurrency } from "../CurrencyProvider";
import { useAdmin } from "../HotelsProvider";
import { AreaChart, Columns, Donut, HBar } from "./Charts";
import { Badge, Btn, Card, Stat, dayLabel, num } from "./ui";
import { fa } from "@/lib/fa";
import { clearMisses, lastUserText, needsReply } from "@/lib/chat";

const RANGES = [[7, "۷ روز"], [30, "۳۰ روز"], [90, "۹۰ روز"], [0, "همه"]];
const DAY = 864e5;
const dkey = (t) => new Date(t).toISOString().slice(0, 10);
const t = (b) => new Date(b.createdAt).getTime();
const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

export default function Dashboard({ bookings, go, onSeed, chat, openThread }) {
  const { fmt } = useCurrency();
  const { hotels, categories } = useAdmin();
  const [range, setRange] = useState(30);
  const [metric, setMetric] = useState("rev");

  const d = useMemo(() => {
    const all = bookings || [];
    const now = Date.now();
    const since = range ? now - range * DAY : 0;
    const inR = all.filter((b) => t(b) >= since);
    const prev = range ? all.filter((b) => t(b) >= now - 2 * range * DAY && t(b) < since) : [];
    const dead = (b) => b.status === "cancelled" || b.status === "voided";
    const ok = (l) => l.filter((b) => !dead(b));
    const sum = (l, f) => l.reduce((s, b) => s + f(b), 0);
    const okR = ok(inR), okP = ok(prev);
    const rev = sum(okR, (b) => b.totalUsd || 0), revP = sum(okP, (b) => b.totalUsd || 0);
    const avg = okR.length ? rev / okR.length : 0, avgP = okP.length ? revP / okP.length : 0;
    const cancelRate = inR.length ? ((inR.length - okR.length) / inR.length) * 100 : 0;
    const nights = sum(okR, (b) => b.nights || 0);

    // سری روزانه
    const first = all.length ? Math.min(...all.map(t)) : now;
    const n = range || Math.min(120, Math.max(7, Math.ceil((now - first) / DAY) + 1));
    const map = new Map();
    for (let i = n - 1; i >= 0; i--) map.set(dkey(now - i * DAY), { rev: 0, cnt: 0 });
    inR.forEach((b) => { const r = map.get(dkey(t(b))); if (r) { r.cnt++; if (!dead(b)) r.rev += b.totalUsd || 0; } });
    const series = [...map].map(([k, v]) => ({ k, label: dayLabel(k), ...v }));

    const group = (keyFn, valFn, nameFn = keyFn) => {
      const m = new Map();
      okR.forEach((b) => { const k = keyFn(b); const r = m.get(k) || { label: nameFn(b), value: 0, cnt: 0 }; r.value += valFn(b); r.cnt++; m.set(k, r); });
      return [...m.values()].sort((a, b) => b.value - a.value);
    };
    const byCity = group((b) => b.city, (b) => b.totalUsd || 0).slice(0, 6);
    const topHotels = group((b) => b.hotelId, (b) => b.totalUsd || 0, (b) => b.hotelName).slice(0, 6).map((r) => ({ ...r, note: `${fa(r.cnt)} رزرو` }));

    const today = dkey(now);
    const kind = (b) => (dead(b) ? "c" : b.checkOut < today ? "p" : "u");
    const st = { u: 0, p: 0, c: 0 };
    inR.forEach((b) => st[kind(b)]++);
    const pay = { online: 0, hotel: 0 };
    okR.forEach((b) => { pay[b.pay === "online" ? "online" : "hotel"]++; });
    const stay = Array.from({ length: 7 }, (_, i) => ({ label: i === 6 ? "+۷" : fa(i + 1), value: 0 }));
    okR.forEach((b) => { stay[Math.min(6, Math.max(1, b.nights || 1) - 1)].value++; });

    return { inR, okR, rev, revP, avg, avgP, cancelRate, nights, series, byCity, topHotels, st, pay, stay, cnt: inR.length, cntP: prev.length, recent: [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6) };
  }, [bookings, range]);

  const cat = useMemo(() => {
    const byStars = [3, 4, 5].map((s) => ({ label: `${fa(s)} ستاره`, value: hotels.filter((h) => h.stars === s).length }));
    const byCat = categories.map((c) => ({ label: c, value: hotels.filter((h) => h.tag === c).length })).sort((a, b) => b.value - a.value).slice(0, 8);
    const avgPrice = hotels.length ? hotels.reduce((s, h) => s + h.price, 0) / hotels.length : 0;
    const avgRate = hotels.length ? hotels.reduce((s, h) => s + h.rating, 0) / hotels.length : 0;
    return { byStars, byCat, avgPrice, avgRate };
  }, [hotels, categories]);

  const pending = useMemo(() => (chat?.threads || []).filter(needsReply), [chat]);
  const missItems = useMemo(() => {
    const m = new Map();
    (chat?.misses || []).forEach((x) => { const k = x.q.toLowerCase(); const r = m.get(k) || { label: x.q, value: 0 }; r.value++; m.set(k, r); });
    return [...m.values()].sort((a, b) => b.value - a.value).slice(0, 6);
  }, [chat]);

  const sp = (k) => d.series.slice(-14).map((s) => s[k]);
  const chart = d.series.map((s) => ({ label: s.label, v: metric === "rev" ? s.rev : s.cnt }));
  const empty = !bookings?.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="بازه‌ی زمانی">
          {RANGES.map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} aria-pressed={range === v}
              className={`rounded-full border px-4 py-1.5 text-sm ${range === v ? "border-violet bg-violet text-white" : "border-line bg-card"}`}>{l}</button>
          ))}
        </div>
        <p className="text-xs text-mut">آمار رزروهای ثبت‌شده .</p>
      </div>

      {empty && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-dashed border-line p-6">
          <div><b>هنوز رزروی ثبت نشده</b><p className="text-sm text-mut">برای دیدن نمودارها یک رزرو از سایت بگیر، یا چند رزرو نمونه بساز (بعداً از تنظیمات قابل حذف است).</p></div>
          <Btn kind="primary" onClick={onSeed}>ساخت ۷۰ رزرو نمونه</Btn>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="درآمد (رزروهای فعال)" value={fmt(d.rev)} delta={range ? pct(d.rev, d.revP) : null} spark={sp("rev")} color="#6C3BFF" />
        <Stat label="تعداد رزرو" value={num(d.cnt)} delta={range ? pct(d.cnt, d.cntP) : null} spark={sp("cnt")} color="#FF5E7A" />
        <Stat label="میانگین ارزش رزرو" value={fmt(d.avg)} delta={range ? pct(d.avg, d.avgP) : null} />
        <Stat label="نرخ لغو" value={`${fa(d.cancelRate.toFixed(1)).replace(".", "٫")}٪`} />
        <Stat label="شب‌های رزروشده" value={num(d.nights)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="روند فروش" action={
          <div className="flex gap-1.5">
            {[["rev", "درآمد"], ["cnt", "تعداد رزرو"]].map(([k, l]) => (
              <button key={k} onClick={() => setMetric(k)} aria-pressed={metric === k} className={`rounded-full border px-3 py-1 text-xs ${metric === k ? "border-violet bg-violet text-white" : "border-line"}`}>{l}</button>
            ))}
          </div>}>
          <AreaChart data={chart} fmt={metric === "rev" ? fmt : num} color={metric === "rev" ? "#6C3BFF" : "#FF5E7A"} />
        </Card>
        <Card title="وضعیت رزروها">
          <Donut center={num(d.cnt)} sub="رزرو" items={[{ label: "آینده", value: d.st.u, color: "#6C3BFF" }, { label: "گذشته", value: d.st.p, color: "#22E3D2" }, { label: "لغو شده", value: d.st.c, color: "#FF5E7A" }]} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={`💬 گفتگوهای بی‌پاسخ${pending.length ? ` (${fa(pending.length)})` : ""}`} action={<Btn onClick={() => go("chat")} className="!py-1 text-xs">همه‌ی گفتگوها</Btn>}>
          {pending.length === 0 ? <p className="py-6 text-center text-sm text-mut">همه‌ی پیام‌ها پاسخ داده شده 🎉</p> : (
            <ul className="divide-y divide-line">
              {pending.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0"><b className="block truncate">{t.name}</b><span className="block truncate text-xs text-mut">{lastUserText(t)}</span></div>
                  <Btn kind="soft" onClick={() => openThread(t.id)} className="shrink-0 !px-3 !py-1">پاسخ</Btn>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="🔍 جستجوهای بی‌نتیجه" action={missItems.length > 0 && <Btn onClick={clearMisses} className="!py-1 text-xs">پاک کردن</Btn>}>
          <HBar items={missItems} empty="هنوز جستجوی بی‌نتیجه‌ای ثبت نشده" />
          <p className="mt-3 text-xs text-mut">چیزهایی که کاربرها دنبالشان بودند و پیدا نکردند؛ ایده‌ی خوبی برای اضافه کردن هتل یا دسته‌ی جدید.</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="پرفروش‌ترین هتل‌ها (درآمد)"><HBar items={d.topHotels} fmt={fmt} empty="در این بازه رزروی نیست" /></Card>
        <Card title="درآمد به تفکیک شهر"><HBar items={d.byCity} fmt={fmt} empty="در این بازه رزروی نیست" /></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="مدت اقامت (شب)"><Columns items={d.stay} color="#22C79A" /></Card>
        <Card title="روش پرداخت"><Donut size={120} center={num(d.pay.online + d.pay.hotel)} sub="رزرو" items={[{ label: "آنلاین", value: d.pay.online, color: "#6C3BFF" }, { label: "در هتل", value: d.pay.hotel, color: "#FFC83D" }]} /></Card>
        <Card title="هتل‌ها بر اساس ستاره"><Donut size={120} center={num(hotels.length)} sub="هتل" items={cat.byStars.map((s, i) => ({ ...s, color: ["#FF8A5C", "#2A6BFF", "#FFC83D"][i] }))} /></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="هتل‌ها بر اساس دسته‌بندی" action={<Btn onClick={() => go("cats")} className="!py-1 text-xs">مدیریت</Btn>}>
          <HBar items={cat.byCat} />
          <p className="mt-4 text-xs text-mut">میانگین قیمت شبی {fmt(cat.avgPrice)} · میانگین امتیاز {fa(cat.avgRate.toFixed(1)).replace(".", "٫")}</p>
        </Card>
        <Card title="آخرین رزروها" action={<Btn onClick={() => go("bookings")} className="!py-1 text-xs">همه</Btn>}>
          {d.recent.length === 0 ? <p className="py-6 text-center text-sm text-mut">رزروی نیست</p> : (
            <ul className="divide-y divide-line">
              {d.recent.map((b) => (
                <li key={b.code} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0"><b className="block truncate">{b.hotelName}</b><span className="text-xs text-mut">{b.city} · {fa(b.checkIn)} · <span dir="ltr">{b.code}</span></span></div>
                  <div className="shrink-0 text-end"><b>{fmt(b.totalUsd)}</b><br />{b.status === "voided" ? <Badge tone="bad">باطل</Badge> : b.status === "cancelled" ? <Badge tone="bad">لغو</Badge> : <Badge tone="ok">فعال</Badge>}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
