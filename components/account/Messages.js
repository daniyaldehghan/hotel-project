"use client";
import { useEffect, useRef } from "react";
import { askAssistant } from "../NoResults";
import { Btn, Card } from "../admin/ui";
import { timeLabel } from "@/lib/chat";
import { fa } from "@/lib/fa";

export default function Messages({ thread }) {
  const msgs = thread?.messages || [];
  const log = useRef(null);
  useEffect(() => { const el = log.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length]);

  return (
    <Card title="💬 پیام‌ها و پشتیبانی" action={<Btn kind="primary" onClick={() => askAssistant("")} className="!py-1.5">{msgs.length ? "ادامه‌ی گفتگو" : "شروع گفتگو"}</Btn>}>
      {msgs.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mb-2 text-5xl" aria-hidden="true">💬</div>
          <p className="font-bold">هنوز گفتگویی نداشته‌ای</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-mut">برای پیدا کردن هتل، سؤال درباره‌ی رزرو یا لغو، با دستیار و تیم پشتیبانی گفتگو کن.</p>
        </div>
      ) : (
        <>
          <div ref={log} role="log" className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto rounded-2xl bg-bg p-4">
            {msgs.map((m) => {
              const mine = m.from === "user";
              return (
                <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-start" : "items-end"}`}>
                  {!mine && <span className="px-1 text-[11px] text-mut">{m.from === "admin" ? "🧑‍💼 پشتیبان" : "🤖 دستیار"}</span>}
                  <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-7 ${mine ? "bg-gradient-to-br from-coral to-violet text-white" : m.from === "admin" ? "border border-violet/40 bg-violet/10" : "border border-line bg-card"}`}>{m.text}</div>
                  <span className="px-1 text-[10px] text-mut">{timeLabel(m.at)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-mut">{fa(msgs.length)} پیام · برای پاسخ دادن «ادامه‌ی گفتگو» را بزن.</p>
        </>
      )}
    </Card>
  );
}
