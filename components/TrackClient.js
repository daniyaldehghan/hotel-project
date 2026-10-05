"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { REPLY_LIMITS, STATUS_LABELS } from "@/lib/contact";
import { fa } from "@/lib/fa";

const TONE = {
  new: "bg-violet/15 text-violet dark:text-aqua",
  read: "bg-sun/25 text-[#8a5a00] dark:text-sun",
  replied: "bg-[#22C79A]/15 text-[#128a6a] dark:text-[#22E3D2]",
  done: "bg-line text-mut",
};
const when = (d) => fa(new Date(d).toLocaleString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
const post = (method, body) => fetch("/api/contact/track", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// پیگیری پیام با کد پیگیری: وضعیت، جواب پشتیبانی و پرسیدن سؤال بعدی
export default function TrackClient({ initialTicket = "" }) {
  const [code, setCode] = useState(initialTicket);
  const [thread, setThread] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const endRef = useRef(null);
  const ticket = thread?.ticket;

  const lookup = useCallback(async (t, silent = false) => {
    if (!silent) { setBusy(true); setErr(""); }
    try {
      const res = await post("POST", { ticket: t });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.thread) { setThread(d.thread); setCode(d.thread.ticket); }
      else if (!silent) { setThread(null); setErr(d.error || "پیدا نشد، دوباره امتحان کن."); }
    } catch {
      if (!silent) setErr("اتصال به سرور برقرار نشد. اینترنتت را بررسی کن.");
    } finally {
      if (!silent) setBusy(false);
    }
  }, []);

  // اگر با لینک (?ticket=...) آمده، همان‌جا باز شود
  useEffect(() => { if (initialTicket) lookup(initialTicket); }, [initialTicket, lookup]);

  // جواب ادمین بدون رفرش دیده شود: هر ۲۰ ثانیه، فقط وقتی تب باز و دیده می‌شود
  useEffect(() => {
    if (!ticket) return;
    const t = setInterval(() => { if (document.visibilityState === "visible") lookup(ticket, true); }, 20000);
    return () => clearInterval(t);
  }, [ticket, lookup]);

  const count = thread?.messages.length;
  useEffect(() => { if (count > 1) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [count]);

  const submitLookup = (e) => { e.preventDefault(); if (!busy && code.trim()) lookup(code.trim()); };

  const send = async (e) => {
    e.preventDefault();
    if (sending) return;
    const t = text.trim();
    if (t.length < REPLY_LIMITS.minText) return setSendErr("متن پیام را بنویس.");
    setSending(true); setSendErr("");
    try {
      const res = await post("PUT", { ticket, text: t, website });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.thread) { setThread(d.thread); setText(""); }
      else setSendErr(d.error || "ارسال نشد، دوباره امتحان کن.");
    } catch {
      setSendErr("اتصال به سرور برقرار نشد.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <form onSubmit={submitLookup} className="space-y-3">
        <h2 className="text-xl font-extrabold">پیگیری پیام</h2>
        <p className="text-sm text-mut">کد پیگیری‌ای که بعد از ارسال پیام گرفتی را وارد کن تا وضعیت و جواب پشتیبانی را ببینی.</p>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 rounded-[14px] border border-line bg-card px-3.5 py-2 focus-within:border-violet">
            <label htmlFor="tcode" className="block text-xs text-mut">کد پیگیری</label>
            <input id="tcode" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} placeholder="TK-7K2QX9" maxLength={14} autoComplete="off" spellCheck={false}
              className="w-full bg-transparent font-mono font-bold uppercase tracking-wider outline-none" />
          </div>
          <button type="submit" disabled={busy || !code.trim()} className="shrink-0 rounded-[14px] bg-gradient-to-br from-coral to-violet px-6 font-extrabold text-white transition disabled:opacity-60">{busy ? "…" : "جست‌وجو"}</button>
        </div>
        {err && <p role="alert" className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{err}</p>}
      </form>

      {thread && (
        <section className="mt-6 border-t border-line pt-5" aria-label="گفتگوی پیام">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <b dir="ltr" className="font-mono">{thread.ticket}</b>
              <p className="truncate text-sm text-mut">{thread.subject} · {when(thread.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[thread.status]}`}>{STATUS_LABELS[thread.status]}</span>
              <button onClick={() => lookup(thread.ticket)} disabled={busy} aria-label="به‌روزرسانی" title="به‌روزرسانی" className="h-8 w-8 rounded-full border border-line hover:border-violet disabled:opacity-50">↻</button>
            </div>
          </div>

          <ol className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pe-1">
            {thread.messages.map((m, i) => {
              const mine = m.from === "user";
              return (
                <li key={i} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${mine ? "rounded-tr-sm bg-violet/10" : "rounded-tl-sm bg-gradient-to-br from-violet to-[#5B1FA8] text-white"}`}>
                    <p className={`mb-1 text-[11px] font-bold ${mine ? "text-mut" : "text-white/75"}`}>{mine ? thread.name || "تو" : "پشتیبانی سرا"} · {when(m.at)}</p>
                    <p className="whitespace-pre-line break-words text-sm leading-7">{m.text}</p>
                  </div>
                </li>
              );
            })}
            <div ref={endRef} />
          </ol>

          {thread.messages.length === 1 && thread.status !== "replied" && (
            <p className="mt-3 rounded-xl bg-line/60 px-3 py-2 text-xs text-mut">پیامت به دست پشتیبانی رسیده. جواب که آمد همین‌جا نشان داده می‌شود؛ این صفحه خودش به‌روز می‌شود.</p>
          )}

          <form onSubmit={send} className="mt-4 space-y-2">
            <div className="rounded-[14px] border border-line bg-card px-3.5 py-2 focus-within:border-violet">
              <label htmlFor="tfollow" className="block text-xs text-mut">{thread.messages.length > 1 ? "سؤال یا پیام بعدی" : "چیزی اضافه کنی؟"}</label>
              <textarea id="tfollow" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={REPLY_LIMITS.text} className="w-full resize-none bg-transparent font-semibold outline-none" />
            </div>
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 opacity-0" />
            {sendErr && <p role="alert" className="rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">{sendErr}</p>}
            <button type="submit" disabled={sending || !text.trim()} className="w-full rounded-[14px] bg-gradient-to-br from-coral to-violet py-3 font-extrabold text-white transition disabled:opacity-60">{sending ? "در حال ارسال…" : "ارسال پیام"}</button>
            {thread.status === "done" && <p className="text-center text-xs text-mut">این گفتگو بسته شده؛ اگر پیام بدهی دوباره باز می‌شود.</p>}
          </form>
        </section>
      )}
    </div>
  );
}
