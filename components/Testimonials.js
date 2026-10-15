"use client";
import { useEffect, useState } from "react";
import Section from "./Section";
import { LIMITS, validateReview } from "@/lib/review";
import { fa } from "@/lib/fa";

const EMPTY = { name: "", trip: "", rating: 5, text: "", website: "" };

function Stars({ n }) {
  return (
    <div className="mb-3 text-sun" role="img" aria-label={`${fa(n)} ستاره از ۵`}>
      {"★".repeat(n)}<span className="text-line">{"★".repeat(5 - n)}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl border border-line bg-card" />)}
    </div>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <div className={`rounded-[14px] border bg-card px-3.5 py-2 ${error ? "border-coral" : "border-line focus-within:border-violet"}`}>
        <label htmlFor={id} className="block text-xs text-mut">{label}</label>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
    </div>
  );
}
const ctl = "w-full bg-transparent font-semibold outline-none";

function ReviewForm({ onClose }) {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState("");
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setFail("");
    const v = validateReview(f);
    setErrors(v.errors);
    if (!v.ok) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v.data, website: f.website }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) setDone(true);
      else {
        if (out.errors) setErrors(out.errors);
        setFail(out.error || "ارسال انجام نشد، دوباره امتحان کن.");
      }
    } catch {
      setFail("اتصال به سرور برقرار نشد. اینترنتت را بررسی کن و دوباره امتحان کن.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="rounded-3xl border border-line bg-card p-7 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-aqua to-violet text-2xl text-white">✓</div>
        <h3 className="text-xl font-extrabold">ممنون از نظرت</h3>
        <p className="mt-1 text-sm text-mut">نظرت ثبت شد و بعد از تأیید مدیر در سایت نمایش داده می‌شود.</p>
        <button onClick={onClose} className="mt-4 rounded-[14px] border border-line px-6 py-2 font-bold">بستن</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-3xl border border-line bg-card p-5 sm:p-6" aria-label="فرم ثبت نظر">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">نظرت را بنویس</h3>
        <button type="button" onClick={onClose} aria-label="بستن" className="h-9 w-9 rounded-full border border-line">✕</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="rname" label="نام" error={errors.name}>
          <input id="rname" value={f.name} onChange={set("name")} maxLength={LIMITS.name} autoComplete="name" className={ctl} />
        </Field>
        <Field id="rtrip" label="سفرت (اختیاری)، مثلاً «سفر به استانبول»" error={errors.trip}>
          <input id="rtrip" value={f.trip} onChange={set("trip")} maxLength={LIMITS.trip} className={ctl} />
        </Field>
      </div>

      <div>
        <span className="mb-1 block text-xs text-mut" id="rrate">امتیاز</span>
        <div role="radiogroup" aria-labelledby="rrate" className="flex gap-1 text-3xl" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={f.rating === n} aria-label={`${fa(n)} ستاره`}
              onClick={() => setF({ ...f, rating: n })}
              className={`transition hover:scale-110 ${n <= f.rating ? "text-sun" : "text-line"}`}>★</button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-coral">{errors.rating}</p>}
      </div>

      <Field id="rtext" label="نظر" error={errors.text}>
        <textarea id="rtext" rows={4} value={f.text} onChange={set("text")} maxLength={LIMITS.text} className={`${ctl} resize-none`} />
      </Field>
      <p className="-mt-1 text-end text-[11px] text-mut">{fa(f.text.length)} / {fa(LIMITS.text)}</p>

      {/* تله‌ی ربات: برای کاربر دیده نمی‌شود */}
      <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 opacity-0" />

      {fail && <p role="alert" className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{fail}</p>}
      <button type="submit" disabled={busy} className="min-h-[50px] w-full rounded-[14px] bg-gradient-to-br from-coral to-violet font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
        {busy ? "در حال ارسال…" : "ثبت نظر"}
      </button>
      <p className="text-center text-xs text-mut">نظرها بعد از بررسی مدیر در سایت نمایش داده می‌شوند.</p>
    </form>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState(null); // null = در حال بارگذاری
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/reviews?limit=6", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => live && setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => live && setItems([]));
    return () => { live = false; };
  }, []);

  return (
    <Section id="reviews" title="مسافرها چه می‌گویند" sub="نظر واقعی کسانی که با سرا سفر کرده‌اند.">
      {items === null ? (
        <Skeleton />
      ) : items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((x) => (
            <figure key={x.id} className="rounded-3xl border border-line bg-card p-6">
              <Stars n={x.rating} />
              <blockquote className="whitespace-pre-line break-words text-[15px] leading-8">{x.text}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet to-aqua font-bold text-white">{[...x.name][0]}</span>
                <span className="min-w-0"><b className="block truncate text-sm">{x.name}</b>{x.trip && <span className="block truncate text-xs text-mut">{x.trip}</span>}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-line bg-card p-8 text-center text-mut">هنوز نظری ثبت نشده. اولین نفر باش!</p>
      )}

      <div className="mt-6">
        {open ? (
          <div className="mx-auto max-w-2xl"><ReviewForm onClose={() => setOpen(false)} /></div>
        ) : (
          <div className="text-center">
            <button onClick={() => setOpen(true)} className="rounded-[14px] border border-line bg-card px-6 py-3 font-bold transition hover:border-violet">✍️ نظر خودت را بنویس</button>
          </div>
        )}
      </div>
    </Section>
  );
}
