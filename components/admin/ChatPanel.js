"use client";
import { useEffect, useRef, useState } from "react";
import { useHotels } from "../HotelsProvider";
import { addMessage, lastUserText, markRead, needsReply, removeThread, setStatus, timeLabel } from "@/lib/chat";
import { Badge, Btn, inputCls } from "./ui";
import { fa } from "@/lib/fa";

const CANNED = [
  "سلام، ممنون از پیامتان. همین الان بررسی می‌کنم.",
  "رزرو شما ثبت شده و تأییدیه برایتان ارسال می‌شود.",
  "لغو رایگان تا ۴۸ ساعت قبل از ورود از بخش «رزروهای من» انجام می‌شود.",
  "کد SARA20 برای اولین رزرو ۲۰٪ تخفیف دارد.",
  "اگر سؤال دیگری دارید، در خدمتم.",
];
const FILTERS = [["all", "همه"], ["wait", "بی‌پاسخ"], ["closed", "بسته‌شده"]];

export default function ChatPanel({ threads, activeId, setActiveId, notify }) {
  const hotels = useHotels([]);
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [asking, setAsking] = useState(false);
  const log = useRef(null);
  const active = threads.find((t) => t.id === activeId) || null;
  const names = new Map(hotels.map((h) => [h.id, h.name]));

  const list = threads.filter((t) => (filter === "wait" ? needsReply(t) : filter === "closed" ? t.status === "closed" : true));
  const waiting = threads.filter(needsReply).length;

  useEffect(() => { if (active && active.adminUnread > 0) markRead(active.id, "admin"); }, [active?.id, active?.adminUnread]);
  useEffect(() => { const el = log.current; if (el) el.scrollTop = el.scrollHeight; }, [active?.id, active?.messages.length]);
  useEffect(() => setAsking(false), [activeId]);

  const send = (v) => {
    const t = (v ?? text).trim();
    if (!t || !active) return;
    addMessage(active.id, { from: "admin", text: t });
    setText("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
      <aside className={`rounded-3xl border border-line bg-card ${active ? "hidden lg:block" : ""}`}>
        <div className="flex gap-1.5 border-b border-line p-3">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-violet bg-violet text-white" : "border-line"}`}>
              {l}{k === "wait" && waiting > 0 && ` (${fa(waiting)})`}
            </button>
          ))}
        </div>
        <ul className="max-h-[68vh] overflow-y-auto">
          {list.map((t) => (
            <li key={t.id}>
              <button onClick={() => setActiveId(t.id)} className={`flex w-full items-start gap-3 border-b border-line px-4 py-3 text-start hover:bg-bg ${t.id === activeId ? "bg-bg" : ""}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet to-coral font-black text-white">{t.name.trim()[0] || "؟"}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><b className="truncate">{t.name}</b><span className="shrink-0 text-[11px] text-mut">{timeLabel(t.updatedAt)}</span></span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-mut">{lastUserText(t) || "—"}</span>
                    {t.adminUnread > 0 ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">{fa(t.adminUnread)}</span>
                      : t.status === "closed" ? <Badge>بسته</Badge> : needsReply(t) ? <Badge tone="bad">بی‌پاسخ</Badge> : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!list.length && (
            <li className="p-8 text-center text-sm text-mut">
              <div className="mb-2 text-3xl">💬</div>
              {threads.length ? "گفتگویی با این فیلتر نیست." : "هنوز گفتگویی نیست. یک تب دیگر از سایت را باز کن و از دکمه‌ی گفتگو پیام بفرست، یا از «تنظیمات» گفتگوی نمونه بساز."}
            </li>
          )}
        </ul>
      </aside>

      <section className={`flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-line bg-card lg:h-[68vh] ${active ? "" : "hidden lg:flex"}`}>
        {!active ? (
          <div className="m-auto p-10 text-center text-mut"><div className="mb-2 text-5xl">👈</div>یک گفتگو را انتخاب کن</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveId(null)} aria-label="بازگشت" className="rounded-full border border-line px-3 py-1 text-sm lg:hidden">→</button>
                <b>{active.name}</b>{active.demo && <Badge>نمونه</Badge>}
                <span className="text-xs text-mut">{fa(active.messages.length)} پیام</span>
              </div>
              <div className="flex gap-1.5">
                <Btn onClick={() => setStatus(active.id, active.status === "closed" ? "open" : "closed")} className="!px-3 !py-1">{active.status === "closed" ? "بازکردن" : "بستن گفتگو"}</Btn>
                {asking ? (
                  <><Btn kind="danger" onClick={() => { removeThread(active.id); setActiveId(null); notify("گفتگو حذف شد."); }} className="!px-3 !py-1">حذف قطعی</Btn><Btn onClick={() => setAsking(false)} className="!px-3 !py-1">نه</Btn></>
                ) : <Btn onClick={() => setAsking(true)} className="!px-3 !py-1 text-coral">حذف</Btn>}
              </div>
            </div>
            <div ref={log} role="log" aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg p-5">
              {active.messages.map((m) => {
                const mine = m.from === "admin";
                return (
                  <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-start" : "items-end"}`}>
                    <span className="px-1 text-[11px] text-mut">{mine ? "شما" : m.from === "bot" ? "🤖 دستیار خودکار" : active.name}</span>
                    <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-7 ${mine ? "bg-gradient-to-br from-coral to-violet text-white" : m.from === "bot" ? "border border-dashed border-line bg-card text-mut" : "border border-line bg-card"}`}>
                      {m.text}
                      {m.hotelIds?.length > 0 && <span className="mt-1 block text-xs">🏨 {m.hotelIds.map((id) => names.get(id)).filter(Boolean).join("، ")}</span>}
                    </div>
                    <span className="px-1 text-[10px] text-mut">{timeLabel(m.at)}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-line p-3">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {CANNED.map((c) => <button key={c} onClick={() => setText(c)} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs hover:border-violet">{c.length > 28 ? `${c.slice(0, 28)}…` : c}</button>)}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="پاسخ پشتیبان…" aria-label="پاسخ" className={inputCls} />
                <Btn kind="primary" type="submit" disabled={!text.trim()} className="shrink-0">ارسال</Btn>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
