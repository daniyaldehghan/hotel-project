"use client";
import { useEffect, useRef, useState } from "react";
import { SOUND_KEY, lastUserText, timeLabel } from "@/lib/chat";
import { fa } from "@/lib/fa";

function beep() {
  try {
    const A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.type = "sine";
    o.frequency.setValueAtTime(880, c.currentTime); o.frequency.setValueAtTime(1320, c.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
    o.start(); o.stop(c.currentTime + 0.42); setTimeout(() => c.close(), 700);
  } catch {}
}

export default function ChatBell({ threads, onOpen }) {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const prev = useRef(null);
  const unread = threads.filter((t) => t.adminUnread > 0);
  const total = unread.reduce((s, t) => s + t.adminUnread, 0);

  useEffect(() => { try { setSound(localStorage.getItem(SOUND_KEY) !== "off"); } catch {} }, []);
  useEffect(() => {
    if (prev.current !== null && total > prev.current && sound) beep();
    prev.current = total;
  }, [total, sound]);
  const toggleSound = () => { const n = !sound; setSound(n); try { localStorage.setItem(SOUND_KEY, n ? "on" : "off"); } catch {} if (n) beep(); };
  const go = (id) => { setOpen(false); onOpen(id); };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label={total ? `${fa(total)} پیام جدید` : "اعلان‌ها"} aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-white/30 hover:bg-white/10">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={total ? "sara-wiggle" : ""} aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {total > 0 && <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">{fa(total)}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="menu" className="sara-pop fixed inset-x-3 top-[68px] z-50 overflow-hidden rounded-2xl border border-line bg-card text-ink shadow-2xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-80">
            <div className="flex items-center justify-between border-b border-line px-4 py-3"><b>پیام‌های جدید</b>
              <button onClick={toggleSound} className="text-xs text-mut" aria-pressed={sound}>{sound ? "🔔 صدا روشن" : "🔕 صدا خاموش"}</button></div>
            {unread.length === 0 ? <p className="p-6 text-center text-sm text-mut">پیام خوانده‌نشده‌ای نیست 🎉</p> : (
              <ul className="max-h-72 overflow-y-auto">
                {unread.slice(0, 6).map((t) => (
                  <li key={t.id}><button onClick={() => go(t.id)} className="flex w-full items-start gap-3 border-b border-line px-4 py-3 text-start hover:bg-bg">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet to-coral text-sm font-black text-white">{t.name.trim()[0] || "؟"}</span>
                    <span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><b className="truncate text-sm">{t.name}</b><span className="shrink-0 text-[11px] text-mut">{timeLabel(t.updatedAt)}</span></span>
                      <span className="block truncate text-xs text-mut">{lastUserText(t)}</span></span>
                  </button></li>
                ))}
              </ul>
            )}
            <button onClick={() => go(null)} className="w-full border-t border-line px-4 py-3 text-sm font-bold text-violet dark:text-aqua">همه‌ی گفتگوها ←</button>
          </div>
        </>
      )}
    </div>
  );
}
