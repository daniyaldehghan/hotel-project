"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LIMITS, SUBJECTS, normalizeTicket, validateContact } from "@/lib/contact";
import CaptchaField, { useCaptcha } from "./Captcha";
import TrackClient from "./TrackClient";

const INFO = [
  ["☎", "تلفن پشتیبانی", "۰۲۱-۱۲۳۴۵", "شبانه‌روز"],
  ["✉", "ایمیل", "daniyaldehghani@gmail.com", "پاسخ تا ۲۴ ساعت"],
  ["◷", "ساعت کاری دفتر", "شنبه تا پنجشنبه", "۹ تا ۱۸"],
  ["⌖", "نشانی ", "تهران، خیابان فردوسی، پلاک ۱۰", ""],
];

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

export default function ContactClient() {
  const [f, setF] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "", website: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState("");
  const [answer, setAnswer] = useState(""); // پاسخ کپچا
  const captcha = useCaptcha();
  const [tab, setTab] = useState("new"); // new | track
  const [track, setTrack] = useState({ ticket: "", key: 0 }); // کدی که باید در تب پیگیری باز شود
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // لینک پیگیری: /contact?ticket=TK-XXXXXX
  useEffect(() => {
    const t = normalizeTicket(new URLSearchParams(window.location.search).get("ticket") || "");
    if (t) { setTrack({ ticket: t, key: 1 }); setTab("track"); }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setFail("");
    const v = validateContact(f);
    const errs = { ...v.errors };
    if (!answer.trim()) errs.captcha = "کد داخل تصویر را وارد کن.";
    setErrors(errs);
    if (!v.ok || errs.captcha) return;
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v.data, website: f.website, captchaId: captcha.id, captchaAnswer: answer }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ticket) setSent(out.ticket);
      else {
        if (out.errors) setErrors(out.errors);
        setFail(out.error || "ارسال انجام نشد، دوباره امتحان کن.");
      }
    } catch {
      setFail("اتصال به سرور برقرار نشد. اینترنتت را بررسی کن و دوباره امتحان کن.");
    } finally {
      setBusy(false);
      setAnswer(""); captcha.reload(); // هر کپچا فقط یک بار قابل استفاده است
    }
  };

  const openTrack = (t) => { setTrack((k) => ({ ticket: t, key: k.key + 1 })); setTab("track"); };

  return (
    <>
      <header className="bg-gradient-to-br from-night via-night2 to-[#5B1FA8] pb-12 pt-12 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="text-[clamp(30px,5vw,52px)] font-black">ارتباط با ما</h1>
          <p className="mt-1 max-w-xl text-white/80">سؤال یا مشکلی داری؟ پیام بگذار یا با پشتیبانی تماس بگیر.</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {INFO.map(([i, t, v, s]) => (
            <div key={t} className="flex items-center gap-4 rounded-3xl border border-line bg-card p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet to-coral text-xl text-white" aria-hidden="true">{i}</span>
              <div className="min-w-0"><span className="block text-xs text-mut">{t}</span><b className="block break-words">{v}</b>{s && <span className="text-xs text-mut">{s}</span>}</div>
            </div>
          ))}
          <p className="px-1 text-sm text-mut">برای سؤال‌های رایج، اول <Link href="/#faq" className="font-bold text-violet dark:text-aqua">سؤالات متداول</Link> را ببین.</p>
        </div>

        <section className="rounded-3xl border border-line bg-card p-5 sm:p-7" aria-label="فرم تماس">
          <div role="tablist" aria-label="بخش‌های تماس" className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-line/60 p-1">
            {[["new", "✉ پیام جدید"], ["track", "🔎 پیگیری پیام"]].map(([k, l]) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded-xl py-2 text-sm font-bold transition ${tab === k ? "bg-card shadow" : "text-mut hover:text-ink"}`}>{l}</button>
            ))}
          </div>
          {tab === "track" ? (
            <TrackClient key={track.key} initialTicket={track.ticket} />
          ) : sent ? (
            <div role="status" className="py-8 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-aqua to-violet text-3xl text-white">✓</div>
              <h2 className="text-2xl font-extrabold">پیامت ثبت شد</h2>
              <p className="mt-1 text-mut">کد پیگیری: <b dir="ltr">{sent}</b></p>
              <p className="mt-1 text-sm text-mut">پیامت به دست پشتیبانی رسید. این کد را نگه دار؛ با آن در تب «پیگیری پیام» جواب را می‌بینی و می‌توانی سؤال بعدی‌ات را بپرسی.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button onClick={() => openTrack(sent)} className="rounded-[14px] bg-gradient-to-br from-coral to-violet px-6 py-2.5 font-extrabold text-white">پیگیری این پیام</button>
                <button onClick={() => { setSent(null); setErrors({}); setF({ name: "", email: "", subject: SUBJECTS[0], message: "", website: "" }); }} className="rounded-[14px] border border-line px-6 py-2.5 font-bold">پیام جدید</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-3">
              <h2 className="mb-1 text-xl font-extrabold">پیام بگذار</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="cname" label="نام" error={errors.name}><input id="cname" value={f.name} onChange={set("name")} maxLength={LIMITS.name} autoComplete="name" className={ctl} /></Field>
                <Field id="cemail" label="ایمیل" error={errors.email}><input id="cemail" type="email" dir="ltr" value={f.email} onChange={set("email")} maxLength={LIMITS.email} autoComplete="email" className={ctl} /></Field>
              </div>
              <Field id="csubject" label="موضوع" error={errors.subject}>
                <select id="csubject" value={f.subject} onChange={set("subject")} className={ctl}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field id="cmsg" label="پیام" error={errors.message}><textarea id="cmsg" rows={5} value={f.message} onChange={set("message")} maxLength={LIMITS.message} className={`${ctl} resize-none`} /></Field>
              {/* تله‌ی ربات: برای کاربر دیده نمی‌شود */}
              <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 opacity-0" />
              <CaptchaField cap={captcha} value={answer} onChange={setAnswer} error={errors.captcha} />
              {fail && <p role="alert" className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{fail}</p>}
              <button type="submit" disabled={busy} className="min-h-[54px] w-full rounded-[14px] bg-gradient-to-br from-coral to-violet font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">{busy ? "در حال ارسال…" : "ارسال پیام"}</button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
