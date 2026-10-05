"use client";
import { useHotels } from "./HotelsProvider";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useCurrency } from "./CurrencyProvider";
import { createBooking } from "@/lib/bookings";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HotelPhoto from "./HotelPhoto";
import { ADDONS, COUPONS, TAX_RATE, addonState, calcTotals, nightsBetween } from "@/lib/pricing";
import { fa } from "@/lib/fa";

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return iso(d); };
const norm = (s) => s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const fmtDate = (s) => new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { day: "numeric", month: "long" }).format(new Date(s));
const box = "rounded-[14px] border px-3.5 py-2";

function Card({ title, children }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function Counter({ label, value, min, max, onChange, hint }) {
  return (
    <div className={`${box} flex items-center justify-between border-line`}>
      <div><span className="block text-xs text-mut">{label}</span><span className="text-[11px] text-mut">{hint}</span></div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`کم کردن ${label}`} className="h-8 w-8 rounded-full border border-line text-lg disabled:opacity-35">−</button>
        <b className="w-6 text-center">{fa(value)}</b>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`اضافه کردن ${label}`} className="h-8 w-8 rounded-full border border-line text-lg disabled:opacity-35">+</button>
      </div>
    </div>
  );
}

function TextField({ id, label, error, ...p }) {
  return (
    <div>
      <div className={`${box} ${error ? "border-coral" : "border-line"}`}>
        <label htmlFor={id} className="block text-xs text-mut">{label}</label>
        <input id={id} {...p} aria-invalid={!!error} className="w-full bg-transparent font-semibold outline-none" />
      </div>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}

export default function CheckoutClient({ hotels: base }) {
  const hotels = useHotels(base);
  const sp = useSearchParams();
  const hotel = hotels.find((h) => h.id === Number(sp.get("hotel")));
  if (!hotel) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-2xl font-extrabold">هتلی برای رزرو انتخاب نشده</h1>
        <p className="mb-6 mt-2 text-mut">اول یک هتل را انتخاب کن و روی «رزرو» بزن.</p>
        <Link href="/hotels" className="inline-block rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">دیدن هتل‌ها</Link>
      </main>
    );
  }
  const init = { room: sp.get("room"), in: sp.get("in"), out: sp.get("out"), guests: sp.get("guests") };
  return <Checkout key={hotel.id} hotel={hotel} init={init} />;
}

function Checkout({ hotel, init }) {
  const [roomIdx, setRoomIdx] = useState(Math.min(Number(init.room) || 0, hotel.rooms.length - 1));
  const [checkIn, setCheckIn] = useState(init.in || addDays(7));
  const [checkOut, setCheckOut] = useState(init.out || addDays(10));
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(Math.min(Math.max(Number(init.guests) || 2, 1), 4));
  const [sel, setSel] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [f, setF] = useState({ first: "", last: "", email: "", phone: "", note: "" });
  const [pay, setPay] = useState("online");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const { user } = useAuth();
  const { fmt } = useCurrency();
  useEffect(() => {
    if (user) setF((p) => ({ ...p, first: p.first || user.first, last: p.last || user.last, email: p.email || user.email }));
  }, [user]);

  const nights = nightsBetween(checkIn, checkOut);
  const room = hotel.rooms[roomIdx];
  const t = useMemo(() => calcTotals({ hotel, room, nights, rooms, guests, selected: sel, coupon }), [hotel, room, nights, rooms, guests, sel, coupon]);
  const freeUntil = checkIn ? fmtDate(addDays(-2, new Date(checkIn))) : "";

  const changeRooms = (n) => { setRooms(n); setGuests((g) => Math.min(Math.max(g, n), n * 4)); };
  const onCheckIn = (v) => { setCheckIn(v); if (nightsBetween(v, checkOut) < 1) setCheckOut(addDays(1, new Date(v))); };
  const toggleAddon = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const applyCoupon = () => {
    const key = codeInput.trim().toUpperCase();
    if (COUPONS[key]) { setCoupon({ code: key, ...COUPONS[key] }); setCodeMsg(""); }
    else setCodeMsg("این کد معتبر نیست.");
  };

  const submit = async () => {
    if (submitting) return;
    const e = {};
    if (nights < 1) e.dates = "تاریخ خروج باید بعد از ورود باشد.";
    if (!f.first.trim()) e.first = "نام را وارد کن.";
    if (!f.last.trim()) e.last = "نام خانوادگی را وارد کن.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "ایمیل معتبر وارد کن.";
    if (!/^\d{10,13}$/.test(norm(f.phone.replace(/[\s+-]/g, "")))) e.phone = "شماره تلفن معتبر وارد کن.";
    if (!agree) e.agree = "برای ادامه باید قوانین را بپذیری.";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) { document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setSubmitting(true); setSubmitErr("");
    try {
      // رزرو در سرور (مونگو) ذخیره می‌شود و کد پیگیری را هم سرور می‌سازد
      const saved = await createBooking({
        hotelId: hotel.id, hotelName: hotel.name, city: hotel.city, room: room.name, rooms, guests, checkIn, checkOut, nights,
        totalUsd: Math.round(t.total * 100) / 100, pay,
        guest: { first: f.first, last: f.last, email: f.email, phone: f.phone, note: f.note },
      });
      setDone({ code: saved.code, t, nights, rooms, guests, room, checkIn, checkOut, pay, freeUntil, name: `${f.first} ${f.last}`, email: f.email });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitErr(err.message || "ثبت رزرو انجام نشد، دوباره امتحان کن.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const d = done;
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <div className="rounded-3xl border border-line bg-card p-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-aqua to-violet text-3xl text-white">✓</div>
          <h1 className="text-2xl font-extrabold">رزرو شما ثبت شد</h1>
          <p className="mt-1 text-mut">{d.name} عزیز، تأیید رزرو به {d.email} ارسال می‌شود.</p>
          <p className="my-5 inline-block rounded-2xl border-2 border-dashed border-line px-6 py-2"><span className="block text-xs text-mut">کد پیگیری رزرو</span><b className="text-2xl tracking-widest" dir="ltr">{d.code}</b></p>
          <dl className="mx-auto grid max-w-md gap-2 text-start text-sm">
            {[["هتل", `${hotel.name}، ${hotel.city}`], ["اتاق", `${fa(d.rooms)} × ${d.room.name}`], ["مهمان", `${fa(d.guests)} نفر`], ["تاریخ", `${fa(d.checkIn)} تا ${fa(d.checkOut)} (${fa(d.nights)} شب)`], ["پرداخت", d.pay === "online" ? "پرداخت آنلاین" : "پرداخت در هتل"], ["مبلغ نهایی", fmt(d.t.total)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line py-1.5"><dt className="text-mut">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-mut">این کد را نگه دار؛ با آن می‌توانی هر وقت خواستی وضعیت رزرو را پیگیری کنی. لغو رایگان تا {d.freeUntil}.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-8 py-3 font-extrabold text-white">صفحه اول</Link>
            <Link href={`/track?code=${d.code}`} className="rounded-[14px] border border-line px-8 py-3 font-bold">پیگیری رزرو</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <nav aria-label="مسیر صفحه" className="mb-2 text-sm text-mut"><Link href="/">خانه</Link> › <Link href={`/hotels`}>هتل‌ها</Link> › پرداخت</nav>
      <h1 className="mb-6 text-3xl font-black">تکمیل رزرو</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="اتاق، تاریخ و تعداد">
            <div className="mb-4 space-y-2" role="radiogroup" aria-label="نوع اتاق">
              {hotel.rooms.map((r, i) => (
                <label key={r.name} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${i === roomIdx ? "border-violet bg-violet/5" : "border-line"}`}>
                  <span className="flex items-center gap-3"><input type="radio" name="room" checked={i === roomIdx} onChange={() => setRoomIdx(i)} className="accent-violet" /><span className="font-semibold">{r.name}</span></span>
                  <span><b style={{ color: "var(--price)" }}>{fmt(r.price)}</b> <span className="text-xs text-mut">/ شب</span></span>
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`${box} border-line`}><label htmlFor="in" className="block text-xs text-mut">ورود (از ساعت {hotel.checkIn})</label>
                <input id="in" type="date" min={addDays(0)} value={checkIn} onChange={(e) => onCheckIn(e.target.value)} className="w-full bg-transparent font-semibold outline-none" /></div>
              <div className={`${box} ${errors.dates ? "border-coral" : "border-line"}`}><label htmlFor="dates" className="block text-xs text-mut">خروج (تا ساعت {hotel.checkOut})</label>
                <input id="dates" type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-transparent font-semibold outline-none" /></div>
              <Counter label="تعداد اتاق" value={rooms} min={1} max={5} onChange={changeRooms} />
              <Counter label="تعداد مهمان" value={guests} min={rooms} max={rooms * 4} onChange={setGuests} hint="حداکثر ۴ نفر در هر اتاق" />
            </div>
            {errors.dates && <p className="mt-2 text-sm text-coral">{errors.dates}</p>}
            <p className="mt-3 text-sm text-mut">{nights > 0 ? `${fa(nights)} شب اقامت` : "تاریخ‌ها را بررسی کن."}</p>
          </Card>

          <Card title="امکانات اضافی">
            <ul className="space-y-2">
              {ADDONS.map((a) => {
                const st = addonState(a, hotel);
                const on = st.included || sel.includes(a.id);
                return (
                  <li key={a.id}>
                    <label className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${st.unavailable ? "opacity-50" : "cursor-pointer"} ${on ? "border-violet bg-violet/5" : "border-line"}`}>
                      <span className="flex items-center gap-3">
                        <input type="checkbox" checked={on} disabled={st.included || st.unavailable} onChange={() => toggleAddon(a.id)} className="h-4 w-4 accent-violet" />
                        <span><b className="block text-sm">{a.label}</b><span className="text-xs text-mut">{a.desc}</span></span>
                      </span>
                      <span className="shrink-0 text-sm font-bold">
                        {st.unavailable ? <span className="text-mut">موجود نیست</span> : st.included ? <span className="text-aqua">شامل هتل</span> : a.unit === "percent" ? `${fa(a.pct * 100)}٪` : fmt(a.price)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="اطلاعات مهمان">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="first" label="نام" value={f.first} onChange={set("first")} error={errors.first} autoComplete="given-name" />
              <TextField id="last" label="نام خانوادگی" value={f.last} onChange={set("last")} error={errors.last} autoComplete="family-name" />
              <TextField id="email" label="ایمیل" type="email" dir="ltr" value={f.email} onChange={set("email")} error={errors.email} autoComplete="email" />
              <TextField id="phone" label="تلفن همراه" type="tel" dir="ltr" value={f.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
            </div>
            <div className={`${box} mt-3 border-line`}><label htmlFor="note" className="block text-xs text-mut">درخواست ویژه (اختیاری)</label>
              <textarea id="note" rows={2} value={f.note} onChange={set("note")} className="w-full resize-none bg-transparent font-semibold outline-none" /></div>
          </Card>

          <Card title="روش پرداخت">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="روش پرداخت">
              {[["online", "پرداخت آنلاین", "همین حالا پرداخت کن؛ تأیید فوری"], ["hotel", "پرداخت در هتل", "هنگام ورود به هتل پرداخت کن"]].map(([v, l, d]) => (
                <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${pay === v ? "border-violet bg-violet/5" : "border-line"}`}>
                  <input type="radio" name="pay" checked={pay === v} onChange={() => setPay(v)} className="mt-1 accent-violet" />
                  <span><b className="block text-sm">{l}</b><span className="text-xs text-mut">{d}</span></span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-24" aria-label="خلاصه رزرو">
          <div className="flex gap-3">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl"><HotelPhoto hotel={hotel} /></div>
            <div><b className="block">{hotel.name}</b><span className="text-xs text-mut">{hotel.city} · <span className="text-sun">{"★".repeat(hotel.stars)}</span></span></div>
          </div>

          <ul className="space-y-2 border-t border-line pt-4 text-sm">
            <li className="flex justify-between gap-3"><span>{room.name}<span className="block text-xs text-mut">{fa(nights)} شب × {fa(rooms)} اتاق × {fmt(room.price)}</span></span><b>{fmt(t.roomTotal)}</b></li>
            {t.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-3"><span>{l.label}<span className="block text-xs text-mut">{l.pct ? `${fa(l.pct * 100)}٪ مبلغ اتاق` : `${fa(l.qty)} × ${fmt(l.unitPrice)}`}</span></span><b>{fmt(l.amount)}</b></li>
            ))}
            <li className="flex justify-between border-t border-line pt-2 text-mut"><span>جمع</span><span>{fmt(t.subtotal)}</span></li>
            {coupon && <li className="flex justify-between text-aqua"><span>تخفیف ({coupon.code})</span><span>−{fmt(t.discount)}</span></li>}
            <li className="flex justify-between text-mut"><span>مالیات و خدمات ({fa(TAX_RATE * 100)}٪)</span><span>{fmt(t.tax)}</span></li>
          </ul>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="font-bold">مبلغ نهایی</span>
            <b className="text-2xl" style={{ color: "var(--price)" }}>{fmt(t.total)}</b>
          </div>
          {nights > 0 && <p className="text-xs text-mut">میانگین هر شب: {fmt(t.total / nights)} · لغو رایگان تا {freeUntil}</p>}

          <div>
            {coupon ? (
              <p className="flex items-center justify-between rounded-[14px] border border-aqua px-3.5 py-2 text-sm">{coupon.label}<button onClick={() => { setCoupon(null); setCodeInput(""); }} className="text-coral">حذف</button></p>
            ) : (
              <div className="flex gap-2">
                <div className={`${box} flex-1 border-line`}><label htmlFor="coupon" className="sr-only">کد تخفیف</label>
                  <input id="coupon" dir="ltr" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="کد تخفیف (SARA20)" className="w-full bg-transparent text-sm font-semibold outline-none" /></div>
                <button onClick={applyCoupon} className="rounded-[14px] border border-line px-4 text-sm font-bold">اعمال</button>
              </div>
            )}
            {codeMsg && <p className="mt-1 text-xs text-coral">{codeMsg}</p>}
          </div>

          <div>
            <label id="agree" className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-violet" />
              <span>قوانین رزرو و لغو را می‌پذیرم.</span>
            </label>
            {errors.agree && <p className="mt-1 text-xs text-coral">{errors.agree}</p>}
          </div>

          {submitErr && <p role="alert" className="rounded-[14px] border border-coral px-3.5 py-2 text-sm text-coral">{submitErr}</p>}
          <button onClick={submit} disabled={submitting} className="min-h-[54px] w-full rounded-[14px] bg-gradient-to-br from-coral to-violet font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-60">
            {submitting ? "در حال ثبت رزرو…" : pay === "online" ? `پرداخت ${fmt(t.total)}` : "ثبت رزرو (پرداخت در هتل)"}
          </button>
        </aside>
      </div>
    </main>
  );
}
