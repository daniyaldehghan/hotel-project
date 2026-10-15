"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Btn, Card } from "./ui";
import { REPLY_LIMITS } from "@/lib/contact";
import { fa } from "@/lib/fa";

const FILTERS = [["new", "جدید"], ["read", "دیده‌شده"], ["replied", "پاسخ داده‌شده"], ["done", "بسته‌شده"], ["all", "همه"]];
const LABEL = { new: "جدید", read: "دیده‌شده", replied: "پاسخ داده شد", done: "بسته" };
const TONE = { new: "bad", read: "info", replied: "ok", done: "mut" };
const when = (d) => fa(new Date(d).toLocaleString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));

// پیام‌های «تماس با ما»: دیدن، جواب دادن و بستن. جواب ادمین با کد پیگیری به کاربر نشان داده می‌شود.
export default function MessagesPanel({ notify, onCount }) {
  const [filter, setFilter] = useState("new");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // { items, counts, pages }
  const [sel, setSel] = useState(null); // پیام بازشده
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/contact?status=${filter}&page=${page}`, { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "خطا در گرفتن پیام‌ها.");
      setData(d); setError("");
      onCount?.(d.counts.new);
    } catch (e) {
      setError(e.message || "اتصال به سرور برقرار نشد.");
      setData((x) => x || { items: [], counts: { new: 0, read: 0, replied: 0, done: 0 }, pages: 1 });
    }
  }, [filter, page, onCount]);

  useEffect(() => { setData(null); load(); }, [load]);
  // پیام تازه‌ی کاربران بدون رفرش بیاید
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 30000);
    return () => clearInterval(t);
  }, [load]);

  const patch = async (ticket, payload) => {
    const res = await fetch("/api/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket, ...payload }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "انجام نشد.");
    return d.item;
  };

  const open = async (m) => {
    setSel(m); setText("");
    if (m.status === "new") { // با باز کردن، «دیده‌شده» می‌شود
      try { setSel(await patch(m.ticket, { status: "read" })); load(); } catch {}
    }
  };

  const reply = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (busy) return;
    if (t.length < REPLY_LIMITS.minText) return notify("متن پاسخ را بنویس.");
    setBusy(true);
    try {
      setSel(await patch(sel.ticket, { reply: t }));
      setText(""); notify("پاسخ ثبت شد و کاربر با کد پیگیری می‌بیند."); load();
    } catch (err) { notify(err.message || "اتصال به سرور برقرار نشد."); } finally { setBusy(false); }
  };

  const setStatus = async (status) => {
    if (busy) return;
    setBusy(true);
    try { setSel(await patch(sel.ticket, { status })); notify(status === "done" ? "گفتگو بسته شد." : "گفتگو دوباره باز شد."); load(); }
    catch (err) { notify(err.message || "انجام نشد."); } finally { setBusy(false); }
  };

  const items = data?.items;
  const counts = data?.counts;
  const msgs = sel ? [{ from: "user", text: sel.message, at: sel.createdAt }, ...sel.replies] : [];
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [sel?.ticket, msgs.length]);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card title="پیام‌های تماس با ما" className="h-fit">
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="فیلتر پیام‌ها">
          {FILTERS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => { setFilter(k); setPage(1); }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === k ? "border-violet bg-violet/10 text-violet dark:text-aqua" : "border-line hover:border-violet"}`}>
              {l}{counts && k !== "all" && <span className="text-mut"> ({fa(counts[k])})</span>}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-3 rounded-xl border border-coral/40 bg-coral/10 p-3 text-sm text-coral">{error} <Btn className="ms-1 !py-0.5" onClick={load}>تلاش دوباره</Btn></p>}
        {items === undefined ? <p className="text-mut">در حال بارگذاری…</p> : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-mut">پیامی در این بخش نیست.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((m) => (
              <li key={m.ticket}>
                <button onClick={() => open(m)} aria-current={sel?.ticket === m.ticket}
                  className={`block w-full rounded-xl px-2 py-3 text-start transition hover:bg-violet/5 ${sel?.ticket === m.ticket ? "bg-violet/10" : ""}`}>
                  <span className="flex items-center justify-between gap-2">
                    <b className={`truncate text-sm ${m.status === "new" ? "" : "font-semibold"}`}>{m.name}</b>
                    <Badge tone={TONE[m.status]}>{LABEL[m.status]}</Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-mut">{m.subject} · <span dir="ltr">{m.ticket}</span></span>
                  <span className="mt-0.5 block truncate text-xs text-mut">{(m.replies.at(-1) || { text: m.message }).text}</span>
                  <span className="mt-0.5 block text-[11px] text-mut">{when(m.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {data?.pages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <Btn disabled={page <= 1} onClick={() => setPage(page - 1)} className="!px-3 !py-1">قبلی</Btn>
            <span className="text-mut">{fa(page)} از {fa(data.pages)}</span>
            <Btn disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="!px-3 !py-1">بعدی</Btn>
          </div>
        )}
      </Card>

      <Card className="min-h-[24rem]">
        {!sel ? (
          <p className="grid h-72 place-items-center text-mut">یک پیام را از لیست انتخاب کن.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div className="min-w-0">
                <h2 className="font-extrabold">{sel.subject}</h2>
                <p className="mt-0.5 text-sm text-mut">
                  {sel.name} · <a href={`mailto:${sel.email}`} dir="ltr" className="text-violet dark:text-aqua">{sel.email}</a> · <span dir="ltr" className="font-mono">{sel.ticket}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={TONE[sel.status]}>{LABEL[sel.status]}</Badge>
                {sel.status === "done"
                  ? <Btn disabled={busy} onClick={() => setStatus("read")} className="!px-3 !py-1">باز کردن مجدد</Btn>
                  : <Btn disabled={busy} onClick={() => setStatus("done")} className="!px-3 !py-1">✓ بستن گفتگو</Btn>}
              </div>
            </div>

            <ol className="my-4 max-h-[28rem] space-y-3 overflow-y-auto pe-1">
              {msgs.map((m, i) => {
                const admin = m.from === "admin";
                return (
                  <li key={i} className={`flex ${admin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${admin ? "rounded-tl-sm bg-gradient-to-br from-violet to-[#5B1FA8] text-white" : "rounded-tr-sm bg-violet/10"}`}>
                      <p className={`mb-1 text-[11px] font-bold ${admin ? "text-white/75" : "text-mut"}`}>{admin ? "پاسخ شما" : sel.name} · {when(m.at)}</p>
                      <p className="whitespace-pre-line break-words text-sm leading-7">{m.text}</p>
                    </div>
                  </li>
                );
              })}
              <div ref={endRef} />
            </ol>

            <form onSubmit={reply} className="space-y-2">
              <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={REPLY_LIMITS.text} aria-label="متن پاسخ" placeholder="پاسخ را بنویس… (کاربر با کد پیگیری می‌بیند)"
                className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-violet" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-mut">{fa(text.length)} / {fa(REPLY_LIMITS.text)}</span>
                <Btn kind="primary" type="submit" disabled={busy || !text.trim()}>{busy ? "…" : "ارسال پاسخ"}</Btn>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
