"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useCurrency } from "./CurrencyProvider";
import { useFavorites } from "./FavoritesProvider";
import { useHotels } from "./HotelsProvider";
import { useChatData } from "./useChat";
import { addMessage, ensureThread, logMiss, markRead, myThreadId, timeLabel } from "@/lib/chat";
import { QUICK, botReply } from "@/lib/chatbot";
import { fa } from "@/lib/fa";

const WELCOME = { id: "welcome", from: "bot", text: "سلام 👋 من دستیار سرا هستم. شهر، بودجه و امکانات هتل دلخواهت رو بنویس تا پیدا کنم. پیام‌هات برای تیم پشتیبانی هم ثبت می‌شه.", chips: QUICK };
const HUMAN_WINDOW = 10 * 60e3;
const SVG = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", width: 26, height: 26, viewBox: "0 0 24 24", "aria-hidden": true };

export default function ChatWidget() {
  const path = usePathname();
  const { user } = useAuth();
  const { fmt } = useCurrency();
  const { cmp, openHotel } = useFavorites();
  const hotels = useHotels([]);
  const { threads } = useChatData();
  const [meId, setMeId] = useState(null);
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const sendRef = useRef(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const inAdmin = path?.startsWith("/admin");

  const thread = threads.find((t) => t.id === meId);
  const msgs = thread?.messages || [];
  const unread = thread?.userUnread || 0;
  const hasUser = msgs.some((m) => m.from === "user");
  const lastIdx = msgs.length - 1;

  useEffect(() => { setMeId(myThreadId()); }, [threads.length]);
  useEffect(() => { if (open && thread?.userUnread > 0) markRead(thread.id, "user"); }, [open, thread?.id, thread?.userUnread]);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [open, msgs.length, busy]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);
  useEffect(() => {
    if (inAdmin) return;
    try { if (sessionStorage.getItem("sara:chat:teased")) return; sessionStorage.setItem("sara:chat:teased", "1"); } catch { return; }
    const a = setTimeout(() => setTeaser(true), 6000), b = setTimeout(() => setTeaser(false), 18000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [inAdmin]);

  const send = async (raw) => {
    const t = (raw ?? text).trim().slice(0, 500);
    if (!t || busyRef.current) return;
    busyRef.current = true; setBusy(true); setText("");
    const id = ensureThread(user?.first || thread?.name || "مهمان");
    setMeId(id);
    addMessage(id, { from: "user", text: t });
    const human = (JSON.parse(localStorage.getItem("sara:chat:v1") || "{}").threads || []).find((x) => x.id === id)?.messages.some((m) => m.from === "admin" && Date.now() - m.at < HUMAN_WINDOW);
    if (!human) { // اگر پشتیبان انسانی تازه جواب داده، ربات دخالت نمی‌کند
      await new Promise((r) => setTimeout(r, 450));
      const r = await botReply(t, hotels, fmt);
      addMessage(id, { from: "bot", text: r.text, hotelIds: r.hotelIds, chips: r.chips, link: r.link });
      if (r.miss) logMiss(t, "chat");
    }
    busyRef.current = false; setBusy(false);
  };
  sendRef.current = send;

  useEffect(() => {
    const on = (e) => { setOpen(true); setTeaser(false); const t = e.detail?.text; if (t) setTimeout(() => sendRef.current?.(t), 250); };
    window.addEventListener("sara:chat", on);
    return () => window.removeEventListener("sara:chat", on);
  }, []);

  if (inAdmin) return null;
  const byId = new Map(hotels.map((h) => [h.id, h]));

  const Bubble = ({ m, last }) => {
    const mine = m.from === "user";
    const cards = (m.hotelIds || []).map((id) => byId.get(id)).filter(Boolean);
    return (
      <div className={`sara-pop flex flex-col gap-1.5 ${mine ? "items-start" : "items-end"}`}>
        {!mine && <span className="px-1 text-[11px] text-mut">{m.from === "admin" ? "🧑‍💼 پشتیبان" : "🤖 دستیار"}</span>}
        <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-7 ${mine ? "bg-gradient-to-br from-coral to-violet text-white" : m.from === "admin" ? "border border-violet/40 bg-violet/10" : "border border-line bg-card"}`}>{m.text}</div>
        {cards.length > 0 && (
          <div className="flex w-full max-w-[92%] flex-col gap-2">
            {cards.map((h) => (
              <button key={h.id} onClick={() => openHotel(h)} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-3 py-2 text-start text-sm hover:border-violet">
                <span className="min-w-0"><b className="block truncate">{h.name}</b><span className="text-xs text-mut">{h.city} · <span className="text-sun">{"★".repeat(h.stars)}</span></span></span>
                <b className="shrink-0 text-violet dark:text-aqua">{fmt(h.price)}</b>
              </button>
            ))}
          </div>
        )}
        {m.link && <Link href={m.link.href} onClick={() => setOpen(false)} className="rounded-full border border-violet px-4 py-1.5 text-xs font-bold text-violet dark:text-aqua">{m.link.label} ←</Link>}
        {last && m.chips?.length > 0 && !busy && (
          <div className="flex flex-wrap gap-1.5">{m.chips.map((c) => <button key={c} onClick={() => send(c)} className="rounded-full border border-line bg-card px-3 py-1 text-xs hover:border-violet">{c}</button>)}</div>
        )}
        {m.at && <span className="px-1 text-[10px] text-mut">{timeLabel(m.at)}</span>}
      </div>
    );
  };

  return (
    <>
      {open && (
        <section role="dialog" aria-label="گفتگوی آنلاین" className="sara-pop fixed inset-x-3 bottom-3 z-[46] flex h-[min(78dvh,600px)] flex-col overflow-hidden rounded-3xl border border-line bg-bg text-ink shadow-2xl sm:inset-x-auto sm:bottom-24 sm:start-5 sm:w-[390px]">
          <header className="flex items-center gap-3 bg-gradient-to-br from-night via-night2 to-[#5B1FA8] px-4 py-3.5 text-white">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15 text-xl">🤖<i className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-night bg-[#22C79A]" /></span>
            <div className="flex-1"><b className="block leading-tight">دستیار سرا</b><span className="text-xs text-white/70">پاسخ فوری · پشتیبانی انسانی</span></div>
            <button onClick={() => setOpen(false)} aria-label="بستن گفتگو" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">✕</button>
          </header>
          <div ref={logRef} role="log" aria-live="polite" className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4">
            <Bubble m={WELCOME} last={!hasUser} />
            {msgs.map((m, i) => <Bubble key={m.id} m={m} last={i === lastIdx} />)}
            {busy && <div className="flex items-center gap-1.5 self-end rounded-2xl border border-line bg-card px-4 py-3" aria-label="در حال نوشتن">{[0, 1, 2].map((i) => <i key={i} className="sara-dot h-2 w-2 rounded-full bg-mut" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line bg-card p-3">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="پیامت را بنویس…" aria-label="پیام"
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-violet" />
            <button type="submit" disabled={!text.trim() || busy} aria-label="ارسال" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-coral to-violet text-white disabled:opacity-40">
              <svg {...SVG} width="20" height="20" className="-scale-x-100"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>
            </button>
          </form>
        </section>
      )}

      <div className={`fixed start-4 z-[45] flex flex-col items-start gap-3 sm:start-5 ${cmp.length ? "bottom-24 sm:bottom-5" : "bottom-5"} ${open ? "max-sm:hidden" : ""}`}>
        {teaser && !open && (
          <div className="sara-pop relative max-w-[230px] rounded-2xl rounded-es-sm border border-line bg-card p-3.5 pe-9 text-sm shadow-xl">
            سلام 👋 دنبال هتل خاصی هستی؟ همین‌جا بپرس!
            <button onClick={() => setTeaser(false)} aria-label="بستن" className="absolute end-2 top-2 text-mut">✕</button>
          </div>
        )}
        <button onClick={() => { setOpen((o) => !o); setTeaser(false); }} aria-label={open ? "بستن گفتگو" : unread ? `گفتگوی آنلاین، ${fa(unread)} پیام جدید` : "گفتگوی آنلاین"} aria-expanded={open}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-coral to-violet text-white shadow-[0_10px_30px_rgba(108,59,255,.45)] transition hover:scale-105">
          {!open && (teaser || unread > 0) && <span className="sara-ping absolute inset-0 rounded-full bg-violet/60" aria-hidden="true" />}
          <span className={`relative ${unread && !open ? "sara-wiggle" : ""}`}>
            {open ? <svg {...SVG}><path d="M18 6 6 18M6 6l12 12" /></svg>
              : unread ? <svg {...SVG}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
              : <svg {...SVG}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
          </span>
          {unread > 0 && !open && <span className="absolute -end-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-sun px-1 text-xs font-black text-[#2a1700]">{fa(unread)}</span>}
        </button>
      </div>
    </>
  );
}
